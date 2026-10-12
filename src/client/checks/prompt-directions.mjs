// Actual MotionDirections + StudioView callback + movement-edit implementation.
// React hooks, editor buffer, and preview child are controlled; no browser, network,
// provider, persistence, native keyboard, or preview-animation acceptance is claimed.
// Run from the repository root: node src/client/checks/prompt-directions.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url), ts = require('typescript'), root = process.cwd();
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const text = node => node == null || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const freeze = value => { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object' && !Object.isFrozen(child)) freeze(child); return value; };
const initialPrompt = '  Café — 夜空 🎞️\r\n```\nKeep this exact movement.\n雪\n  ';
const reference = freeze({ id: 'frame-a', projectId: 'project-a', title: 'Active draft reference', kind: 'image', source: 'upload', fileName: 'frame.png', mediaUrl: '/frame.png', downloadUrl: '/frame.png', posterUrl: null, attribution: null, mimeType: 'image/png', width: 512, height: 768, durationSeconds: null, byteSize: 1000, sourceJobId: null, createdAt: '2026-10-12T20:00:00Z' });

function harness(prompt = initialPrompt) {
  let buffer = freeze({ title: 'Keep the title', operation: 'image_to_video', drafts: {
    text_to_image: { operation: 'text_to_image', prompt: 'Keep the inactive image draft.', presetId: 'image-preset', parentAssetId: 'image-parent' },
    image_to_video: { operation: 'image_to_video', prompt, presetId: 'motion-preset', parentAssetId: 'motion-parent', startAssetId: reference.id },
  } });
  const initialBuffer = buffer;
  const calls = [], cache = new Map();
  const studioState = {
    loading: false, expired: false, conflict: false, uploading: false, saving: false,
    project: { id: 'project-a', preferredAssetId: null }, assets: [reference], jobs: [], sourceJobs: [],
    selectedId: null, dirty: false, saved: false,
    capabilities: { liveGeneration: { enabled: false, remainingMicroUsd: 0, reason: 'disabled' } },
    edit(update) { calls.push(['edit']); buffer = freeze(update(buffer)); studioState.dirty = true; },
    updatePrompt(value) { buffer = freeze({ ...buffer, drafts: { ...buffer.drafts, [buffer.operation]: { ...buffer.drafts[buffer.operation], prompt: value } } }); },
    save() { throw new Error('Unexpected save'); }, submit() { throw new Error('Unexpected generation'); },
    upload() { throw new Error('Unexpected upload'); },
  };
  let active, slot, nextId = 0, outerTree, tree, componentProps, childKey, childBag;
  const outerBag = { slots: [] }, wrapperBag = { slots: [] };
  const React = {
    useState(initial) {
      const bag = active, i = slot++;
      if (!(i in bag.slots)) bag.slots[i] = typeof initial === 'function' ? initial() : initial;
      return [bag.slots[i], value => { const next = typeof value === 'function' ? value(bag.slots[i]) : value; if (!Object.is(next, bag.slots[i])) { bag.slots[i] = next; bag.dirty = true; } }];
    },
    useRef(initial) { const i = slot++; return active.slots[i] ||= { current: initial }; },
    useId() { const i = slot++; return active.slots[i] ||= `controlled-${++nextId}`; },
    useCallback(fn, deps) { const i = slot++, old = active.slots[i]; if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) active.slots[i] = { fn, deps }; return active.slots[i].fn; },
    useEffect(fn, deps) {
      const bag = active, i = slot++, old = bag.slots[i];
      if (!old || !deps || deps.some((v, j) => !Object.is(v, old.deps[j]))) {
        bag.effects.push(() => { old?.cleanup?.(); bag.slots[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  function cleanup(bag) { for (const value of bag?.slots || []) value?.cleanup?.(); }
  function run(Component, props, bag) {
    let output;
    for (let i = 0; i < 10; i++) {
      active = bag; slot = 0; bag.dirty = false; bag.effects = [];
      output = Component(props);
      for (const effect of bag.effects) effect();
      if (!bag.dirty) return output;
    }
    throw new Error('Controlled hook render did not settle');
  }
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const mod = { exports: {} }; cache.set(filename, mod.exports);
    const localRequire = name => {
      if (name === 'react') return React;
      if (name === 'react/jsx-runtime') return { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }), Fragment: 'fragment' };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => key });
      if (name === './CameraStudyPreview') return { CameraStudyPreview: 'CameraStudyPreview' };
      if (name === './AppShell') return { AppShell: 'AppShell' };
      if (name === './AssetMedia') return { AssetMedia: 'AssetMedia', Attribution: 'Attribution', mediaFacts: () => '' };
      if (name === './AssetDetails') return { AssetDetails: 'AssetDetails' };
      if (name === '@/src/client/use-studio') return { useStudio: () => ({ ...studioState, buffer }), activeJob: () => false };
      if (name.startsWith('.') || name.startsWith('@/')) {
        const base = name.startsWith('@/') ? name.slice(2) : path.relative(root, path.resolve(path.dirname(filename), name));
        return load(base + (fs.existsSync(path.join(root, base + '.ts')) ? '.ts' : '.tsx'));
      }
      return require(name);
    };
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { console, URLSearchParams, window: { location: { search: '' } } }, { filename })(localRequire, mod, mod.exports);
    return mod.exports;
  }
  const MotionDirections = load('components/studio/MotionDirections.tsx').MotionDirections;
  const StudioView = load('components/studio/StudioView.tsx').StudioView;
  function render() {
    outerTree = run(StudioView, {}, outerBag);
    const child = nodes(outerTree).find(node => node.type === MotionDirections);
    componentProps = child?.props;
    if (!child) { cleanup(childBag); childBag = undefined; childKey = undefined; tree = null; return tree; }
    const inner = run(MotionDirections, child.props, wrapperBag);
    const key = `${child.key}/${inner.key}`;
    if (!childBag || key !== childKey) { cleanup(childBag); childBag = { slots: [] }; childKey = key; }
    tree = run(inner.type, inner.props, childBag);
    return tree;
  }
  render();
  return {
    render, calls, load, studioState, initialBuffer,
    get buffer() { return buffer; }, get tree() { return tree; }, get props() { return componentProps; },
    button(label) { const node = nodes(tree).find(n => n.type === 'button' && text(n) === label); assert(node, `Missing ${label}`); return node; },
    proposal() { return nodes(tree).find(n => n.type === 'textarea'); },
    choose(id) { nodes(tree).find(n => n.type === 'input' && n.props.value === id).props.onChange(); render(); },
    wording(value) { this.proposal().props.onChange({ target: { value } }); render(); },
    toggle(open) { tree.props.onToggle({ currentTarget: { open } }); render(); },
    type(value, commit = true) { studioState.updatePrompt(value); if (commit) render(); },
    changeDraft(patch) { buffer = freeze({ ...buffer, drafts: { ...buffer.drafts, image_to_video: { ...buffer.drafts.image_to_video, ...patch } } }); render(); },
    switchTask(operation) { buffer = freeze({ ...buffer, operation }); render(); },
    title(value) { buffer = freeze({ ...buffer, title: value }); render(); },
    apply() { this.button('Replace movement text').props.onClick(); render(); },
    undo() { this.button('Undo replacement').props.onClick(); render(); },
    preview() { return nodes(tree).find(n => n.type === 'CameraStudyPreview'); },
  };
}

let count = 0;
const check = (name, fn) => { fn(); count++; console.log('PASS ' + name); };
const base = harness();
const { CAMERA_DIRECTIONS, movementTextLength, retainPromptReplacement } = base.load('src/client/prompt-directions.ts');

check('catalog contains only the three agreed deterministic direction ideas', () => {
  assert.equal(CAMERA_DIRECTIONS.map(option => `${option.id}:${option.label}`).join('|'), 'push-in:Push in|pan:Pan across frame|locked:Locked frame');
  for (const option of CAMERA_DIRECTIONS) assert(movementTextLength(option.prompt) > 0 && movementTextLength(option.prompt) <= 2500);
});
check('code-point counting preserves astral characters and counts newlines without trimming', () => {
  assert.equal(movementTextLength('🎬'.repeat(2500)), 2500);
  assert.equal(movementTextLength('  雪\r\n🎬  '), 8);
});
check('discarded undo history does not revive when text returns to the applied value', () => {
  const history = { contextKey: 'a', before: initialPrompt, after: 'applied' };
  assert.equal(retainPromptReplacement(history, 'a', 'applied'), history);
  assert.equal(retainPromptReplacement(history, 'b', 'applied'), null);
  const discarded = retainPromptReplacement(history, 'a', 'typed');
  assert.equal(retainPromptReplacement(discarded, 'a', 'applied'), null);
});
check('native disclosure starts collapsed, labels are explicit, and preview receives active reference and closed state', () => {
  assert.equal(base.tree.type, 'details'); assert.equal(base.tree.props.open, false);
  assert.equal(text(nodes(base.tree).find(n => n.type === 'summary')), 'Camera direction ideas');
  assert.equal(nodes(base.tree).filter(n => n.type === 'input' && n.props.type === 'radio').length, 3);
  assert.equal(base.preview().props.reference, reference);
  assert.equal(base.preview().props.contextKey, base.props.contextKey);
  assert.equal(base.preview().props.open, false);
  assert.equal(base.proposal().props.maxLength, undefined);
  assert.equal(base.button('Replace movement text').props.type, 'button');
  assert.equal(base.button('Undo replacement').props.type, 'button');
  assert.equal(base.button('Undo replacement').props.disabled, true);
  assert.match(text(base.tree), /Prepared writing suggestions/); assert.match(text(base.tree), /do not guarantee camera control/);
});
check('opening, all selections, and proposal edits do not mutate the draft or call its callback', () => {
  const h = harness(); const before = h.buffer;
  h.toggle(true); assert.equal(h.preview().props.open, true);
  for (const option of CAMERA_DIRECTIONS) {
    h.choose(option.id); assert.equal(h.proposal().props.value, option.prompt);
    assert.equal(h.preview().props.direction, option.id);
  }
  h.wording('  My own wording\n雪 🎬  ');
  assert.equal(h.buffer, before); assert.equal(h.calls.length, 0);
  h.toggle(false); assert.equal(h.preview().props.open, false); assert.equal(h.buffer, before);
});
check('explicit replacement uses exactly the displayed editable wording and changes only the active movement prompt', () => {
  const h = harness(), before = h.buffer, proposal = '  Pan left.\r\n雪 🎬\n  ';
  h.wording(proposal); h.apply();
  assert.equal(h.buffer.drafts.image_to_video.prompt, proposal);
  assert.equal(h.buffer.title, before.title); assert.equal(h.buffer.operation, before.operation);
  assert.equal(h.buffer.drafts.text_to_image, before.drafts.text_to_image);
  for (const field of ['startAssetId', 'parentAssetId', 'presetId']) assert.equal(h.buffer.drafts.image_to_video[field], before.drafts.image_to_video[field]);
  assert.equal(before.drafts.image_to_video.prompt, initialPrompt);
  assert.equal(h.button('Undo replacement').props.disabled, false);
  assert.equal(h.calls.length, 1);
});
check('Undo restores Unicode, CRLF, multiline, blank and whitespace-only originals exactly', () => {
  for (const original of [initialPrompt, '', ' \n\t  ', '👩🏽‍🚀 e\u0301 café\n\n']) {
    const h = harness(original); h.apply(); h.undo();
    assert.equal(h.buffer.drafts.image_to_video.prompt, original);
    assert.equal(h.button('Undo replacement').props.disabled, true);
    assert.match(text(h.tree), /Previous movement text restored/);
  }
});
check('replacement captures latest callback buffer before text, even when rendered prompt prop is stale', () => {
  const h = harness(); const newer = '  Latest unrendered movement\n🎬 雪  ';
  h.type(newer, false); assert.equal(h.props.prompt, initialPrompt);
  h.apply(); h.undo(); assert.equal(h.buffer.drafts.image_to_video.prompt, newer);
});
check('typing invalidates Undo permanently, including a return to the replacement text', () => {
  const h = harness(); h.apply(); const applied = h.buffer.drafts.image_to_video.prompt;
  h.type('A later edit'); assert.equal(h.button('Undo replacement').props.disabled, true);
  h.type(applied); assert.equal(h.button('Undo replacement').props.disabled, true);
  const calls = h.calls.length; h.undo(); assert.equal(h.calls.length, calls);
  assert.equal(h.buffer.drafts.image_to_video.prompt, applied);
});
check('atomic expected-current guard rejects an edit after render without losing it', () => {
  const h = harness(); h.apply();
  h.type('Typed after render', false); h.undo();
  assert.equal(h.buffer.drafts.image_to_video.prompt, 'Typed after render');
  assert.equal(h.button('Undo replacement').props.disabled, true);
  assert.match(text(h.tree), /Undo is no longer available/);
});
check('a newer replacement supersedes the earlier undo record', () => {
  const h = harness(); h.apply(); const first = h.buffer.drafts.image_to_video.prompt;
  h.choose('pan'); h.apply(); h.undo();
  assert.equal(h.buffer.drafts.image_to_video.prompt, first);
  assert.equal(h.button('Undo replacement').props.disabled, true);
});
check('replacing identical text creates no new undo history', () => {
  const h = harness(CAMERA_DIRECTIONS[0].prompt); h.apply();
  assert.equal(h.button('Undo replacement').props.disabled, true);
  assert.match(text(h.tree), /already matches/);
});
check('title changes preserve the open helper, proposal, and valid Undo', () => {
  const h = harness(); h.toggle(true); h.choose('pan'); h.apply();
  h.title('A new title'); assert.equal(h.tree.props.open, true);
  assert.equal(h.preview().props.direction, 'pan'); assert.equal(h.button('Undo replacement').props.disabled, false);
  h.undo(); assert.equal(h.buffer.title, 'A new title'); assert.equal(h.buffer.drafts.image_to_video.prompt, initialPrompt);
});
for (const field of ['startAssetId', 'parentAssetId', 'presetId']) check(`${field} context changes reset local state and reject old callbacks`, () => {
  const h = harness(); h.toggle(true); h.choose('pan'); h.apply();
  const oldUndo = h.button('Undo replacement').props.onClick;
  h.changeDraft({ [field]: 'new-value' }); const current = h.buffer;
  assert.equal(h.tree.props.open, false); assert.equal(h.preview().props.direction, 'push-in');
  assert.equal(h.button('Undo replacement').props.disabled, true);
  oldUndo(); assert.equal(h.buffer, current);
});
check('task unmount and return start collapsed with no old Undo', () => {
  const h = harness(); h.toggle(true); h.apply(); const current = h.buffer.drafts.image_to_video.prompt;
  h.switchTask('text_to_image'); assert.equal(h.tree, null);
  h.switchTask('image_to_video'); assert.equal(h.tree.props.open, false);
  assert.equal(h.button('Undo replacement').props.disabled, true);
  assert.equal(h.buffer.drafts.image_to_video.prompt, current);
});
check('project identity changes reset local state', () => {
  const h = harness(); h.toggle(true); h.apply();
  h.studioState.project = { id: 'project-b', preferredAssetId: null }; h.render();
  assert.equal(h.tree.props.open, false); assert.equal(h.button('Undo replacement').props.disabled, true);
});
check('exactly 2500 code points apply and undo; 2501 remain visible and never reach callback', () => {
  const h = harness(); const allowed = '🎬'.repeat(2500), rejected = allowed + '雪';
  h.wording(allowed); assert.equal(h.button('Replace movement text').props.disabled, false);
  h.apply(); assert.equal(h.buffer.drafts.image_to_video.prompt, allowed); h.undo();
  assert.equal(h.buffer.drafts.image_to_video.prompt, initialPrompt);
  h.wording(rejected); const before = h.buffer, calls = h.calls.length;
  assert.equal(h.proposal().props.value, rejected); assert.equal(h.proposal().props['aria-invalid'], true);
  assert.equal(h.button('Replace movement text').props.disabled, true);
  h.apply(); assert.equal(h.buffer, before); assert.equal(h.calls.length, calls);
  assert.match(text(h.tree), /Nothing was replaced/);
});
check('rejected apply keeps proposal and current draft intact with explicit feedback', () => {
  const h = harness(); const before = h.buffer, proposal = h.proposal().props.value;
  h.studioState.conflict = true; h.render();
  assert.equal(h.button('Replace movement text').props.disabled, true);
  h.apply(); assert.equal(h.buffer, before); assert.equal(h.calls.length, 0);
  assert.equal(h.proposal().props.value, proposal);
  h.studioState.conflict = false; h.render();
  const oldApply = h.button('Replace movement text').props.onClick;
  // The root callback sees the latest buffer even if the component has not re-rendered.
  h.studioState.edit(current => ({ ...current, operation: 'text_to_image' }));
  oldApply(); h.render(); assert.equal(h.buffer.drafts.image_to_video.prompt, initialPrompt);
});
check('oversize original remains intact until it can be replaced with a valid exact Undo', () => {
  const original = '🎬'.repeat(2501), h = harness(original);
  assert.equal(h.button('Replace movement text').props.disabled, true);
  h.apply(); assert.equal(h.buffer.drafts.image_to_video.prompt, original);
  assert.equal(h.calls.length, 0);
  assert.match(text(h.tree), /so Undo can restore the full draft/);
});
check('root rejects an oversized latest original even when its prompt prop has not rendered yet', () => {
  const h = harness(), original = '🎬'.repeat(2501);
  h.type(original, false);
  h.apply();
  assert(h.buffer.drafts.image_to_video.prompt === original, 'Root must reject an oversized latest before value so it cannot replace a draft that Undo would reject.');
  assert.match(text(h.tree), /could not be replaced/);
});

console.log(`\n${count} prompt-direction checks passed. Controlled React/editor boundary; browser and persistence acceptance remain with root.`);
