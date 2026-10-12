// Client-state verification only. No browser, network, provider, or storage service calls.
// This minimal hook-state harness checks deferred-request invariants; it is not a React renderer or DOM test.
// Run from the repository root: node src/client/checks/studio-state.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
const root = process.cwd();
const req = createRequire(path.join(root, 'package.json'));
const ts = req('typescript');
const deferred = () => { let resolve, reject; const promise = new Promise((r,j) => {resolve=r;reject=j;}); return {promise,resolve,reject}; };
const tick = async () => { for (let i=0;i<5;i++) await new Promise(r => setImmediate(r)); };
const sampleDraft = () => ({operation:'image_to_video',prompt:'first',presetId:null,parentAssetId:null,startAssetId:'sample-dune-light'});
const project = (draft=sampleDraft(), revision=1) => ({id:'11111111-1111-4111-8111-111111111111', title:'Untitled shot', draft,revision,preferredAssetId:null,createdAt:'2026-10-12T00:00:00Z',updatedAt:'2026-10-12T00:00:00Z'});
function harness(query='?sample=dune-study', overrides={}, existingStorage, followEffects=false) {
  let slot=0, first=true; const slots=[], effects=[], cache=new Map(), calls=[];
  const store=existingStorage||new Map();
  const storage = {getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  // clearRecovery enumerates Storage keys, so mirror its enumerable-key behavior.
  const localStorage=new Proxy(storage,{ownKeys:()=>[...store.keys()],getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
  const React={
    useState(initial){const index=slot++; if(first) slots[index]=typeof initial==='function'?initial():initial; return [slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
    useRef(initial){const index=slot++; if(first) slots[index]={current:initial}; return slots[index];},
    useCallback(fn,deps){const index=slot++;const previous=slots[index];if(!previous || deps.some((dep,i)=>dep!==previous.deps[i]))slots[index]={fn,deps};return slots[index].fn;},
    useEffect(fn,deps){const index=slot++;const previous=slots[index];if(first || (followEffects && (!deps || deps.some((dep,i)=>dep!==previous?.deps?.[i])))){effects.push(()=>{previous?.cleanup?.();slots[index]={deps,cleanup:fn()};});}},
  };
  class StudioApiError extends Error {constructor(message,status,code,retryable=false){super(message);Object.assign(this,{status,code,retryable});}}
  const api={
    capabilities:async()=>({liveGeneration:{enabled:false,remainingMicroUsd:0,budgetLimitMicroUsd:0,reason:'disabled'},upload:{maxBytes:5000000,mimeTypes:['image/jpeg','image/png']},operations:[],samplesAvailable:true}),
    guest:async()=>({expiresAt:'2026-11-10T00:00:00Z'}),
    createProject:async body=>({...project(body.draft),id:body.id,title:body.title}),
    saveProject:async(id,body)=>({...project(body.draft,body.expectedRevision+1),id,title:body.title}),
    project:async()=>({project:project(),assets:[],jobs:[]}),
    asset:async()=>{throw new Error('no asset');},
    job:async()=>{throw new Error('no source job');},
    upload:async()=>{throw new StudioApiError('upload interrupted',503,'SERVICE_UNAVAILABLE');},
    ...overrides,
  };
  for(const key of Object.keys(api)){const fn=api[key];api[key]=(...args)=>{calls.push([key,...args]);return fn(...args);};}
  const context={console,JSON,Date,Math,URLSearchParams,localStorage,crypto:webcrypto,setTimeout:(...args)=>{const timer=setTimeout(...args);timer.unref();return timer;},clearTimeout,document:{hidden:true},window:{location:{search:query},history:{replaceState(){}},addEventListener(){},removeEventListener(){}},createImageBitmap:async()=>({width:512,height:512,close(){}})};
  function load(relative){const filename=path.join(root,relative);if(cache.has(filename))return cache.get(filename);const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const loadedModule={exports:{}};cache.set(filename,loadedModule.exports);const localRequire=name=>{if(name==='react')return React;if(name==='./api')return {api,StudioApiError,errorMessage:e=>e.message};if(name.startsWith('@/'))return load(name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(filename),name))+'.ts');return req(name);};vm.runInNewContext(`(function(require,module,exports){${code}\n})`,context,{filename})(localRequire,loadedModule,loadedModule.exports);return loadedModule.exports;}
  const {useStudio: runStudio}=load('src/client/use-studio.ts');
  const render=()=>{slot=0;const view=runStudio();first=false;return view;};
  render();
  const flush=async()=>{for(let i=0;i<10;i++){render();for(const effect of effects.splice(0))effect();await tick();}return render();};
  const start=async()=>{for(const effect of effects.splice(0))effect();await tick();return followEffects?flush():render();};
  return {start,flush,render,calls,store,api,StudioApiError,context,load};
}
(async()=>{
  let count=0;
  const check=(name)=>{count++;console.log('PASS '+name);};
  {
    const h=harness();let v=await h.start();assert.equal(v.sampleCollection,true);assert.equal(v.project,null);assert.equal(h.calls.filter(c=>['guest','createProject'].includes(c[0])).length,0);check('sample inspection creates no private guest/project');
    const d=deferred();h.api.createProject=async body=>{h.calls.push(['deferred-create',body]);await d.promise;return {...project({...body.draft}),id:body.id,title:body.title};};
    v.updatePrompt('before response');v=h.render();const saving=v.save();await tick();v=h.render();assert.equal(v.saving,true);assert.equal(v.saved,false);v.updatePrompt('newer typed buffer');d.resolve();await saving;v=h.render();assert.equal(v.buffer.drafts.image_to_video.prompt,'newer typed buffer');assert.equal(v.saved,false);assert.equal(v.dirty,true);check('save response does not overwrite later typing or announce Saved');
    await v.save();v=h.render();assert.equal(v.saved,true);check('subsequent acknowledged save marks current buffer saved');
    v.switchMode('text_to_image');v.updatePrompt('other mode');v.switchMode('image_to_video');v=h.render();assert.equal(v.buffer.drafts.text_to_image.prompt,'other mode');assert.equal(v.buffer.drafts.image_to_video.prompt,'newer typed buffer');const stored=[...h.store.values()].filter(s=>s.includes('newer typed buffer'));assert(stored.some(s=>s.includes('other mode')));check('both task drafts persist in browser recovery');
  }
  {
    const h=harness('?project=11111111-1111-4111-8111-111111111111');let v=await h.start();h.api.saveProject=async()=>{throw new h.StudioApiError('conflict',409,'REVISION_CONFLICT');};v.updatePrompt('keep on conflict');assert.equal(await v.save(),null);v=h.render();assert.equal(v.conflict,true);assert.equal(v.buffer.drafts.image_to_video.prompt,'keep on conflict');assert.equal(await v.beforeNavigate(),false);check('revision conflict retains current edits and blocks departure');
  }
  {
    const h=harness('?project=11111111-1111-4111-8111-111111111111');let v=await h.start();h.api.saveProject=async()=>{throw new h.StudioApiError('offline',0,'CONNECTION_LOST');};v.updatePrompt('keep offline');assert.equal(await v.beforeNavigate(),false);v=h.render();assert.equal(v.buffer.drafts.image_to_video.prompt,'keep offline');assert.equal(v.saved,false);check('failed save prevents navigation and retains current text');
    h.api.saveProject=async()=>{throw new h.StudioApiError('expired',401,'GUEST_REQUIRED');};await v.save();v=h.render();assert.equal(v.expired,true);assert.equal(v.buffer.drafts.image_to_video.prompt,'keep offline');assert.equal([...h.store.keys()].filter(k=>k.startsWith('frame-studio:recovery:')).length,0);check('expired session clears stale persistent recovery but keeps in-memory text');
  }
  {
    const h=harness('?project=11111111-1111-4111-8111-111111111111');let v=await h.start();const before=v.buffer.drafts.image_to_video.startAssetId;await v.upload({name:'valid.jpg',type:'image/jpeg',size:2000});v=h.render();assert.equal(v.buffer.drafts.image_to_video.startAssetId,before);assert.match(v.uploadError,/interrupted/);assert(v.pendingFile);check('failed reference upload retains prior reference and retry file');
  }
  {
    const live={liveGeneration:{enabled:true,remainingMicroUsd:100,budgetLimitMicroUsd:100,reason:null},upload:{maxBytes:5000000,mimeTypes:[]},operations:[],samplesAvailable:true};
    const requests=[];const h=harness('?project=11111111-1111-4111-8111-111111111111',{capabilities:async()=>live,submit:async(id,body)=>{requests.push({...body});throw new Error('ambiguous connection loss');}});let v=await h.start();await v.submit();v=h.render();assert(v.pending);assert.equal(requests.length,1);v.updatePrompt('edited after uncertain submit');h.api.capabilities=async()=>({...live,liveGeneration:{enabled:false,remainingMicroUsd:0,budgetLimitMicroUsd:0,reason:'disabled'}});await v.retryCapabilities();v=h.render();await v.submit();assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);check('ambiguous submission replays same request key/revision even after edits and zero-cap change');
  }
  {
    const h=harness('?project=11111111-1111-4111-8111-111111111111');let v=await h.start();
    h.api.saveProject=async(id,body)=>({...project(Object.fromEntries(Object.entries(body.draft).sort().map(([key,value])=>[key,key === "prompt" ? value.trim() : value])),body.expectedRevision+1),id,title:body.title.trim()});
    v.updatePrompt('  normalized prompt  ');await v.save();v=h.render();assert.equal(v.saved,true);assert.equal(v.buffer.drafts.image_to_video.prompt,'  normalized prompt  ');check('server property reordering and trimming do not cause false unsaved state');
  }
  {
    let accepted;
    const h=harness('?sample=dune-study',{createProject:async body=>{accepted=body;throw new Error('response lost after creation');}});let v=await h.start();v.updatePrompt('original create');await v.save();v=h.render();v.updatePrompt('edited after lost create');
    const h2=harness('?sample=dune-study',{createProject:async body=>{assert.equal(body.id,accepted.id);assert.equal(body.draft.prompt,'original create');return {...project(body.draft),id:body.id,title:body.title};}},h.store);let restored=await h2.start();assert.equal(restored.buffer.drafts.image_to_video.prompt,'edited after lost create');await restored.save();restored=h2.render();assert.equal(restored.saved,true);assert.equal(restored.project.draft.prompt,'edited after lost create');check('ambiguous project creation replays original identity/content after reload then saves new edits');
  }

  const failures=[];
  const regression=async(name,run)=>{try{await run();check(name);}catch(error){failures.push(name);console.error('FAIL '+name, error.message);}};
  const query='?project=11111111-1111-4111-8111-111111111111';
  const live={liveGeneration:{enabled:true,remainingMicroUsd:100,budgetLimitMicroUsd:100,reason:null},upload:{maxBytes:5000000,mimeTypes:[]},operations:[],samplesAvailable:true};
  const job=(overrides={})=>({id:'old-job',projectId:project().id,requestKey:'old-key',status:'running',outputAssetIds:[],nextPollAfterMs:3000,createdAt:'2026-10-12T00:00:00Z',...overrides});
  const output={id:'old-output',projectId:project().id,createdAt:'2026-10-12T00:00:00Z'};
  const restoreUnsaved = async (query='') => {
    const initial=harness(query);let v=await initial.start();
    v.switchMode('text_to_image');v.updatePrompt('inactive task kept');v.switchMode('image_to_video');v.updatePrompt('recovered video prompt');
    const h=harness(query,{},initial.store);v=await h.start();assert.match(v.notice,/Unsaved browser buffer restored/);
    return {h,v};
  };
  await regression('SN01: restored new shot, edited title/prompt and JPG save clear stale recovery notice',async()=>{
    const {h,v}=await restoreUnsaved();
    v.edit(current=>({...current,title:'Recovered shot'}));v.updatePrompt('edited before upload');
    h.api.upload=async id=>({...output,id:'uploaded-frame',projectId:id});
    await v.upload({name:'valid.jpg',type:'image/jpeg',size:2000});const saved=h.render();
    assert.equal(saved.saved,true);assert.equal(saved.dirty,false);assert.equal(saved.notice,'');
    assert.equal(saved.project.title,'Recovered shot');assert.equal(saved.project.draft.prompt,'edited before upload');assert.equal(saved.project.draft.startAssetId,'uploaded-frame');
    assert.equal(saved.buffer.drafts.text_to_image.prompt,'inactive task kept');
    const recovery=h.load('src/client/recovery.ts').readRecovery(saved.project.id);assert.equal(recovery.buffer.drafts.text_to_image.prompt,'inactive task kept');
    assert.equal(saved.capabilities.liveGeneration.enabled,false);assert.equal(h.calls.filter(c=>c[0]==='submit').length,0);
  });
  for(const location of ['',query]) await regression(`SN02: pending save preserves newer edits and unsaved recovery notice (${location?'existing':'new'} shot)`,async()=>{
    const {h,v}=await restoreUnsaved(location);const delayed=deferred();
    if(location) h.api.saveProject=async(id,body)=>{await delayed.promise;return {...project(body.draft,body.expectedRevision+1),id,title:body.title};};
    else h.api.createProject=async body=>{await delayed.promise;return {...project(body.draft),id:body.id,title:body.title};};
    const saving=v.save();await tick();assert.equal(h.render().saving,true);
    v.edit(current=>({...current,title:'Newer title'}));v.updatePrompt('newer pending-save edit');
    delayed.resolve();await saving;let next=h.render();
    assert.equal(next.saved,false);assert.equal(next.dirty,true);assert.match(next.notice,/Unsaved browser buffer restored/);
    assert.equal(next.buffer.title,'Newer title');assert.equal(next.buffer.drafts.image_to_video.prompt,'newer pending-save edit');
    assert.equal(next.buffer.drafts.text_to_image.prompt,'inactive task kept');
    await next.save();next=h.render();assert.equal(next.saved,true);assert.equal(next.notice,'');
  });
  await regression('SN03: storage warning arriving during save survives acknowledgement',async()=>{
    const {h,v}=await restoreUnsaved(query);const delayed=deferred();
    h.api.saveProject=async(id,body)=>{await delayed.promise;return {...project(body.draft,body.expectedRevision+1),id,title:body.title};};
    const saving=v.save();await tick();h.store.set=()=>{throw new Error('storage unavailable');};
    v.edit(current=>({...current}));const warning=h.render().notice;assert.match(warning,/recovery storage is unavailable/);
    delayed.resolve();await saving;const next=h.render();assert.equal(next.saved,true);assert.equal(next.notice,warning);
  });
  await regression('SN04: result notice arriving during save survives acknowledgement',async()=>{
    const {h,v}=await restoreUnsaved(query);const delayed=deferred();
    h.api.saveProject=async(id,body)=>{await delayed.promise;return {...project(body.draft,body.expectedRevision+1),id,title:body.title};};
    const saving=v.save();await tick();h.api.refresh=async()=>job({status:'succeeded',outputAssetIds:[output.id]});
    h.api.project=async()=>({project:project(),assets:[output],jobs:[job({status:'succeeded'})]});
    await v.refreshJob(job());assert.equal(h.render().notice,'Your result is ready to inspect.');
    delayed.resolve();await saving;assert.equal(h.render().saved,true);assert.equal(h.render().notice,'Your result is ready to inspect.');
  });
  await regression('IR01: invalid inactive prompt and saved active prompt survive reload; API limits remain',async()=>{
    const h=harness(query);let v=await h.start();const invalid=' '+ 'x'.repeat(2501)+' ';
    v.switchMode('text_to_image');v.updatePrompt(invalid);v.switchMode('image_to_video');v.updatePrompt('new valid video draft');await v.save();v=h.render();assert.equal(v.saved,true);
    const saved=v.project;
    const h2=harness(query,{project:async()=>({project:saved,assets:[],jobs:[]})},h.store);let restored=await h2.start();
    assert.equal(restored.buffer.drafts.text_to_image.prompt,invalid);assert.equal(restored.buffer.drafts.image_to_video.prompt,'new valid video draft');assert.equal(restored.saved,true);
    restored.switchMode('text_to_image');restored=h2.render();assert.equal(await restored.save(),null);assert.equal(h2.calls.filter(c=>c[0]==='saveProject').length,0);
    const {draftSchema}=h2.load('src/contracts/studio.ts');assert.equal(draftSchema.safeParse(restored.buffer.drafts.text_to_image).success,false);
    const h3=harness(query,{project:async()=>({project:saved,assets:[],jobs:[]})},h2.store);restored=await h3.start();assert.equal(restored.buffer.operation,'text_to_image');assert.equal(restored.buffer.drafts.text_to_image.prompt,invalid);
  });
  await regression('IR02: lost acknowledgement then 429 and inconclusive errors retain identity across reload',async()=>{
    const requests=[];const h=harness(query,{capabilities:async()=>live,submit:async(id,body)=>{requests.push({id,...body});throw new Error('lost acknowledgement');}});let v=await h.start();await v.submit();v=h.render();const original=JSON.stringify(v.pending);assert(v.pending);
    for(const [status,code] of [[429,'RATE_LIMITED'],[503,'SERVICE_UNAVAILABLE'],[401,'GUEST_REQUIRED'],[403,'FORBIDDEN'],[404,'NOT_FOUND'],[422,'VALIDATION_FAILED'],[409,'REQUEST_KEY_CONFLICT'],[200,'INVALID_RESPONSE']]){
      h.api.submit=async(id,body)=>{requests.push({id,...body});throw new h.StudioApiError(code,status,code);};await v.submit();v=h.render();assert.equal(JSON.stringify(v.pending),original,code);
    }
    const h2=harness(query,{capabilities:async()=>live,submit:async(id,body)=>{requests.push({id,...body});return job({projectId:id,requestKey:body.requestKey});}},h.store);v=await h2.start();assert.equal(JSON.stringify(v.pending),original);await v.submit();v=h2.render();assert.equal(v.pending,null);assert.equal(v.jobs.length,1);
    assert.equal(requests.length,10);for(const request of requests)assert.deepEqual(request,requests[0]);await v.submit();assert.equal(requests.length,10);
  });
  await regression('IR02: conclusive admission rejection releases pending request without automatic retry',async()=>{
    const h=harness(query,{capabilities:async()=>live});let v=await h.start();let requests=0;h.api.submit=async()=>{requests++;throw new h.StudioApiError('disabled',403,'LIVE_DISABLED');};await v.submit();v=h.render();assert.equal(v.pending,null);assert.equal(requests,1);
  });
  for(const replacement of ['conflict-copy','session-replacement']) for(const stage of ['refresh','detail','error']){
    await regression(`IR03: deferred ${stage} ignored after ${replacement}`,async()=>{
      const delayed=deferred();let detailReads=0;const originalJob=job();
      const h=harness(query,{project:async()=>({project:project(),assets:[],jobs:[originalJob]})});let v=await h.start();
      h.api.refresh=async()=> stage==='refresh'||stage==='error' ? delayed.promise : job({status:'succeeded',outputAssetIds:[output.id]});
      h.api.project=async()=>{detailReads++;return stage==='detail'?delayed.promise:{project:project(),assets:[output],jobs:[job({status:'succeeded'})]};}
      const refresh=v.refreshJob(originalJob);await tick();
      if(replacement==='conflict-copy') {h.api.saveProject=async()=>{throw new h.StudioApiError('conflict',409,'REVISION_CONFLICT');};v.updatePrompt('copy retained edits');await v.save();v=h.render();assert.equal(v.conflict,true);await v.saveSeparate();}
      else await v.restartSession();
      v=h.render();const newId=v.project.id;assert.notEqual(newId,originalJob.projectId);const notice=v.notice;
      if(stage==='error')delayed.reject(new Error('old refresh failed'));
      else if(stage==='refresh')delayed.resolve(job({status:'succeeded',outputAssetIds:[output.id]}));
      else delayed.resolve({project:project(),assets:[output],jobs:[job({status:'succeeded'})]});
      await refresh;v=h.render();assert.equal(v.project.id,newId);assert.equal(v.assets.length,0);assert.equal(v.jobs.length,0);assert.equal(v.selectedId,null);assert.equal(v.notice,notice);assert.equal(v.jobError,'');assert.equal(v.jobBusy,null);assert.equal(detailReads,stage==='detail'?1:0);
      await v.refreshJob(originalJob);assert.equal(detailReads,stage==='detail'?1:0);
    });
  }

  for(const operation of ['save','submit','upload']) for(const outcome of ['success','error']){
    await regression(`IR03 adjacent: stale ${operation} ${outcome} cannot alter replacement session`,async()=>{
      const old=deferred(),fresh=deferred();const h=harness(query,{capabilities:async()=>live});let v=await h.start();let work;
      if(operation==='save') {h.api.saveProject=async()=>old.promise;v.updatePrompt('old save text');work=v.save();}
      if(operation==='submit') {h.api.submit=async()=>old.promise;work=v.submit();}
      if(operation==='upload') {h.api.upload=async()=>old.promise;work=v.upload({name:'valid.jpg',type:'image/jpeg',size:2000});}
      await tick();v=h.render();const originalPending=v.pending;
      await v.restartSession();v=h.render();const replacement=v.project;const replacementPrompt=v.buffer.drafts.image_to_video.prompt;
      // Leave an operation in the new context pending: old finally blocks must not clear it.
      if(operation==='save') {h.api.saveProject=async(id,body)=>{await fresh.promise;return {...replacement,revision:replacement.revision+1,draft:body.draft};};v.updatePrompt('new save text');}
      if(operation==='submit')h.api.submit=async(id,body)=>{await fresh.promise;return job({id:'new-job',projectId:id,requestKey:body.requestKey});};
      if(operation==='upload')h.api.upload=async()=>{await fresh.promise;throw new Error('new upload pending');};
      const currentWork=operation==='save'?v.save():operation==='submit'?v.submit():v.upload({name:'new.jpg',type:'image/jpeg',size:2000});await tick();v=h.render();
      const stateField=operation==='save'?'saving':operation==='submit'?'submitting':'uploading';assert.equal(v[stateField],true);const currentPending=JSON.stringify(v.pending);
      if(outcome==='error')old.reject(new h.StudioApiError('old expired response',401,'GUEST_REQUIRED'));
      else old.resolve(operation==='save'?project({...sampleDraft(),prompt:'old save text'},2):operation==='submit'?job({requestKey:originalPending.requestKey}):output);
      await work;v=h.render();assert.equal(v.project.id,replacement.id);assert.equal(v[stateField],true);assert.equal(v.expired,false);assert.equal(v.assets.length,0);assert.equal(v.jobs.length,0);assert.equal(v.selectedId,null);assert.equal(v.error,'');assert.equal(v.jobError,'');assert.equal(v.uploadError,'');assert.equal(JSON.stringify(v.pending),currentPending);assert.equal(v.buffer.drafts.image_to_video.prompt,operation==='save'?'new save text':replacementPrompt);
      fresh.resolve();await currentWork;v=h.render();assert.equal(v[stateField],false);
    });
  }
  await regression('IR03: late refresh cleanup cannot clear the replacement shot refresh indicator',async()=>{
    const old=deferred(),fresh=deferred();const h=harness(query,{refresh:async()=>old.promise});let v=await h.start();const oldWork=v.refreshJob(job());await tick();await v.restartSession();v=h.render();const newJob=job({id:'new-job',projectId:v.project.id});h.api.refresh=async()=>fresh.promise;
    const newWork=v.refreshJob(newJob);old.resolve(job());await oldWork;v=h.render();assert.equal(v.jobBusy,newJob.id);fresh.resolve(newJob);await newWork;v=h.render();assert.equal(v.jobBusy,null);
  });
  const foreignAsset={...output,id:'foreign-frame',projectId:'external-project',sourceJobId:'foreign-job',kind:'image',source:'generation'};
  const parentAsset={...foreignAsset,id:'external-parent',sourceJobId:'parent-job'};
  const foreignJob=job({id:'foreign-job',projectId:foreignAsset.projectId,snapshot:{operation:'text_to_image',prompt:'immutable original',modelId:'fal-ai/flux/schnell',parentAssetId:parentAsset.id}});
  const parentJob=job({id:'parent-job',projectId:foreignAsset.projectId,snapshot:{operation:'text_to_image',prompt:'parent original',parentAssetId:foreignAsset.id}});
  const crossProject=()=>project({...sampleDraft(),startAssetId:foreignAsset.id});
  const metadataMocks={project:async()=>({project:crossProject(),assets:[],jobs:[]}),asset:async id=>id===foreignAsset.id?foreignAsset:parentAsset,job:async id=>id===foreignJob.id?foreignJob:parentJob};
  await regression('P4-02: resolves immutable external source jobs and recursive parent without poll/list contamination or loops',async()=>{
    const h=harness(query,{...metadataMocks,capabilities:async()=>live,submit:async(id,body)=>job({id:'own-job',projectId:id,requestKey:body.requestKey})},undefined,true);let v=await h.start();
    assert.equal(v.sourceJobs.length,2);assert.equal(v.sourceJobs[0].snapshot.prompt,'immutable original');assert.equal(v.assets.length,2);assert.equal(v.jobs.length,0);assert.equal(v.selectedId,null);assert.equal(h.calls.filter(c=>c[0]==='asset').length,2);assert.equal(h.calls.filter(c=>c[0]==='job').length,2);
    await v.refreshJob(v.sourceJobs[0]);assert.equal(h.calls.filter(c=>c[0]==='refresh').length,0);
    v.updatePrompt('new draft');await v.submit();v=await h.flush();assert.equal(v.jobs.length,1);assert.equal(v.jobs[0].id,'own-job');assert.equal(v.sourceJobs[0].snapshot.prompt,'immutable original');assert.equal(v.buffer.drafts.image_to_video.prompt,'new draft');
  });
  for(const stage of ['asset','job']) for(const outcome of ['success','expiry']) await regression(`P4-02: stale external ${stage} ${outcome} ignored after session replacement`,async()=>{
    const delayed=deferred();const h=harness(query,{...metadataMocks,[stage]:async()=>delayed.promise},undefined,true);let v=await h.start();await v.restartSession();v=await h.flush();
    if(outcome==='expiry')delayed.reject(new h.StudioApiError('old guest',401,'GUEST_REQUIRED'));else delayed.resolve(stage==='asset'?foreignAsset:foreignJob);
    v=await h.flush();assert.equal(v.sourceJobs.length,0);assert.equal(v.assets.length,0);assert.equal(v.expired,false);assert.equal(v.jobs.length,0);
  });
  await regression('P4-02: current metadata expiry clears private assets/jobs; late success cannot restore them',async()=>{
    const delayed=deferred(),late=deferred();const extra={...parentAsset,id:'extra',sourceJobId:'late-job'};const h=harness(query,{...metadataMocks,project:async()=>({project:crossProject(),assets:[foreignAsset,parentAsset,extra],jobs:[]}),job:async id=>id===foreignJob.id?delayed.promise:id==='late-job'?late.promise:parentJob},undefined,true);let v=await h.start();assert.equal(v.sourceJobs.length,1);delayed.reject(new h.StudioApiError('expired',401,'GUEST_REQUIRED'));v=await h.flush();assert.equal(v.expired,true);assert.equal(v.sourceJobs.length,0);assert.equal(v.assets.length,0);assert.equal(v.buffer.drafts.image_to_video.prompt,'first');late.resolve({...parentJob,id:'late-job'});v=await h.flush();assert.equal(v.sourceJobs.length,0);assert.equal(v.assets.length,0);
  });
  await regression('P4-02: unavailable metadata retains known assets, selection and edited draft without retry loop',async()=>{
    const h=harness(query,{...metadataMocks,project:async()=>({project:{...crossProject(),preferredAssetId:foreignAsset.id},assets:[foreignAsset],jobs:[]}),job:async()=>{throw new Error('temporary failure');}},undefined,true);let v=await h.start();v.updatePrompt('keep edits');v=await h.flush();assert.equal(v.assets.length,1);assert.equal(v.selectedId,foreignAsset.id);assert.equal(v.sourceJobs.length,0);assert.equal(v.buffer.drafts.image_to_video.prompt,'keep edits');assert.equal(h.calls.filter(c=>c[0]==='job').length,1);
  });
  await regression('P4-02: arbitrary recorded parent resolves independently of active start frame',async()=>{
    const own=job({snapshot:{operation:'text_to_image',parentAssetId:parentAsset.id,prompt:'current shot'}});
    const h=harness(query,{...metadataMocks,project:async()=>({project:project(),assets:[],jobs:[own]})},undefined,true);const v=await h.start();
    assert.equal(v.assets.length,2);assert.equal(v.jobs.length,1);assert.equal(v.jobs[0].id,own.id);assert.equal(v.sourceJobs.find(j=>j.id===foreignJob.id).snapshot.modelId,'fal-ai/flux/schnell');assert.equal(v.buffer.drafts.image_to_video.startAssetId,'sample-dune-light');
  });
  await regression('P4-02: copy clears metadata and rejects old source-job response while same-owner references resolve again',async()=>{
    const old=deferred();let reads=0;
    const h=harness(query,{...metadataMocks,job:async id=>{if(id===foreignJob.id && reads++===0)return old.promise;return id===foreignJob.id?foreignJob:parentJob;}},undefined,true);let v=await h.start();await v.saveSeparate();v=await h.flush();assert.equal(v.sourceJobs.length,2);const copyId=v.project.id;
    old.resolve({...foreignJob,snapshot:{...foreignJob.snapshot,prompt:'stale response must not overwrite'}});v=await h.flush();assert.equal(v.project.id,copyId);assert.equal(v.sourceJobs.find(j=>j.id===foreignJob.id).snapshot.prompt,'immutable original');assert.equal(v.jobs.length,0);
  });
  await regression('P4-02: source-job response must match requested ID and owning asset project',async()=>{
    for(const invalid of [{...foreignJob,id:'wrong-job'},{...foreignJob,projectId:'wrong-project'}]){
      const h=harness(query,{...metadataMocks,job:async()=>invalid},undefined,true);const v=await h.start();assert.equal(v.sourceJobs.length,0);assert.equal(v.assets.length,1);
    }
  });
  await regression('P4-02: API job retrieval is an encoded owner-session GET with no-store',async()=>{
    const h=harness();let requested;h.context.fetch=async(path,init)=>{requested={path,init};return {ok:true,status:200,json:async()=>({data:foreignJob,requestId:'mock'})};};
    const result=await h.load('src/client/api.ts').api.job('source/id');assert.equal(result,foreignJob);assert.equal(requested.path,'/api/jobs/source%2Fid');assert.equal(requested.init.credentials,'same-origin');assert.equal(requested.init.cache,'no-store');assert.equal(requested.init.method,undefined);
  });
  await regression('P4-02: refreshing own result retains resolved external provenance without changing edited text',async()=>{
    const own=job({snapshot:{operation:'image_to_video',parentAssetId:foreignAsset.id,startAsset:{id:foreignAsset.id}}});
    const h=harness(query,{...metadataMocks,project:async()=>({project:crossProject(),assets:[],jobs:[own]})},undefined,true);let v=await h.start();v.updatePrompt('edited locally');
    h.api.refresh=async()=>({...own,status:'succeeded',outputAssetIds:[output.id]});h.api.project=async()=>({project:crossProject(),assets:[output],jobs:[{...own,status:'succeeded'}]});
    await v.refreshJob(own);v=await h.flush();assert.equal(v.sourceJobs.length,2);assert.equal(v.assets.length,3);assert.equal(v.jobs.length,1);assert.equal(v.selectedId,output.id);assert.equal(v.buffer.drafts.image_to_video.prompt,'edited locally');assert.equal(h.calls.filter(c=>c[0]==='asset').length,2);
  });
  await regression('SS01: explicit preference uses preference-only PATCH',async()=>{
    const asset={...output,source:'upload'};
    const h=harness(query,{project:async()=>({project:project(),assets:[asset],jobs:[]}),saveProject:async(id,body)=>({...project(),revision:body.expectedRevision+1,preferredAssetId:body.preferredAssetId})});
    let v=await h.start();v.updatePrompt('unsaved current draft');
    assert.equal(typeof v.preferAsset,'function','explicit durable preference action must exist');
    await v.preferAsset(asset.id);v=h.render();
    assert.equal(v.project.preferredAssetId,asset.id);assert.equal(v.buffer.drafts.image_to_video.prompt,'unsaved current draft');assert.equal(v.dirty,true);
    const patch=h.calls.find(c=>c[0]==='saveProject')[2];assert.deepEqual(Object.keys(patch).sort(),['expectedRevision','preferredAssetId']);
  });

  function preferenceFixture() {
    let server=project();
    const asset={...output,source:'upload',title:'Retained reference'};
    const patches=[];
    const mocks={project:async()=>({project:server,assets:[asset],jobs:[]}),saveProject:async(id,{expectedRevision,...patch})=>{
      assert.equal(id,server.id);assert.equal(expectedRevision,server.revision,'sequential expectedRevision');
      patches.push({expectedRevision,...patch});server={...server,...patch,revision:server.revision+1};return server;
    }};
    return {asset,mocks,patches,get server(){return server;}};
  }
  await regression('SS02: preference acknowledgement preserves newer and inactive typing, restores preference and dirty drafts after reload',async()=>{
    const f=preferenceFixture(),d=deferred();const h=harness(query,{...f.mocks,saveProject:async(...args)=>{await d.promise;return f.mocks.saveProject(...args);}});
    let v=await h.start();v.switchMode('text_to_image');v.updatePrompt('inactive '+ 'x'.repeat(2501));v.switchMode('image_to_video');v.updatePrompt('unsaved at click');
    const work=v.preferAsset(f.asset.id);await tick();v=h.render();assert.equal(v.preferring,true);assert.equal(v.project.preferredAssetId,null);assert.equal(v.preferenceNotice,'');
    v.updatePrompt('newer typing');v.edit(current=>({...current,title:'unsaved title'}));d.resolve();await work;v=h.render();
    assert.equal(v.buffer.drafts.image_to_video.prompt,'newer typing');assert.match(v.buffer.drafts.text_to_image.prompt,/inactive/);assert.equal(v.dirty,true);assert.match(v.preferenceNotice,/Preferred version saved/);assert.equal(f.server.draft.prompt,'first');assert.equal(f.server.title,'Untitled shot');
    const reload=harness(query,f.mocks,h.store);v=await reload.start();assert.equal(v.selectedId,f.asset.id);assert.equal(v.project.revision,2);assert.equal(v.conflict,false);assert.equal(v.buffer.title,'unsaved title');assert.equal(v.buffer.drafts.image_to_video.prompt,'newer typing');assert.equal(v.buffer.drafts.text_to_image.prompt.length,2510);assert.equal(v.dirty,true);
    const fresh=harness(query,f.mocks);const clean=await fresh.start();assert.equal(clean.selectedId,f.asset.id);assert.equal(clean.saved,true);assert.equal(clean.buffer.drafts.image_to_video.prompt,'first');
  });
  await regression('SS03: pending draft save precedes preference PATCH, later typing stays dirty',async()=>{
    const f=preferenceFixture(),d=deferred();let first=true;const h=harness(query,{...f.mocks,saveProject:async(...args)=>{if(first){first=false;await d.promise;}return f.mocks.saveProject(...args);}});
    let v=await h.start();v.updatePrompt('draft before save');const save=v.save();const preference=v.preferAsset(f.asset.id);await tick();assert.equal(f.patches.length,0);v.updatePrompt('newer typing');d.resolve();await Promise.all([save,preference]);v=h.render();
    assert.deepEqual(f.patches.map(p=>p.expectedRevision),[1,2]);assert.equal(f.patches[1].draft,undefined);assert.equal(f.server.draft.prompt,'draft before save');assert.equal(v.buffer.drafts.image_to_video.prompt,'newer typing');assert.equal(v.dirty,true);assert.equal(v.project.revision,3);
  });
  await regression('SS04: draft save waits for preference and captures latest typing; duplicate preference does not write',async()=>{
    const f=preferenceFixture(),d=deferred();let first=true;const h=harness(query,{...f.mocks,saveProject:async(...args)=>{if(first){first=false;await d.promise;}return f.mocks.saveProject(...args);}});
    let v=await h.start();const preference=v.preferAsset(f.asset.id);await v.preferAsset(f.asset.id);v.updatePrompt('text at save');const save=v.save();v.updatePrompt('newer while preference pending');d.resolve();await Promise.all([preference,save]);v=h.render();
    assert.equal(f.patches.length,2);assert.deepEqual(f.patches.map(p=>p.expectedRevision),[1,2]);assert.equal(f.server.preferredAssetId,f.asset.id);assert.equal(f.server.draft.prompt,'newer while preference pending');assert.equal(v.saved,true);
  });
  await regression('SS05: preference network failure retains selection/drafts/confirmed preference; explicit retry succeeds',async()=>{
    const f=preferenceFixture();let fail=true;const h=harness(query,{...f.mocks,saveProject:async(...args)=>{if(fail)throw new Error('connection lost');return f.mocks.saveProject(...args);}});
    let v=await h.start();v.updatePrompt('keep text');const selected=v.selectedId;await v.preferAsset(f.asset.id);v=h.render();assert.equal(v.project.preferredAssetId,null);assert.equal(v.selectedId,selected);assert.equal(v.buffer.drafts.image_to_video.prompt,'keep text');assert.equal(v.preferenceNotice,'');assert.match(v.preferenceError,/not confirmed/);assert.equal(v.preferring,false);assert.equal(v.error,'');
    fail=false;await v.preferAsset(f.asset.id);v=h.render();assert.equal(v.preferenceError,'');assert.equal(v.project.preferredAssetId,f.asset.id);assert.equal(v.dirty,true);
  });
  for(const [status,code] of [[409,'REVISION_CONFLICT'],[401,'GUEST_REQUIRED']]) await regression(`SS06: preference ${code} preserves text and uses existing recovery path`,async()=>{
    const f=preferenceFixture();const h=harness(query,f.mocks);let v=await h.start();v.switchMode('text_to_image');v.updatePrompt('inactive text');v.switchMode('image_to_video');v.updatePrompt('current text');let requests=0;
    h.api.saveProject=async()=>{requests++;throw new h.StudioApiError('server rejected',status,code);};await v.preferAsset(f.asset.id);v=h.render();assert.equal(v[status===409?'conflict':'expired'],true);assert.equal(v.preferring,false);assert.equal(v.buffer.drafts.image_to_video.prompt,'current text');assert.equal(v.buffer.drafts.text_to_image.prompt,'inactive text');assert.equal(v.project.preferredAssetId,null);await v.preferAsset(f.asset.id);assert.equal(requests,1);
    if(status===401){assert.equal(v.assets.length,0);assert.equal(v.selectedId,null);assert.equal(v.preferenceNotice,'');}
  });
  for(const replace of ['saveSeparate','restartSession']) for(const outcome of ['success','expiry']) await regression(`SS07: stale preference ${outcome} ignored after ${replace}`,async()=>{
    const f=preferenceFixture(),d=deferred();const h=harness(query,f.mocks);let v=await h.start();h.api.saveProject=async()=>d.promise;v.updatePrompt('kept text');const work=v.preferAsset(f.asset.id);await tick();await v[replace]();v=h.render();const copy=v.project;const notice=v.notice;
    if(outcome==='success')d.resolve({...project(),revision:2,preferredAssetId:f.asset.id});else d.reject(new h.StudioApiError('old expiry',401,'GUEST_REQUIRED'));
    await work;v=h.render();assert.equal(v.project.id,copy.id);assert.equal(v.project.preferredAssetId,null);assert.equal(v.expired,false);assert.equal(v.preferenceError,'');assert.equal(v.preferenceNotice,'');assert.equal(v.notice,notice);assert.equal(v.buffer.drafts.image_to_video.prompt,'kept text');
  });
  await regression('SS08: samples, foreign assets and missing assets cannot become preferences; inspection makes no writes',async()=>{
    const foreign={...output,id:'foreign',source:'upload',projectId:'another-project'};const h=harness(query,{project:async()=>({project:project(),assets:[foreign],jobs:[]})});let v=await h.start();
    for(const id of ['sample-dune-light','foreign','missing']){v.setSelectedId(id);await v.preferAsset(id);v=h.render();assert.equal(v.project.preferredAssetId,null);}
    assert.equal(h.calls.filter(c=>['saveProject','createProject','guest'].includes(c[0])).length,0);
    const sample=harness();v=await sample.start();v.setSelectedId('sample-dune-light');await v.preferAsset('sample-dune-light');assert.equal(sample.calls.filter(c=>['saveProject','createProject','guest'].includes(c[0])).length,0);
  });
  await regression('SS09: wrong preference/revision acknowledgements never claim success',async()=>{
    for(const reply of [{preferredAssetId:'wrong',revision:2},{preferredAssetId:output.id,revision:1}]){
      const f=preferenceFixture();const h=harness(query,{...f.mocks,saveProject:async()=>({...project(),...reply})});let v=await h.start();await v.preferAsset(f.asset.id);v=h.render();assert.equal(v.project.revision,1);assert.equal(v.project.preferredAssetId,null);assert.equal(v.preferenceNotice,'');assert.match(v.preferenceError,/not confirmed/);
    }
  });
  await regression('SS10: navigation awaits preference acknowledgement and failed acknowledgement blocks departure',async()=>{
    for(const success of [true,false]){
      const f=preferenceFixture(),d=deferred();const h=harness(query,{...f.mocks,saveProject:async(...args)=>{await d.promise;if(!success)throw new Error('lost');return f.mocks.saveProject(...args);}});let v=await h.start();const preference=v.preferAsset(f.asset.id);let left=false;const navigation=v.beforeNavigate().then(value=>{left=value;return value;});await tick();assert.equal(left,false);d.resolve();await preference;assert.equal(await navigation,success);
    }
  });
  assert.deepEqual(failures,[], 'regressions must pass');
  console.log(`${count} client-state checks passed; mocked API, no browser/provider calls.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
