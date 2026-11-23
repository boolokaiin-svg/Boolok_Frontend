const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function fixture() {
  const timers = new Map(); let sequence = 0;
  const document = { visibilityState: 'visible' };
  const context = { exports: {}, AbortController, Date, document,
    setTimeout(fn, delay) { const id = ++sequence; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/screenPolling.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return { start: context.exports.startScreenPolling, timers, document,
    delay: () => [...timers.values()][0]?.delay,
    tick: () => { const [id, timer] = timers.entries().next().value; timers.delete(id); return timer.fn(); },
  };
}
test('waits between requests and never overlaps a slow request', async () => {
  const f = fixture(); let finish, calls = 0;
  const stop = f.start(async () => { calls++; await new Promise(resolve => { finish = resolve; }); }, 15000);
  assert.equal(f.delay(), 15000);
  const pending = f.tick(); assert.equal(calls, 1); assert.equal(f.timers.size, 0);
  finish(); await pending; assert.equal(f.delay(), 15000); stop();
});
test('honors Retry-After after rate limiting', async () => {
  const f = fixture();
  const stop = f.start(async () => { throw { response: { status: 429, headers: { 'retry-after': '900' } } }; }, 15000);
  await f.tick(); assert.equal(f.delay(), 900000); stop();
});
test('backs off on errors and resets the interval after a successful request', async () => {
  const f = fixture(); let calls = 0;
  const stop = f.start(async () => { if (++calls === 1) throw Error('offline'); }, 15000);
  await f.tick(); assert.equal(f.delay(), 30000);
  await f.tick(); assert.equal(f.delay(), 15000); stop();
});
test('does not request data in a hidden browser tab', async () => {
  const f = fixture(); let calls = 0; f.document.visibilityState = 'hidden';
  const stop = f.start(async () => { calls++; }, 15000);
  await f.tick(); assert.equal(calls, 0); assert.equal(f.delay(), 15000); stop();
});
test('stopping on navigation aborts the request and prevents another timer', async () => {
  const f = fixture(); let signal, finish;
  const stop = f.start(async input => { signal = input; await new Promise(resolve => { finish = resolve; }); }, 15000);
  const pending = f.tick(); stop(); assert.equal(signal.aborted, true);
  finish(); await pending; assert.equal(f.timers.size, 0);
});
