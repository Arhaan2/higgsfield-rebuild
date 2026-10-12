// Mock hook/JSX-tree checks only: no React renderer, browser, network or provider.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
const packageRequire=createRequire(import.meta.url);
const contractModule={exports:{}};
const contractCode=ts.transpileModule(fs.readFileSync('src/contracts/studio.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(`(function(require,module,exports){${contractCode}\n})`)(packageRequire,contractModule,contractModule.exports);
const duplicateCode=ts.transpileModule(fs.readFileSync('src/client/duplicate-shot.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const catalogModule={exports:{}};
const catalogCode=ts.transpileModule(fs.readFileSync('src/catalog/samples.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(`(function(module,exports){${catalogCode}\n})`)(catalogModule,catalogModule.exports);
const {SAMPLE_ASSETS,PRESETS}=catalogModule.exports;
const queryModule={exports:{}};
const queryCode=ts.transpileModule(fs.readFileSync('src/client/library-query.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(`(function(module,exports){${queryCode}\n})`)(queryModule,queryModule.exports);
const {queryLibraryProjects,mergeLibraryProjects,preferNewerProject}=queryModule.exports;
const tick=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const shot=id=>({id,title:`Shot ${id}`,draft:{operation:'text_to_image',prompt:'',presetId:null,parentAssetId:null},revision:1,createdAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-12T00:00:00Z',preferredAssetId:null});
const detail=id=>({project:shot(id),assets:[{id:`image-${id}`,kind:'image',source:'generation',mediaUrl:`/private/${id}`}],jobs:[{status:'running'}]});
class StudioApiError extends Error {constructor(status){super('unavailable');this.status=status;}}
function harness(overrides={},options={}) {
  let slot=0,first=true;const slots=[],effects=[],cleanups=new Map(),calls=[];let cleared=0,unmounted=false,lateUpdates=0;
  const store=options.store??new Map();
  const localStorage=options.storage??{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)};
  const duplicateModule={exports:{}};
  vm.runInNewContext(`(function(require,module,exports){${duplicateCode}\n})`,{localStorage})(name=>name==='@/src/contracts/studio'?contractModule.exports:packageRequire(name),duplicateModule,duplicateModule.exports);
  const changed=(before,after)=>!before||!after||before.length!==after.length||before.some((value,index)=>!Object.is(value,after[index]));
  const React={
    useState(initial){const i=slot++;if(first)slots[i]=initial;return [slots[i],value=>{if(unmounted)lateUpdates++;slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useRef(initial){const i=slot++;if(first)slots[i]={current:initial};return slots[i];},
    useCallback(fn,deps){const i=slot++;if(first||changed(slots[i]?.deps,deps))slots[i]={fn,deps};return slots[i].fn;},
    useEffect(fn,deps){const i=slot++;if(first||changed(slots[i],deps)){slots[i]=deps;effects.push([i,fn]);}},
  };
  const api={projects:async()=>({items:[shot('a'),shot('b')],nextCursor:null}),project:async id=>detail(id),asset:async()=>{throw new StudioApiError(404);},guest:async()=>{throw new Error('Library must not rotate guests');},createProject:async()=>{throw new Error('No copy fixture configured');},...overrides};
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
    if(name==='@/src/client/duplicate-shot')return duplicateModule.exports;
    if(name==='@/src/client/library-query')return queryModule.exports;
    if(name==='@/src/catalog/samples')return {SAMPLE_ASSETS};
    throw new Error(name);
  };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{console,Date,Promise,crypto:options.crypto??webcrypto},{filename:'LibraryView.tsx'})(require,loadedModule,loadedModule.exports);
  const render=()=>{slot=0;const view=loadedModule.exports.LibraryView();first=false;for(const [i,fn] of effects.splice(0)){cleanups.get(i)?.();cleanups.set(i,fn());}return view;};
  render();
  return {render,api,calls,store,duplicate:duplicateModule.exports,start:async()=>{await tick();return render();},cleared:()=>cleared,lateUpdates:()=>lateUpdates,unmount:()=>{unmounted=true;cleanups.forEach(fn=>fn?.());}};
}
function nodes(node){if(Array.isArray(node))return node.flatMap(nodes);if(!node||typeof node!=='object')return [];return [node,...nodes(node.props?.children)];}
function text(node){if(Array.isArray(node))return node.map(text).join(' ');if(node==null||typeof node==='boolean')return '';if(typeof node==='object')return text(node.props?.children);return String(node);}
const button=(view,label)=>nodes(view).find(node=>node.type==='button'&&text(node).includes(label));
const card=(view,id)=>nodes(view).find(node=>node.type==='a'&&node.props.className==='shot-card'&&node.props.href===`/studio?project=${id}`);
let count=0;
async function check(name,run){await run();count++;console.log('PASS '+name);}
await check('P4-03: partial failure retains links/loaded card, exposes unavailable state and retries only failed detail',async()=>{
  const h=harness({project:async id=>{if(id==='b')throw new StudioApiError(503);return detail(id);}});let v=await h.start();
  assert(card(v,'a'));assert(card(v,'b'));assert.match(text(card(v,'a')),/Latest request:\s+running/);assert.match(text(card(v,'b')),/Preview and request status unavailable/);assert.doesNotMatch(text(card(v,'b')),/0 generated/);
  for(const anchor of nodes(v).filter(n=>n.type==='a'))assert.equal(nodes(anchor.props.children).some(n=>n.type==='button'),false);
  const retry=deferred();h.api.project=async id=>{h.calls.push(['retry',id]);return retry.promise;};const action=button(v,'Retry previews');action.props.onClick({detail:1});v=h.render();assert.equal(button(v,'Retrying previews').props.disabled,true);assert(card(v,'a'));retry.resolve(detail('b'));await tick();v=h.render();assert.match(text(card(v,'b')),/Latest request:\s+running/);assert.doesNotMatch(text(v),/Preview and request status unavailable/);assert.equal(h.calls.filter(c=>c[0]==='retry').length,1);assert.equal(h.calls.at(-1)[1],'b');
});
await check('P4-03: failed retry preserves other previews and remains recoverable',async()=>{
  const h=harness({project:async id=>{if(id==='b')throw new StudioApiError(503);return detail(id);}});let v=await h.start();button(v,'Retry previews').props.onClick({detail:1});await tick();v=h.render();assert.match(text(card(v,'a')),/Latest request:\s+running/);assert.match(text(card(v,'b')),/unavailable/);assert.equal(button(v,'Retry previews').props.disabled,false);
});
await check('P4-03: detail expiry clears all private cards immediately, ignores another pending success',async()=>{
  const a=deferred(),b=deferred();const h=harness({project:async id=>id==='a'?a.promise:b.promise});await h.start();a.reject(new StudioApiError(401));await tick();let v=h.render();assert.equal(card(v,'a'),undefined);assert.equal(card(v,'b'),undefined);assert.equal(h.cleared(),1);b.resolve(detail('b'));await tick();v=h.render();assert.equal(card(v,'b'),undefined);assert.doesNotMatch(text(v),/Latest request/);assert.match(text(v),/No saved shots/);
});
await check('P4-03: stale preview retry expiry cannot erase newer Library load',async()=>{
  const h=harness({projects:async()=>({items:[shot('a'),shot('b')],nextCursor:'next'}),project:async id=>{if(id==='b')throw new StudioApiError(503);return detail(id);}});let v=await h.start();const stale=deferred();h.api.project=async()=>stale.promise;button(v,'Retry previews').props.onClick({detail:1});h.api.projects=async()=>({items:[shot('c')],nextCursor:null});h.api.project=async id=>detail(id);button(h.render(),'Load more shots').props.onClick({detail:1});await tick();assert(card(h.render(),'c'));stale.reject(new StudioApiError(401));await tick();assert(card(h.render(),'c'));assert.equal(h.cleared(),0);
});
await check('P4-03: list expiry removes existing private previews and failed status',async()=>{
  const h=harness({projects:async()=>({items:[shot('a')],nextCursor:'next'})});let v=await h.start();h.api.projects=async()=>{throw new StudioApiError(401);};button(v,'Load more shots').props.onClick({detail:1});await tick();v=h.render();assert.equal(card(v,'a'),undefined);assert.equal(nodes(v).filter(n=>n.type==='img'&&n.props.src==='/private/a').length,0);assert.equal(h.cleared(),1);
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
const motion=(id,startAssetId='sample-dune-light')=>({...shot(id),draft:{operation:'image_to_video',prompt:'',startAssetId,presetId:null,parentAssetId:null}});
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
    const before=h.calls.filter(c=>c[0]==='project').length;available=true;button(v,'Retry previews').props.onClick({detail:1});await tick();v=h.render();
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
    button(h.render(),'Load more shots').props.onClick({detail:1});await tick();assert.equal(thumbnail(h.render(),'a'),'/private/a');
    if(expires)stale.reject(new StudioApiError(401));else stale.resolve({id:'external-image',kind:'image',mediaUrl:'/stale.jpg'});
    await tick();assert.equal(thumbnail(h.render(),'a'),'/private/a');assert.equal(h.cleared(),0);
  }
});
await check('unmounted or superseded detail never starts an external reference request',async()=>{
  const pending=deferred();const h=harness({project:async()=>pending.promise});await h.start();h.unmount();
  pending.resolve({project:motion('a','external-image'),assets:[],jobs:[]});await tick();assert.equal(h.calls.some(c=>c[0]==='asset'),false);
});
const control=(view,id)=>nodes(view).find(node=>node.props?.id===id);
const change=(h,id,value)=>{control(h.render(),id).props.onChange({target:{value}});return h.render();};
const cardIds=view=>nodes(view).filter(node=>node.type==='a'&&node.props.href?.startsWith('/studio?project=')).map(node=>node.props.href.split('=')[1]);
const sampleCard=view=>nodes(view).find(node=>node.type==='a'&&node.props.href==='/studio?sample=dune-study');
const queryShot=(id,title,prompt,operation,updatedAt)=>({...shot(id),title,draft:{...shot(id).draft,operation,...(operation==='image_to_video'?{startAssetId:null}:{}),prompt},updatedAt});
// Saved-project fixtures exercise local state only; actual three-shot save/browser acceptance belongs to root.
const savedShots=[
  queryShot('c','Zinc light','A scarlet bicycle in rain','text_to_image','2026-10-12T01:00:00Z'),
  queryShot('a','Amber room','Quiet blue mist over water','image_to_video','2026-10-12T02:00:00Z'),
  queryShot('b','Birch study','Slow bicycle tracking shot','image_to_video','2026-10-12T03:00:00Z'),
];
const savedHarness=()=>harness({projects:async()=>({items:savedShots,nextCursor:null}),project:async id=>({project:savedShots.find(project=>project.id===id),assets:[],jobs:[]})});
await check('local query finds three saved-project fixtures by title and prompt, ignoring case/outer whitespace',async()=>{
  for(const [query,id] of [['ZINC','c'],['scarlet','c'],[' amber ROOM ','a'],['BLUE MIST','a'],['birch study','b'],['Tracking','b']]){
    assert.deepEqual([...queryLibraryProjects(savedShots,query,'all','updated').map(project=>project.id)],[id]);
  }
  assert.equal(queryLibraryProjects(savedShots,'[','all','updated').length,0);
  assert.equal(queryLibraryProjects(savedShots,'  ','all','updated').length,3);
});
await check('operation filter and both sorts compose with search and use updatedAt, not createdAt',async()=>{
  assert.deepEqual([...queryLibraryProjects(savedShots,'','all','updated').map(project=>project.id)],['b','a','c']);
  assert.deepEqual([...queryLibraryProjects(savedShots,'','all','title').map(project=>project.id)],['a','b','c']);
  assert.deepEqual([...queryLibraryProjects(savedShots,'BICYCLE','image_to_video','title').map(project=>project.id)],['b']);
  assert.deepEqual([...queryLibraryProjects(savedShots,'bicycle','text_to_image','updated').map(project=>project.id)],['c']);
  const ties=[{...savedShots[2],title:'alpha',updatedAt:'2026-10-11T20:00:00-07:00'}, {...savedShots[1],title:'Alpha',updatedAt:'2026-10-12T03:00:00Z',createdAt:'2099-01-01T00:00:00Z'}];
  for(const sort of ['updated','title'])assert.deepEqual([...queryLibraryProjects(ties,'','all',sort).map(project=>project.id)],['a','b']);
});
await check('query never mutates the source array or projects, including when no filter is active',async()=>{
  const source=Object.freeze(savedShots.map(project=>Object.freeze({...project,draft:Object.freeze({...project.draft})})));
  const before=JSON.stringify(source);
  for(const sort of ['updated','title'])for(const filter of ['all','text_to_image','image_to_video']){
    const result=queryLibraryProjects(source,'',filter,sort);assert.notEqual(result,source);
  }
  assert.equal(JSON.stringify(source),before);
});
await check('page reconciliation retains newer detail revisions and timestamps, deduplicates, and drops absent IDs on refresh',async()=>{
  const older=shot('a'),newer={...older,title:'Edited',revision:2,updatedAt:'2026-10-12T02:00:00Z'};
  const current=Object.freeze([newer,shot('b')]),incoming=Object.freeze([older,shot('c'),shot('c')]);
  const appended=mergeLibraryProjects(current,incoming,true);
  assert.deepEqual([...appended.map(project=>project.id)],['a','b','c']);assert.equal(appended[0],newer);
  const refreshed=mergeLibraryProjects(current,incoming,false);assert.deepEqual([...refreshed.map(project=>project.id)],['a','c']);assert.equal(refreshed[0],newer);
  assert.equal(preferNewerProject(newer,{...newer,updatedAt:older.updatedAt}),newer);
  assert.equal(current.length,2);assert.equal(incoming.length,3);
});
await check('toolbar labels native controls and keeps actions outside card anchors',async()=>{
  const h=savedHarness(),v=await h.start();
  for(const id of ['library-search','library-filter','library-sort']){
    const input=control(v,id);assert(input);assert.equal(input.props['aria-controls'],'saved-shot-results');assert.equal(input.props.tabIndex,undefined);
    assert(nodes(v).some(node=>node.type==='label'&&node.props.htmlFor===id&&text(node)));
  }
  assert.equal(control(v,'library-search').props.type,'search');
  assert.equal(control(v,'library-filter').type,'select');assert.equal(control(v,'library-sort').type,'select');
  for(const anchor of nodes(v).filter(node=>node.type==='a'))assert.equal(nodes(anchor.props.children).some(node=>['button','input','select'].includes(node.type)),false);
});
await check('typing, filtering, sorting and reset issue no extra list/detail requests or preview loading',async()=>{
  const h=savedHarness();let v=await h.start();const before=JSON.stringify(h.calls),sample=JSON.stringify(sampleCard(v));
  for(const query of ['b','bi','BICYCLE']){v=change(h,'library-search',query);await tick();v=h.render();assert.doesNotMatch(text(v),/Loading your shots/);}
  assert.deepEqual(cardIds(v),['b','c']);v=change(h,'library-filter','image_to_video');assert.deepEqual(cardIds(v),['b']);
  v=change(h,'library-sort','title');assert.deepEqual(cardIds(v),['b']);assert.equal(JSON.stringify(sampleCard(v)),sample);
  button(v,'Reset').props.onClick({detail:1});await tick();v=h.render();assert.deepEqual(cardIds(v),['b','a','c']);assert.equal(JSON.stringify(h.calls),before);
  assert.equal(JSON.stringify(sampleCard(v)),sample);assert.equal(button(v,'Reset').props.disabled,true);
});
await check('no-match count/reset restores search, type and sort while prepared collection stays visible',async()=>{
  const h=savedHarness();await h.start();change(h,'library-filter','text_to_image');change(h,'library-sort','title');let v=change(h,'library-search','Dune study');
  assert.deepEqual(cardIds(v),[]);assert.match(text(v),/No matching shots/);assert.doesNotMatch(text(v),/Your next shot starts here|unavailable|Loading your shots/);
  const countNode=nodes(v).find(node=>node.props?.role==='status');assert.match(text(countNode).replace(/\s+/g,' '),/0 of 3 shots/);assert(sampleCard(v));
  let focused=0;control(v,'library-search').props.ref.current={focus(){focused++;}};
  button(v,'Reset search and filters').props.onClick({detail:1});v=h.render();assert.equal(focused,1);
  assert.deepEqual(cardIds(v),['b','a','c']);assert.equal(control(v,'library-search').props.value,'');assert.equal(control(v,'library-filter').props.value,'all');assert.equal(control(v,'library-sort').props.value,'updated');assert.equal(control(v,'library-no-matches-title'),undefined);
});
await check('newer details update title/prompt/filter/order during a pending search without refetching',async()=>{
  const pending=deferred();const revised={...savedShots[0],title:'Edited light',revision:2,draft:{...savedShots[0].draft,prompt:'Lavender evening'},updatedAt:'2026-10-12T04:00:00Z'};
  const h=harness({projects:async()=>({items:savedShots,nextCursor:null}),project:async id=>id==='c'?pending.promise:{project:savedShots.find(project=>project.id===id),assets:[],jobs:[]}});
  await h.start();let v=change(h,'library-search','LAVENDER');assert.deepEqual(cardIds(v),[]);assert.match(text(v),/Loading your shots/);assert.equal(control(v,'library-no-matches-title'),undefined);
  const before=h.calls.length;pending.resolve({project:revised,assets:[],jobs:[]});await tick();v=h.render();assert.deepEqual(cardIds(v),['c']);assert.match(text(card(v,'c')),/Edited light/);assert.equal(h.calls.length,before);
  button(v,'Reset').props.onClick({detail:1});assert.deepEqual(cardIds(h.render()),['c','b','a']);
});
await check('successful newer project data remains searchable when its external thumbnail fails',async()=>{
  const old=shot('a'),current={...motion('a','missing'),title:'New lantern',revision:2,draft:{...motion('a','missing').draft,prompt:'Copper harbor'},updatedAt:'2026-10-12T04:00:00Z'};
  const h=harness({projects:async()=>({items:[old],nextCursor:null}),project:async()=>({project:current,assets:[],jobs:[]})});await h.start();
  change(h,'library-filter','image_to_video');const v=change(h,'library-search','COPPER');assert.deepEqual(cardIds(v),['a']);assert.match(text(card(v,'a')),/New lantern.*Motion draft.*unavailable/);assert(button(v,'Retry previews'));assert.equal(control(v,'library-no-matches-title'),undefined);
});
await check('retrying a failed detail moves an edited shot in recent order and updates prompt search',async()=>{
  let recover=false;const revised={...savedShots[0],title:'Latest edit',revision:2,draft:{...savedShots[0].draft,prompt:'Silver haze'},updatedAt:'2026-10-12T05:00:00Z'};
  const h=harness({projects:async()=>({items:savedShots,nextCursor:null}),project:async id=>{if(id==='c'&&!recover)throw new StudioApiError(503);return {project:id==='c'?revised:savedShots.find(project=>project.id===id),assets:[],jobs:[]};}});
  let v=await h.start();assert.deepEqual(cardIds(v),['b','a','c']);recover=true;button(v,'Retry previews').props.onClick({detail:1});await tick();v=h.render();assert.deepEqual(cardIds(v),['c','b','a']);assert.deepEqual(cardIds(change(h,'library-search','silver')),['c']);
});
await check('empty, loading, failed list and expired session each remain distinct from no matches',async()=>{
  const pending=deferred();const loading=harness({projects:()=>pending.promise});let v=loading.render();assert.match(text(v),/Loading your shots/);assert.equal(control(v,'library-no-matches-title'),undefined);assert.doesNotMatch(text(v),/Your next shot starts here/);
  pending.resolve({items:[],nextCursor:null});await tick();v=loading.render();assert.match(text(v),/Your next shot starts here/);assert.doesNotMatch(text(v),/No matching shots|Loading your shots|saved session is unavailable/);assert.equal(control(v,'library-search'),undefined);
  for(const status of [503,401]){
    const h=harness({projects:async()=>{throw new StudioApiError(status);}});v=await h.start();assert.equal(control(v,'library-no-matches-title'),undefined);assert.doesNotMatch(text(v),/Your next shot starts here|Loading your shots/);
    if(status===401){assert.match(text(v),/Your saved session is unavailable/);assert.equal(button(v,'Retry library'),undefined);assert.equal(h.cleared(),1);}
    else{assert(button(v,'Retry library'));assert(nodes(v).some(node=>node.props?.role==='alert'));assert.equal(h.cleared(),0);}
    assert(sampleCard(v));
  }
});
await check('partial preview failure coexists with local no-match state and retry does not reset the query',async()=>{
  const h=harness({project:async()=>{throw new StudioApiError(503);}});await h.start();let v=change(h,'library-search','unmatched');assert(button(v,'Retry previews'));assert.match(text(v),/No matching shots/);
  button(v,'Retry previews').props.onClick({detail:1});await tick();v=h.render();assert.equal(control(v,'library-search').props.value,'unmatched');assert.match(text(v),/No matching shots/);assert(button(v,'Retry previews'));
});
await check('paginated no-match is scoped to loaded shots; load-more includes matches without duplicate cards',async()=>{
  const h=harness({projects:async cursor=>cursor?{items:[shot('a'),savedShots[2]],nextCursor:null}:{items:[shot('a')],nextCursor:'next'},project:async id=>({project:id==='b'?savedShots[2]:shot(id),assets:[],jobs:[]})});await h.start();
  let v=change(h,'library-search','tracking');assert.match(text(v),/No matches in loaded shots/);assert.match(text(v),/Load more to include remaining saved shots/);assert.doesNotMatch(text(v),/No matching shots/);assert.match(text(v).replace(/\s+/g,' '),/0 of 1 loaded shot/);
  button(v,'Load more shots').props.onClick({detail:1});await tick();v=h.render();assert.deepEqual(cardIds(v),['b']);assert.equal(control(v,'library-no-matches-title'),undefined);assert.equal(button(v,'Load more shots'),undefined);assert.equal(control(v,'library-search').props.value,'tracking');
  button(v,'Reset').props.onClick({detail:1});assert.deepEqual(cardIds(h.render()),['b','a']);assert.deepEqual(h.calls.filter(call=>call[0]==='projects'),[['projects',undefined],['projects','next']]);
});
await check('an empty loaded page with a next cursor never claims the Library is empty',async()=>{
  const h=harness({projects:async()=>({items:[],nextCursor:'next'})});const v=await h.start();assert(button(v,'Load more shots'));assert.doesNotMatch(text(v),/Your next shot starts here|No matching shots|No matches in loaded shots/);assert.match(text(v),/remaining saved shots/);
});
await check('a failed next-page request keeps query and load-more boundary without claiming no matches',async()=>{
  const h=harness({projects:async cursor=>{if(cursor)throw new StudioApiError(503);return {items:[shot('a')],nextCursor:'next'};}});await h.start();let v=change(h,'library-search','unmatched');button(v,'Load more shots').props.onClick({detail:1});await tick();v=h.render();
  assert(button(v,'Retry library'));assert(button(v,'Load more shots'));assert.equal(control(v,'library-search').props.value,'unmatched');assert.equal(control(v,'library-no-matches-title'),undefined);
});
await check('expiry while filtered clears private cards, toolbar and pending pagination while keeping prepared samples',async()=>{
  const h=harness({projects:async cursor=>{if(cursor)throw new StudioApiError(401);return {items:[shot('a')],nextCursor:'next'};}});await h.start();change(h,'library-search','Shot');change(h,'library-sort','title');button(h.render(),'Load more shots').props.onClick({detail:1});await tick();const v=h.render();
  assert.deepEqual(cardIds(v),[]);assert.equal(control(v,'library-search'),undefined);assert.equal(button(v,'Load more shots'),undefined);assert.equal(control(v,'library-no-matches-title'),undefined);assert.match(text(v),/Your saved session is unavailable/);assert(sampleCard(v));assert.equal(h.cleared(),1);
});
const sourceId='11111111-1111-4111-8111-111111111111';
const copyId='22222222-2222-4222-8222-222222222222';
const recoveryKey='frame-studio:duplicate-saved-shot:v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const copySource=(operation='text_to_image')=>({...shot(sourceId),title:'Saved original',preferredAssetId:'source-output',draft:{operation,prompt:'Original saved direction',presetId:null,parentAssetId:'private-image',...(operation==='image_to_video'?{startAssetId:'private-image'}:{})}});
const duplicateButton=(view,id=sourceId)=>button(nodes(view).find(node=>node.props?.className==='library-shot-item'&&card(node,id)),'Duplicate saved shot');
const creates=h=>h.calls.filter(call=>call[0]==='createProject');
function copyHarness(options={}) {
  const db=options.db??new Map([[sourceId,copySource(options.operation)]]);
  const defaults={
    projects:async()=>({items:[...db.values()].map(clone),nextCursor:null}),
    project:async id=>{if(!db.has(id))throw new StudioApiError(404);return {project:clone(db.get(id)),assets:id===sourceId?[{id:'source-output',kind:'image',source:'generation',mediaUrl:'/original.jpg'}]:[],jobs:id===sourceId?[{status:'succeeded',requestKey:'original-request'}]:[]};},
    asset:async id=>({id,kind:'image',source:'upload',projectId:sourceId,mediaUrl:'/reference.jpg'}),
    createProject:async payload=>{
      const existing=db.get(payload.id);
      if(existing){assert.equal(existing.title,payload.title);assert.equal(JSON.stringify(existing.draft),JSON.stringify(payload.draft));return clone(existing);}
      const saved={...shot(payload.id),...clone(payload),preferredAssetId:null};db.set(saved.id,saved);return clone(saved);
    },
  };
  const h=harness({...defaults,...options.api},{...options,crypto:{randomUUID:()=>copyId}});
  return {...h,db,defaults};
}
for(const operation of ['text_to_image','image_to_video'])await check(`duplicate ${operation}: sibling button, validated saved payload, original intact, new empty card and explicit Open copy`,async()=>{
  const h=copyHarness({operation});let v=await h.start();const before=JSON.stringify(h.db.get(sourceId));
  const sourceCard=card(v,sourceId),action=duplicateButton(v);assert(action);assert(!nodes(sourceCard).includes(action));
  assert.equal(action.props['aria-label'],'Duplicate saved shot: Saved original');
  action.props.onClick({detail:1});await tick();v=h.render();
  assert.equal(creates(h).length,1);const payload=creates(h)[0][1];
  assert.deepEqual(Object.keys(payload).sort(),['draft','id','title']);assert.equal(payload.id,copyId);assert.equal(payload.title,'Saved original — Copy');
  assert.deepEqual(clone(payload.draft),h.db.get(sourceId).draft);assert.equal(h.db.get(copyId).preferredAssetId,null);
  assert.equal(JSON.stringify(h.db.get(sourceId)),before);assert(card(v,sourceId));assert(card(v,copyId));
  assert.match(text(card(v,copyId)),/0 generated versions/);assert.doesNotMatch(text(card(v,copyId)),/Latest request/);
  assert.match(text(v),/Copy created/);assert(nodes(v).some(node=>node.type==='a'&&text(node).includes('Open copy')&&node.props.href===`/studio?project=${copyId}`));
  if(operation==='image_to_video'){assert.equal(thumbnail(v,copyId),'/reference.jpg');assert.equal(h.calls.filter(c=>c[0]==='asset').at(-1)[1],'private-image');}
  assert.equal(h.store.has(recoveryKey),false);assert.equal(h.calls.some(c=>['guest','upload','saveProject','submit'].includes(c[0])),false);
  for(const anchor of nodes(v).filter(n=>n.type==='a'))assert(!nodes(anchor.props.children).some(n=>n.type==='button'));
});
await check('duplicate synchronous double-click has one source validation and one POST; recovery exists before POST',async()=>{
  const wait=deferred();const h=copyHarness();let v=await h.start();
  h.api.createProject=async payload=>{h.calls.push(['createProject',payload]);assert.equal(JSON.stringify(JSON.parse(h.store.get(recoveryKey)).payload),JSON.stringify(payload));await wait.promise;return h.defaults.createProject(payload);};
  const before=h.calls.filter(c=>c[0]==='project').length,action=duplicateButton(v);action.props.onClick({detail:1});action.props.onClick({detail:1});await tick();v=h.render();
  assert.equal(creates(h).length,1);assert.equal(h.calls.filter(c=>c[0]==='project').length,before+1);assert(duplicateButton(v).props.disabled);assert(button(v,'Retry saved copy').props.disabled);assert.match(text(v),/Confirming your copy/);
  wait.resolve();await tick();assert.match(text(h.render()),/Copy created/);
});
await check('lost acknowledgement and reload wait for explicit retry, then reuse exact UUID/payload despite source edits',async()=>{
  const h=copyHarness({operation:'image_to_video'});await h.start();
  h.api.createProject=async payload=>{h.calls.push(['createProject',payload]);await h.defaults.createProject(payload);throw new StudioApiError(0);};
  duplicateButton(h.render()).props.onClick({detail:1});await tick();let v=h.render();assert(button(v,'Retry saved copy'));const frozen=JSON.stringify(creates(h)[0][1]);assert(h.store.has(recoveryKey));h.unmount();
  const changed=h.db.get(sourceId);h.db.set(sourceId,{...changed,title:'Edited source later',draft:{...changed.draft,prompt:'New direction',startAssetId:null}});
  const reloaded=copyHarness({db:h.db,store:h.store});v=await reloaded.start();assert.equal(creates(reloaded).length,0);assert(button(v,'Retry saved copy'));assert.match(text(v),/even if the original has changed/);assert.equal(thumbnail(v,copyId),'/reference.jpg');
  const retry=button(v,'Retry saved copy');retry.props.onClick({detail:1});retry.props.onClick({detail:1});await tick();v=reloaded.render();
  assert.equal(creates(reloaded).length,1);assert.equal(JSON.stringify(creates(reloaded)[0][1]),frozen);assert.match(text(v),/Copy created/);assert.equal(h.db.size,2);assert.equal(reloaded.store.has(recoveryKey),false);
  assert.equal(reloaded.db.get(copyId).draft.startAssetId,'private-image');assert.equal(reloaded.db.get(sourceId).draft.prompt,'New direction');
});
for(const status of [0,429,503])await check(`duplicate ${status===429?'quota':status===0?'network':'service'} failure preserves exact attempt and source for explicit retry`,async()=>{
  const h=copyHarness();await h.start();const before=JSON.stringify(h.db.get(sourceId));
  h.api.createProject=async payload=>{h.calls.push(['createProject',payload]);throw new StudioApiError(status);};
  duplicateButton(h.render()).props.onClick({detail:1});await tick();let v=h.render();const first=JSON.stringify(creates(h)[0][1]);
  assert.match(text(v),/Copy not confirmed/);assert.equal(JSON.stringify(h.db.get(sourceId)),before);assert(card(v,sourceId));assert(h.store.has(recoveryKey));assert(button(v,'Retry saved copy'));assert.equal(duplicateButton(v).props.disabled,true);
  h.api.createProject=async payload=>{h.calls.push(['createProject',payload]);return h.defaults.createProject(payload);};button(v,'Retry saved copy').props.onClick({detail:1});await tick();v=h.render();
  assert.equal(JSON.stringify(creates(h)[1][1]),first);assert.match(text(v),/Copy created/);assert.equal(h.calls.some(c=>c[0]==='guest'),false);
});
for(const stage of ['source','create'])await check(`duplicate ${stage} expiry clears cards/recovery/private copy state without guest rotation`,async()=>{
  const h=copyHarness();await h.start();const oldAction=duplicateButton(h.render());
  if(stage==='source')h.api.project=async()=>{throw new StudioApiError(401);};
  else h.api.createProject=async payload=>{h.calls.push(['createProject',payload]);throw new StudioApiError(401);};
  oldAction.props.onClick({detail:1});await tick();let v=h.render();assert.equal(card(v,sourceId),undefined);assert.equal(card(v,copyId),undefined);assert.match(text(v),/Your saved session is unavailable/);assert.doesNotMatch(text(v),/saved copy|Copy created|Copy not confirmed/);
  assert.equal(h.store.has(recoveryKey),false);assert.equal(h.cleared(),1);assert.equal(h.calls.some(c=>c[0]==='guest'),false);const before=h.calls.length;
  oldAction.props.onClick({detail:1});await tick();v=h.render();assert.equal(h.calls.length,before);assert.equal(card(v,sourceId),undefined);
});
for(const recovered of [false,true])await check(`${recovered?'recovered':'initial'} duplicate source 404 or ID mismatch never posts`,async()=>{
  for(const mismatch of [false,true]){
    const h=copyHarness();if(recovered)h.duplicate.persistDuplicateAttempt(h.duplicate.createDuplicateAttempt(copySource(),copyId));
    await h.start();h.api.project=async()=>{if(!mismatch)throw new StudioApiError(404);return {project:shot(copyId),assets:[],jobs:[]};};
    (recovered?button(h.render(),'Retry saved copy'):duplicateButton(h.render())).props.onClick({detail:1});await tick();const v=h.render();
    assert.equal(creates(h).length,0);assert.match(text(v),mismatch?/saved source could not be verified/:/saved source is no longer accessible/);assert.equal(h.calls.some(c=>c[0]==='guest'),false);
  }
});
await check('late POST acknowledgement or error after preview expiry cannot resurrect copy, recovery, or private media',async()=>{
  for(const rejected of [false,true]){
    const h=copyHarness({api:{project:async()=>{throw new StudioApiError(503);}}});await h.start();
    h.api.project=h.defaults.project;const pending=deferred();h.api.createProject=async payload=>{h.calls.push(['createProject',payload]);return pending.promise;};
    duplicateButton(h.render()).props.onClick({detail:1});await tick();assert.equal(creates(h).length,1);assert(h.store.has(recoveryKey));
    h.api.project=async()=>{throw new StudioApiError(401);};button(h.render(),'Retry previews').props.onClick({detail:1});await tick();assert.match(text(h.render()),/Your saved session is unavailable/);
    if(rejected)pending.reject(new StudioApiError(503));else pending.resolve({...shot(copyId),...creates(h)[0][1]});
    await tick();const v=h.render();assert.equal(card(v,copyId),undefined);assert.equal(card(v,sourceId),undefined);assert.doesNotMatch(text(v),/Copy created|Copy not confirmed|Retry saved copy/);assert.equal(h.store.has(recoveryKey),false);
  }
});
await check('unmount during source validation sends no POST; unmount during POST preserves durable recovery and has zero late state writes',async()=>{
  for(const stage of ['source','create'])for(const rejected of [false,true]){
    const h=copyHarness();await h.start();const pending=deferred();
    if(stage==='source')h.api.project=async()=>pending.promise;
    else h.api.createProject=async payload=>{h.calls.push(['createProject',payload]);return pending.promise;};
    duplicateButton(h.render()).props.onClick({detail:1});await tick();h.unmount();
    if(rejected)pending.reject(new StudioApiError(401));else pending.resolve(stage==='source'?await h.defaults.project(sourceId):{...shot(copyId),...creates(h)[0][1]});
    await tick();assert.equal(h.lateUpdates(),0);assert.equal(h.cleared(),0);assert.equal(creates(h).length,stage==='source'?0:1);assert.equal(h.store.has(recoveryKey),stage==='create');
  }
});
await check('denied, full, corrupt or silently dropping durable storage forbids initial and retried POST',async()=>{
  for(const failure of ['get','set','drop','corrupt']){
    const store=new Map();if(failure==='corrupt')store.set(recoveryKey,'{bad');
    const storage={getItem:key=>{if(failure==='get')throw new Error('denied');return store.get(key)??null;},setItem:(key,value)=>{if(failure==='set')throw new Error('full');if(failure!=='drop')store.set(key,value);},removeItem:key=>store.delete(key)};
    const h=copyHarness({store,storage});await h.start();duplicateButton(h.render()).props.onClick({detail:1});await tick();let v=h.render();
    assert.equal(creates(h).length,0);assert(card(v,sourceId));assert.match(text(v),/No new copy was sent/);assert.equal(h.db.size,1);
    const retry=button(v,'Retry saved copy')??duplicateButton(v);retry.props.onClick({detail:1});await tick();v=h.render();assert.equal(creates(h).length,0);assert.match(text(v),/No new copy was sent/);
  }
});
await check('acknowledgement cleanup failure exposes Open copy and local-only Finish confirmation without enabling another POST',async()=>{
  const store=new Map();let removalBlocked=true;
  const storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value),removeItem:key=>{if(removalBlocked)throw new Error('blocked');store.delete(key);}};
  const h=copyHarness({store,storage});await h.start();duplicateButton(h.render()).props.onClick({detail:1});await tick();let v=h.render();
  assert.match(text(v),/Copy created/);assert(button(v,'Finish confirmation'));assert.equal(duplicateButton(v).props.disabled,true);assert(h.store.has(recoveryKey));const before=h.calls.length;
  removalBlocked=false;button(v,'Finish confirmation').props.onClick({detail:1});v=h.render();assert.equal(h.store.has(recoveryKey),false);assert.equal(duplicateButton(v).props.disabled,false);assert.equal(h.calls.length,before);
});
await check('acknowledgement with mismatched project ID stays recoverable and never adds a wrong card',async()=>{
  const h=copyHarness({api:{createProject:async()=>shot('wrong')}});await h.start();duplicateButton(h.render()).props.onClick({detail:1});await tick();const v=h.render();
  assert.equal(card(v,'wrong'),undefined);assert.equal(card(v,copyId),undefined);assert(button(v,'Retry saved copy'));assert(h.store.has(recoveryKey));assert.match(text(v),/response could not be confirmed/);
});
await check('copy acknowledgement preserves active query and source; Open copy remains visible if the copy is filtered out',async()=>{
  const h=copyHarness();await h.start();duplicateButton(h.render()).props.onClick({detail:1});change(h,'library-search','no match');await tick();const v=h.render();
  assert.equal(control(v,'library-search').props.value,'no match');assert.equal(card(v,copyId),undefined);assert.match(text(v),/Copy created/);assert(nodes(v).some(node=>node.type==='a'&&text(node).includes('Open copy')));
  button(v,'Reset search and filters').props.onClick({detail:1});assert(card(h.render(),copyId));assert(card(h.render(),sourceId));
});
await check('expired list on reload clears dedicated pending copy without reading private draft into UI or automatically posting',async()=>{
  const h=copyHarness({api:{projects:async()=>{throw new StudioApiError(401);}}});
  h.duplicate.persistDuplicateAttempt(h.duplicate.createDuplicateAttempt(copySource(),copyId));
  const v=await h.start();assert.match(text(v),/Your saved session is unavailable/);assert.doesNotMatch(text(v),/Original saved direction|Saved original|Retry saved copy/);
  assert.equal(h.store.has(recoveryKey),false);assert.equal(creates(h).length,0);assert.equal(h.calls.some(c=>c[0]==='guest'),false);
});
await check('synchronous list reload blocks stale duplicate callback and list failure keeps copy action visibly disabled',async()=>{
  const h=copyHarness({api:{projects:async()=>({items:[copySource()],nextCursor:'next'})}});let v=await h.start();const stale=duplicateButton(v),pending=deferred();
  h.api.projects=async()=>pending.promise;button(v,'Load more shots').props.onClick({detail:1});stale.props.onClick({detail:1});await tick();assert.equal(creates(h).length,0);
  pending.reject(new StudioApiError(503));await tick();v=h.render();assert(button(v,'Retry library'));assert.equal(duplicateButton(v).props.disabled,true);assert.equal(creates(h).length,0);
});
await check('missing initial source cannot clear an unrelated attempt that appeared while its access request was pending',async()=>{
  const h=copyHarness();await h.start();const pending=deferred();h.api.project=async()=>pending.promise;
  duplicateButton(h.render()).props.onClick({detail:1});await tick();const another=h.duplicate.createDuplicateAttempt({...copySource(),id:'33333333-3333-4333-8333-333333333333'},copyId);h.duplicate.persistDuplicateAttempt(another);
  pending.reject(new StudioApiError(404));await tick();assert.equal(creates(h).length,0);assert.equal(JSON.stringify(h.duplicate.readDuplicateAttempt()),JSON.stringify(another));
});
await check('second pointer click cannot navigate a shifted card or create another copy after acknowledgement', async()=>{
  const h=copyHarness();let v=await h.start();
  duplicateButton(v).props.onClick({detail:1});await tick();v=h.render();
  const before=creates(h).length;
  duplicateButton(v).props.onClick({detail:2});await tick();assert.equal(creates(h).length,before);
  let prevented=false;card(v,sourceId).props.onClick({detail:2,preventDefault:()=>{prevented=true;}});
  assert.equal(prevented,true);
  prevented=false;card(v,sourceId).props.onClick({detail:0,preventDefault:()=>{prevented=true;}});
  assert.equal(prevented,false);
});
console.log(`${count} Library checks passed; mock hooks/JSX and pure queries only; no browser or saved-server acceptance.`);
