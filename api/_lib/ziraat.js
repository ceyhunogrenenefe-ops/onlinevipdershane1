const crypto = require('crypto');

/**
 * Ziraat Bankası Sanal POS — Payten / NestPay (EST) 3D Pay Hosting.
 * Kart bilgisi sitede toplanmaz; form bankanın ortak ödeme sayfasına POST edilir.
 *
 * Hash: Payten Hash Ver3 (31.08.2024+ zorunlu)
 *   natcasesort(parametre adları) → değerler "|" ile → storeKey → SHA-512 → Base64
 *   \ ve | değer içinde kaçışlanır. hash ve encoding hash'e girmez.
 */

function readEnv(name) {
  return String(process.env[name] || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function readClientId() {
  return readEnv('ZIRAAT_CLIENT_ID') || readEnv('ZIRAAT_MERCHANT_ID');
}

function readStoreType() {
  const raw = readEnv('ZIRAAT_STORE_TYPE').toLowerCase().replace(/-/g, '_');
  if (raw === '3d_host' || raw === '3dhost') return '3d_host';
  if (raw === '3d_pay_hosting' || raw === '3dpayhosting') return '3d_pay_hosting';
  return '3d_pay_hosting';
}

function ziraatEnvCheck() {
  const missing = [];
  if (!readClientId()) missing.push('ZIRAAT_CLIENT_ID');
  if (!readEnv('ZIRAAT_STORE_KEY')) missing.push('ZIRAAT_STORE_KEY');
  return {
    configured: missing.length === 0,
    missing,
    testMode: readEnv('ZIRAAT_MODE').toUpperCase() !== 'PROD',
    siteUrl: readEnv('SITE_URL') || null,
    clientId: readClientId() || null,
    terminalId: readEnv('ZIRAAT_TERMINAL_ID') || null,
    storeKeyLen: readEnv('ZIRAAT_STORE_KEY').length,
    storeKeyHasWhitespace: /\s/.test(readEnv('ZIRAAT_STORE_KEY')),
    hasApiUser: !!(readEnv('ZIRAAT_USERNAME') && readEnv('ZIRAAT_PASSWORD')),
  };
}

function ziraatConfig() {
  const clientId = readClientId();
  const storeKey = readEnv('ZIRAAT_STORE_KEY');
  if (!clientId || !storeKey) return null;

  const mode = readEnv('ZIRAAT_MODE').toUpperCase() === 'PROD' ? 'PROD' : 'TEST';
  return {
    clientId,
    terminalId: readEnv('ZIRAAT_TERMINAL_ID'),
    storeKey,
    mode,
    storeType: readStoreType(),
    companyName: readEnv('ZIRAAT_COMPANY_NAME') || 'Online VIP Dershane',
    username: readEnv('ZIRAAT_USERNAME'),
    password: readEnv('ZIRAAT_PASSWORD'),
  };
}

function nestpayEscape(value) {
  return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

/** PHP natcasesort eşdeğeri (strnatcasecmp). */
function natCaseCompare(a, b) {
  return String(a).localeCompare(String(b), 'en', { numeric: true, sensitivity: 'accent' });
}

function hashPlaintext(fields, storeKey) {
  const keys = Object.keys(fields || {}).filter((key) => {
    const lower = key.toLowerCase();
    return lower !== 'hash' && lower !== 'encoding';
  });
  keys.sort(natCaseCompare);
  const parts = keys.map((key) => nestpayEscape(fields[key]));
  parts.push(nestpayEscape(storeKey));
  return parts.join('|');
}

function sha512Base64(text) {
  return crypto.createHash('sha512').update(String(text), 'utf8').digest('base64');
}

/** Payten Hash Ver3 — SHA-512 + Base64. */
function buildHashVer3(fields, storeKey) {
  return sha512Base64(hashPlaintext(fields, storeKey));
}

function hashesEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (!left.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function gatewayUrl(mode, override) {
  if (override) return override;
  return mode === 'PROD'
    ? 'https://sanalpos2.ziraatbank.com.tr/fim/est3Dgate'
    : 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate';
}

function formatAmountTl(amountKurus) {
  const n = Number(amountKurus);
  if (!Number.isFinite(n) || n < 0) return '0.00';
  return (n / 100).toFixed(2);
}

function nestpayAmountToKurus(raw) {
  const s = String(raw || '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
  if (!s) return 0;
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function normalizeInstallment(installmentCount) {
  const raw = String(installmentCount == null ? '' : installmentCount).trim();
  if (!raw || raw === '0' || raw === '1') return '';
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n <= 1) return '';
  return String(n);
}

function makeOrderId() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `OVDZ${Date.now()}${rand}`.slice(0, 64);
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const real = String(req.headers['x-real-ip'] || '').trim();
  return forwarded || real || '127.0.0.1';
}

/**
 * Ortak ödeme formu — 3d_pay_hosting (kart banka sayfasında).
 * amount NestPay'de TL (150.00); Garanti'deki gibi kuruş değil.
 */
function buildHostingPaymentForm({
  cfg,
  orderId,
  amountKurus,
  email,
  billToName,
  successUrl,
  errorUrl,
  installmentCount = '',
  lang = 'tr',
}) {
  const fields = {
    clientid: String(cfg.clientId),
    amount: formatAmountTl(amountKurus),
    oid: String(orderId).slice(0, 64),
    okUrl: String(successUrl),
    failUrl: String(errorUrl),
    TranType: 'Auth',
    Instalment: normalizeInstallment(installmentCount),
    currency: '949',
    rnd: `${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
    storetype: cfg.storeType || '3d_pay_hosting',
    hashAlgorithm: 'ver3',
    lang: lang === 'en' ? 'en' : 'tr',
    refreshtime: '5',
    firmaadi: String(cfg.companyName || '').slice(0, 80),
  };

  const name = String(billToName || '').trim();
  if (name) fields.BillToName = name.slice(0, 80);
  const mail = String(email || '').trim();
  if (mail) fields.email = mail.slice(0, 64);

  fields.HASH = buildHashVer3(fields, cfg.storeKey);

  return {
    action: gatewayUrl(cfg.mode, readEnv('ZIRAAT_GATEWAY_URL')),
    fields,
  };
}

/**
 * Bankadan dönen HASH doğrulama.
 * 1) Ver3: dönen tüm alanlar (hash/encoding hariç) + storeKey
 * 2) Eski: HASHPARAMSVAL + storeKey (SHA1 veya SHA512, Base64)
 */
function verifyCallbackHash(body, cfg) {
  const hash = String(body.HASH || body.hash || '').trim();
  if (!hash || !cfg || !cfg.storeKey) return false;

  if (hashesEqual(hash, buildHashVer3(body, cfg.storeKey))) return true;

  const paramsVal = String(body.HASHPARAMSVAL || body.hashparamsval || '');
  if (paramsVal) {
    const sha1 = crypto.createHash('sha1').update(paramsVal + cfg.storeKey, 'utf8').digest('base64');
    const sha512 = sha512Base64(paramsVal + cfg.storeKey);
    if (hashesEqual(hash, sha1) || hashesEqual(hash, sha512)) return true;
  }
  return false;
}

function isPaymentSuccess(body) {
  const procRaw = String(body.ProcReturnCode || body.procreturncode || '').trim();
  const proc = /^0+$/.test(procRaw) ? '00' : procRaw;
  const md = String(body.mdStatus || body.mdstatus || '').trim();
  const response = String(body.Response || body.response || '').trim().toLowerCase();
  const mdOk = ['1', '2', '3', '4'].includes(md);
  return proc === '00' && mdOk && (response === 'approved' || response === '' || response === 'success');
}

module.exports = {
  ziraatConfig,
  ziraatEnvCheck,
  buildHashVer3,
  buildHostingPaymentForm,
  verifyCallbackHash,
  isPaymentSuccess,
  makeOrderId,
  clientIp,
  gatewayUrl,
  formatAmountTl,
  nestpayAmountToKurus,
  hashPlaintext,
};
