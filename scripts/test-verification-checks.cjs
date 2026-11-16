const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/verificationChecks.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject });
const check = exportsObject.verificationChecks;
test('missing results never imply successful government or signature checks', () => {
  const result = check({ verdict: 'NEEDS_MANUAL_UPLOAD' });
  assert.equal(result.qr.label, 'NOT_CHECKED');
  assert.equal(result.signature.label, 'NOT_CHECKED');
  assert.equal(result.ec.label, 'NOT RETRIEVED');
  assert.equal(result.ec.confirmed, false);
});
test('overall verified evidence is not evidence that an EC was retrieved', () => {
  assert.equal(check({ data: { portal_check: { overall_portal_status: 'VERIFIED', qr_check_status: 'MATCH' } } }).ec.confirmed, false);
});
test('legacy signature presence claims are not displayed as valid integrity', () => {
  const result = check({ data: { portal_check: { signature_status: 'VALID', portal_details: { signature: { note: 'Signature fields detected. Full CCA chain validation recommended.' } } } } });
  assert.equal(result.signature.confirmed, false);
  assert.match(result.signature.label, /NOT VERIFIED/);
});
test('retrieved and manually supplied PDFs have distinct labels without title approval', () => {
  assert.match(check({ downloaded_files: { ec: 'ec.pdf' } }).ec.label, /PDF RETRIEVED/);
  assert.equal(check({ downloaded_files: { ec: 'ec.pdf' }, ec_download: { code: 'EC_MANUAL_UPLOAD' } }).ec.label, 'MANUALLY SUPPLIED');
});
