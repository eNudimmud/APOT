/* Signed-session route checks; real MP4 encoding is checked separately. */
'use strict';
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const oauth = require('./lib/x-oauth');
const signal = require('./signature-engine');
const renderer = require('./lib/signal-film');
const route = require('./api/x/film');
const savedEnv = Object.fromEntries(oauth.ENV_NAMES.map(key => [key, process.env[key]]));
const originalRender = renderer.render;
Object.assign(process.env, { X_CLIENT_ID:'fixture', X_CLIENT_SECRET:'fixture', X_REDIRECT_URI:'https://apot.example/api/x/callback', APOT_SESSION_SECRET:'film-fixture-secret' });
const account = (id=signal.FIXTURE_X_ID, username='APOTsignal') => ({v:1,id,username,name:'APOT',avatar:'https://pbs.twimg.com/profile_images/1/photo.jpg',exp:Date.now()+60000});
const cookie = value => value ? oauth.SESSION_COOKIE+'='+encodeURIComponent(oauth.sign(value,process.env.APOT_SESSION_SECRET)) : '';
function req(value=account(), extras={}) {
  return {method:'POST',body:{tone:'midnight'},...extras,headers:{origin:'https://apot.example','content-type':'application/json','x-apot-account':value?.id,cookie:cookie(value),...extras.headers}};
}
function res() { return Object.assign(new EventEmitter(), {headers:{},statusCode:0,writableEnded:false,setHeader(key,value){this.headers[key.toLowerCase()]=value;},end(body){this.body=body;this.writableEnded=true;}}); }
async function call(request) { const result=res(); await route(request,result); return result; }
async function run() {
  let renders=0;
  renderer.render=async (a,tone) => { renders++; return {bytes:Buffer.from('fixture MP4 '+a.id+' '+tone),seed:signal.seedForIdentity(a.id)}; };
  for (const [request,status] of [[req(null),401],[req({...account(),exp:Date.now()-1}),401],[req(account(),{method:'GET'}),405],
    [req(account(),{headers:{origin:'https://other.example'}}),403],[req(account(),{headers:{'x-apot-account':'123'}}),409],
    [req(account(),{body:{tone:'midnight',seed:'7F2A91C4'}}),400],[req(account(),{body:{tone:'invalid'}}),400],
    [req(account(),{body:'{'}),400],[req(account(),{body:'x'.repeat(1025)}),413],[req(account(),{headers:{'content-type':'text/plain'}}),415]]) {
    assert.equal((await call(request)).statusCode,status);
  }
  assert.equal(renders,0,'Rejected requests must never allocate the encoder.');
  const own=await call(req()); assert.equal(own.statusCode,200);
  assert.equal(own.headers['content-type'],'video/mp4'); assert.equal(own.headers['cache-control'],'private, no-store');
  assert.equal(own.headers['x-apot-account'],signal.FIXTURE_X_ID); assert.equal(own.headers['x-apot-seed'],signal.FIXTURE_X_SEED);
  assert.ok(own.headers['content-disposition'].includes(signal.FIXTURE_X_SEED));
  assert.equal((await call(req(account(),{headers:{host:'www.apot.world',origin:'https://www.apot.world'}}))).statusCode,200,'The same deployed host works even if the OAuth callback uses another canonical host.');
  assert.equal((await call(req(account(),{headers:{host:'www.apot.world',origin:'https://other.example'}}))).statusCode,403);
  const repeated=await call(req()); assert.deepEqual(repeated.body,own.body); assert.equal(renders,1,'A warm cache reuses only this account, handle and palette.');
  const other=await call(req(account('123456789'))); assert.notDeepEqual(other.body,own.body); assert.notEqual(other.headers['x-apot-seed'],own.headers['x-apot-seed']);
  const renamed=await call(req(account(signal.FIXTURE_X_ID,'new_handle'))); assert.equal(renamed.headers['x-apot-seed'],own.headers['x-apot-seed']); assert.equal(renders,3);
  let release, abortSignal;
  renderer.render=async (a,tone,options) => {abortSignal=options.signal;await new Promise(done=>{release=done;});return {bytes:Buffer.from('pending'),seed:signal.seedForIdentity(a.id)};};
  const pendingReq=req(account('234567890')), pendingRes=res(), pending=route(pendingReq,pendingRes);
  await new Promise(done=>setImmediate(done));
  assert.equal((await call(req(account('234567890')))).statusCode,429,'An account cannot start two concurrent renders.');
  pendingReq.headers.cookie=cookie({...account('234567890'),exp:Date.now()-1}); release(); await pending;
  assert.equal(pendingRes.statusCode,401,'An expired account must not receive the finished MP4.');
  const interruptedRes=res(), interrupted=route(req(account('345678901')),interruptedRes); await new Promise(done=>setImmediate(done));
  interruptedRes.emit('close'); assert.equal(abortSignal.aborted,true); release(); await interrupted;
  assert.equal(interruptedRes.writableEnded,false,'A disconnected client must not receive a completed film.');
  renderer.render=async()=>{throw new Error('Encoder unavailable');};
  assert.equal((await call(req(account('456789012')))).statusCode,503);
  console.log('film check ok — X-only route, server-derived seed, strict palette, private MP4, isolated cache, concurrency, expiry and cancellation');
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{renderer.render=originalRender;for(const key of oauth.ENV_NAMES)if(savedEnv[key]==null)delete process.env[key];else process.env[key]=savedEnv[key];});
