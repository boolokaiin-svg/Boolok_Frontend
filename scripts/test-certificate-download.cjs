const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/downloadCertificate.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function fixture(options = {}) {
  const calls = [], opened = [], links = [];
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: name => name === 'react-native'
      ? { Platform: { OS: options.platform || 'web' }, Linking: { openURL: async url => opened.push(url) } }
      : { API_BASE_URL: 'https://api.test', getStoredToken: async () => options.noToken ? null : 'private-session-token' },
    fetch: async (url, request) => {
      calls.push({ url, request });
      return options.response || { ok: true, blob: async () => ({}), json: async () => ({ url: '/api/legal/download-ec/ec.pdf?ticket=scoped-ticket' }) };
    },
    URL: { createObjectURL: () => 'blob:certificate', revokeObjectURL() {} },
    document: { createElement: () => { const link = { click() {}, remove() {} }; links.push(link); return link; }, body: { appendChild() {} } },
    setTimeout: callback => callback(),
  });
  return { download: exports.downloadCertificate, calls, opened, links };
}
test('web download authenticates the request and saves the certificate with a filename', async () => {
  const f = fixture(); await f.download('output/accounts/id/ec.pdf');
  assert.equal(f.calls[0].request.headers.Authorization, 'Bearer private-session-token');
  assert.equal(f.links[0].download, 'ec.pdf'); assert.equal(f.opened.length, 0);
});
test('native download obtains a scoped URL without placing the session JWT in it', async () => {
  const f = fixture({ platform: 'android' }); await f.download('ec.pdf');
  assert.equal(f.calls[0].request.method, 'POST');
  assert.equal(f.opened[0], 'https://api.test/api/legal/download-ec/ec.pdf?ticket=scoped-ticket');
  assert(!f.opened[0].includes('private-session-token'));
});
test('unauthenticated requests and server errors do not claim successful download', async () => {
  const f = fixture({ noToken: true }); await assert.rejects(f.download('ec.pdf'), /sign in again/);
  assert.equal(f.calls.length, 0);
  const failed = fixture({ response: { ok: false, json: async () => ({ message: 'Certificate not found.' }) } });
  await assert.rejects(failed.download('ec.pdf'), /Certificate not found/);
  assert.equal(failed.links.length, 0);
});
test('native download rejects unexpected external URLs', async () => {
  const f = fixture({ platform: 'android', response: { ok: true, json: async () => ({ url: 'https://external.test/file.pdf' }) } });
  await assert.rejects(f.download('ec.pdf'), /Certificate download failed/);
  assert.equal(f.opened.length, 0);
});
