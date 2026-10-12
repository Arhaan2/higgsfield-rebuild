// Focused formatter + real StudioView/useStudio action checks with controlled React/DOM/API.
// No browser/download-manager, native keyboard, network, or provider acceptance is claimed.
// Run with Node 24.18: node src/client/checks/shot-brief.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';

const require = createRequire(import.meta.url), ts = require('typescript'), root = process.cwd();
const tick = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const text = node => node == null || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const projectId = '11111111-1111-4111-8111-111111111111';
const motion = { operation: 'image_to_video', prompt: 'Orbit gently.\nKeep the light.', startAssetId: 'frame-a', presetId: null, parentAssetId: null };
const uploaded = { id: 'frame-a', projectId, title: 'My reference', kind: 'image', source: 'upload', fileName: 'reference.png', mimeType: 'image/png', byteSize: 4567, width: 512, height: 768, durationSeconds: null, sourceJobId: null, mediaUrl: '/api/assets/frame-a/media?token=PRIVATE', downloadUrl: 'https://private.invalid/file?X-Amz-Signature=SECRET', posterUrl: 'https://private.invalid/poster?secret=COOKIE', createdAt: '2026-10-12T00:00:00Z', attribution: null };
const initialProject = { id: projectId, title: 'Current shot', draft: motion, revision: 7, preferredAssetId: 'frame-b', createdAt: uploaded.createdAt, updatedAt: uploaded.createdAt };

function harness() {
  let slot = 0, effects = [], tree, studio, storedProject = structuredClone(initialProject), downloadFailure = false;
  const slots = [], cache = new Map(), calls = [], store = new Map(), blobs = [], links = [], timers = [], revoked = [], focusCalls = [];
  const assets = [structuredClone(uploaded), { ...uploaded, id: 'frame-b', title: 'Unrelated inspected asset', fileName: 'UNRELATED.png' }];
  const api = {
    project: async () => ({ project: storedProject, assets, jobs: [] }),
    capabilities: async () => ({ liveGeneration: { enabled: false, remainingMicroUsd: 0, reason: 'disabled' } }),
    saveProject: async (id, { expectedRevision, ...patch }) => (storedProject = { ...storedProject, ...patch, id, revision: expectedRevision + 1 }),
    asset: async () => { throw new Error('Unavailable fixture'); },
  };
  const React = {
    useState(initial) { const i = slot++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = slot++; return slots[i] ||= { current: initial }; },
    useCallback(fn, deps) { const i = slot++, old = slots[i]; if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) slots[i] = { deps, fn }; return slots[i].fn; },
    useEffect(fn, deps) { const i = slot++, old = slots[i]; if (!old || !deps || deps.some((v, j) => !Object.is(v, old.deps[j]))) effects.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  class StudioApiError extends Error {}
  const context = {
    console, Date, JSON, Math, URLSearchParams, Blob, crypto: webcrypto,
    URL: { createObjectURL(blob) { blobs.push(blob); return `blob:local-${blobs.length}`; }, revokeObjectURL(url) { revoked.push(url); } },
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; }, clearTimeout() {},
    document: { hidden: true, body: { appendChild(link) { link.appended = true; } }, createElement(tag) { assert.equal(tag, 'a'); const link = { click() { if (downloadFailure) throw new Error('Local download failure'); this.clicked = true; }, remove() { this.removed = true; } }; links.push(link); return link; } },
    window: { location: { search: '?project=' + projectId }, history: { replaceState() {} }, addEventListener() {}, removeEventListener() {} },
    localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) },
  };
  function load(relative) {
    const filename = path.resolve(root, relative); if (cache.has(filename)) return cache.get(filename);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const mod = { exports: {} }; cache.set(filename, mod.exports);
    const localRequire = name => {
      if (name === 'react') return React;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => key });
      if (name === './AppShell') return { AppShell: 'AppShell' };
      if (name === './AssetDetails') return { AssetDetails: 'AssetDetails' };
      if (name === './AssetMedia') return { AssetMedia: 'AssetMedia', Attribution: 'Attribution', mediaFacts: () => '' };
      if (name === './api') return { api: new Proxy(api, { get: (target, key) => (...args) => { calls.push([key, ...args]); return target[key](...args); } }), StudioApiError, errorMessage: error => error.message };
      if (name.startsWith('.') || name.startsWith('@/')) {
        const base = name.startsWith('@/') ? name.slice(2) : path.relative(root, path.resolve(path.dirname(filename), name));
        const value = load(base + (fs.existsSync(path.join(root, base + '.ts')) ? '.ts' : '.tsx'));
        return name === '@/src/client/use-studio' ? { ...value, useStudio: () => (studio = value.useStudio()) } : value;
      }
      return require(name);
    };
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, context, { filename })(localRequire, mod, mod.exports);
    return mod.exports;
  }
  const View = load('components/studio/StudioView.tsx').StudioView;
  function render() {
    slot = 0; tree = View();
    for (const node of nodes(tree)) if (node.props?.ref) node.props.ref.current = { focus(options) { focusCalls.push({ id: node.props.id, options }); } };
    const pending = effects; effects = []; pending.forEach(effect => effect()); return tree;
  }
  return { load, render, api, calls, blobs, links, timers, revoked, focusCalls, context, store,
    get studio() { return studio; }, get tree() { return tree; },
    failDownload(value) { downloadFailure = value; },
    async start() { render(); await tick(); render(); },
    button(label) { const button = nodes(tree).find(node => node.type === 'button' && text(node).trim() === label); assert(button, `Missing button: ${label}`); return button; },
  };
}

const h = harness();
const { createShotBrief, downloadShotBrief } = h.load('src/client/shot-brief.ts');
const { SAMPLE_ASSETS } = h.load('src/catalog/samples.ts');
const input = (patch = {}) => ({ title: initialProject.title, draft: structuredClone(motion), project: structuredClone(initialProject), saved: true, saving: false, assets: [uploaded], ...patch });
let count = 0;
function check(label, fn) { fn(); count++; console.log('PASS ' + label); }
function promptFrom(markdown) {
  const section = markdown.slice(markdown.indexOf('## Current prompt\n'));
  const match = section.match(/\n(`{3,})text\n/); assert(match);
  const start = match.index + match[0].length, end = section.indexOf('\n' + match[1] + '\n', start);
  assert(end >= start); return section.slice(start, end);
}

check('confirmed saved motion exports current prompt, revision and complete video settings', () => {
  const { markdown } = createShotBrief(input()); assert.match(markdown, /Saved draft — revision 7/); assert.equal(promptFrom(markdown), motion.prompt);
  assert.match(markdown, /fal-ai\/kling-video\/v2.5-turbo\/pro\/image-to-video/); assert.match(markdown, /"duration": "5"/); assert.match(markdown, /"cfg_scale": 0.5/); assert.match(markdown, /negative_prompt/);
});
for (const [name, patch] of [
  ['prompt edits', { draft: { ...motion, prompt: 'new edit' } }], ['whitespace-only edits', { draft: { ...motion, prompt: ' ' + motion.prompt + '\n' } }],
  ['title whitespace', { title: initialProject.title + ' ' }], ['different reference', { draft: { ...motion, startAssetId: 'other' } }],
  ['preset change', { draft: { ...motion, presetId: 'slow-reveal' } }], ['parent change', { draft: { ...motion, parentAssetId: 'other' } }],
  ['no confirmed project', { project: null }], ['unacknowledged state', { saved: false }], ['save in flight', { saving: true }],
]) check(`${name} cannot claim a saved revision`, () => {
  const brief = createShotBrief(input(patch)); assert.match(brief.markdown, /Working draft — unsaved/); assert.doesNotMatch(brief.markdown, /Saved draft — revision/);
});
check('image task uses image settings and ignores inactive motion reference', () => {
  const draft = { operation: 'text_to_image', prompt: 'Create a still', presetId: null, parentAssetId: null };
  const brief = createShotBrief(input({ draft, project: { ...initialProject, draft } }));
  assert.match(brief.markdown, /Saved draft — revision 7/); assert.match(brief.markdown, /fal-ai\/flux\/schnell/); assert.match(brief.markdown, /"width": 1280/); assert.match(brief.markdown, /"height": 720/); assert.match(brief.markdown, /"num_inference_steps": 4/); assert.match(brief.markdown, /Not used by the current Create image task/); assert.doesNotMatch(brief.markdown, /reference.png|Kling|duration/);
});
check('multiline Unicode, CRLF, whitespace and embedded Markdown/code fences round-trip exactly', () => {
  for (const prompt of ['', ' \n', '  Café — 夜空 🎞️\r\n```\n# injected\n~~~~\n``````text\n<script>hello</script>\n雪  \n\n']) {
    const brief = createShotBrief(input({ draft: { ...motion, prompt } })); assert.equal(promptFrom(brief.markdown), prompt);
  }
});
check('filename is bounded and portable; title stays exact in a safe fenced block', () => {
  for (const title of ['../../CON:*?<>|\\\n# heading', '雪 🎞️', 'Café sunrise', 'x'.repeat(200), '']) {
    const brief = createShotBrief(input({ title })); assert.match(brief.fileName, /^shot-brief(?:-[a-z0-9-]{1,64})?\.md$/); assert(brief.markdown.includes('\n' + title + '\n'));
  }
});
check('upload facts stay uploads; private media URLs and untrusted attribution links are absent', () => {
  const brief = createShotBrief(input({ assets: [{ ...uploaded, attribution: { label: 'Photographer supplied', url: 'https://private.invalid/source?token=SECRET' } }] }));
  assert.match(brief.markdown, /User upload/); assert.match(brief.markdown, /512 × 768 px/); assert.match(brief.markdown, /4567 bytes/); assert.match(brief.markdown, /Photographer supplied/); assert.match(brief.markdown, /original generation prompt and model unavailable/); assert.doesNotMatch(brief.markdown, /PRIVATE|SECRET|COOKIE|private.invalid|\/api\/assets/);
});
check('prepared start frame has its own attribution, not the inspected stock video provenance', () => {
  const brief = createShotBrief(input({ draft: { ...motion, startAssetId: SAMPLE_ASSETS[0].id }, assets: SAMPLE_ASSETS }));
  assert.match(brief.markdown, /Prepared sample — not generated from this draft/); assert.match(brief.markdown, /Jacob Castle \/ Unsplash/); assert.match(brief.markdown, /1600 × 2397 px/); assert.match(brief.markdown, /<https:\/\/unsplash.com\/photos\//); assert.doesNotMatch(brief.markdown, /Lukas|Pexels|14.996667/);
});
check('unknown and absent start frames are explicit; mismatched video is not used as a frame', () => {
  assert.match(createShotBrief(input({ assets: [] })).markdown, /metadata unavailable/);
  assert.match(createShotBrief(input({ draft: { ...motion, startAssetId: null } })).markdown, /No start frame selected/);
  assert.match(createShotBrief(input({ assets: [{ ...uploaded, kind: 'video' }] })).markdown, /metadata unavailable/);
});
check('missing dimensions and attribution stay unavailable; generated provenance does not invent a prompt/job', () => {
  const brief = createShotBrief(input({ assets: [{ ...uploaded, source: 'generation', width: null, height: null, sourceJobId: 'UNEXPORTED_JOB' }] }));
  assert.match(brief.markdown, /Generated image/); assert.match(brief.markdown, /Dimensions: Unavailable/); assert.match(brief.markdown, /no source attribution was supplied/); assert.doesNotMatch(brief.markdown, /UNEXPORTED_JOB/); assert.match(brief.markdown, /Media files are not embedded/);
});

await h.start();
check('zero-budget UI exposes export and primary Save with truthful disabled Generate', () => {
  h.studio.updatePrompt('working edit'); h.render();
  assert(!h.button('Export shot brief').props.disabled); assert.match(h.button('Save draft').props.className, /button-primary/); assert.equal(h.button('Generate 5-second video').props.disabled, true);
  assert(nodes(h.tree).some(n => n.props?.id === 'generation-reason' && text(n).includes('Spending is disabled')));
});
const stateBefore = JSON.stringify({ buffer: h.studio.buffer, project: h.studio.project, selectedId: h.studio.selectedId, pending: h.studio.pending, dirty: h.studio.dirty, saved: h.studio.saved, store: [...h.store] });
const callsBefore = h.calls.length;
h.button('Export shot brief').props.onClick(); h.render();
const downloaded = await h.blobs.at(-1).text();
check('actual action creates one UTF-8 Markdown Blob without requests or draft/selection/preference mutations', () => {
  assert.equal(h.calls.length, callsBefore); assert.equal(h.blobs.length, 1); assert.equal(h.blobs[0].type, 'text/markdown;charset=utf-8');
  assert.equal(JSON.stringify({ buffer: h.studio.buffer, project: h.studio.project, selectedId: h.studio.selectedId, pending: h.studio.pending, dirty: h.studio.dirty, saved: h.studio.saved, store: [...h.store] }), stateBefore);
  assert.equal(promptFrom(downloaded), 'working edit'); assert.match(downloaded, /reference.png/); assert.doesNotMatch(downloaded, /UNRELATED.png|Unrelated inspected/);
  assert.equal(h.links[0].download, 'shot-brief-current-shot.md'); assert(h.links[0].clicked && h.links[0].appended && h.links[0].removed); assert.equal(h.revoked.length, 0);
});
check('Blob cleanup is deferred until after download dispatch', () => { assert.equal(h.timers[0].delay, 60_000); h.timers[0].fn(); assert.equal(h.revoked[0], 'blob:local-1'); });

let release;
const wait = new Promise(resolve => { release = resolve; });
const saveProject = h.api.saveProject;
h.api.saveProject = async (...args) => { await wait; return saveProject(...args); };
const saving = h.studio.save(); await tick(); h.render();
h.studio.updatePrompt('  new text DURING save\n夜空\n```\n  '); h.render();
const inFlightCalls = h.calls.length, pendingBefore = h.studio.pending;
h.button('Export shot brief').props.onClick(); h.render();
const inFlightBrief = await h.blobs.at(-1).text();
check('export during a real deferred hook save uses newer edits without waiting or requesting a second save', () => {
  assert.equal(h.studio.saving, true); assert.equal(h.calls.length, inFlightCalls); assert.equal(h.studio.pending, pendingBefore); assert.equal(promptFrom(inFlightBrief), '  new text DURING save\n夜空\n```\n  '); assert.match(inFlightBrief, /Working draft — unsaved/); assert.match(inFlightBrief, /A save is in flight/);
});
release(); await saving; h.render();
check('deferred save completes normally and leaves newer exported edits dirty', () => {
  assert.equal(h.studio.saving, false); assert.equal(h.studio.dirty, true); assert.equal(h.studio.project.draft.prompt, 'working edit'); assert.equal(h.studio.selectedId, 'frame-b'); assert.equal(h.studio.project.preferredAssetId, 'frame-b');
});
await h.studio.save(); h.render();
h.button('Export shot brief').props.onClick();
const savedBrief = await h.blobs.at(-1).text();
check('export after confirmed save reports actual revision and exact prompt', () => {
  assert.match(savedBrief, new RegExp(`Saved draft — revision ${h.studio.project.revision}`)); assert.equal(promptFrom(savedBrief), h.studio.buffer.drafts.image_to_video.prompt);
});

check('header preview link targets and focuses selected-output; absent selection hides it', () => {
  h.render(); const header = nodes(h.tree).find(n => n.type === 'header' && n.props.className === 'page-header');
  const jump = nodes(header).find(n => n.type === 'a' && n.props.href === '#selected-output'); assert(jump); assert.match(text(jump), /View reference/); jump.props.onClick(); assert.equal(h.focusCalls.at(-1).id, 'selected-output');
  h.studio.setSelectedId(null); h.render(); assert(!nodes(h.tree).some(n => n.type === 'a' && n.props.href === '#selected-output'));
});
check('prepared media preview link says sample; prepared draft reference says reference', () => {
  h.studio.setSelectedId('sample-dune-flight'); h.render(); assert(nodes(h.tree).some(n => n.props?.href === '#selected-output' && text(n).includes('View sample')));
  h.studio.edit(current => ({ ...current, drafts: { ...current.drafts, image_to_video: { ...current.drafts.image_to_video, startAssetId: 'sample-dune-light' } } })); h.studio.setSelectedId('sample-dune-light'); h.render(); assert(nodes(h.tree).some(n => n.props?.href === '#selected-output' && text(n).includes('View reference')));
});
check('download exception keeps edits and offers explicit retry feedback', () => {
  h.failDownload(true); const before = JSON.stringify(h.studio.buffer), requests = h.calls.length;
  h.button('Export shot brief').props.onClick(); h.render(); assert.equal(JSON.stringify(h.studio.buffer), before); assert.equal(h.calls.length, requests); assert(nodes(h.tree).some(n => n.props?.role === 'alert' && text(n).includes('could not be downloaded'))); assert(h.links.at(-1).removed);
});

console.log(`${count} shot-brief checks passed. Controlled React/DOM/API harness; browser acceptance remains outstanding.`);
