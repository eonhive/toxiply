/**
 * Company: EonHive Inc. | Title: Private benchmark CLI integration
 * Purpose: Exercise explicit execution and immutable artifacts against an isolated mock server.
 * Author: Stan Nesi | Created: 2026-11-11 | Updated: 2026-11-11
 * Notes: Vibe coded with Codex.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp,readFile,writeFile,readdir,stat,mkdir,rm,symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { BENCHMARK_PROMPT_SHA256 } from '../eval/model-benchmark-config.mjs';
import { fixtureResponse,fixtureModelOptions } from '../eval/model-fixture-client.mjs';
import { sha256 } from '../eval/review-dataset.mjs';

const root=new URL('..',import.meta.url);
const bundled=['native-text.v1.json','context-attribution.v1.json','text-review.example.v1.json',
  'english-spam-scam.v1.json','spam-scam-attribution.v1.json','model-adapter.v1.json'];
const hashes=await Promise.all(bundled.map(async name=>sha256(await readFile(new URL(`../eval/${name}`,import.meta.url),'utf8'))));
const original=JSON.parse(await readFile(new URL('../eval/model-adapter.v1.json',import.meta.url),'utf8'));
async function cli(args,extraEnv={}){
  const env={...process.env};for(const k of Object.keys(env))if(k.startsWith('TOXIPLY_MODEL_'))delete env[k];
  try{return {...await promisify(execFile)(process.execPath,['eval/run-model-benchmark.mjs',...args],
    {cwd:root,env:{...env,...extraEnv},maxBuffer:1024*1024}),code:0};}
  catch(error){return {stdout:error.stdout,stderr:error.stderr,code:error.code};}
}
async function files(t,origin){
  const directory=await mkdtemp(join(tmpdir(),'toxiply-benchmark-test-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const data=JSON.stringify({...original,cases:[original.cases[0]]});
  // These declarations are fictional fixtures for a loopback test server only.
  // They are not a real model authorization, reviewer or benchmark result.
  const config={schemaVersion:'toxiply.model-benchmark.v1',mode:'live',benchmarkId:'mock-http-test',
    authorization:{approvedBy:'FICTIONAL_TEST_ONLY',approvedAt:'2026-11-11T00:00:00Z',modelUseAuthorized:true,
      endpointUseAuthorized:true,dataUseAuthorized:true,permissionRecord:'FICTIONAL_TEST_RECORD',privacyRetentionAccessRecord:'MOCK_TEST_ONLY'},
    model:{id:fixtureModelOptions.modelId,version:fixtureModelOptions.modelVersion,checkpointRevision:'NO_WEIGHTS_TEST_ONLY',quantization:'NONE',configuration:'Canned test responses',
      license:{identifier:'Synthetic',reference:'Test fixtures',usePermissionRecord:'FICTIONAL_TEST_RECORD'}},
    client:{id:'chat-completions-json',version:'chat-json-v1',promptRevision:'model-json-v2',promptSha256:BENCHMARK_PROMPT_SHA256},
    endpoint:{url:`${origin}/v1/chat/completions`,allowedOrigins:[origin],allowInsecureLoopback:true,credentialEnv:'TOXIPLY_BENCHMARK_TEST_KEY'},
    profile:{categories:fixtureModelOptions.categories,languages:['en'],supportsContext:true},
    execution:{timeoutMs:1500,maxResponseBytes:65536,maxCases:1},
    dataset:{id:original.datasetId,version:original.datasetVersion,sha256:sha256(data),referenceSha256:hashes},
    runtime:{server:'MOCK_HTTP_NOT_MODEL',hardware:'Test process',software:process.version,notes:'NOT_REAL_MODEL_RESULTS'}};
  const configPath=join(directory,'private-config.json');const dataPath=join(directory,'data.json');
  await writeFile(configPath,JSON.stringify(config),{mode:0o600});await writeFile(dataPath,data,{mode:0o600});
  return {directory,config,configPath,dataPath,args:['--config',configPath,'--dataset',dataPath]};
}
async function server(t,invalid=false){
  let calls=0;
  const s=createServer(async(req,res)=>{
    calls++;
    try{
      assert.equal(req.headers.authorization,'Bearer SYNTHETIC_TEST_KEY');
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const wire=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const data=JSON.parse(wire.messages[1].content);const output=fixtureResponse(data);
      if(invalid)output.evidence[0].quote='PRIVATE_FAKE_SPAN';
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({model:data.modelId,choices:[{finish_reason:'stop',message:{role:'assistant',content:JSON.stringify(output)}}]}));
    }catch{res.destroy();}
  });
  s.listen(0,'127.0.0.1');await once(s,'listening');
  t.after(async()=>{s.closeAllConnections();await new Promise(resolve=>s.close(resolve));});
  return {origin:`http://127.0.0.1:${s.address().port}`,calls:()=>calls};
}

test('default and mock commands cannot select real inference through environment credentials',async()=>{
  const env={TOXIPLY_MODEL_ENDPOINT:'https://example.invalid/forbidden',TOXIPLY_MODEL_API_KEY:'PRIVATE_ENV_KEY'};
  const described=await cli([],env);assert.equal(described.code,0);assert.equal(JSON.parse(described.stdout).liveModel,'NOT_RUN');
  const mocked=await cli(['mock'],env);assert.equal(mocked.code,0);const r=JSON.parse(mocked.stdout);
  assert.equal(r.liveModel,'NOT_RUN');assert.equal(r.calls.invoked,12);assert.match(r.interpretation,/MOCK_ONLY/);
  assert.doesNotMatch(mocked.stdout,/PRIVATE_ENV_KEY|https:\/\/example.invalid/);
});

test('validation does not invoke inference and run requires explicit execution, credentials and private output',async t=>{
  const s=await server(t);const f=await files(t,s.origin);
  assert.equal((await cli(['validate',...f.args])).code,0);
  assert.equal((await cli(['run',...f.args,'--output',f.directory])).code,1);
  assert.equal((await cli(['run',...f.args,'--output',f.directory,'--execute'])).code,1);
  assert.equal((await cli(['run',...f.args,'--output',new URL('../src',import.meta.url).pathname,'--execute'],
    {TOXIPLY_BENCHMARK_TEST_KEY:'SYNTHETIC_TEST_KEY'})).code,1);
  assert.equal(s.calls(),0);
});

test('configured benchmark path runs once, stores 0600 immutable plan/report, and returns no raw input or credentials',async t=>{
  const s=await server(t);const f=await files(t,s.origin);
  const before=await readFile(f.dataPath);
  const result=await cli(['run',...f.args,'--output',f.directory,'--execute'],{TOXIPLY_BENCHMARK_TEST_KEY:'SYNTHETIC_TEST_KEY'});
  assert.equal(result.code,0,result.stderr);
  const receipt=JSON.parse(result.stdout);const artifact=join(f.directory,receipt.artifact);
  const report=JSON.parse(await readFile(artifact,'utf8'));
  assert.equal(report.calls.invoked,1);assert.equal(s.calls(),1);
  assert.equal(report.model.statusCounts.completed,1);
  assert.equal(report.modelLatency.samples,1);assert.ok(report.modelLatency.p50Ms>0);
  assert.equal((await stat(artifact)).mode&0o777,0o600);
  assert.equal((await readdir(f.directory)).filter(n=>n.endsWith('.plan.json')).length,1);
  assert.equal(receipt.sha256,sha256(await readFile(artifact,'utf8')));
  assert.deepEqual(await readFile(f.dataPath),before);
  assert.doesNotMatch(result.stdout,/SYNTHETIC_TEST_KEY|You are an idiot|FICTIONAL_TEST/);
  assert.doesNotMatch(JSON.stringify(report),/SYNTHETIC_TEST_KEY|You are an idiot\./);
  assert.equal(report.observations.cost,null);
});

test('strict model failure persists an auditable failed report with no benign quality denominator',async t=>{
  const s=await server(t,true);const f=await files(t,s.origin);
  const result=await cli(['run',...f.args,'--output',f.directory,'--execute'],{TOXIPLY_BENCHMARK_TEST_KEY:'SYNTHETIC_TEST_KEY'});
  assert.equal(result.code,1);
  const report=JSON.parse(await readFile(join(f.directory,JSON.parse(result.stdout).artifact),'utf8'));
  assert.equal(report.model.statusCounts.failed,1);assert.equal(report.model.totals.cases,0);
  assert.equal(report.responseAudit.invalidSpans,1);assert.equal(report.executionFailed,true);
  assert.doesNotMatch(JSON.stringify(report),/PRIVATE_FAKE_SPAN/);
});

test('configuration in public or another repository and malformed flags are rejected without disclosing paths',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'toxiply-config-location-test-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  await mkdir(join(directory,'.git'));const config=join(directory,'config.json');await writeFile(config,'{}');
  const result=await cli(['validate','--config',config,'--dataset',config]);
  assert.equal(result.code,1);assert.doesNotMatch(result.stderr,new RegExp(directory));
  const publicConfig=new URL('../package.json',import.meta.url).pathname;
  assert.equal((await cli(['validate','--config',publicConfig,'--dataset',config])).code,1);
  const linked=join(tmpdir(),`toxiply-link-${process.pid}.json`);await symlink(publicConfig,linked);t.after(()=>rm(linked,{force:true}));
  assert.equal((await cli(['validate','--config',linked,'--dataset',config])).code,1);
  for(const args of [['run'],['mock','--execute'],['describe','--output','x'],['wat'],['validate','--config'],['run','--execute','--execute']]){
    assert.equal((await cli(args)).code,1);
  }
});
