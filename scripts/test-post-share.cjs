const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/postShare.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, context);
const { parsePostShare, createPostShare } = context.exports;
const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
test('shared posts retain the original ID, author, image and text', () => {
  const post = { _id: id, author: { fullName: 'Test Member' }, content: 'Property listing', mediaUrl: 'https://example.test/photo.png' };
  const parsed = parsePostShare(createPostShare(post));
  assert.equal(parsed.postId, id);
  assert.equal(parsed.authorName, 'Test Member');
  assert.equal(parsed.content, post.content);
  assert.equal(parsed.image, post.mediaUrl);
});
test('preview text is bounded so sharing long posts does not exceed message limits', () => {
  const encoded = createPostShare({ _id: id, content: 'x'.repeat(10000), author: { fullName: 'a'.repeat(200) } });
  const parsed = parsePostShare(encoded);
  assert.equal(parsed.content.length, 500);
  assert.equal(parsed.authorName.length, 100);
  assert.ok(encoded.length < 5000);
});
test('malformed shares and ordinary messages do not become post links', () => {
  for (const text of [undefined, 'Hello', '[REEL_SHARE]:{}', '[POST_SHARE]:bad', '[POST_SHARE]:null', '[POST_SHARE]:{"postId":"../../bad"}']) {
    assert.equal(parsePostShare(text), null);
  }
});
test('text-only posts can be shared without an image or author', () => {
  const parsed = parsePostShare(createPostShare({ _id: id, content: 'Market update' }));
  assert.equal(parsed.image, null); assert.equal(parsed.authorName, 'Member');
});
test('embedded images are excluded so the backend cannot truncate share JSON', () => {
  const encoded = createPostShare({ _id: id, content: 'Photo post', mediaUrl: 'data:image/jpeg;base64,' + 'A'.repeat(100000) });
  assert.ok(encoded.length < 5000);
  assert.equal(parsePostShare(encoded).postId, id);
  assert.equal(parsePostShare(encoded).image, null);
});
test('existing truncated base64 shares recover their card and original post ID', () => {
  const broken = ('[POST_SHARE]:' + JSON.stringify({ postId: id, authorName: 'Member "One"', content: 'A listing', image: 'data:image/jpeg;base64,' + 'A'.repeat(10000) })).slice(0, 5000);
  const parsed = parsePostShare(broken);
  assert.equal(parsed.postId, id);
  assert.equal(parsed.authorName, 'Member "One"');
  assert.equal(parsed.content, 'A listing');
  assert.equal(parsed.image, null);
});
test('heavily escaped text also fits within backend limits', () => {
  const encoded = createPostShare({ _id: id, author: { fullName: '\u0000'.repeat(100) }, content: '\u0000'.repeat(500), mediaUrl: 'https://example.test/' + 'a'.repeat(1400) });
  assert.ok(encoded.length <= 5000);
  assert.equal(parsePostShare(encoded).postId, id);
});
