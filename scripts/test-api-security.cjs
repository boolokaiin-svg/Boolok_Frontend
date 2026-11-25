const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/api.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function fixture() {
  const calls = []; let tokenReads = 0;
  const context = { exports: {}, URL, console, process: { env: { EXPO_PUBLIC_API_URL: 'https://api.example.test' } },
    require: name => name === 'react-native' ? { Platform: { OS: 'web' } } : { default: {} },
    localStorage: { getItem: () => { tokenReads++; return 'private-token'; } },
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ success: true }) }; },
  };
  vm.runInNewContext(source, context);
  return { api: context.exports.apiFetch, calls, reads: () => tokenReads };
}
test('authenticated requests reject cross-origin destinations before reading or sending the token', async () => {
  const f = fixture();
  for (const url of ['https://attacker.test/collect', 'https://api.example.test.attacker.test/api', 'https://api.example.test@attacker.test/api', 'http://api.example.test/api']) {
    await assert.rejects(f.api(url), /configured API server/);
  }
  assert.equal(f.reads(), 0); assert.equal(f.calls.length, 0);
});
test('relative and same-origin API calls preserve authorization and caller options', async () => {
  const f = fixture();
  await f.api('/api/dashboard/stats');
  await f.api('https://api.example.test/api/users/self', { method: 'GET' });
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0].url, 'https://api.example.test/api/dashboard/stats');
  assert.equal(f.calls[0].options.headers.Authorization, 'Bearer private-token');
  assert.equal(f.calls[1].options.method, 'GET');
});
