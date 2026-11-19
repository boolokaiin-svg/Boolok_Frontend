const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../lib/legalVerificationError.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;
const context = { exports: {} };
vm.runInNewContext(source, context);
const error = context.exports.legalVerificationError;

test('HTTP 200 processing failures show the report issue instead of a generic error', () => {
  assert.equal(error(200, { verdict: 'ERROR', success: false, report:
    'VERDICT: ERROR\nCONFIDENCE: 0%\n\nISSUES FOUND IN THIS DOCUMENT:\n• OCR failed: no readable text.\n\nPROBLEMATIC AREAS:\n• Document could not be processed.'
  }), 'OCR failed: no readable text.');
});
test('explicit API messages take precedence over reports', () => {
  assert.equal(error(400, { message: 'Upload a sale deed.', report: 'Processing error: other' }), 'Upload a sale deed.');
});
test('processing exception reports are understood', () => {
  assert.equal(error(200, { report: 'Processing error: unsupported document' }), 'unsupported document');
});
test('expired sessions, oversized files, busy service and timeouts have actionable messages', () => {
  assert.match(error(401, {}), /sign in again/i);
  assert.match(error(413, {}), /smaller files/i);
  assert.match(error(429, {}), /busy/i);
  assert.match(error(504, {}), /timed out/i);
});
test('non-JSON and malformed responses do not hide failure or crash', () => {
  assert.match(error(502, {}), /unavailable/i);
  assert.match(error(400, { detail: [{ input: 'private document contents' }] }), /HTTP 400/);
  assert.match(error(200, null), /could not complete/i);
});
test('long server messages are bounded', () => {
  assert.equal(error(400, { message: 'x'.repeat(1000) }).length, 600);
});
