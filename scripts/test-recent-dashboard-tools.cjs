const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/recentDashboardTools.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function load({ platform = 'web', stored = null, failStorage = false } = {}) {
  const storage = new Map(stored ? [['boolok_recent_tools', stored]] : []);
  const get = key => { if (failStorage) throw Error('Unavailable'); return storage.get(key) || null; };
  const set = (key, value) => { if (failStorage) throw Error('Unavailable'); storage.set(key, value); };
  const context = { exports: {}, localStorage: { getItem: get, setItem: set },
    require: name => name === 'react-native' ? { Platform: { OS: platform } } : {
      getItemAsync: async key => get(key), setItemAsync: async (key, value) => set(key, value),
    } };
  vm.runInNewContext(source, context);
  return { ...context.exports, storage };
}
const plain = value => JSON.parse(JSON.stringify(value));

for (const platform of ['web', 'ios']) {
  test(`${platform}: the last opened tool moves first, persists, and repeated visits do not duplicate cards`, async () => {
    const f = load({ platform });
    await f.recordDashboardTool('account-a', 'legal', 10);
    await f.recordDashboardTool('account-a', 'blueprint', 20);
    await f.recordDashboardTool('account-a', 'legal', 30);
    const recent = await f.readRecentDashboardTools('account-a');
    assert.deepEqual(plain(f.orderedDashboardTools(recent)), ['legal', 'blueprint', 'predictions']);
    assert.equal(recent.length, 2);
    const restarted = load({ platform, stored: f.storage.get('boolok_recent_tools') });
    assert.deepEqual(plain(await restarted.readRecentDashboardTools('account-a')), plain(recent));
  });
}

test('rapid visits are serialized and a read waits for the latest write', async () => {
  const f = load();
  const first = f.recordDashboardTool('a', 'blueprint', 10);
  const second = f.recordDashboardTool('a', 'predictions', 20);
  const recent = await f.readRecentDashboardTools('a');
  await Promise.all([first, second]);
  assert.deepEqual(plain(f.orderedDashboardTools(recent)), ['predictions', 'blueprint', 'legal']);
});

test('account switching never displays another account\'s activity', async () => {
  const f = load({ stored: JSON.stringify({ accountId: 'a', tools: [{ id: 'blueprint', openedAt: 10 }] }) });
  assert.deepEqual(plain(await f.readRecentDashboardTools('b')), []);
  assert.deepEqual(plain(f.orderedDashboardTools(await f.readRecentDashboardTools('a'))), ['blueprint', 'legal', 'predictions']);
});

test('disabled storage keeps navigation usable and preserves ordering in memory', async () => {
  const f = load({ failStorage: true });
  await f.recordDashboardTool('a', 'predictions', 10);
  assert.deepEqual(plain(f.orderedDashboardTools(await f.readRecentDashboardTools('a'))), ['predictions', 'legal', 'blueprint']);
});

test('corrupt, unknown and duplicated entries cannot remove or add dashboard cards', async () => {
  const corrupt = load({ stored: 'not JSON' });
  assert.deepEqual(plain(await corrupt.readRecentDashboardTools('a')), []);
  const f = load({ stored: JSON.stringify({ accountId: 'a', tools: [null, { id: 'unknown', openedAt: 999 },
    { id: 'blueprint', openedAt: 20 }, { id: 'blueprint', openedAt: 10 }, { id: 'legal', openedAt: 'invalid' }] }) });
  assert.deepEqual(plain(f.orderedDashboardTools(await f.readRecentDashboardTools('a'))), ['blueprint', 'legal', 'predictions']);
});
