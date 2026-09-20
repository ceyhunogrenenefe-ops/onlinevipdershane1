/** Quick hash sanity — run: node scripts/test-garanti-hash.js */
const assert = require('assert');
const {
  buildHashedPassword,
  buildSecure3dHash,
  isPaymentSuccess,
  flattenFormBody,
  verifyCallbackHash,
} = require('../api/_lib/garanti');
const crypto = require('crypto');

function sha1(t) {
  return crypto.createHash('sha1').update(t, 'latin1').digest('hex').toUpperCase();
}
function sha512(t) {
  return crypto.createHash('sha512').update(t, 'latin1').digest('hex').toUpperCase();
}

const hp = buildHashedPassword('123qweASD/', '10410839');
assert.strictEqual(hp, sha1('123qweASD/010410839'));

const hash = buildSecure3dHash({
  terminalId: '10410839',
  orderId: 'ORDER1',
  amountKurus: 100,
  currencyCode: '949',
  successUrl: 'https://example.com/ok',
  errorUrl: 'https://example.com/fail',
  type: 'sales',
  installmentCount: 0,
  storeKey: '123456789012345678901234',
  provPassword: '123qweASD/',
});
assert.strictEqual(hash.length, 128);
assert.strictEqual(
  hash,
  sha512(
    '10410839ORDER1100949https://example.com/okhttps://example.com/failsales0' +
      '123456789012345678901234' +
      hp
  )
);

assert.ok(
  isPaymentSuccess({
    ProcReturnCode: '000',
    mdStatus: '1',
    Response: 'Approved',
    AuthCode: '123456',
  })
);
assert.ok(
  !isPaymentSuccess({
    procreturncode: '00',
    mdstatus: '1',
    Response: 'Successful',
    mderrormessage: "TROY Gateway Result: [Code: '000', Message: 'Success', Description: 'Successful']",
  }),
  'TROY Success without authcode is 3D only'
);
assert.ok(
  !isPaymentSuccess({
    mdstatus: '1',
    mderrormessage: "TROY Gateway Result: [Code: '000', Message: 'Success', Description: 'Successful']",
  })
);
assert.ok(
  !isPaymentSuccess({
    procreturncode: '00',
    mdstatus: '1',
    Response: 'Approved',
  }),
  'Approved without authcode is not capture'
);
assert.ok(
  !isPaymentSuccess({
    procreturncode: '00',
    mdstatus: '1',
    Response: 'Approved',
    hostrefnum: '123456789012',
  }),
  'hostref without authcode is not capture'
);
assert.ok(!isPaymentSuccess({ procreturncode: '99', mdstatus: '1' }));
assert.ok(!isPaymentSuccess({ procreturncode: '00', mdstatus: '0' }));

const flat = flattenFormBody({
  terminalid: ['10410839', '10410839'],
  authcode: ['665202'],
  hashparams: ['clientid:authcode:', 'clientid:authcode:'],
});
assert.strictEqual(flat.terminalid, '10410839');
assert.strictEqual(flat.authcode, '665202');
assert.strictEqual(flat.hashparams, 'clientid:authcode:');

const storeKey = 'teststorekey';
const concat = '10410839665202';
const cbHash = sha1(concat + storeKey);
assert.ok(
  verifyCallbackHash(
    {
      hash: cbHash,
      hashparams: 'terminalid:authcode:',
      terminalid: ['10410839', '10410839'],
      authcode: '665202',
    },
    { storeKey }
  ),
  'duplicate terminalid must not break callback hash'
);

const b64 = crypto.createHash('sha1').update(concat + storeKey, 'latin1').digest('base64');
assert.ok(
  verifyCallbackHash(
    {
      hash: b64,
      hashparams: 'clientid:authcode:',
      clientid: '10410839',
      authcode: '665202',
    },
    { storeKey }
  ),
  'Garanti callback SHA1 Base64 hash'
);

console.log('test-garanti-hash.js OK');
