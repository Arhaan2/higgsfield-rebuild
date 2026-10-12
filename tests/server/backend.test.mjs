import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, session, project, imageBytes } from './harness.mjs';
import { parseRange } from '../../src/server/media.ts';
import { validateImage } from '../../src/server/images.ts';
import { boundedBytes } from '../../src/server/http.ts';
import { outputUrl, queueUrl } from '../../src/server/fal.ts';
import { IMAGE_MODEL } from '../../src/contracts/studio.ts';
const data=async r=>(await r.json()).data;
async function upload(h,cookie,p,id=crypto.randomUUID(),bytes=imageBytes()) {return h.request(`/api/projects/${p.id}/uploads?assetId=${id}&filename=start.jpg`,{method:'POST',cookie,raw:bytes,headers:{'Content-Type':'image/jpeg'}});}

test('Origin is configured, mandatory, and checked before session creation; opaque cookie stores only its hash',async()=>{
  const h=harness();for(const origin of ['null','https://evil.test','https://studio.test.evil',''])assert.equal((await h.request('/api/guest',{method:'POST',body:{},headers:{Origin:origin}})).status,403);
  assert.equal(h.db.raw.prepare('SELECT count(*) AS n FROM guests').get().n,0);
  const r=await h.request('/api/guest',{method:'POST',body:{}}),cookie=r.headers.get('Set-Cookie');assert.match(cookie,/^__Host-studio_guest=/);assert.match(cookie,/HttpOnly; Secure; SameSite=Lax/);assert.equal((await r.json()).data.expiresAt.length,24);
  const row=h.db.raw.prepare('SELECT * FROM guests').get();assert.equal(row.token_hash.length,64);assert.ok(!JSON.stringify(row).includes(cookie.split('=')[1].split(';')[0]));
});
test('Guest CRUD persists revisions and rejects foreign project/asset/reuse; same-owner cross-project reuse is allowed',async()=>{
  const h=harness(),a=await session(h),b=await session(h),p=await project(h,a),other=await project(h,a);
  assert.equal((await h.request(`/api/projects/${p.id}`,{cookie:b})).status,404);
  const asset=await data(await upload(h,a,p));
  assert.equal((await h.request(`/api/assets/${asset.id}`,{cookie:b})).status,404);
  assert.equal((await h.request(`/api/assets/${asset.id}/media`,{cookie:b})).status,404);assert.equal(h.r2.calls.get,0);
  const bp=await project(h,b);
  const draft={operation:'image_to_video',prompt:'Slow motion',presetId:null,parentAssetId:asset.id,startAssetId:asset.id};
  assert.equal((await h.request(`/api/projects/${bp.id}`,{method:'PATCH',cookie:b,body:{expectedRevision:1,draft}})).status,404);
  const saved=await h.request(`/api/projects/${other.id}`,{method:'PATCH',cookie:a,body:{expectedRevision:1,draft}});assert.equal(saved.status,200);
  assert.equal((await data(await h.request(`/api/projects/${other.id}`,{cookie:a}))).project.draft.startAssetId,asset.id);
  assert.equal((await h.request(`/api/projects/${other.id}`,{method:'PATCH',cookie:a,body:{expectedRevision:1,title:'Stale'}})).status,409);
  assert.equal((await h.request(`/api/projects/${other.id}`,{method:'PATCH',cookie:a,body:{expectedRevision:2,preferredAssetId:asset.id}})).status,422);
  assert.equal((await data(await h.request(`/api/assets/${asset.id}`,{cookie:a}))).projectId,p.id);
});
test('Binary validation rejects MIME lies, missing EOI, compressed and oversize bodies before R2; raw chunk limit counts actual bytes',async()=>{
  assert.equal(validateImage(imageBytes(),'image/jpeg').width,1600);
  assert.throws(()=>validateImage(imageBytes(),'image/png'));assert.throws(()=>validateImage(imageBytes().slice(0,-2),'image/jpeg'));
  let cancelled=false;const stream=new ReadableStream({pull(c){c.enqueue(new Uint8Array(6));},cancel(){cancelled=true;}});
  await assert.rejects(()=>boundedBytes(stream,10));assert.equal(cancelled,true);
  const h=harness(),c=await session(h),p=await project(h,c);
  assert.equal((await upload(h,c,p,crypto.randomUUID(),new Uint8Array([1,2,3]))).status,422);
  assert.equal((await h.request(`/api/projects/${p.id}/uploads?assetId=${crypto.randomUUID()}&filename=x.jpg`,{method:'POST',cookie:c,raw:imageBytes(),headers:{'Content-Type':'image/jpeg','Content-Encoding':'gzip'}})).status,415);
  assert.equal((await upload(h,c,p,crypto.randomUUID(),new Uint8Array(5000001))).status,413);assert.equal(h.r2.calls.put,0);
});
test('Upload idempotency, uncertain R2 write reconciliation, and immutable first-write preserve accounting',async()=>{
  const h=harness(),c=await session(h),p=await project(h,c),id=crypto.randomUUID();h.r2.failNextAfterWrite();
  assert.equal((await upload(h,c,p,id)).status,503);assert.equal(h.db.raw.prepare("SELECT state FROM storage_reservations WHERE asset_id=?").get(id).state,'held');
  assert.equal((await upload(h,c,p,id)).status,201);assert.equal(h.r2.calls.put,1);assert.equal((await upload(h,c,p,id)).status,200);
  assert.equal(h.db.raw.prepare('SELECT count(*) AS n FROM assets').get().n,1);assert.equal(h.db.raw.prepare('SELECT bytes FROM storage_reservations').get().bytes,imageBytes().length);
});
test('Range, HEAD, conditional requests, and disposition return retained bytes without foreign access',async()=>{
  const h=harness(),c=await session(h),p=await project(h,c),asset=await data(await upload(h,c,p));
  let r=await h.request(`/api/assets/${asset.id}/media`,{cookie:c,headers:{Range:'bytes=2-20'}});assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),`bytes 2-20/${asset.byteSize}`);assert.equal((await r.arrayBuffer()).byteLength,19);assert.match(r.headers.get('Cache-Control'),/no-store/);
  r=await h.request(`/api/assets/${asset.id}/download`,{method:'HEAD',cookie:c,headers:{Range:'bytes=-16'}});assert.equal(r.status,206);assert.equal(r.headers.get('Content-Length'),'16');assert.equal((await r.arrayBuffer()).byteLength,0);assert.match(r.headers.get('Content-Disposition'),/^attachment;/);
  r=await h.request(`/api/assets/${asset.id}/media`,{cookie:c,headers:{Range:'bytes=0-9','If-Range':'"old"'}});assert.equal(r.status,200);
  r=await h.request(`/api/assets/${asset.id}/media`,{cookie:c,headers:{'If-None-Match':'"retained"'}});assert.equal(r.status,304);
  r=await h.request(`/api/assets/${asset.id}/media`,{cookie:c,headers:{Range:'bytes=99999999-'}});assert.equal(r.status,416);assert.equal(r.headers.get('Content-Range'),`bytes */${asset.byteSize}`);
  for(const invalid of ['bytes=2-1','bytes=0-1,3-4','bytes=-0','bytes=-','items=0-4'])assert.throws(()=>parseRange(invalid,100));
});
test('All zero/disabled policy combinations create no jobs, no reservations, and no provider calls',async()=>{
  for(const options of [{live:false,envCap:'1',dbCap:1000000},{live:true,envCap:'0',dbCap:1000000},{live:true,envCap:'1',dbCap:0},{live:true,envCap:'1',dbCap:null}]) {
    let calls=0;const h=harness({...options,fetcher:async()=>{calls++;throw new Error();}}),c=await session(h),p=await project(h,c);
    const r=await h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey:crypto.randomUUID(),draftRevision:1}});assert.equal(r.status,403);
    assert.equal(h.db.raw.prepare('SELECT count(*) AS n FROM jobs').get().n,0);assert.equal(h.db.raw.prepare('SELECT count(*) AS n FROM storage_reservations').get().n,0);assert.equal(calls,0);
    const capability=await data(await h.request('/api/capabilities'));assert.equal(capability.liveGeneration.enabled,false);assert.ok(!JSON.stringify(capability).includes('isolated-test-key'));
  }
});
test('Concurrent identical requests submit once; ambiguous outcome remains held and never resubmits, even after lease expiry',async()=>{
  let calls=0;const h=harness({live:true,envCap:'1',dbCap:1000000,fetcher:async()=>{calls++;throw new Error('Lost response after acceptance');}}),c=await session(h),p=await project(h,c),requestKey=crypto.randomUUID();
  const send=()=>h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey,draftRevision:1}});
  const responses=await Promise.all([send(),send()]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,202]);assert.equal(calls,1);
  const job=await data(responses[0]);assert.equal(h.db.raw.prepare('SELECT count(*) AS n FROM jobs').get().n,1);
  const row=h.db.raw.prepare('SELECT * FROM jobs').get();assert.equal(row.status,'submission_unknown');assert.equal(row.accounting_state,'held');
  h.advance(120000);await h.request(`/api/jobs/${job.id}/refresh`,{method:'POST',cookie:c,body:{}});assert.equal(calls,1);
  h.runtime.config.liveEnabled=false;const replay=await send();assert.equal(replay.status,200);assert.equal((await data(replay)).id,job.id);
  assert.equal((await h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey,draftRevision:2}})).status,409);
});
test('Concurrent admission at last budget unit allows one guest; held storage slots are atomic',async()=>{
  let calls=0;const h=harness({live:true,envCap:'0.01',dbCap:10000,fetcher:async()=>{calls++;throw new Error('Unknown outcome');}}),a=await session(h),b=await session(h),p=await project(h,a),q=await project(h,b);
  const responses=await Promise.all([[a,p],[b,q]].map(([cookie,pr])=>h.request(`/api/projects/${pr.id}/jobs`,{method:'POST',cookie,body:{requestKey:crypto.randomUUID(),draftRevision:1}})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[202,429]);assert.equal(calls,1);assert.equal(h.db.raw.prepare("SELECT sum(reserve_micro_usd) AS total FROM jobs WHERE accounting_state!='released'").get().total,10000);
  const guest=h.db.raw.prepare('SELECT guest_id FROM projects WHERE id=?').get(p.id).guest_id;
  for(let i=0;i<11;i++){const id=crypto.randomUUID();h.db.raw.prepare("INSERT INTO storage_reservations (id,guest_id,project_id,asset_id,bytes,state,created_at,updated_at) VALUES (?,?,?,?,1,'held',1,1)").run(id,guest,p.id,id);}
  const inserts=Array.from({length:2},()=>{const id=crypto.randomUUID();return h.db.prepare("INSERT INTO storage_reservations (id,guest_id,project_id,asset_id,bytes,state,created_at,updated_at) VALUES (?,?,?,?,1,'held',1,1)").bind(id,guest,p.id,id).run();});
  const settled=await Promise.allSettled(inserts);assert.ok(settled.some(r=>r.status==='rejected'));assert.ok(h.db.raw.prepare("SELECT count(*) AS n FROM storage_reservations WHERE guest_id=? AND state!='released'").get(guest).n<=12);
});
test('Output and authenticated queue URLs reject host/path tricks',()=>{
  assert.equal(outputUrl('https://v3.fal.media/files/clip.mp4'),'https://v3.fal.media/files/clip.mp4');
  for(const url of ['https://fal.media.evil.test/x','http://fal.media/x','https://user@fal.media/x','https://storage.googleapis.com/other/x','https://127.0.0.1/x'])assert.throws(()=>outputUrl(url));
  assert.throws(()=>queueUrl('https://queue.fal.run/fal-ai/flux/requests/wrong/status',IMAGE_MODEL,'expected','status'));
});

test('Mocked FLUX completion retains one immutable output; transfer retry reconciles a lost R2 acknowledgement without regeneration',async()=>{
  const providerId=crypto.randomUUID();let submits=0,statuses=0,results=0,media=0;
  const h=harness({live:true,envCap:'1',dbCap:1000000,fetcher:async(url,init)=>{
    const u=String(url);
    if(init?.method==='POST'){submits++;assert.equal(init.headers['X-Fal-No-Retry'],'1');assert.equal(init.headers['x-app-fal-disable-fallback'],'true');const input=JSON.parse(init.body);assert.equal(input.num_images,1);assert.equal(input.sync_mode,false);return Response.json({request_id:providerId,status_url:`https://queue.fal.run/fal-ai/flux/requests/${providerId}/status`,response_url:`https://queue.fal.run/fal-ai/flux/requests/${providerId}`});}
    if(u.endsWith('/status')){statuses++;return Response.json({status:'COMPLETED',request_id:providerId});}
    if(u.includes('queue.fal.run')){results++;return Response.json({images:[{url:'https://v3.fal.media/output.jpg',content_type:'image/jpeg',width:1600,height:2397}],seed:99});}
    media++;assert.equal(init.headers,undefined);return new Response(imageBytes(),{headers:{'Content-Type':'image/jpeg'}});
  }}),c=await session(h),p=await project(h,c),requestKey=crypto.randomUUID();
  const initial=await data(await h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey,draftRevision:1}}));assert.equal(initial.status,'queued');
  h.advance(3000);h.r2.failNextAfterWrite();
  const failed=await data(await h.request(`/api/jobs/${initial.id}/refresh`,{method:'POST',cookie:c,body:{}}));assert.equal(failed.status,'transfer_failed');assert.equal(failed.error.recovery,'retry_transfer');assert.equal(h.db.raw.prepare('SELECT accounting_state FROM jobs').get().accounting_state,'committed');
  const complete=await data(await h.request(`/api/jobs/${initial.id}/retry-transfer`,{method:'POST',cookie:c,body:{}}));assert.equal(complete.status,'succeeded');assert.equal(complete.resultMetadata.seed,99);assert.equal(complete.outputAssetIds.length,1);assert.deepEqual([submits,statuses,results,media],[1,1,1,1]);assert.equal(h.r2.calls.put,1);
  assert.equal(h.db.raw.prepare('SELECT count(*) AS n FROM assets').get().n,1);assert.equal(h.db.raw.prepare('SELECT bytes FROM storage_reservations').get().bytes,imageBytes().length);
  assert.throws(()=>h.db.raw.exec("UPDATE jobs SET snapshot_json='{}'"),/IMMUTABLE_JOB/);assert.throws(()=>h.db.raw.exec("UPDATE assets SET file_name='changed.jpg'"),/IMMUTABLE_ASSET/);
  assert.ok(!JSON.stringify(complete).includes('https://queue.fal.run'));assert.ok(!JSON.stringify(complete).includes('https://v3.fal.media'));assert.ok(!JSON.stringify(complete).includes('isolated-test-key'));
});

test('An expired poll lease cannot overwrite the successor completed result',async()=>{
  const providerId=crypto.randomUUID();let statusCalls=0,release,entered;
  const waiting=new Promise(resolve=>{entered=resolve;});
  const h=harness({live:true,envCap:'1',dbCap:1000000,fetcher:async(url,init)=>{
    if(init?.method==='POST')return Response.json({request_id:providerId});
    if(String(url).endsWith('/status')) {statusCalls++;if(statusCalls===1){entered();return new Promise(resolve=>{release=()=>resolve(Response.json({status:'IN_PROGRESS'}));});}return Response.json({status:'COMPLETED'});}
    if(String(url).includes('queue.fal.run'))return Response.json({images:[{url:'https://fal.media/output.jpg'}]});
    return new Response(imageBytes(),{headers:{'Content-Type':'image/jpeg'}});
  }}),c=await session(h),p=await project(h,c);
  const job=await data(await h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey:crypto.randomUUID(),draftRevision:1}}));h.advance(3000);
  const stale=h.request(`/api/jobs/${job.id}/refresh`,{method:'POST',cookie:c,body:{}});await waiting;h.advance(61000);
  const successor=await data(await h.request(`/api/jobs/${job.id}/refresh`,{method:'POST',cookie:c,body:{}}));assert.equal(successor.status,'succeeded');
  release();assert.equal((await data(await stale)).status,'succeeded');assert.equal(h.db.raw.prepare('SELECT count(*) AS n FROM assets').get().n,1);
});

test('Unsafe result host fails transfer while retaining job identity and blocking a second active operation',async()=>{
  let posts=0,unexpected=0;const id=crypto.randomUUID();
  const h=harness({live:true,envCap:'1',dbCap:1000000,fetcher:async(url,init)=>{
    if(init?.method==='POST'){posts++;return Response.json({request_id:id});}
    if(String(url).endsWith('/status'))return Response.json({status:'COMPLETED'});
    if(String(url).includes('queue.fal.run'))return Response.json({images:[{url:'http://127.0.0.1/private'}]});
    unexpected++;throw new Error('Should not fetch an unapproved host');
  }}),c=await session(h),p=await project(h,c);
  const job=await data(await h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey:crypto.randomUUID(),draftRevision:1}}));h.advance(3000);
  assert.equal((await data(await h.request(`/api/jobs/${job.id}/refresh`,{method:'POST',cookie:c,body:{}}))).status,'transfer_failed');
  assert.equal((await h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey:crypto.randomUUID(),draftRevision:1}})).status,409);
  assert.equal(posts,1);assert.equal(unexpected,0);assert.equal(h.db.raw.prepare('SELECT provider_request_id FROM jobs').get().provider_request_id,id);
});

test('A stale submitting lease becomes unknown; late acknowledgement cannot overwrite it or trigger another POST',async()=>{
  let posts=0,entered,release;const waiting=new Promise(resolve=>{entered=resolve;});const providerId=crypto.randomUUID();
  const h=harness({live:true,envCap:'1',dbCap:1000000,fetcher:async()=>{posts++;entered();return new Promise(resolve=>{release=()=>resolve(Response.json({request_id:providerId}));});}}),c=await session(h),p=await project(h,c);
  const pending=h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey:crypto.randomUUID(),draftRevision:1}});
  await waiting;const job=h.db.raw.prepare('SELECT id FROM jobs').get();h.advance(61000);
  const refreshed=await data(await h.request(`/api/jobs/${job.id}/refresh`,{method:'POST',cookie:c,body:{}}));assert.equal(refreshed.status,'submission_unknown');assert.equal(refreshed.error.recovery,'contact_owner');
  release();assert.equal((await data(await pending)).status,'submission_unknown');assert.equal(posts,1);assert.equal(h.db.raw.prepare('SELECT provider_request_id FROM jobs').get().provider_request_id,null);
});

test('PNG structural/CRC validation accepts the original fixture and rejects corrupted chunks and animation markers',async()=>{
  const {readFileSync}=await import('node:fs');const png=new Uint8Array(readFileSync(new URL('../../docs/recon/fixtures/amber-study-upload.png',import.meta.url)));
  assert.deepEqual(validateImage(png,'image/png'),{mimeType:'image/png',width:1024,height:576});
  const corrupt=png.slice();corrupt[29]^=1;assert.throws(()=>validateImage(corrupt,'image/png'));
  const {crc32}=await import('node:zlib');const chunk=Buffer.alloc(20);chunk.writeUInt32BE(8,0);chunk.write('acTL',4);chunk.writeUInt32BE(1,8);chunk.writeUInt32BE(crc32(chunk.subarray(4,16)),16);const animated=Buffer.concat([png.subarray(0,33),chunk,png.subarray(33)]);assert.throws(()=>validateImage(animated,'image/png'));
  const h=harness(),c=await session(h),p=await project(h,c);
  assert.equal((await h.request(`/api/projects/${p.id}/uploads?assetId=${crypto.randomUUID()}&filename=frame.png`,{method:'POST',cookie:c,raw:png,headers:{'Content-Type':'image/png'}})).status,201);
});

test('Kling sample input comes only from the configured origin/catalog after enablement, with frozen five-second settings',async()=>{
  const seen=[];const h=harness({live:true,envCap:'1',dbCap:1000000,fetcher:async(url,init)=>{
    seen.push(String(url));if(String(url)==='https://studio.test/samples/dune-light.jpg')return new Response(imageBytes());
    assert.equal(String(url),'https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video');assert.equal(init.method,'POST');
    const input=JSON.parse(init.body);assert.equal(input.duration,'5');assert.equal(input.cfg_scale,0.5);assert.equal(input.tail_image_url,undefined);assert.match(input.image_url,/^data:image\/jpeg;base64,/);
    return Response.json({request_id:crypto.randomUUID()});
  }}),c=await session(h),p=await project(h,c,{operation:'image_to_video',prompt:'A slow camera push',presetId:null,parentAssetId:'sample-dune-light',startAssetId:'sample-dune-light'});
  const created=await data(await h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:c,body:{requestKey:crypto.randomUUID(),draftRevision:1}}));assert.equal(created.status,'queued');assert.equal(seen.length,2);assert.equal(h.db.raw.prepare('SELECT bytes FROM storage_reservations').get().bytes,20000000);
  assert.ok(!JSON.stringify(created).includes('data:image'));
});

test('Owner checks precede zero-budget response on a new foreign job request',async()=>{
  const h=harness(),a=await session(h),b=await session(h),p=await project(h,a);
  assert.equal((await h.request(`/api/projects/${p.id}/jobs`,{method:'POST',cookie:b,body:{requestKey:crypto.randomUUID(),draftRevision:1}})).status,404);
});

test('Fixed rate buckets deny extra writes atomically and expire without deleting saved work',async()=>{
  const h=harness(),c=await session(h),p=await project(h,c);let status;
  // One create plus 59 acknowledged patches fills this guest's 60/hour writes.
  for(let revision=1;revision<60;revision++){const r=await h.request(`/api/projects/${p.id}`,{method:'PATCH',cookie:c,body:{expectedRevision:revision,title:`Frame ${revision}`}});assert.equal(r.status,200);}
  const denied=await h.request(`/api/projects/${p.id}`,{method:'PATCH',cookie:c,body:{expectedRevision:60,title:'Denied'}});assert.equal(denied.status,429);assert.ok(Number(denied.headers.get('Retry-After'))>0);
  h.advance(3600000);status=(await h.request(`/api/projects/${p.id}`,{method:'PATCH',cookie:c,body:{expectedRevision:60,title:'Next hour'}})).status;assert.equal(status,200);
  assert.equal((await data(await h.request(`/api/projects/${p.id}`,{cookie:c}))).project.title,'Next hour');
});

test('Unknown JSON keys, compressed JSON, unsafe revisions, and oversized bodies fail without changing the draft',async()=>{
  const h=harness(),c=await session(h),p=await project(h,c);
  assert.equal((await h.request(`/api/projects/${p.id}`,{method:'PATCH',cookie:c,body:{expectedRevision:1,modelId:'caller-model'}})).status,422);
  assert.equal((await h.request(`/api/projects/${p.id}`,{method:'PATCH',cookie:c,body:{expectedRevision:Number.MAX_SAFE_INTEGER+1,title:'Unsafe'}})).status,422);
  assert.equal((await h.request(`/api/projects/${p.id}`,{method:'PATCH',cookie:c,body:{expectedRevision:1,title:'a'.repeat(17000)}})).status,413);
  assert.equal((await h.request(`/api/projects/${p.id}`,{method:'PATCH',cookie:c,body:{expectedRevision:1,title:'Compressed'},headers:{'Content-Encoding':'gzip'}})).status,415);
  assert.equal((await data(await h.request(`/api/projects/${p.id}`,{cookie:c}))).project.revision,1);
});
