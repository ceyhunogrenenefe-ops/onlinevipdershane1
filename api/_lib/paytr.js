const crypto = require('crypto');

const PAYTR_ENV_KEYS = ['PAYTR_MERCHANT_ID', 'PAYTR_MERCHANT_KEY', 'PAYTR_MERCHANT_SALT'];

function readEnv(name) {
  return String(process.env[name] || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

/** Hangi PayTR ortam değişkenleri eksik/boş (değerleri döndürmez). */
function paytrEnvCheck() {
  const missing = PAYTR_ENV_KEYS.filter((key) => !readEnv(key));
  return {
    configured: missing.length === 0,
    missing,
    testMode: readEnv('PAYTR_TEST_MODE') === '1',
    siteUrl: readEnv('SITE_URL') || null,
  };
}

function paytrConfig() {
  const merchantId = readEnv('PAYTR_MERCHANT_ID');
  const merchantKey = readEnv('PAYTR_MERCHANT_KEY');
  const merchantSalt = readEnv('PAYTR_MERCHANT_SALT');
  if (!merchantId || !merchantKey || !merchantSalt) return null;
  return {
    merchantId,
    merchantKey,
    merchantSalt,
    testMode: readEnv('PAYTR_TEST_MODE') === '1' ? 1 : 0,
  };
}

function buildUserBasket(resolved) {
  const rows = resolved.map(({ product, qty }) => [
    product.name,
    Number(product.price).toFixed(2),
    qty,
  ]);
  return Buffer.from(JSON.stringify(rows), 'utf8').toString('base64');
}

function buildPaytrToken({
  merchantId,
  merchantKey,
  merchantSalt,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  userBasket,
  noInstallment = 0,
  maxInstallment = 0,
  currency = 'TL',
  testMode = 0,
}) {
  const hashStr =
    String(merchantId) +
    String(userIp) +
    String(merchantOid) +
    String(email) +
    String(paymentAmount) +
    String(userBasket) +
    String(noInstallment) +
    String(maxInstallment) +
    String(currency) +
    String(testMode);
  return crypto.createHmac('sha256', merchantKey).update(hashStr + merchantSalt).digest('base64');
}

function verifyCallbackHash({ merchantOid, status, totalAmount, hash }, cfg) {
  const payload = String(merchantOid) + cfg.merchantSalt + String(status) + String(totalAmount);
  const token = crypto.createHmac('sha256', cfg.merchantKey).update(payload).digest('base64');
  return token === String(hash || '');
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const real = String(req.headers['x-real-ip'] || '').trim();
  return forwarded || real || '127.0.0.1';
}

function makeMerchantOid() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `OVD${Date.now()}${rand}`.slice(0, 64);
}

module.exports = {
  paytrConfig,
  paytrEnvCheck,
  buildUserBasket,
  buildPaytrToken,
  verifyCallbackHash,
  clientIp,
  makeMerchantOid,
};
