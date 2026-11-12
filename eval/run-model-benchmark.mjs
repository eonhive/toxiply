/**
 * Company: EonHive Inc. | Title: Opt-in private model benchmark command
 * Purpose: Validate approved manifests and persist immutable reports without default inference.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { BenchmarkError, BENCHMARK_PROMPT_SHA256, prepareBenchmark,
  configuredClient, readPrivateBenchmarkConfig } from './model-benchmark-config.mjs';
import { runModelBenchmark } from './model-benchmark.mjs';
import { readDatasetText, sha256, writePrivateArtifact } from './review-dataset.mjs';

const bundled = ['native-text.v1.json','context-attribution.v1.json','text-review.example.v1.json',
  'english-spam-scam.v1.json','spam-scam-attribution.v1.json','model-adapter.v1.json'];
try {
  const [command = 'describe', ...args] = process.argv.slice(2);
  if (!['describe','mock','validate','run'].includes(command)) throw new BenchmarkError('invalid_command');
  const flags = {};
  const references = [];
  for (let i=0;i<args.length;i++) {
    const flag = args[i];
    if (flag === '--execute') {
      if (flags.execute) throw new BenchmarkError('invalid_arguments');
      flags.execute = true;
    } else if (['--config','--dataset','--output','--reference'].includes(flag) && args[i+1] && !args[i+1].startsWith('--')) {
      const value = args[++i];
      if (flag === '--reference') references.push(value);
      else { if (flags[flag]) throw new BenchmarkError('invalid_arguments'); flags[flag] = value; }
    } else throw new BenchmarkError('invalid_arguments');
  }
  if (command === 'describe') {
    if (args.length) throw new BenchmarkError('invalid_arguments');
    console.log(JSON.stringify({ liveModel:'NOT_RUN', reason:'No approved model configuration selected.',
      schemaVersion:'toxiply.model-benchmark.v1', promptRevision:'model-json-v2', promptSha256:BENCHMARK_PROMPT_SHA256,
      client:{ id:'chat-completions-json', version:'chat-json-v1' },
      required:'Private model/checkpoint/quantization/license/permission/endpoint/profile/runtime manifest; hash-bound eligible dataset and references; output directory; run --execute.' }, null, 2));
  } else if (command === 'mock') {
    if (args.length) throw new BenchmarkError('invalid_arguments');
    const { fixtureModelOptions, fixtureModelClient } = await import('./model-fixture-client.mjs');
    const datasetText = await readFile(new URL('./model-adapter.v1.json', import.meta.url),'utf8');
    const dataset = JSON.parse(datasetText);
    const config = { schemaVersion:'toxiply.model-benchmark.v1',mode:'mock',benchmarkId:'t7b-canned-replay',authorization:null,
      model:{ id:fixtureModelOptions.modelId,version:fixtureModelOptions.modelVersion,checkpointRevision:'NO_REAL_WEIGHTS',
        quantization:'NOT_APPLICABLE',configuration:'Canned fixture replay only',
        license:{ identifier:'Synthetic fixtures',reference:'eval/model-adapter.v1.json',usePermissionRecord:'Repository-authored public synthetic development inputs' } },
      client:{ id:fixtureModelClient.id,version:fixtureModelClient.version,promptRevision:'model-json-v2',promptSha256:BENCHMARK_PROMPT_SHA256 },
      endpoint:null,profile:{ categories:fixtureModelOptions.categories,languages:['en'],supportsContext:true },
      execution:{ timeoutMs:1000,maxResponseBytes:65536,maxCases:14 },
      dataset:{ id:dataset.datasetId,version:dataset.datasetVersion,sha256:sha256(datasetText),referenceSha256:[] },
      runtime:{ server:'Canned client, not a model server',hardware:'Client process only',software:process.version,notes:'MOCK_ONLY_NOT_REAL_MODEL_QUALITY' } };
    const report = await runModelBenchmark({ configText:JSON.stringify(config),datasetText,client:fixtureModelClient });
    console.log(JSON.stringify({ liveModel:report.liveModel,interpretation:report.interpretation,
      statusCounts:report.model.statusCounts,calls:report.calls,
      responseAudit:{ validSpans:report.responseAudit.validSpans,invalidSpans:report.responseAudit.invalidSpans },
      comparisons:Object.fromEntries(Object.entries(report.comparisons).map(([k,v]) => [k,{comparableCases:v.paired.comparableCases,
        categories:Object.keys(v.paired.categories)}])),
      note:'Mock timings/resources are measured only in tests/private reports; no real-model accuracy, latency, tokens or costs.' }, null, 2));
    if (report.executionFailed) process.exitCode = 1;
  } else {
    if (!flags['--config'] || !flags['--dataset'] || (command === 'run' && (!flags.execute || !flags['--output']))
      || (command === 'validate' && (flags.execute || flags['--output']))) throw new BenchmarkError('explicit_configuration_required');
    const configText = await readPrivateBenchmarkConfig(flags['--config']);
    const datasetText = await readDatasetText(flags['--dataset']);
    const referenceTexts = await Promise.all([...bundled.map(name => new URL(name,import.meta.url)),...references].map(readDatasetText));
    const prepared = prepareBenchmark(configText,datasetText,referenceTexts);
    if (prepared.config.mode !== 'live') throw new BenchmarkError('live_configuration_required');
    if (command === 'validate') {
      console.log(JSON.stringify({ validated:true,liveModel:'NOT_RUN',configSha256:prepared.configSha256,
        datasetSha256:prepared.loaded.datasetSha256,referenceSha256:prepared.loaded.referenceHashes }, null, 2));
    } else {
      const client = configuredClient(prepared.config);
      const runId = `${prepared.config.benchmarkId}-${randomUUID()}`;
      // Validate private/immutable storage before any network call. The plan is
      // an evaluation receipt, not a source-action journal or customer history.
      await writePrivateArtifact(flags['--output'],`${runId}.plan.json`,JSON.stringify({
        runId,createdAt:new Date().toISOString(),configSha256:prepared.configSha256,
        datasetSha256:prepared.loaded.datasetSha256,state:'planned-not-yet-executed',
      },null,2)+'\n');
      const report = await runModelBenchmark({configText,datasetText,referenceTexts,client});
      const serialized = JSON.stringify({...report,runId},null,2)+'\n';
      const filename = `${runId}.report.json`;
      await writePrivateArtifact(flags['--output'],filename,serialized);
      console.log(JSON.stringify({artifact:filename,sha256:sha256(serialized),liveModel:report.liveModel,
        executionFailed:report.executionFailed}));
      if (report.executionFailed) process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(JSON.stringify({error:error instanceof BenchmarkError ? error.code : 'model_benchmark_failed'}));
  process.exitCode = 1;
}
