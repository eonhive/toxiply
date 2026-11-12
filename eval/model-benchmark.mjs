/**
 * Company: EonHive Inc. | Title: Single-model comparative benchmark
 * Purpose: Reuse strict inference/evaluation with cached model calls and honest measurements.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import os from 'node:os';
import { createAnalyzer, createModelTextAnalyzer, nativeTextAnalyzer, contextualTextAnalyzer,
  createEnglishProfanityAnalyzer, createEnglishSpamScamAnalyzer,
  createEnglishSpamScamAttributionAnalyzer } from '@eonhive/toxiply';
import { modelOutputSchema } from '../dist/model/protocol.js';
import { evidenceSchema } from '../dist/contracts/schemas.js';
import { compareReviewedDataset, evaluateReviewedDataset } from './evaluate-reviewed.mjs';
import { summarize } from './metrics.mjs';
import { sha256, validSourceSpan } from './review-dataset.mjs';
import { BenchmarkError, modelOptions, prepareBenchmark } from './model-benchmark-config.mjs';

export function latencySummary(samples) {
  const sorted = [...samples].sort((a,b) => a-b);
  const percentile = p => sorted.length ? sorted[Math.ceil(sorted.length * p) - 1] : null;
  return { samples: sorted.length, p50Ms: percentile(0.5), p95Ms: percentile(0.95),
    method: 'nearest-rank', scope: 'Measured client-side V1 analyze calls, including validation; no warmup or retries.' };
}

function auditResponse(raw, request, maxBytes) {
  const unavailable = { schemaCompliant: null, observedSpans: null, validSpans: null, invalidSpans: null };
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > maxBytes) return unavailable;
  try {
    const output = JSON.parse(raw);
    const schemaCompliant = modelOutputSchema.safeParse(output).success;
    if (!Array.isArray(output?.evidence) || output.evidence.length > 64) return { ...unavailable, schemaCompliant };
    let validSpans = 0;
    for (const item of output.evidence) {
      const span = evidenceSchema.safeParse(item && { id:item.id, code:item.code, source:item.source, start:item.start, end:item.end });
      const source = item?.source === 'text' ? request.content.text : request.context?.[item?.source];
      if (span.success && validSourceSpan(item, request) && typeof item.quote === 'string'
        && source?.slice(item.start, item.end) === item.quote) validSpans++;
    }
    return { schemaCompliant, observedSpans: output.evidence.length, validSpans,
      invalidSpans: output.evidence.length - validSpans };
  } catch { return { ...unavailable, schemaCompliant: false }; }
}

function pairedMetrics(comparison, modelTiming, baselineTiming) {
  const rows = comparison.baseline.cases.map((before, i) => {
    const after = comparison.candidate.cases[i];
    return { before, after, categories: before.assessedCategories.filter(c => after.assessedCategories.includes(c)) };
  });
  const categories = [...new Set(rows.flatMap(r => r.categories))];
  const metrics = (rows, side, category) => summarize(rows.map(row => ({
    expectedPresent: row[side].labels[category], actualPresent: row[side].predictedCategories.includes(category),
  })));
  const comparable = rows.filter(r => r.categories.length);
  return {
    categories: Object.fromEntries(categories.map(category => {
      const selected = rows.filter(r => r.categories.includes(category));
      return [category, { comparableCaseIds: selected.map(r => r.before.id),
        baseline: metrics(selected, 'before', category), model: metrics(selected, 'after', category) }];
    })),
    comparableCases: comparable.length, uncomparableCases: rows.length - comparable.length,
    latency: { baseline: latencySummary(comparable.map(r => baselineTiming.get(r.before.id))),
      model: latencySummary(comparable.map(r => modelTiming.get(r.before.id))),
      caveat: 'Same inputs and overlapping assessed categories; total work/category counts may differ. Not an inference-speed equivalence claim.' },
  };
}

export async function runModelBenchmark({ configText, datasetText, referenceTexts = [], client }) {
  const { config, configSha256, loaded } = prepareBenchmark(configText, datasetText, referenceTexts);
  if (!client || client.id !== config.client.id || client.version !== config.client.version) throw new BenchmarkError('client_identity_mismatch');
  const invocations = new Map();
  const cleanups = new Map();
  const instrumented = { id:client.id, version:client.version, async infer(input, limits) {
    const sourceRequest = structuredClone(input.request);
    const observation = { requestId:input.request.requestId, timeout:false, transportFailed:false,
      schemaCompliant:null, observedSpans:null, validSpans:null, invalidSpans:null };
    invocations.set(input.request.requestId, observation);
    const onAbort = () => { if (limits.signal.reason === 'model_deadline_exceeded') observation.timeout = true; };
    limits.signal.addEventListener('abort', onAbort);
    cleanups.set(input.request.requestId, () => limits.signal.removeEventListener('abort', onAbort));
    try {
      const raw = await client.infer(input, limits);
      // Keep only bounded audit counts. Never retain/log response text or quotes.
      if (!limits.signal.aborted) Object.assign(observation, auditResponse(raw, sourceRequest, limits.maxResponseBytes));
      return raw;
    } catch { observation.transportFailed = true; throw new Error('Benchmark inference failed.'); }
  } };
  const model = createAnalyzer(createModelTextAnalyzer(modelOptions(config, instrumented)));
  const cache = new Map();
  const modelTiming = new Map();
  const cpuBefore = process.cpuUsage();
  const memoryBefore = process.memoryUsage();
  const startedAt = new Date().toISOString();
  const report = await evaluateReviewedDataset(datasetText, { async analyze(request) {
    const start = performance.now();
    try {
      const result = await model.analyze(request);
      cache.set(request.requestId, { requestHash:sha256(JSON.stringify(request)), result:structuredClone(result) });
      return result;
    } finally {
      modelTiming.set(request.requestId, performance.now()-start);
      cleanups.get(request.requestId)?.();
    }
  } }, referenceTexts);
  const cpu = process.cpuUsage(cpuBefore);
  const memoryAfter = process.memoryUsage();
  const cachedModel = { async analyze(request) {
    const cached = cache.get(request.requestId);
    if (!cached || cached.requestHash !== sha256(JSON.stringify(request))) throw new Error('Benchmark cache mismatch.');
    return structuredClone(cached.result);
  } };
  const baselines = [ ['native',nativeTextAnalyzer], ['contextual',contextualTextAnalyzer],
    ['profanity',createEnglishProfanityAnalyzer()], ['spam_scam',createEnglishSpamScamAnalyzer()],
    ['spam_attribution',createEnglishSpamScamAttributionAnalyzer()] ];
  const comparisons = {};
  for (const [name, analyzer] of baselines) {
    const engine = createAnalyzer(analyzer);
    const timing = new Map();
    const compared = await compareReviewedDataset(datasetText, referenceTexts, { candidate:cachedModel,
      baseline:{ async analyze(request) {
        const start = performance.now();
        try { return await engine.analyze(request); }
        finally { timing.set(request.requestId, performance.now()-start); }
      } } });
    comparisons[name] = { paired: pairedMetrics(compared, modelTiming, timing),
      ...compared, baselineLatency: latencySummary(compared.baseline.cases
        .filter(c => Object.keys(c.modelVersions).length).map(c => timing.get(c.id))),
      caseLatency:compared.baseline.cases.map(c => ({id:c.id,invoked:Object.keys(c.modelVersions).length>0,latencyMs:timing.get(c.id)})) };
  }
  const observations = structuredClone([...invocations.values()]);
  return {
    reportVersion:'toxiply.model-benchmark-report.v1', mode:config.mode,
    liveModel:config.mode === 'mock' || !observations.length ? 'NOT_RUN' : 'ATTEMPTED',
    interpretation:config.mode === 'mock' ? 'MOCK_ONLY_NOT_REAL_MODEL_ACCURACY_OR_PERFORMANCE' : 'Uncalibrated evaluation under declared approvals; no production accuracy claim.',
    startedAt, completedAt:new Date().toISOString(), configSha256,
    provenance:config, dataset:report.dataset,
    attestations:'Configuration metadata does not verify authorization, weights, runtime or reviewer independence.',
    executionFailed:report.executionFailures.length > 0 || Object.values(comparisons).some(c => c.executionFailed),
    model:report,
    modelLatency:latencySummary([...invocations.keys()].map(id => modelTiming.get(id))),
    modelCaseLatency:report.cases.map(c => ({id:c.id,invoked:invocations.has(c.id),latencyMs:modelTiming.get(c.id)})),
    calls:{ requested:loaded.dataset.cases.length, invoked:observations.length,
      timeouts:observations.filter(x => x.timeout).length,
      failed:report.statusCounts.failed, transportFailures:observations.filter(x => x.transportFailed).length,
      schemaFailures:observations.filter(x => x.schemaCompliant === false).length },
    responseAudit:{ cases:observations,
      validSpans:observations.reduce((n,x) => n+(x.validSpans ?? 0),0),
      invalidSpans:observations.reduce((n,x) => n+(x.invalidSpans ?? 0),0),
      unauditedCalls:observations.filter(x => x.observedSpans === null).length,
      unrelatedEvidence:null, semanticScope:'Only optional dataset span annotations assess alignment; unannotated relevance is NOT_MEASURED.' },
    observations:{ clientProcess:{ cpuUserMicros:cpu.user, cpuSystemMicros:cpu.system,
      rssBeforeBytes:memoryBefore.rss, rssAfterBytes:memoryAfter.rss,
      heapBeforeBytes:memoryBefore.heapUsed, heapAfterBytes:memoryAfter.heapUsed },
      host:{ node:process.version, platform:os.platform(), arch:os.arch(), cpuCount:os.cpus().length, totalRamBytes:os.totalmem() },
      modelServerCpu:null, modelServerGpu:null, modelServerRam:null,
      tokens:null, cost:null,
      unavailableReason:'Server resource/usage/cost telemetry is not exposed by the T7A string-only inference client. Client process observations are not model resource usage.' },
    comparisons,
  };
}
