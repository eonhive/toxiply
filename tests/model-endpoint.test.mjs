/**
 * Company: EonHive Inc. | Title: Isolated model endpoint integration tests
 * Purpose: Verify HTTP inference, bounded responses, redirects and confidential failures locally.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { createAnalyzer, createModelTextAnalyzer, createChatCompletionsClient } from '@eonhive/toxiply';
import { fixtureModelOptions, fixtureResponse } from '../eval/model-fixture-client.mjs';

const dataset = JSON.parse(await readFile(new URL('../eval/model-adapter.v1.json', import.meta.url), 'utf8'));
const request = () => structuredClone(dataset.cases[0].request);
async function serve(t, handler) {
  const server = createServer((req, res) => { Promise.resolve(handler(req, res)).catch(() => { res.destroy(); }); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, endpoint: `${origin}/v1/chat/completions`, server };
}
async function body(req) {
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function envelope(output) {
  return { model: fixtureModelOptions.modelId, choices: [{ index: 0, finish_reason: 'stop',
    message: { role: 'assistant', content: JSON.stringify(output) } }] };
}
function engine(config, changes = {}) {
  return createAnalyzer(createModelTextAnalyzer({ ...fixtureModelOptions, timeoutMs: 1500,
    client: createChatCompletionsClient({ endpoint: config.endpoint, allowedOrigins: [config.origin],
      allowInsecureLoopback: true, apiKey: 'LOCAL_TEST_SECRET' }), ...changes }));
}

test('full V1 request -> model adapter -> isolated chat server -> validated V1 result', async t => {
  let captured;
  const config = await serve(t, async (req, res) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/v1/chat/completions');
    assert.equal(req.headers.authorization, 'Bearer LOCAL_TEST_SECRET');
    captured = await body(req);
    assert.equal(captured.model, fixtureModelOptions.modelId);
    assert.equal(captured.stream, false);
    assert.equal(captured.temperature, 0);
    assert.equal(captured.response_format.json_schema.strict, true);
    assert.match(captured.messages[0].content, /untrusted data/);
    const data = JSON.parse(captured.messages[1].content);
    assert.deepEqual(data.request, request());
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(envelope(fixtureResponse(data))));
  });
  const result = await engine(config).analyze(request());
  assert.equal(result.status, 'completed');
  assert.equal(result.findings.length, 2);
  assert.deepEqual(result.findings.map(f => f.category), ['toxicity', 'harassment']);
  assert.equal(result.evidence[0].start, 0);
  assert.equal(result.evidence[0].end, 'You are an idiot'.length);
  assert.equal(result.confidence.calibrated, false);
  assert.doesNotMatch(JSON.stringify(result), /LOCAL_TEST_SECRET|You are an idiot|127\.0\.0\.1/);
  assert.ok(captured);
});

for (const [name, change] of [
  ['truncated completion', e => { e.choices[0].finish_reason = 'length'; }],
  ['refusal', e => { e.choices[0].message.refusal = 'PRIVATE_REFUSAL'; }],
  ['tools requested', e => { e.choices[0].message.tool_calls = [{}]; }],
  ['legacy function requested', e => { e.choices[0].message.function_call = { name: 'unexpected' }; }],
  ['wrong outer model', e => { e.model = 'other-model'; }],
  ['multiple choices', e => { e.choices.push(e.choices[0]); }],
  ['malformed inner JSON', e => { e.choices[0].message.content = 'PRIVATE_FAILURE'; }],
  ['nonassistant message', e => { e.choices[0].message.role = 'user'; }],
]) {
  test(`endpoint failure: ${name}`, async t => {
    const config = await serve(t, async (req, res) => {
      const wire = await body(req); const output = envelope(fixtureResponse(JSON.parse(wire.messages[1].content)));
      change(output); res.setHeader('content-type','application/json'); res.end(JSON.stringify(output));
    });
    const result = await engine(config).analyze(request());
    assert.equal(result.status, 'failed');
    assert.equal(result.error.code, 'analyzer_failed');
    assert.deepEqual(result.findings, []);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE|LOCAL_TEST_SECRET/);
  });
}

for (const [name, handler] of [
  ['HTTP failure', (_, res) => { res.writeHead(500, {'content-type':'application/json'}); res.end('PRIVATE_FAILURE'); }],
  ['wrong content type', (_, res) => { res.end('PRIVATE_HTML'); }],
  ['invalid UTF8', (_, res) => { res.setHeader('content-type','application/json'); res.end(Buffer.from([255,254])); }],
  ['declared oversize', (_, res) => { res.writeHead(200, {'content-type':'application/json','content-length':'10000000'}); res.end('x'); }],
  ['streamed oversize', (_, res) => { res.writeHead(200, {'content-type':'application/json'}); res.write('x'.repeat(1000)); res.end('x'.repeat(1000)); }],
  ['network reset', (req) => { req.socket.destroy(); }],
  ['slow headers', () => {}],
  ['stalled body', (_, res) => { res.writeHead(200, {'content-type':'application/json'}); res.write('{'); }],
]) {
  test(`bounded network failure: ${name}`, async t => {
    const config = await serve(t, handler);
    const result = await engine(config, { timeoutMs: 100, maxResponseBytes: 1024 }).analyze(request());
    assert.equal(result.status, 'failed');
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE|LOCAL_TEST_SECRET/);
  });
}

test('redirects are rejected and never receive content or credentials', async t => {
  let redirected = 0;
  const target = await serve(t, (_, res) => { redirected++; res.end(); });
  const source = await serve(t, (_, res) => { res.writeHead(307, { location: target.endpoint }); res.end(); });
  assert.equal((await engine(source).analyze(request())).status, 'failed');
  assert.equal(redirected, 0);
});

test('endpoint policy rejects missing approval, URL credentials, query secrets, insecure remote hosts and unsupported protocols', () => {
  for (const config of [
    { endpoint:'https://example.invalid/model',allowedOrigins:[] },
    { endpoint:'http://example.invalid/model',allowedOrigins:['http://example.invalid'],allowInsecureLoopback:true },
    { endpoint:'http://localhost:11434/model',allowedOrigins:['http://localhost:11434'],allowInsecureLoopback:true },
    { endpoint:'https://user:SECRET@example.invalid/model',allowedOrigins:['https://example.invalid'] },
    { endpoint:'https://example.invalid/model?key=SECRET',allowedOrigins:['https://example.invalid'] },
    { endpoint:'https://example.invalid/model#fragment',allowedOrigins:['https://example.invalid'] },
    { endpoint:'file:///tmp/model',allowedOrigins:['null'] },
    { endpoint:'http://127.0.0.1:1234/model',allowedOrigins:['http://127.0.0.1:1234'] },
    { endpoint:'https://example.invalid/model',allowedOrigins:['https://example.invalid'],apiKey:'secret\r\nHeader: bad' },
  ]) assert.throws(() => createChatCompletionsClient(config), /^Error: Invalid model endpoint configuration\.$/);
});

test('runnable example performs an actual round trip with only explicitly supplied configuration', async t => {
  let calls = 0;
  const config = await serve(t, async (req, res) => {
    calls++;
    const wire = await body(req); const data = JSON.parse(wire.messages[1].content);
    const output = { ...data, request: undefined, requestId: data.request.requestId,
      language:'en', context:'analyzed', findings:[{ category:'harassment', score:0.8, evidenceIds:['e1'] }],
      evidence:[{ id:'e1',code:'model.source_span',source:'text',start:0,end:16,quote:'You are an idiot' }] };
    res.setHeader('content-type','application/json'); res.end(JSON.stringify(envelope(output)));
  });
  const { stdout } = await promisify(execFile)(process.execPath, ['examples/model-text.mjs'], {
    cwd: new URL('..', import.meta.url), env: { ...process.env,
      TOXIPLY_MODEL_ENDPOINT:config.endpoint, TOXIPLY_MODEL_ALLOWED_ORIGIN:config.origin,
      TOXIPLY_MODEL_ALLOW_LOOPBACK:'true', TOXIPLY_MODEL_ID:fixtureModelOptions.modelId,
      TOXIPLY_MODEL_VERSION:fixtureModelOptions.modelVersion, TOXIPLY_MODEL_API_KEY:'LOCAL_TEST_SECRET' },
  });
  assert.equal(JSON.parse(stdout).status,'completed');
  assert.equal(calls,1);
  assert.doesNotMatch(stdout,/LOCAL_TEST_SECRET|You are an idiot/);
});

test('unconfigured example explicitly reports NOT_RUN without invoking any endpoint', async () => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith('TOXIPLY_MODEL_')) delete env[key];
  const { stdout } = await promisify(execFile)(process.execPath, ['examples/model-text.mjs'], {
    cwd: new URL('..', import.meta.url), env,
  });
  assert.equal(JSON.parse(stdout).liveModel, 'NOT_RUN');
});
