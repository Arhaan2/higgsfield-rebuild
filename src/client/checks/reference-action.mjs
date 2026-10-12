// Component/action + actual hook integration, with mock API and React hooks.
// No browser, network, provider, or native focus/layout claim.
// Run: node src/client/checks/reference-action.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
const req = createRequire(import.meta.url), ts = req('typescript'), root = process.cwd();
const tick = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };
const deepFreeze = value => { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object') deepFreeze(child); return value; };
const textOf = node => node == null || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : textOf(node.props?.children);
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
function harness({ source = 'upload', status = 'succeeded', selected = 'frame-a', prompt = '  orbit gently clockwise\nkeep exact text  ' } = {}) {
  let slot = 0, effects = [], tree, studio, focusCalls = 0, inspectOnly = false;
  const slots = [], cache = new Map(), calls = [], store = new Map();
  const motion = { operation: 'image_to_video', prompt, presetId: null, parentAssetId: 'original-parent', startAssetId: 'frame-a' };
  let project = { id: '11111111-1111-4111-8111-111111111111', title: 'Repair check', draft: motion, revision: 1, preferredAssetId: selected, createdAt: '2026-10-12T00:00:00Z', updatedAt: '2026-10-12T00:00:00Z' };
  const assets = deepFreeze(['frame-a', 'frame-b'].map(id => ({ id, projectId: project.id, title: id, kind: 'image', source, fileName: id + '.png', mimeType: 'image/png', mediaUrl: '/' + id, downloadUrl: '/' + id, width: 512, height: 512, durationSeconds: null, byteSize: 100, posterUrl: null, sourceJobId: source === 'upload' ? null : 'job-' + id, createdAt: project.createdAt, attribution: null })));
  const jobs = deepFreeze(assets.map(asset => ({ id: 'job-' + asset.id, projectId: project.id, status, lastCheckedAt: project.createdAt, outputAssetIds: [source === 'upload' ? 'output-' + asset.id : asset.id], snapshot: { operation: 'text_to_image', prompt: 'immutable original', presetId: null, parentAssetId: null, startAsset: null }, createdAt: project.createdAt })));
  const originals = JSON.stringify({ assets, jobs });
  const api = {
    project: async () => ({ project, assets: [...assets], jobs: [...jobs] }),
    projects: async () => ({ items: [project], nextCursor: null }),
    capabilities: async () => ({ upload: { maxBytes: 5000000 }, liveGeneration: { enabled: false, remainingMicroUsd: 0, reason: 'disabled' } }),
    saveProject: async (id, { expectedRevision, ...patch }) => (project = { ...project, ...patch, id, revision: expectedRevision + 1 }),
    asset: async () => { throw new Error('metadata unavailable in fixture'); },
    guest: async () => ({ expiresAt: '2026-11-01T00:00:00Z' }),
  };
  class StudioApiError extends Error {}
  const React = {
    useState(initial) { const i = slot++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = slot++; return slots[i] ||= { current: initial }; },
    useCallback(fn, deps) { const i = slot++, previous = slots[i]; if (!previous || deps.some((value, n) => !Object.is(value, previous.deps[n]))) slots[i] = { deps, fn }; return slots[i].fn; },
    useEffect(fn, deps) { if (inspectOnly) return; const i = slot++, previous = slots[i]; if (!previous || !deps || deps.some((value, n) => !Object.is(value, previous.deps[n]))) effects.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const context = { createImageBitmap: async () => ({ width: 512, height: 512, close() {} }), console, URLSearchParams, Date, JSON, Math, crypto: webcrypto, setTimeout: () => 0, clearTimeout() {}, document: { hidden: true }, window: { location: { search: '?project=' + project.id }, history: { replaceState() {} }, addEventListener() {}, removeEventListener() {} }, localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) } };
  const apiProxy = new Proxy(api, { get: (target, key) => (...args) => { calls.push([key, ...args]); return target[key](...args); } });
  function load(relative) {
    const filename = path.resolve(root, relative); if (cache.has(filename)) return cache.get(filename);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const mod = { exports: {} }; cache.set(filename, mod.exports);
    const localRequire = name => {
      if (name === 'react') return React;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
      if (name === './AppShell') return { AppShell: 'AppShell', GenerationBadge: 'GenerationBadge' };
      if (name === './api' || name === '@/src/client/api') return { api: apiProxy, StudioApiError, errorMessage: error => error.message };
      if (name.startsWith('.') || name.startsWith('@/')) {
        const base = name.startsWith('@/') ? name.slice(2) : path.relative(root, path.resolve(path.dirname(filename), name));
        const loaded = load(base + (fs.existsSync(path.resolve(root, base + '.ts')) ? '.ts' : '.tsx'));
        if (name === '@/src/client/use-studio') return { ...loaded, useStudio: () => (studio = loaded.useStudio()) };
        return loaded;
      }
      return req(name);
    };
    vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`, context, { filename })(localRequire, mod, mod.exports);
    return mod.exports;
  }
  let View = load('components/studio/StudioView.tsx').StudioView;
  function render() {
    slot = 0; tree = View();
    for (const node of nodes(tree)) if (node.props?.ref && node.type === 'textarea') node.props.ref.current = { focus() { focusCalls++; } };
    const next = effects; effects = []; for (const effect of next) effect();
    return tree;
  }
  return { api, calls, load, render, async openLibrary() { for (const entry of slots) entry?.cleanup?.(); slots.length = 0; effects = []; View = load('components/studio/LibraryView.tsx').LibraryView; render(); await tick(); return render(); }, detailsElement(props) { inspectOnly = true; try { return load('components/studio/AssetDetails.tsx').AssetDetails(props); } finally { inspectOnly = false; } }, get assets() { return assets; }, get studio() { return studio; }, get tree() { return tree; }, get focusCalls() { return focusCalls; }, async start() { render(); await tick(); render(); }, button(label) { const found = nodes(tree).find(node => node.type === 'button' && textOf(node).trim() === label.trim()); assert(found, `button ${label} exists; loadError=${studio.loadError}; selected=${studio.selectedId}; buttons=${nodes(tree).filter(n => n.type === "button").map(textOf).join("|")}`); return found; }, unchanged() { assert.equal(JSON.stringify({ assets, jobs }), originals); }, detailsProps() { return nodes(tree).find(node => typeof node.type === 'function' && node.type.name === 'AssetDetails')?.props; } };
}
let checks = 0;
const check = name => { checks++; console.log('PASS ' + name); };
for (const saved of [true, false]) for (const imageMode of [false, true]) for (const same of [true, false]) {
  const h = harness({ selected: same ? 'frame-a' : 'frame-b' }); await h.start();
  const expected = saved ? h.studio.buffer.drafts.image_to_video.prompt : '  Unsaved movement: keep\nmy exact direction.  ';
  if (!saved) h.studio.updatePrompt(expected);
  if (imageMode) { h.studio.switchMode('text_to_image'); h.studio.updatePrompt('separate image text'); }
  h.render(); const before = h.calls.length, motion = h.studio.buffer.drafts.image_to_video;
  h.button(same ? 'Edit movement' : 'Use as start frame').props.onClick(); await tick(); h.render();
  assert.equal(h.studio.buffer.operation, 'image_to_video');
  assert.equal(h.studio.buffer.drafts.image_to_video.prompt, expected);
  assert.equal(h.studio.buffer.drafts.image_to_video.startAssetId, same ? 'frame-a' : 'frame-b');
  if (same) { assert.equal(h.studio.buffer.drafts.image_to_video, motion); assert.equal(h.calls.length, before); }
  else assert.equal(h.studio.buffer.drafts.image_to_video.parentAssetId, 'frame-b');
  if (imageMode) assert.equal(h.studio.buffer.drafts.text_to_image.prompt, 'separate image text');
  assert(h.focusCalls > 0); h.unchanged();
  assert(!h.calls.some(call => ['submit', 'refresh', 'retryTransfer'].includes(call[0])));
  check(`${saved ? 'saved' : 'unsaved'}, ${imageMode ? 'image' : 'motion'} mode, ${same ? 'same' : 'different'} reference preserves exact movement and focuses; originals immutable`);
}
{
  const h = harness({ selected: 'frame-b', prompt: '' }); await h.start();
  h.button('Use as start frame').props.onClick(); await tick(); h.render();
  assert.equal(h.studio.buffer.drafts.image_to_video.prompt, h.load('src/catalog/samples.ts').PRESETS[1].draft.prompt);
  check('different reference initializes only an empty movement prompt from existing preset');
}
for (const same of [true, false]) {
  const h = harness({ selected: same ? 'frame-a' : 'frame-b' }); await h.start(); const expected = h.studio.buffer.drafts.image_to_video.prompt;
  h.button(' View details').props.onClick(); h.render(); const props = h.detailsProps();
  assert.equal(props.referenceAction.label, same ? 'Edit movement' : 'Use as start frame');
  assert.match(props.referenceAction.description, /does not generate/);
  // Invoke the actual AssetDetails component in an isolated element-level harness.
  const element = h.detailsElement(props);
  const action = nodes(element).find(node => node.type === 'button' && textOf(node) === props.referenceAction.label);
  assert(action); action.props.onClick(); await tick(); h.render();
  assert.equal(h.detailsProps(), undefined); assert.equal(h.studio.buffer.drafts.image_to_video.prompt, expected); assert(h.focusCalls > 0); h.unchanged();
  check(`details ${same ? 'same' : 'different'} reference invokes explicit shared callback, closes and requests focus`);
}
{
  const h = harness(); await h.start();
  h.studio.setSelectedId('sample-dune-light'); h.render(); h.button(' View details').props.onClick(); h.render(); const props = h.detailsProps();
  const element = h.detailsElement(props);
  const suggestion = nodes(element).find(node => node.type === 'button' && textOf(node) === 'Use suggested prompt');
  assert(suggestion); assert(nodes(element).some(node => node.type === 'button' && textOf(node) === 'Use as start frame'));
  suggestion.props.onClick(); await tick(); h.render();
  assert.equal(h.studio.buffer.operation, 'text_to_image'); assert.equal(h.studio.buffer.drafts.text_to_image.prompt, h.load('src/catalog/samples.ts').PRESETS[0].draft.prompt);
  const attribution = nodes(element).find(node => node.props?.className === 'detail-attribution text-small text-muted'); assert(attribution);
  check('sample details retains separate suggested-prompt behavior and dedicated attribution row');
}
for (const status of ['queued', 'running', 'storing', 'failed', 'transfer_failed']) {
  const h = harness({ status }); await h.start();
  const notice = nodes(h.tree).find(node => node.props?.['aria-label'] === 'Generation request status');
  const live = nodes(notice).find(node => node.props?.role === (status.endsWith('failed') ? 'alert' : 'status'));
  assert(live); assert.equal(live.props['aria-live'], status.endsWith('failed') ? 'assertive' : 'polite');
  assert.equal(live.props['aria-atomic'], 'true'); assert(!nodes(live).some(node => ['time', 'button'].includes(node.type)));
  check(`${status} status text has live semantics without polling timestamps or actions`);
}
// Regression: resolve the reference change against text typed during an in-flight save.
{
  const h = harness({ selected: 'frame-b' }); await h.start(); h.studio.updatePrompt('at click'); h.render();
  let release; const pending = new Promise(resolve => { release = resolve; }); const save = h.api.saveProject; let first = true;
  h.api.saveProject = async (...args) => { if (first) { first = false; await pending; } return save(...args); };
  h.button('Use as start frame').props.onClick(); await tick(); h.studio.updatePrompt('newer typing during save'); release(); await tick(); h.render();
  if (h.studio.buffer.drafts.image_to_video.prompt !== 'newer typing during save') {
    console.error('BLOCKED root hook: forkDraft applies its pre-save argument after beforeNavigate, replacing typing made during that wait.');
    process.exitCode = 1;
  } else check('typing during reference-action save remains exact');
}

// Select a retained old job, then replace its reference using the real hook upload path.
{
  const h = harness({ source: 'generation' }); await h.start();
  const version = nodes(h.tree).find(n => n.type === 'button' && n.props.className === 'version-card' && textOf(n).includes('V01'));
  version.props.onClick(); h.render();
  const uploaded = { ...h.assets[0], id: 'new-reference', title: 'New reference', source: 'upload', sourceJobId: null };
  h.api.upload = async () => uploaded;
  await h.studio.upload({ name: 'new.png', type: 'image/png', size: 100 }); h.render();
  assert.equal(h.studio.selectedId, uploaded.id);
  const media = nodes(h.tree).find(n => typeof n.type === 'function' && n.type.name === 'AssetMedia');
  assert.equal(media?.props.asset.id, uploaded.id, 'successful upload must replace old selected job on stage');
  check('old selected job yields to successfully uploaded reference');
}

for (const status of ['succeeded', 'queued', 'failed', 'transfer_failed']) for (const success of [true, false]) {
  const h = harness({ source: 'generation', status }); await h.start();
  nodes(h.tree).find(n => n.type === 'button' && n.props.className === 'version-card' && textOf(n).includes('V01')).props.onClick(); h.render();
  const stageMedia = () => nodes(h.tree).find(n => typeof n.type === 'function' && n.type.name === 'AssetMedia')?.props.asset.id;
  assert.equal(stageMedia(), status === 'succeeded' ? 'frame-a' : undefined, 'non-success job must not expose fake output');
  let release; const pending = new Promise(resolve => { release = resolve; });
  const uploaded = { ...h.assets[0], id: 'new-reference', title: 'New reference', source: 'upload', sourceJobId: null };
  h.api.upload = async () => { await pending; if (!success) throw new Error('upload interrupted'); return uploaded; };
  const upload = h.studio.upload({ name: 'new.png', type: 'image/png', size: 100 }); await tick(); h.render();
  assert.equal(stageMedia(), status === 'succeeded' ? 'frame-a' : undefined);
  release(); await upload; h.render();
  assert.equal(stageMedia(), success ? uploaded.id : status === 'succeeded' ? 'frame-a' : undefined);
  assert.equal(h.studio.buffer.drafts.image_to_video.startAssetId, success ? uploaded.id : 'frame-a');
  if (!success) assert.match(h.studio.uploadError, /interrupted/);
  h.unchanged(); check(`${status} inspection: ${success ? 'successful upload selects reference' : 'failed upload preserves selection'}, no fake output while pending`);
}
{
  const h = harness(); await h.start();
  nodes(h.tree).find(n => n.type === 'button' && n.props.className === 'version-card' && textOf(n).includes('frame-b')).props.onClick(); h.render();
  assert.equal(h.calls.filter(c => c[0] === 'saveProject').length, 0, 'inspection must never persist');
  h.studio.updatePrompt('unsaved preserved'); h.render();
  let release; const pending = new Promise(resolve => { release = resolve; }); const save = h.api.saveProject;
  h.api.saveProject = async (...args) => { await pending; return save(...args); };
  h.button('Make preferred version').props.onClick(); await tick(); h.render();
  assert.equal(h.button('Saving preference…').props.disabled, true); assert.equal(h.studio.project.preferredAssetId, 'frame-a');
  h.studio.updatePrompt('newer preserved'); release(); await tick(); h.render();
  assert.equal(h.button('Preferred version').props.disabled, true); assert.equal(h.studio.project.preferredAssetId, 'frame-b');
  assert.equal(h.studio.buffer.drafts.image_to_video.prompt, 'newer preserved'); assert.equal(h.studio.dirty, true);
  assert(nodes(h.tree).some(n => n.props?.role === 'status' && textOf(n).includes('Preferred version saved')));
  h.unchanged();
  const library = await h.openLibrary();
  const card = nodes(library).find(n => n.type === 'a' && n.props.href === '/studio?project=11111111-1111-4111-8111-111111111111');
  assert.equal(nodes(card).find(n => n.type === 'img')?.props.src, '/frame-b');
  assert.equal(h.calls.filter(c => c[0] === 'saveProject').length, 1);
  check('explicit preference acknowledges after PATCH, preserves unsaved text, and actual Library component uses saved preference');
}
{
  const h = harness(); await h.start();h.studio.setSelectedId('frame-b');h.render();
  const save = h.api.saveProject;h.api.saveProject = async () => { throw new Error('network lost'); };
  h.button('Make preferred version').props.onClick();await tick();h.render();
  assert(nodes(h.tree).some(n => n.props?.role === 'alert' && textOf(n).includes('Preferred version was not confirmed')));
  assert.equal(h.studio.project.preferredAssetId,'frame-a');h.api.saveProject=save;
  h.button('Retry preferred version').props.onClick();await tick();h.render();assert.equal(h.button('Preferred version').props.disabled,true);
  h.studio.setSelectedId('sample-dune-light');h.render();
  assert(!nodes(h.tree).some(n => n.type === 'button' && /^(Make preferred version|Retry preferred version|Preferred version)$/.test(textOf(n))));
  check('preference error exposes explicit retry; prepared sample has no preference action');
}
console.log(`${checks} action checks passed; mock React/API, no browser/provider calls.`);
