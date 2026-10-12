// Execute the actual TSX with controlled hooks, image events, media queries and time.
// These checks do not claim browser rendering, image decoding, or animation smoothness.
// Run: node src/client/checks/camera-study.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), ts = require('typescript');
const source = fs.readFileSync('components/studio/CameraStudyPreview.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const reference = Object.freeze({ id: 'actual-draft-frame', kind: 'image', mediaUrl: '/api/assets/draft/media', title: 'Evening light', fileName: 'frame.png' });
const nodes = value => !value || typeof value !== 'object' ? [] : Array.isArray(value) ? value.flatMap(nodes) : [value, ...nodes(value.props?.children)];
const textOf = value => value == null || typeof value === 'boolean' ? '' : typeof value !== 'object' ? String(value) : Array.isArray(value) ? value.map(textOf).join('') : textOf(value.props?.children);
const changed = (before, after) => !before || !after || before.length !== after.length || after.some((value, i) => !Object.is(value, before[i]));

function harness(overrides = {}, { reduced = false, cached = false, animate = true } = {}) {
  let props = { reference, direction: 'push-in', contextKey: 'project:motion:frame', open: true, ...overrides };
  let cursor = 0, dirty = false, tree, now = 0, nextTimer = 0, unmounted = false, srcWrites = 0, imageMounts = 0, attachedRef;
  const slots = [], layouts = [], effects = [], timers = new Map(), allTimers = new Map(), animations = [], documentListeners = new Map(), preferenceListeners = new Set();
  const preference = { matches: reduced, addEventListener(type, listener) { assert.equal(type, 'change'); preferenceListeners.add(listener); }, removeEventListener(type, listener) { assert.equal(type, 'change'); preferenceListeners.delete(listener); } };
  const document = { baseURI: 'http://local.test/studio', hidden: false, addEventListener(type, listener) { documentListeners.set(type, listener); }, removeEventListener(type, listener) { if (documentListeners.get(type) === listener) documentListeners.delete(type); } };
  const image = { src: '', currentSrc: '', complete: false, naturalWidth: 0, style: {},
    animate: animate ? (frames, options) => { const animation = { frames, options, cancelled: 0, cancel() { this.cancelled++; } }; animations.push(animation); return animation; } : undefined };
  const effectHook = queue => (fn, deps) => {
    const index = cursor++, previous = slots[index];
    if (changed(previous?.deps, deps)) queue.push(() => { previous?.cleanup?.(); const next = { deps }; slots[index] = next; next.cleanup = fn(); });
  };
  const React = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { assert.equal(unmounted, false, 'no state update after unmount'); const next = typeof value === 'function' ? value(slots[index]) : value; if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; } }]; },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useCallback(fn, deps) { const index = cursor++; if (changed(slots[index]?.deps, deps)) slots[index] = { deps, fn }; return slots[index].fn; },
    useLayoutEffect: effectHook(layouts), useEffect: effectHook(effects),
  };
  const mod = { exports: {} };
  const runtimeRequire = name => {
    if (name === 'react') return React;
    if (name === 'react/jsx-runtime') return { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
    throw new Error('Unexpected runtime dependency: ' + name);
  };
  vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`, {
    URL, document, window: { matchMedia(query) { assert.equal(query, '(prefers-reduced-motion: reduce)'); return preference; } },
    setTimeout(callback, duration) { const id = ++nextTimer, entry = { callback, due: now + duration, duration }; timers.set(id, entry); allTimers.set(id, entry); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch() { throw new Error('Network calls forbidden'); },
  }, { filename: 'CameraStudyPreview.tsx' })(runtimeRequire, mod, mod.exports);
  const Component = mod.exports.CameraStudyPreview;
  function render() {
    let passes = 0;
    do {
      assert(++passes < 20, 'render settles'); dirty = false; cursor = 0; tree = Component(props);
      const element = nodes(tree).find(node => node.type === 'img');
      if (element) {
        if (!element.props.ref.current) imageMounts++;
        element.props.ref.current = image;
        attachedRef = element.props.ref;
        const nextSrc = new URL(element.props.src, document.baseURI).href;
        if (image.src !== nextSrc) {
          srcWrites++; image.src = nextSrc; image.currentSrc = nextSrc; image.complete = cached; image.naturalWidth = cached ? 800 : 0;
        }
        image.style = { ...element.props.style };
      } else if (attachedRef) {
        attachedRef.current = null; attachedRef = undefined;
        image.src = ''; image.currentSrc = ''; image.complete = false; image.naturalWidth = 0;
      }
      while (layouts.length) layouts.shift()();
      while (effects.length) effects.shift()();
    } while (dirty);
    return tree;
  }
  function button(label) { const result = nodes(tree).find(node => node.type === 'button' && textOf(node) === label); assert(result, 'button exists: ' + label); return result; }
  function click(label) { const node = button(label); assert.equal(node.props.disabled, false, label + ' enabled'); node.props.onClick(); render(); }
  function img() { return nodes(tree).find(node => node.type === 'img'); }
  function load() { image.complete = true; image.naturalWidth = 800; image.currentSrc = image.src; img().props.onLoad({ currentTarget: image }); render(); }
  render();
  return {
    render, button, click, img, load, image, animations, timers, allTimers, preference, document,
    get tree() { return tree; }, get text() { return textOf(tree); }, get srcWrites() { return srcWrites; }, get imageMounts() { return imageMounts; },
    get listenerCount() { return preferenceListeners.size + documentListeners.size; },
    update(patch) { props = { ...props, ...patch }; render(); },
    advance(ms) { now += ms; for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback(); } render(); },
    reduce(value, dispatch = true) { preference.matches = value; if (dispatch) for (const listener of preferenceListeners) listener(); render(); },
    hide(value = true) { document.hidden = value; documentListeners.get('visibilitychange')?.(); render(); },
    error() { image.complete = true; image.naturalWidth = 0; image.currentSrc = image.src; img().props.onError({ currentTarget: image }); render(); },
    unmount() { for (const slot of slots) slot?.cleanup?.(); unmounted = true; },
  };
}

let count = 0;
function check(name, fn) { fn(); count++; console.log('PASS ' + name); }
function playing(h) { assert.equal(h.tree.props['data-playing'], true); assert.equal(h.button('Stop').props.disabled, false); }
function idle(h) { assert.equal(h.tree.props['data-playing'], false); assert.equal(h.timers.size, 0); }
function ready(overrides, options) { const h = harness(overrides, options); h.load(); return h; }

check('missing and non-image references cannot play or substitute a sample', () => {
  for (const value of [undefined, { ...reference, kind: 'video' }]) {
    const h = harness({ reference: value }); assert.equal(h.img(), undefined); assert.match(h.text, /No start frame/); assert.equal(h.button('Play').props.disabled, true); idle(h);
  }
});
check('load, ready and error are distinct; exact disclosure is persistent', () => {
  const h = harness(); assert.match(h.text, /Loading your reference image/); assert.equal(h.button('Play').props.disabled, true);
  h.load(); assert.equal(h.button('Play').props.disabled, false); assert.equal(h.animations.length, 0); idle(h);
  h.error(); assert.match(h.text, /could not be loaded/); assert.equal(h.button('Play').props.disabled, true);
  assert.match(h.text, /Camera study · 5 seconds/); assert.match(h.text, /Local movement of your reference image\. This is not an AI-generated video\./);
  assert.equal(h.img().props.alt, 'Reference image: Evening light');
});
check('cached completion is recognized without requiring a later load event', () => {
  const h = harness({}, { cached: true }); assert.equal(h.button('Play').props.disabled, false); idle(h);
});
check('removing then restoring the same reference requires its new image node to load', () => {
  const h = ready(); h.update({ reference: undefined }); h.update({ reference });
  assert.match(h.text, /Loading your reference image/); assert.equal(h.button('Play').props.disabled, true);
  h.load(); assert.equal(h.button('Play').props.disabled, false); assert.equal(h.imageMounts, 2);
});
check('one five-second run completes without animationend; replay preserves node and URL', () => {
  const h = ready(), node = h.image, original = JSON.stringify(reference);
  const initial = h.button('Play'); initial.props.onClick(); initial.props.onClick(); h.render();
  playing(h); assert.equal(h.timers.size, 1); assert.equal(h.animations.length, 1);
  assert.equal([...h.timers.values()][0].duration, 5000); assert.equal(h.animations[0].options.iterations, 1);
  h.advance(4999); playing(h); h.advance(1); idle(h); assert.match(h.text, /study finished/); assert.equal(h.animations[0].cancelled, 1);
  assert.equal(h.image.style.transform, 'scale(1.06)'); h.advance(20000); assert.equal(h.animations.length, 1);
  h.click('Replay'); playing(h); assert.equal(h.animations.length, 2); assert.equal(h.image, node); assert.equal(h.srcWrites, 1); assert.equal(h.imageMounts, 1); assert.equal(h.img().key, undefined); assert.equal(JSON.stringify(reference), original);
});
check('Stop cancels immediately, resets framing and allows explicit Replay', () => {
  const h = ready(); h.click('Play'); const late = [...h.allTimers.values()][0].callback;
  h.advance(1200); h.click('Stop'); idle(h); assert.equal(h.image.style.transform, 'scale(1)'); assert.equal(h.animations[0].cancelled, 1);
  late(); h.render(); assert.match(h.text, /study stopped/); h.click('Replay'); playing(h); assert.equal(h.srcWrites, 1);
});
check('pan is enlarged and bounded; locked study has no animation and ends after five seconds', () => {
  const h = ready({ direction: 'pan' }); h.click('Play'); assert.deepEqual(JSON.parse(JSON.stringify(h.animations[0].frames)), [{ transform: 'translateX(-2%) scale(1.08)' }, { transform: 'translateX(2%) scale(1.08)' }]);
  h.update({ direction: 'locked' }); idle(h); assert.equal(h.image.style.transform, 'none'); h.click('Play'); playing(h); assert.equal(h.animations.length, 1); h.advance(5000); idle(h); assert.equal(h.image.style.transform, 'none');
});
check('context, task, direction, reference identity and close invalidate runs and late timers', () => {
  for (const patch of [{ contextKey: 'other-project:motion:frame' }, { contextKey: 'project:image:frame' }, { direction: 'pan' }, { reference: { ...reference, id: 'different-id-same-url' } }, { open: false }]) {
    const h = ready(); h.click('Play'); const late = [...h.allTimers.values()][0].callback; h.update(patch); idle(h); assert.equal(h.animations[0].cancelled, 1);
    late(); h.render(); idle(h); assert.doesNotMatch(h.text, /study finished/); h.update({ open: true }); assert.equal(h.button('Play').props.disabled, false); assert.equal(h.srcWrites, 1);
  }
});
check('unchanged parent props do not interrupt a running study', () => {
  const h = ready(); h.click('Play'); h.update({ reference: { ...reference } }); playing(h); assert.equal(h.animations[0].cancelled, 0); assert.equal(h.timers.size, 1);
});
check('new reference URL requires a new load; old handler and old currentSrc events are ignored', () => {
  const h = ready(), oldLoad = h.img().props.onLoad, oldError = h.img().props.onError, oldSrc = h.image.src;
  h.click('Play'); h.update({ reference: { ...reference, mediaUrl: '/api/assets/next/media' } }); idle(h); assert.equal(h.button('Play').props.disabled, true);
  h.image.complete = true; h.image.naturalWidth = 800; h.image.currentSrc = oldSrc;
  oldLoad({ currentTarget: h.image }); h.img().props.onLoad({ currentTarget: h.image }); h.render(); assert.equal(h.button('Play').props.disabled, true);
  h.image.naturalWidth = 0; oldError({ currentTarget: h.image }); h.img().props.onError({ currentTarget: h.image }); h.render(); assert.match(h.text, /Loading your reference image/);
  h.load(); assert.equal(h.button('Play').props.disabled, false); assert.equal(h.srcWrites, 2); assert.equal(h.imageMounts, 1);
});
check('page hiding cancels and showing the page never resumes automatically', () => {
  const h = ready(); h.click('Play'); h.hide(); idle(h); h.hide(false); idle(h); assert.equal(h.animations.length, 1); h.click('Play'); playing(h);
});
check('hidden document refuses a saved click handler', () => {
  const h = ready(); h.document.hidden = true; h.button('Play').props.onClick(); h.render(); idle(h); assert.equal(h.animations.length, 0);
});
check('initial reduced motion remains still with disabled Play and an explanation', () => {
  const h = ready({ direction: 'pan' }, { reduced: true }); assert.equal(h.button('Play').props.disabled, true); assert.equal(h.image.style.transform, 'none'); assert.match(h.text, /Reduced motion is on/); idle(h); assert.equal(h.animations.length, 0);
});
check('live reduced-motion changes cancel playback; turning it off requires a new Play', () => {
  const h = ready(); h.click('Play'); h.reduce(true); idle(h); assert.equal(h.animations[0].cancelled, 1); assert.equal(h.image.style.transform, 'none'); assert.equal(h.button('Play').props.disabled, true);
  h.reduce(false); idle(h); assert.equal(h.button('Play').props.disabled, false); assert.equal(h.animations.length, 1); h.click('Play'); playing(h);
});
check('synchronous preference guard closes the change-event race', () => {
  const h = ready(); h.reduce(true, false); h.button('Play').props.onClick(); h.render(); idle(h); assert.equal(h.animations.length, 0); assert.equal(h.button('Play').props.disabled, true);
});
check('image error during playback cancels and disables further play', () => {
  const h = ready(); h.click('Play'); h.error(); idle(h); assert.equal(h.animations[0].cancelled, 1); assert.equal(h.button('Play').props.disabled, true);
});
check('unavailable animation API never leaves playback running', () => {
  const h = ready({}, { animate: false }); h.click('Play'); idle(h); assert.match(h.text, /unavailable in this browser/); assert.equal(h.button('Play').props.disabled, true);
});
check('unmount cleans timers, animation and both listeners; late callbacks do nothing', () => {
  const h = ready(); assert.equal(h.listenerCount, 2); h.click('Play'); const late = [...h.allTimers.values()][0].callback;
  h.unmount(); assert.equal(h.timers.size, 0); assert.equal(h.listenerCount, 0); assert.equal(h.animations[0].cancelled, 1); late();
});
console.log(`${count} camera-study checks passed. Controlled source harness; no browser, network, provider, draft, asset or job writes.`);
