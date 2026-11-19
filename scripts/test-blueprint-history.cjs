const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function load(fetch) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/blueprintHistory.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, AbortController, setTimeout, clearTimeout, fetch,
    require: () => ({ API_BASE_URL: 'https://api.example.test' }) };
  vm.runInNewContext(source, context);
  return context.exports.blueprintHistoryRequest;
}

test('history saving sends the same generation ID on retry, with authenticated JSON requests', async () => {
  const calls = [];
  const request = load(async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ id: 'saved' }) }; });
  const snapshot = { generationId: 'one_generation', mode: '2d', form: { plotWidth: 30 }, plan2dSvg: '<svg/>' };
  await request('account-token', '', snapshot);
  await request('account-token', '', snapshot);
  assert.equal(calls[0].url, 'https://api.example.test/api/blueprint-history');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer account-token');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.body, calls[1].options.body);
});
test('opening a plan requests its detail without sending another save', async () => {
  const request = load(async (url, options) => {
    assert.equal(url, 'https://api.example.test/api/blueprint-history/plan-id');
    assert.equal(options.method, 'GET');
    assert.equal(options.body, undefined);
    return { ok: true, json: async () => ({ plan: { _id: 'plan-id' } }) };
  });
  assert.equal((await request('token', '/plan-id')).plan._id, 'plan-id');
});
test('unavailable deployment and expired sessions produce actionable history errors', async () => {
  await assert.rejects(load(async () => ({ ok: false, status: 404, json: async () => ({}) }))('token'), /not available on the server yet/);
  await assert.rejects(load(async () => ({ ok: false, status: 401, json: async () => ({}) }))('token'), /sign in again/);
});
test('non-JSON server failures and timeouts reject history cleanly', async () => {
  await assert.rejects(load(async () => ({ ok: false, status: 502, json: async () => { throw Error('HTML response'); } }))('token'), /temporarily unavailable/);
  await assert.rejects(load(async () => { const error = new Error(); error.name = 'AbortError'; throw error; })('token'), /too long/);
  await assert.rejects(load(async () => ({ ok: true, json: async () => { throw Error('HTML response'); } }))('token'), /unexpected response/);
});
