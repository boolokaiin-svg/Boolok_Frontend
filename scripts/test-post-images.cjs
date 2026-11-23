const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, globals = {}) {
  const context = { exports: {}, FormData, fetch, require: () => ({ resolveImageUrl: url => url.startsWith('/') ? `https://api.example.test${url}` : url }), ...globals };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.exports;
}
test('web uploads send the selected image bytes, filename and MIME type as a file', async () => {
  const file = new Blob(['original-selected-image'], { type: 'image/png' });
  const { buildPostForm } = load('postUpload.ts', { fetch: () => { throw Error('Should use the selected file'); } });
  const form = await buildPostForm('Caption', 'blob:local-preview', { file, fileName: 'my-photo.png', mimeType: 'image/png' }, 'web');
  assert.equal(form.get('content'), 'Caption');
  assert.equal(form.get('image').name, 'my-photo.png');
  assert.equal(form.get('image').type, 'image/png');
  assert.equal(await form.get('image').text(), 'original-selected-image');
  assert.equal(form.has('mediaUrl'), false);
});
test('web URI-only selections are read and uploaded, not stored as temporary URLs', async () => {
  const { buildPostForm } = load('postUpload.ts', { fetch: async uri => {
    assert.equal(uri, 'blob:chosen'); return { blob: async () => new Blob(['original'], { type: 'image/jpeg' }) };
  } });
  const form = await buildPostForm('', 'blob:chosen', null, 'web');
  assert.equal(await form.get('image').text(), 'original');
});
test('native uploads retain the device file descriptor and actual format', async () => {
  class NativeForm { values = new Map(); append(key, value) { this.values.set(key, value); } }
  const { buildPostForm } = load('postUpload.ts', { FormData: NativeForm });
  const form = await buildPostForm('Caption', 'file:///chosen.webp', { mimeType: 'image/webp', fileName: 'chosen.webp' }, 'android');
  assert.equal(form.values.get('image').uri, 'file:///chosen.webp');
  assert.equal(form.values.get('image').type, 'image/webp');
});
test('a PNG with missing MIME metadata keeps a PNG filename and file type', async () => {
  const { buildPostForm } = load('postUpload.ts', { fetch: async () => ({ blob: async () => new Blob(['png-bytes'], { type: 'image/png' }) }) });
  const webForm = await buildPostForm('PNG photo', 'blob:preview', null, 'web');
  assert.equal(webForm.get('image').name, 'post.png');
  assert.equal(webForm.get('image').type, 'image/png');
  class NativeForm { values = new Map(); append(key, value) { this.values.set(key, value); } }
  const native = load('postUpload.ts', { FormData: NativeForm });
  const nativeForm = await native.buildPostForm('PNG photo', 'file:///photo.png', { fileName: 'photo.png' }, 'android');
  assert.equal(nativeForm.values.get('image').type, 'image/png');
});
test('post images use their saved URL and never infer stock photos from location or title', () => {
  const { getPostImageUri } = load('postMedia.ts');
  assert.equal(getPostImageUri({ mediaUrl: 'data:image/png;base64,original' }), 'data:image/png;base64,original');
  assert.equal(getPostImageUri({ mediaUrl: '/uploads/posts/chosen.png' }), 'https://api.example.test/uploads/posts/chosen.png');
  assert.equal(getPostImageUri({ mediaUrls: ['https://bucket.example.test/chosen.png'] }), 'https://bucket.example.test/chosen.png');
  assert.equal(getPostImageUri({ title: 'Dubai penthouse', location: 'London' }), null);
  assert.equal(getPostImageUri({ mediaUrl: 'blob:expired' }), null);
});
test('saved photo delivery prefers a normal image endpoint while preserving old inline-image support', () => {
  const { getPostImageUri } = load('postMedia.ts');
  const imageUrl = '/api/feed/aaaaaaaaaaaaaaaaaaaaaaaa/image';
  assert.equal(getPostImageUri({ imageUrl, mediaUrl: 'data:image/png;base64,original' }), `https://api.example.test${imageUrl}`);
  assert.equal(getPostImageUri({ mediaUrl: 'data:image/png;base64,original' }), 'data:image/png;base64,original');
});
test('an unavailable image endpoint can fall back to the exact original photo', () => {
  const { getPostImageCandidates } = load('postMedia.ts');
  const imageUrl = '/api/feed/aaaaaaaaaaaaaaaaaaaaaaaa/image';
  const original = 'data:image/png;base64,original-photo';
  const candidates = getPostImageCandidates({ imageUrl, mediaUrl: original });
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0], `https://api.example.test${imageUrl}`);
  assert.equal(candidates[1], original);
  assert.equal(getPostImageCandidates({ content: 'Text only', location: 'Dubai' }).length, 0);
});
test('the actual image component falls back after an endpoint error and retries both sources', () => {
  const media = load('postMedia.ts');
  const slots = []; let index = 0;
  const React = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }) };
  const modules = {
    react: { default: React, useEffect() {}, useState(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
    } },
    'react-native': { Image: 'Image', View: 'View', Pressable: 'Pressable', Text: 'Text' },
    '@expo/vector-icons': { MaterialIcons: 'Icon' },
    '../context/ThemeContext': { useTheme: () => ({ isDark: false }) },
    '../lib/postMedia': media,
  };
  const context = { exports: {}, console: { warn() {} }, require: name => modules[name] };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/PostImage.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 } }).outputText, context);
  const original = 'data:image/png;base64,original-photo';
  const post = { imageUrl: '/api/feed/aaaaaaaaaaaaaaaaaaaaaaaa/image', mediaUrl: original };
  const render = () => { index = 0; return context.exports.default({ post, style: {} }); };
  const first = render(); assert.match(first.props.source.uri, /\/image$/);
  first.props.onError();
  const fallback = render(); assert.equal(fallback.type, 'Image'); assert.equal(fallback.props.source.uri, original);
  fallback.props.onError();
  const failed = render(); assert.equal(failed.type, 'View');
  const retry = failed.props.children.find(child => child?.type === 'Pressable');
  retry.props.onPress({ stopPropagation() {} });
  assert.match(render().props.source.uri, /\/image\?retry=1$/);
});
