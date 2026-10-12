// Mock hook/JSX-tree checks only: no React renderer, browser, network or provider.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const catalogModule={exports:{}};
const catalogCode=ts.transpileModule(fs.readFileSync('src/catalog/samples.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(`(function(module,exports){${catalogCode}\n})`)(catalogModule,catalogModule.exports);
const {SAMPLE_ASSETS,PRESETS}=catalogModule.exports;
const tick=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const shot=id=>({id,title:`Shot ${id}`,draft:{operation:'text_to_image'},updatedAt:'2026-10-12T00:00:00Z',preferredAssetId:null});
const detail=id=>({project:shot(id),assets:[{id:`image-${id}`,kind:'image',source:'generation',mediaUrl:`/private/${id}`}],jobs:[{status:'running'}]});
class StudioApiError extends Error {constructor(status){super('unavailable');this.status=status;}}
function harness(overrides={}) {
  let slot=0,first=true;const slots=[],effects=[],calls=[];let cleared=0;
  const React={
    useState(initial){const i=slot++;if(first)slots[i]=initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useRef(initial){const i=slot++;if(first)slots[i]={current:initial};return slots[i];},
    useCallback(fn){slot++;return fn;},
    useEffect(fn){slot++;if(first)effects.push(fn);},
  };
  const api={projects:async()=>({items:[shot('a'),shot('b')],nextCursor:null}),project:async id=>detail(id),asset:async()=>{throw new StudioApiError(404);},...overrides};
  for(const key of Object.keys(api)){const fn=api[key];api[key]=(...args)=>{calls.push([key,...args]);return fn(...args);};}
  const loadedModule={exports:{}};
  const code=ts.transpileModule(fs.readFileSync('components/studio/LibraryView.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const jsx=(type,props)=>({type,props});
  const require=name=>{
    if(name==='react')return React;
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
    if(name==='lucide-react')return {};
    if(name==='./AppShell')return {AppShell:'shell',GenerationBadge:'badge'};
    if(name==='@/src/client/api')return {api,StudioApiError,errorMessage:e=>e.message};
    if(name==='@/src/client/recovery')return {clearRecovery:()=>cleared++};
    if(name==='@/src/catalog/samples')return {SAMPLE_ASSETS};
    throw new Error(name);
  };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{console,Date,Promise},{filename:'LibraryView.tsx'})(require,loadedModule,loadedModule.exports);
  const render=()=>{slot=0;const view=loadedModule.exports.LibraryView();first=false;return view;};
  render();const cleanups=effects.map(fn=>fn());
  return {render,api,calls,start:async()=>{await tick();return render();},cleared:()=>cleared,unmount:()=>cleanups.forEach(fn=>fn?.())};
}
function nodes(node){if(Array.isArray(node))return node.flatMap(nodes);if(!node||typeof node!=='object')return [];return [node,...nodes(node.props?.children)];}
function text(node){if(Array.isArray(node))return node.map(text).join(' ');if(node==null||typeof node==='boolean')return '';if(typeof node==='object')return text(node.props?.children);return String(node);}
const button=(view,label)=>nodes(view).find(node=>node.type==='button'&&text(node).includes(label));
const card=(view,id)=>nodes(view).find(node=>node.type==='a'&&node.props.href===`/studio?project=${id}`);
let count=0;
async function check(name,run){await run();count++;console.log('PASS '+name);}
await check('P4-03: partial failure retains links/loaded card, exposes unavailable state and retries only failed detail',async()=>{
  const h=harness({project:async id=>{if(id==='b')throw new StudioApiError(503);return detail(id);}});let v=await h.start();
  assert(card(v,'a'));assert(card(v,'b'));assert.match(text(card(v,'a')),/Latest request:\s+running/);assert.match(text(card(v,'b')),/Preview and request status unavailable/);assert.doesNotMatch(text(card(v,'b')),/0 generated/);
  for(const anchor of nodes(v).filter(n=>n.type==='a'))assert.equal(nodes(anchor.props.children).some(n=>n.type==='button'),false);
  const retry=deferred();h.api.project=async id=>{h.calls.push(['retry',id]);return retry.promise;};const action=button(v,'Retry previews');action.props.onClick();v=h.render();assert.equal(button(v,'Retrying previews').props.disabled,true);assert(card(v,'a'));retry.resolve(detail('b'));await tick();v=h.render();assert.match(text(card(v,'b')),/Latest request:\s+running/);assert.doesNotMatch(text(v),/Preview and request status unavailable/);assert.equal(h.calls.filter(c=>c[0]==='retry').length,1);assert.equal(h.calls.at(-1)[1],'b');
});
await check('P4-03: failed retry preserves other previews and remains recoverable',async()=>{
  const h=harness({project:async id=>{if(id==='b')throw new StudioApiError(503);return detail(id);}});let v=await h.start();button(v,'Retry previews').props.onClick();await tick();v=h.render();assert.match(text(card(v,'a')),/Latest request:\s+running/);assert.match(text(card(v,'b')),/unavailable/);assert.equal(button(v,'Retry previews').props.disabled,false);
});
await check('P4-03: detail expiry clears all private cards immediately, ignores another pending success',async()=>{
  const a=deferred(),b=deferred();const h=harness({project:async id=>id==='a'?a.promise:b.promise});await h.start();a.reject(new StudioApiError(401));await tick();let v=h.render();assert.equal(card(v,'a'),undefined);assert.equal(card(v,'b'),undefined);assert.equal(h.cleared(),1);b.resolve(detail('b'));await tick();v=h.render();assert.equal(card(v,'b'),undefined);assert.doesNotMatch(text(v),/Latest request/);assert.match(text(v),/No saved shots/);
});
await check('P4-03: stale preview retry expiry cannot erase newer Library load',async()=>{
  const h=harness({projects:async()=>({items:[shot('a'),shot('b')],nextCursor:'next'}),project:async id=>{if(id==='b')throw new StudioApiError(503);return detail(id);}});let v=await h.start();const stale=deferred();h.api.project=async()=>stale.promise;button(v,'Retry previews').props.onClick();h.api.projects=async()=>({items:[shot('c')],nextCursor:null});h.api.project=async id=>detail(id);button(h.render(),'Load more shots').props.onClick();await tick();assert(card(h.render(),'c'));stale.reject(new StudioApiError(401));await tick();assert(card(h.render(),'c'));assert.equal(h.cleared(),0);
});
await check('P4-03: list expiry removes existing private previews and failed status',async()=>{
  const h=harness({projects:async()=>({items:[shot('a')],nextCursor:'next'})});let v=await h.start();h.api.projects=async()=>{throw new StudioApiError(401);};button(v,'Load more shots').props.onClick();await tick();v=h.render();assert.equal(card(v,'a'),undefined);assert.equal(nodes(v).filter(n=>n.type==='img'&&n.props.src==='/private/a').length,0);assert.equal(h.cleared(),1);
});
await check('P4-03: unmounted Library ignores delayed detail and expiry',async()=>{
  const pending=deferred();const h=harness({project:async()=>pending.promise});await h.start();h.unmount();pending.reject(new StudioApiError(401));await tick();assert.equal(h.cleared(),0);
});
await check('preset-only motion drafts render the real catalog start frame and zero generated versions',async()=>{
  for(const preset of PRESETS.filter(p=>p.operation==='image_to_video')){
    const project={...shot(preset.id),draft:preset.draft};
    const h=harness({projects:async()=>({items:[project],nextCursor:null}),project:async()=>({project,assets:[],jobs:[]})});
    const v=await h.start(),saved=card(v,project.id);
    assert.equal(nodes(saved).find(n=>n.type==='img')?.props.src,SAMPLE_ASSETS.find(a=>a.id===preset.draft.startAssetId).mediaUrl);
    assert.match(text(saved),/Motion draft.*0 generated versions/);assert.doesNotMatch(text(saved),/Latest request/);
    assert.equal(h.calls.some(c=>c[0]==='asset'),false);
  }
});
const motion=(id,startAssetId='sample-dune-light')=>({...shot(id),draft:{operation:'image_to_video',startAssetId}});
const thumbnail=(view,id)=>nodes(card(view,id)).find(n=>n.type==='img')?.props.src;
await check('current detail controls preferred retained output, retained fallback, title and draft',async()=>{
  for(const preferredAssetId of ['preferred',null]){
    const project={...motion('a'),title:'Current shot',preferredAssetId};
    const assets=[{id:'preferred',kind:'video',source:'generation',posterUrl:'/preferred.jpg'},{id:'latest',kind:'image',source:'upload',mediaUrl:'/latest.jpg'}];
    const h=harness({projects:async()=>({items:[{...shot('a'),preferredAssetId:'latest'}],nextCursor:null}),project:async()=>({project,assets,jobs:[]})});
    const v=await h.start();assert.equal(thumbnail(v,'a'),preferredAssetId?'/preferred.jpg':'/latest.jpg');
    assert.match(text(card(v,'a')),/Current shot.*Motion draft.*1 generated version/);assert.equal(h.calls.some(c=>c[0]==='asset'),false);
  }
});
await check('current detail start frame supersedes stale list; text and frameless drafts stay empty',async()=>{
  for(const current of [motion('a'),shot('a'),motion('a',null)]){
    const h=harness({projects:async()=>({items:[motion('a','stale-private-id')],nextCursor:null}),project:async()=>({project:current,assets:[],jobs:[]})});
    const v=await h.start();assert.equal(thumbnail(v,'a'),current.draft.startAssetId?'/samples/dune-light.jpg':undefined);
    assert.match(text(card(v,'a')),/0 generated versions/);assert.equal(h.calls.some(c=>c[0]==='asset'),false);
  }
});
await check('external start frame requests only its ID and never becomes this shot’s generated count',async()=>{
  const project=motion('a','external-image');
  const h=harness({projects:async()=>({items:[project],nextCursor:null}),project:async()=>({project,assets:[],jobs:[]}),asset:async id=>({id,kind:'image',source:'generation',projectId:'source-shot',mediaUrl:'/external.jpg'})});
  const v=await h.start();assert.equal(thumbnail(v,'a'),'/external.jpg');assert.match(text(card(v,'a')),/0 generated versions/);assert.doesNotMatch(text(card(v,'a')),/Latest request/);
  assert.deepEqual(h.calls.filter(c=>c[0]==='asset'),[['asset','external-image']]);
});
await check('missing or unavailable references preserve mixed successes and recover through targeted retry',async()=>{
  for(const status of [404,503]){
    const project=motion('b','external-image');let available=false;
    const h=harness({project:async id=>id==='b'?{project,assets:[],jobs:[]}:detail(id),asset:async id=>{if(!available)throw new StudioApiError(status);return {id,kind:'image',mediaUrl:'/recovered.jpg'};}});
    let v=await h.start();assert.equal(thumbnail(v,'a'),'/private/a');assert(card(v,'b'));assert.match(text(card(v,'b')),/unavailable/);assert.doesNotMatch(text(card(v,'b')),/0 generated/);
    const before=h.calls.filter(c=>c[0]==='project').length;available=true;button(v,'Retry previews').props.onClick();await tick();v=h.render();
    assert.equal(thumbnail(v,'b'),'/recovered.jpg');assert.equal(thumbnail(v,'a'),'/private/a');assert.match(text(card(v,'b')),/0 generated versions/);assert.equal(button(v,'Retry previews'),undefined);
    assert.deepEqual(h.calls.filter(c=>c[0]==='project').slice(before),[['project','b']]);
  }
});
await check('mismatched details or non-image/mismatched reference responses remain recoverable',async()=>{
  for(const variant of ['project','asset-id','asset-kind']){
    const project=motion('a','external-image');
    const h=harness({projects:async()=>({items:[project],nextCursor:null}),project:async()=>({project:variant==='project'?motion('wrong','unrelated'):project,assets:[],jobs:[]}),asset:async()=>({id:variant==='asset-id'?'unrelated':'external-image',kind:variant==='asset-kind'?'video':'image',mediaUrl:'/wrong.jpg'})});
    const v=await h.start();assert.equal(thumbnail(v,'a'),undefined);assert.match(text(card(v,'a')),/unavailable/);assert(button(v,'Retry previews'));
    assert.equal(h.calls.filter(c=>c[0]==='asset').length,variant==='project'?0:1);
  }
});
await check('reference expiry clears private cards immediately and ignores pending sibling reference',async()=>{
  const a=deferred(),b=deferred();
  const h=harness({project:async id=>({project:motion(id,`external-${id}`),assets:[],jobs:[]}),asset:async id=>id==='external-a'?a.promise:b.promise});
  await h.start();a.reject(new StudioApiError(401));await tick();assert.equal(card(h.render(),'a'),undefined);assert.equal(card(h.render(),'b'),undefined);assert.equal(h.cleared(),1);
  b.resolve({id:'external-b',kind:'image',mediaUrl:'/late.jpg'});await tick();assert.equal(card(h.render(),'b'),undefined);assert.match(text(h.render()),/No saved shots/);
});
await check('stale reference success or expiry cannot overwrite a newer Library load',async()=>{
  for(const expires of [false,true]){
    const stale=deferred();const project=motion('a','external-image');
    const h=harness({projects:async()=>({items:[project],nextCursor:'next'}),project:async()=>({project,assets:[],jobs:[]}),asset:async()=>stale.promise});
    await h.start();h.api.projects=async()=>({items:[shot('a')],nextCursor:null});h.api.project=async()=>detail('a');
    button(h.render(),'Load more shots').props.onClick();await tick();assert.equal(thumbnail(h.render(),'a'),'/private/a');
    if(expires)stale.reject(new StudioApiError(401));else stale.resolve({id:'external-image',kind:'image',mediaUrl:'/stale.jpg'});
    await tick();assert.equal(thumbnail(h.render(),'a'),'/private/a');assert.equal(h.cleared(),0);
  }
});
await check('unmounted or superseded detail never starts an external reference request',async()=>{
  const pending=deferred();const h=harness({project:async()=>pending.promise});await h.start();h.unmount();
  pending.resolve({project:motion('a','external-image'),assets:[],jobs:[]});await tick();assert.equal(h.calls.some(c=>c[0]==='asset'),false);
});
console.log(`${count} Library checks passed; mock hooks/JSX only.`);
