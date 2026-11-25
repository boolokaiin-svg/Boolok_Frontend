const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/HousePlanLoadingAnimation.tsx'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;

function fixture() {
  const slots = [], effects = [], animations = [], intervals = [];
  let cursor = 0, completeCount = 0, viewCount = 0;
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, index) => value !== b[index]);
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    createContext: value => ({ Provider: 'Provider', value }), useContext: context => context.value,
    useRef: value => { const i = cursor++; return slots[i] || (slots[i] = { current: value }); },
    useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useMemo: (fn, deps) => { const i = cursor++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { value: fn(), deps }; return slots[i].value; },
    useEffect: (fn, deps) => { const i = cursor++; if (!slots[i] || changed(slots[i].deps, deps)) effects.push(() => {
      slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() };
    }); },
  };
  class Value {
    constructor(value) { this.value = value; this.listeners = new Map(); }
    setValue(value) { this.value = value; for (const listener of this.listeners.values()) listener({ value }); }
    addListener(fn) { const id = String(this.listeners.size); this.listeners.set(id, fn); return id; }
    removeListener(id) { this.listeners.delete(id); }
    interpolate() { return new Value(0); }
  }
  const animation = (kind, value, config) => {
    const entry = { kind, value, config, stopped: false, start(fn) { this.callback = fn; this.started = true; }, stop() { this.stopped = true; },
      finish() { if (value) value.setValue(config.toValue); this.callback?.({ finished: true }); } };
    animations.push(entry); return entry;
  };
  const Animated = { Value, createAnimatedComponent: name => name, View: 'AnimatedView',
    timing: (value, config) => animation('timing', value, config),
    sequence: children => ({ children }), loop: child => animation('loop', null, child),
  };
  const context = { exports: {},
    setInterval: (fn, duration) => { const timer = { fn, duration, cleared: false }; intervals.push(timer); return timer; },
    clearInterval: timer => { timer.cleared = true; },
    require: name => {
    if (name === 'react') return react;
    if (name === 'react-native') return { Animated, Easing: { linear: value => value }, Platform: { OS: 'web' },
      StyleSheet: { create: value => value, absoluteFill: {} }, useWindowDimensions: () => ({ width: 1000, height: 900 }),
      View: 'View', Text: 'Text', Pressable: 'Pressable' };
    if (name.includes('ThemeContext')) return { useTheme: () => ({ isDark: true }) };
    if (name === '@expo/vector-icons') return { MaterialIcons: 'MaterialIcons' };
    return new Proxy({ default: 'Svg', __esModule: true }, { get: (object, key) => object[key] || String(key) });
  } };
  vm.runInNewContext(source, context);
  function render(isReady) {
    cursor = 0;
    const tree = context.exports.default({ isReady, onComplete: () => completeCount++, onViewPlan: () => viewCount++ });
    while (effects.length) effects.shift()();
    return tree;
  }
  function pressables(tree) {
    if (!tree || typeof tree !== 'object') return [];
    if (Array.isArray(tree)) return tree.flatMap(pressables);
    return [...(tree.type === 'Pressable' ? [tree] : []), ...pressables(tree.props?.children)];
  }
  return { render, animations, intervals, pressables, completeCount: () => completeCount, viewCount: () => viewCount,
    unmount() { for (const slot of slots) slot?.cleanup?.(); } };
}

test('the longer animation waits at the final working scene until outputs become ready', () => {
  const f = fixture();
  f.render(false);
  const intro = f.animations.find(a => a.config?.toValue === 10.6);
  assert.equal(Math.round(intro.config.duration), 26500);
  intro.finish();
  f.render(false);
  assert.equal(f.completeCount(), 0);
  assert(!f.animations.some(a => a.config?.toValue === 12));
  const pulse = f.animations.find(a => a.kind === 'loop');
  assert(pulse.started);
  f.render(true);
  assert(pulse.stopped);
  const finish = f.animations.find(a => a.config?.toValue === 12);
  assert(finish.started);
  finish.finish();
  assert.equal(f.completeCount(), 1);
  finish.finish();
  assert.equal(f.completeCount(), 1);
});

test('view result cannot reveal placeholders while generation is pending', () => {
  const f = fixture();
  const waiting = f.pressables(f.render(false))[0];
  assert.equal(waiting.props.disabled, true);
  waiting.props.onPress();
  assert.equal(f.viewCount(), 0);
  const ready = f.pressables(f.render(true))[0];
  assert.equal(ready.props.disabled, false);
  ready.props.onPress();
  ready.props.onPress();
  assert.equal(f.viewCount(), 1);
});

test('unmount stops the scene and waiting pulse without showing an output', () => {
  const f = fixture();
  f.render(false);
  f.animations[0].finish();
  f.render(false);
  const pulse = f.animations.find(a => a.kind === 'loop');
  f.unmount();
  assert(pulse.stopped);
  assert.equal(f.completeCount(), 0);
});


function findComponent(tree, name) {
  if (!tree || typeof tree !== 'object') return null;
  if (Array.isArray(tree)) return tree.map(child => findComponent(child, name)).find(Boolean);
  if (tree.type?.name === name) return tree;
  return findComponent(tree.props?.children, name);
}

test('waiting progress sweeps continuously and messages rotate until generation is ready', () => {
  const f = fixture();
  f.render(false);
  f.animations[0].finish();
  let tree = f.render(false);
  const message = () => findComponent(tree, 'BottomCard').props.message;
  assert.equal(findComponent(tree, 'Chrome').props.waiting, true);
  assert.equal(message(), 'Getting your plan ready...');
  const sweep = f.animations.find(a => a.kind === 'loop' && a.config?.config?.duration === 1800);
  assert(sweep.started);
  assert.equal(f.intervals[0].duration, 4500);
  f.intervals[0].fn();
  tree = f.render(false);
  assert.equal(message(), 'Your design is taking shape...');
  f.intervals[0].fn();
  tree = f.render(false);
  assert.equal(message(), 'Preparing your previews...');
  assert.equal(f.completeCount(), 0);
  tree = f.render(true);
  assert.equal(findComponent(tree, 'Chrome').props.waiting, false);
  assert(sweep.stopped);
  assert(f.intervals[0].cleared);
});
