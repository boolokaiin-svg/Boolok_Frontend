const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Run the production callbacks without importing native UI modules.
const screen = fs.readFileSync(path.join(__dirname, '../app/(app)/blueprint.tsx'), 'utf8');
const tree = ts.createSourceFile('blueprint.tsx', screen, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['executeGeneration', 'retrySingleView'].includes(node.name.getText(tree))) declarations.push(`const ${node.getText(tree)};`);
  ts.forEachChild(node, visit);
}
visit(tree);
const callbacks = ts.transpileModule(declarations.join('\n') + '\nglobalThis.execute = executeGeneration; globalThis.retry = retrySingleView;',
  { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;

function fixture({ source = null, mode = '3d', response, fail = false } = {}) {
  const calls = [], alerts = [], states = {}, snapshots = [];
  const form = { plotWidth: 30, plotDepth: 40 };
  const context = {
    useCallback: fn => fn, isAiGenerating: false, form, outputMode: mode, openAiKey: 'fixture',
    source2dRef: { current: source === true ? { url: '/uploads/blueprints/plan_2d_fixture.png', form: JSON.stringify(form) } : source },
    activeRequestIdRef: { current: 0 }, historySaveVersion: { current: 0 }, pendingHistoryRef: { current: null },
    animationSkippedRef: { current: true }, generationDoneRef: { current: false }, scrollRef: { current: { scrollTo() {} } },
    buildJson: () => ({ plot: { width: 30, depth: 40 } }), getStoredToken: async () => 'token',
    saveBlueprint: async (token, snapshot) => snapshots.push(snapshot), API_BASE_URL: 'https://api.test', DEFAULT_UNIVERSAL_PROMPT: 'COMBINED',
    resolveImageUrl: value => value ? `https://api.test${value}` : null,
    Image: { prefetch: async () => true },
    Alert: { alert: (...args) => alerts.push(args) }, router: { push() {} }, console: { error() {} },
    fetch: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      if (fail) throw Error('Network failure');
      return { ok: true, json: async () => response || ({ success: true, complete: true,
        sourcePlan2dUrl: '/uploads/blueprints/plan_2d_fixture.png', plan2dUrl: '/uploads/blueprints/plan_2d_fixture.png', plan3dUrl: '/uploads/blueprints/plan_3d_fixture.png' }) };
    },
  };
  for (const name of screen.match(/\bset[A-Z]\w+/g)) context[name] = value => { states[name] = value; };
  vm.createContext(context);
  vm.runInContext(callbacks, context);
  return { context, calls, alerts, states, snapshots };
}

for (const source of [null, { url: '/old.png', form: JSON.stringify({ plotWidth: 40 }) }]) {
  test(`3D warns before network calls when 2D is ${source ? 'outdated' : 'missing'}`, async () => {
    const f = fixture({ source });
    await f.context.execute();
    assert.equal(f.calls.length, 0);
    assert.equal(f.alerts[0][0], '2D Plan Required');
    assert.match(f.states.setAiGenError, /current project details first/);
    assert.equal(f.states.setIsGenerating, undefined);
  });
}

test('3D retry sends the existing 2D source and saves both images together', async () => {
  const f = fixture({ source: true });
  await f.context.retry('3d');
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].body.mode, '3d');
  assert.equal(f.calls[0].body.sourcePlan2dUrl, '/uploads/blueprints/plan_2d_fixture.png');
  assert(!('customPrompt' in f.calls[0].body));
  assert.equal(f.states.setPlan2dUrl, 'https://api.test/uploads/blueprints/plan_2d_fixture.png');
  assert.equal(f.snapshots.length, 1);
  assert(f.snapshots[0].plan2dUrl && f.snapshots[0].plan3dUrl);
});

test('Both sends its combined prompt and retains the returned 2D source', async () => {
  const f = fixture({ mode: 'both' });
  await f.context.execute();
  assert.equal(f.calls[0].body.customPrompt, 'COMBINED');
  assert.equal(f.context.source2dRef.current.url, '/uploads/blueprints/plan_2d_fixture.png');
});

test('network failure never substitutes an independently generated local layout', async () => {
  const f = fixture({ source: true, fail: true });
  await f.context.retry('3d');
  assert.equal(f.calls.length, 1);
  assert.match(f.states.setAiGenError, /Network failure/);
  assert.equal(f.states.setPlan3dUrl, null);
  assert.equal(f.states.setPlan2dUrl, undefined);
  assert(f.context.source2dRef.current);
  assert.equal(f.snapshots.length, 0);
});

test('conversion failure warns, keeps 2D, and saves no missing 3D', async () => {
  const f = fixture({ mode: 'both', response: { success: true, complete: false,
    sourcePlan2dUrl: '/uploads/blueprints/plan_2d_fixture.png', plan2dUrl: '/uploads/blueprints/plan_2d_fixture.png',
    plan3dUrl: null, warning: '3D conversion failed. Your 2D plan is preserved.' } });
  await f.context.execute();
  assert.equal(f.alerts[0][0], '3D Conversion Incomplete');
  assert.match(f.states.setPlan3dError, /conversion failed/);
  assert.equal(f.states.setPlan3dUrl, null);
  assert(f.context.source2dRef.current);
  assert.equal(f.snapshots[0].plan3dUrl, null);
});

test('Generate 3D switches the visible panel immediately while preserving 2D during the request', async () => {
  const f = fixture({ source: true, mode: '2d' });
  const fetchResponse = f.context.fetch;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  f.context.fetch = async (...args) => { await gate; return fetchResponse(...args); };
  const pending = f.context.execute('3d');
  assert.equal(f.states.setOutputMode, '3d');
  assert.equal(f.states.setSubmitted, true);
  assert.equal(f.states.setIsGenerating, false);
  assert.equal(f.states.setIsAiGenerating, true);
  assert.equal(f.states.setPlan2dUrl, undefined);
  assert(f.context.source2dRef.current);
  release();
  await pending;
  assert.equal(f.states.setIsAiGenerating, false);
  assert.equal(f.states.setPlan3dUrl, 'https://api.test/uploads/blueprints/plan_3d_fixture.png');
});

test('3D request failure leaves the result page open with a visible error and its 2D reference', async () => {
  const f = fixture({ source: true, mode: '2d', fail: true });
  await f.context.execute('3d');
  assert.equal(f.states.setSubmitted, true);
  assert.equal(f.states.setOutputMode, '3d');
  assert.equal(f.states.setIsAiGenerating, false);
  assert.match(f.states.setPlan3dError, /Network failure/);
  assert.equal(f.states.setPlan2dUrl, undefined);
  assert(f.context.source2dRef.current);
});

test('missing credentials show an actionable 3D error instead of an endless loading panel', async () => {
  const f = fixture({ source: true, mode: '2d' });
  f.context.getStoredToken = async () => null;
  f.context.openAiKey = '';
  await f.context.execute('3d');
  assert.equal(f.calls.length, 0);
  assert.equal(f.states.setSubmitted, true);
  assert.equal(f.states.setIsAiGenerating, false);
  assert.match(f.states.setPlan3dError, /sign in/);
});


test('generation stays pending until the image files have been prefetched', async () => {
  const f = fixture({ mode: 'both' });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const urls = [];
  let markPrefetchStarted;
  const started = new Promise(resolve => { markPrefetchStarted = resolve; });
  f.context.Image.prefetch = async url => { urls.push(url); if (urls.length === 2) markPrefetchStarted(); await gate; return true; };
  const pending = f.context.execute();
  await Promise.race([started, pending.then(() => { throw Error('Generation finished before image prefetch'); })]);
  assert.equal(urls.length, 2);
  assert.equal(f.states.setIsAiGenerating, true);
  assert.equal(f.context.generationDoneRef.current, false);
  assert.equal(f.states.setPlan3dUrl, null);
  release();
  await pending;
  assert.equal(f.states.setIsAiGenerating, false);
  assert.equal(f.context.generationDoneRef.current, true);
});

test('image prefetch failure does not discard a successfully generated plan', async () => {
  const f = fixture({ mode: 'both' });
  f.context.Image.prefetch = async () => { throw Error('Image cache unavailable'); };
  await f.context.execute();
  assert.equal(f.context.generationDoneRef.current, true);
  assert(f.states.setPlan2dUrl && f.states.setPlan3dUrl);
});
