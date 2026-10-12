// Mock hook/JSX-tree checks only: no React renderer, browser, network or provider.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
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
function harness(overrides={}) {
  let slot=0,first=true;const slots=[],effects=[],cleanups=new Map(),calls=[];let cleared=0;
  const changed=(before,after)=>!before||!after||before.length!==after.length||before.some((value,index)=>!Object.is(value,after[index]));
  const React={
    useState(initial){const i=slot++;if(first)slots[i]=initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useRef(initial){const i=slot++;if(first)slots[i]={current:initial};return slots[i];},
    useCallback(fn,deps){const i=slot++;if(first||changed(slots[i]?.deps,deps))slots[i]={fn,deps};return slots[i].fn;},
    useEffect(fn,deps){const i=slot++;if(first||changed(slots[i],deps)){slots[i]=deps;effects.push([i,fn]);}},
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
    if(name==='@/src/client/library-query')return queryModule.exports;
    if(name==='@/src/catalog/samples')return {SAMPLE_ASSETS};
    throw new Error(name);
  };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`,{console,Date,Promise},{filename:'LibraryView.tsx'})(require,loadedModule,loadedModule.exports);
  const render=()=>{slot=0;const view=loadedModule.exports.LibraryView();first=false;for(const [i,fn] of effects.splice(0)){cleanups.get(i)?.();cleanups.set(i,fn());}return view;};
  render();
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
  button(v,'Reset').props.onClick();await tick();v=h.render();assert.deepEqual(cardIds(v),['b','a','c']);assert.equal(JSON.stringify(h.calls),before);
  assert.equal(JSON.stringify(sampleCard(v)),sample);assert.equal(button(v,'Reset').props.disabled,true);
});
await check('no-match count/reset restores search, type and sort while prepared collection stays visible',async()=>{
  const h=savedHarness();await h.start();change(h,'library-filter','text_to_image');change(h,'library-sort','title');let v=change(h,'library-search','Dune study');
  assert.deepEqual(cardIds(v),[]);assert.match(text(v),/No matching shots/);assert.doesNotMatch(text(v),/Your next shot starts here|unavailable|Loading your shots/);
  const countNode=nodes(v).find(node=>node.props?.role==='status');assert.match(text(countNode).replace(/\s+/g,' '),/0 of 3 shots/);assert(sampleCard(v));
  let focused=0;control(v,'library-search').props.ref.current={focus(){focused++;}};
  button(v,'Reset search and filters').props.onClick();v=h.render();assert.equal(focused,1);
  assert.deepEqual(cardIds(v),['b','a','c']);assert.equal(control(v,'library-search').props.value,'');assert.equal(control(v,'library-filter').props.value,'all');assert.equal(control(v,'library-sort').props.value,'updated');assert.equal(control(v,'library-no-matches-title'),undefined);
});
await check('newer details update title/prompt/filter/order during a pending search without refetching',async()=>{
  const pending=deferred();const revised={...savedShots[0],title:'Edited light',revision:2,draft:{...savedShots[0].draft,prompt:'Lavender evening'},updatedAt:'2026-10-12T04:00:00Z'};
  const h=harness({projects:async()=>({items:savedShots,nextCursor:null}),project:async id=>id==='c'?pending.promise:{project:savedShots.find(project=>project.id===id),assets:[],jobs:[]}});
  await h.start();let v=change(h,'library-search','LAVENDER');assert.deepEqual(cardIds(v),[]);assert.match(text(v),/Loading your shots/);assert.equal(control(v,'library-no-matches-title'),undefined);
  const before=h.calls.length;pending.resolve({project:revised,assets:[],jobs:[]});await tick();v=h.render();assert.deepEqual(cardIds(v),['c']);assert.match(text(card(v,'c')),/Edited light/);assert.equal(h.calls.length,before);
  button(v,'Reset').props.onClick();assert.deepEqual(cardIds(h.render()),['c','b','a']);
});
await check('successful newer project data remains searchable when its external thumbnail fails',async()=>{
  const old=shot('a'),current={...motion('a','missing'),title:'New lantern',revision:2,draft:{...motion('a','missing').draft,prompt:'Copper harbor'},updatedAt:'2026-10-12T04:00:00Z'};
  const h=harness({projects:async()=>({items:[old],nextCursor:null}),project:async()=>({project:current,assets:[],jobs:[]})});await h.start();
  change(h,'library-filter','image_to_video');const v=change(h,'library-search','COPPER');assert.deepEqual(cardIds(v),['a']);assert.match(text(card(v,'a')),/New lantern.*Motion draft.*unavailable/);assert(button(v,'Retry previews'));assert.equal(control(v,'library-no-matches-title'),undefined);
});
await check('retrying a failed detail moves an edited shot in recent order and updates prompt search',async()=>{
  let recover=false;const revised={...savedShots[0],title:'Latest edit',revision:2,draft:{...savedShots[0].draft,prompt:'Silver haze'},updatedAt:'2026-10-12T05:00:00Z'};
  const h=harness({projects:async()=>({items:savedShots,nextCursor:null}),project:async id=>{if(id==='c'&&!recover)throw new StudioApiError(503);return {project:id==='c'?revised:savedShots.find(project=>project.id===id),assets:[],jobs:[]};}});
  let v=await h.start();assert.deepEqual(cardIds(v),['b','a','c']);recover=true;button(v,'Retry previews').props.onClick();await tick();v=h.render();assert.deepEqual(cardIds(v),['c','b','a']);assert.deepEqual(cardIds(change(h,'library-search','silver')),['c']);
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
  button(v,'Retry previews').props.onClick();await tick();v=h.render();assert.equal(control(v,'library-search').props.value,'unmatched');assert.match(text(v),/No matching shots/);assert(button(v,'Retry previews'));
});
await check('paginated no-match is scoped to loaded shots; load-more includes matches without duplicate cards',async()=>{
  const h=harness({projects:async cursor=>cursor?{items:[shot('a'),savedShots[2]],nextCursor:null}:{items:[shot('a')],nextCursor:'next'},project:async id=>({project:id==='b'?savedShots[2]:shot(id),assets:[],jobs:[]})});await h.start();
  let v=change(h,'library-search','tracking');assert.match(text(v),/No matches in loaded shots/);assert.match(text(v),/Load more to include remaining saved shots/);assert.doesNotMatch(text(v),/No matching shots/);assert.match(text(v).replace(/\s+/g,' '),/0 of 1 loaded shot/);
  button(v,'Load more shots').props.onClick();await tick();v=h.render();assert.deepEqual(cardIds(v),['b']);assert.equal(control(v,'library-no-matches-title'),undefined);assert.equal(button(v,'Load more shots'),undefined);assert.equal(control(v,'library-search').props.value,'tracking');
  button(v,'Reset').props.onClick();assert.deepEqual(cardIds(h.render()),['b','a']);assert.deepEqual(h.calls.filter(call=>call[0]==='projects'),[['projects',undefined],['projects','next']]);
});
await check('an empty loaded page with a next cursor never claims the Library is empty',async()=>{
  const h=harness({projects:async()=>({items:[],nextCursor:'next'})});const v=await h.start();assert(button(v,'Load more shots'));assert.doesNotMatch(text(v),/Your next shot starts here|No matching shots|No matches in loaded shots/);assert.match(text(v),/remaining saved shots/);
});
await check('a failed next-page request keeps query and load-more boundary without claiming no matches',async()=>{
  const h=harness({projects:async cursor=>{if(cursor)throw new StudioApiError(503);return {items:[shot('a')],nextCursor:'next'};}});await h.start();let v=change(h,'library-search','unmatched');button(v,'Load more shots').props.onClick();await tick();v=h.render();
  assert(button(v,'Retry library'));assert(button(v,'Load more shots'));assert.equal(control(v,'library-search').props.value,'unmatched');assert.equal(control(v,'library-no-matches-title'),undefined);
});
await check('expiry while filtered clears private cards, toolbar and pending pagination while keeping prepared samples',async()=>{
  const h=harness({projects:async cursor=>{if(cursor)throw new StudioApiError(401);return {items:[shot('a')],nextCursor:'next'};}});await h.start();change(h,'library-search','Shot');change(h,'library-sort','title');button(h.render(),'Load more shots').props.onClick();await tick();const v=h.render();
  assert.deepEqual(cardIds(v),[]);assert.equal(control(v,'library-search'),undefined);assert.equal(button(v,'Load more shots'),undefined);assert.equal(control(v,'library-no-matches-title'),undefined);assert.match(text(v),/Your saved session is unavailable/);assert(sampleCard(v));assert.equal(h.cleared(),1);
});
console.log(`${count} Library checks passed; mock hooks/JSX and pure queries only; no browser or saved-server acceptance.`);
