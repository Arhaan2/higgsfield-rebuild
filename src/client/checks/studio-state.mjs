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
function harness(query='?sample=dune-study', overrides={}, existingStorage) {
  let slot=0, first=true; const slots=[], effects=[], cache=new Map(), calls=[];
  const store=existingStorage||new Map();
  const storage = {getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  // clearRecovery enumerates Storage keys, so mirror its enumerable-key behavior.
  const localStorage=new Proxy(storage,{ownKeys:()=>[...store.keys()],getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
  const React={
    useState(initial){const index=slot++; if(first) slots[index]=typeof initial==='function'?initial():initial; return [slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
    useRef(initial){const index=slot++; if(first) slots[index]={current:initial}; return slots[index];},
    useCallback(fn){slot++;return fn;},
    useEffect(fn){slot++;if(first)effects.push(fn);},
  };
  class StudioApiError extends Error {constructor(message,status,code,retryable=false){super(message);Object.assign(this,{status,code,retryable});}}
  const api={
    capabilities:async()=>({liveGeneration:{enabled:false,remainingMicroUsd:0,budgetLimitMicroUsd:0,reason:'disabled'},upload:{maxBytes:5000000,mimeTypes:['image/jpeg','image/png']},operations:[],samplesAvailable:true}),
    guest:async()=>({expiresAt:'2026-11-10T00:00:00Z'}),
    createProject:async body=>({...project(body.draft),id:body.id,title:body.title}),
    saveProject:async(id,body)=>({...project(body.draft,body.expectedRevision+1),id,title:body.title}),
    project:async()=>({project:project(),assets:[],jobs:[]}),
    asset:async()=>{throw new Error('no asset');},
    upload:async()=>{throw new StudioApiError('upload interrupted',503,'SERVICE_UNAVAILABLE');},
    ...overrides,
  };
  for(const key of Object.keys(api)){const fn=api[key];api[key]=(...args)=>{calls.push([key,...args]);return fn(...args);};}
  const context={console,JSON,Date,Math,URLSearchParams,localStorage,crypto:webcrypto,setTimeout,clearTimeout,document:{hidden:true},window:{location:{search:query},history:{replaceState(){}},addEventListener(){},removeEventListener(){}},createImageBitmap:async()=>({width:512,height:512,close(){}})};
  function load(relative){const filename=path.join(root,relative);if(cache.has(filename))return cache.get(filename);const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const loadedModule={exports:{}};cache.set(filename,loadedModule.exports);const localRequire=name=>{if(name==='react')return React;if(name==='./api')return {api,StudioApiError,errorMessage:e=>e.message};if(name.startsWith('@/'))return load(name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(filename),name))+'.ts');return req(name);};vm.runInNewContext(`(function(require,module,exports){${code}\n})`,context,{filename})(localRequire,loadedModule,loadedModule.exports);return loadedModule.exports;}
  const {useStudio: runStudio}=load('src/client/use-studio.ts');
  const render=()=>{slot=0;const view=runStudio();first=false;return view;};
  render();
  const start=async()=>{for(const effect of effects)effect();await tick();return render();};
  return {start,render,calls,store,api,StudioApiError,context};
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
  console.log(`${count} client-state checks passed; mocked API, no browser/provider calls.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
