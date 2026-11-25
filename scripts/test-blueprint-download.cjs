const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/downloadBlueprint.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function fixture({ fail = false, contentType = 'image/png', platform = 'web' } = {}) {
  const calls = [], links = [], timers = [], revoked = [], shared = [], removed = [];
  const context = { exports: {},
    require: name => {
      if (name === 'react-native') return { Platform: { OS: platform } };
      if (name === 'expo-file-system/legacy') return { cacheDirectory: 'file://cache/',
        downloadAsync: async (url, destination) => { calls.push({ url, destination }); return { status: fail ? 403 : 200 }; },
        deleteAsync: async destination => removed.push(destination) };
      if (name === 'expo-sharing') return { isAvailableAsync: async () => true, shareAsync: async (uri, options) => shared.push({ uri, options }) };
      return {};
    },
    fetch: async url => { calls.push(url); return { ok: !fail, blob: async () => ({ type: contentType }) }; },
    URL: { createObjectURL: () => 'blob:local-image', revokeObjectURL: url => revoked.push(url) },
    setTimeout: fn => timers.push(fn),
    document: { body: { appendChild: () => {} }, createElement: () => {
      const link = { click() { this.clicked = true; }, remove() { this.removed = true; } };
      links.push(link); return link;
    } },
  };
  vm.runInNewContext(source, context);
  return { download: context.exports.downloadBlueprint, calls, links, timers, revoked, shared, removed };
}

test('cross-origin images download as a local blob file without opening a tab', async () => {
  const f = fixture();
  await f.download('https://backend.example/api/blueprint/images/plan.png', 'house_plan.png');
  assert.equal(f.calls[0], 'https://backend.example/api/blueprint/images/plan.png');
  assert.equal(f.links[0].href, 'blob:local-image');
  assert.equal(f.links[0].download, 'house_plan.png');
  assert.equal(f.links[0].target, undefined);
  assert.equal(f.links[0].clicked, true);
  assert.equal(f.links[0].removed, true);
  assert.equal(f.revoked.length, 0);
  f.timers[0]();
  assert.deepEqual(f.revoked, ['blob:local-image']);
});

for (const options of [{ fail: true }, { contentType: 'text/html' }]) {
  test(`failed or non-image responses cannot download an error page (${JSON.stringify(options)})`, async () => {
    const f = fixture(options);
    await assert.rejects(f.download('https://backend.example/plan.png', 'plan.png'), /could not be downloaded|did not return/);
    assert.equal(f.links.length, 0);
  });
}


test('mobile downloads the image bytes and shares a local file rather than an image link', async () => {
  const f = fixture({ platform: 'ios' });
  await f.download('https://backend.example/plan.png', 'house_plan.png');
  assert.match(f.calls[0].destination, /^file:\/\/cache\//);
  assert.equal(f.shared[0].uri, f.calls[0].destination);
  assert.equal(f.shared[0].options.mimeType, 'image/png');
  assert.equal(f.removed[0], f.shared[0].uri);
});

test('mobile does not share a failed download and cleans the incomplete file', async () => {
  const f = fixture({ platform: 'android', fail: true });
  await assert.rejects(f.download('https://backend.example/plan.png', 'plan.png'), /could not be downloaded/);
  assert.equal(f.shared.length, 0);
  assert.equal(f.removed.length, 1);
});
