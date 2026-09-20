/** Quick hash sanity — run: node scripts/test-ziraat-hash.js */
const assert = require('assert');
const crypto = require('crypto');
const {
  buildHashVer3,
  verifyCallbackHash,
  hashPlaintext,
  formatAmountTl,
  nestpayAmountToKurus,
  isPaymentSuccess,
} = require('../api/_lib/ziraat');

const storeKey = 'TEST1234';
const fields = {
  amount: '10.00',
  clientid: '100200127',
  currency: '949',
  failUrl: 'https://example.com/fail',
  hashAlgorithm: 'ver3',
  Instalment: '',
  lang: 'tr',
  oid: 'OID1',
  okUrl: 'https://example.com/ok',
  rnd: '123',
  storetype: '3d_pay_hosting',
  TranType: 'Auth',
};

const expectedPlain =
  '10.00|100200127|949|https://example.com/fail|ver3||tr|OID1|https://example.com/ok|123|3d_pay_hosting|Auth|TEST1234';
assert.strictEqual(hashPlaintext(fields, storeKey), expectedPlain);

const hash = buildHashVer3(fields, storeKey);
const independent = crypto.createHash('sha512').update(expectedPlain, 'utf8').digest('base64');
assert.strictEqual(hash, independent);

const piped = { note: 'a|b', z: '1' };
assert.strictEqual(hashPlaintext(piped, 'k|ey'), 'a\\|b|1|k\\|ey');

assert.strictEqual(formatAmountTl(15050), '150.50');
assert.strictEqual(nestpayAmountToKurus('150.50'), 15050);
assert.strictEqual(nestpayAmountToKurus('150,50'), 15050);

const signed = { ...fields, HASH: hash };
assert.ok(verifyCallbackHash(signed, { storeKey }));

const callback = { ...fields, HASH: hash, mdStatus: '1', ProcReturnCode: '00', Response: 'Approved' };
assert.ok(isPaymentSuccess(callback));

const tampered = { ...signed, amount: '11.00' };
assert.ok(!verifyCallbackHash(tampered, { storeKey }));

assert.ok(!isPaymentSuccess({ ...callback, mdStatus: '0' }));
assert.ok(!isPaymentSuccess({ ...callback, ProcReturnCode: '99', Response: 'Error' }));

console.log('test-ziraat-hash.js OK');
