const crypto = require('crypto');

const GARANTI_ENV_KEYS = [
  'GARANTI_MERCHANT_ID',
  'GARANTI_TERMINAL_ID',
  'GARANTI_PROV_PASSWORD',
  'GARANTI_STORE_KEY',
];

function readEnv(name) {
  return String(process.env[name] || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

/** Kullanıcının eklediği alternatif env adlarını da kabul et. */
/**
 * Ortak ödeme (kart banka sayfasında) → 3D_OOS + PROVOOS.
 * İşyeri kendi sayfasında kart topluyorsa → 3D_PAY + PROVAUT (+ cardnumber).
 */
function readSecurityLevel() {
  const raw = readEnv('GARANTI_SECURITY_LEVEL').toUpperCase();
  if (raw === '3D_PAY' || raw === '3D' || raw === '3D_OOS' || raw === 'CUSTOM_PAY') return raw;
  return '3D_OOS';
}

function readGarantiProvUser() {
  const level = readSecurityLevel();
  const explicit =
    readEnv('GARANTI_PROV_USER_ID') ||
    readEnv('GARANTI_PROVISION_USER') ||
    '';
  if (level === '3D_OOS' || level === 'CUSTOM_PAY') {
    // Ortak ödeme: PROVAUT ile PAN zorunlu olur → PROVOOS kullan
    if (explicit && explicit.toUpperCase() !== 'PROVAUT') return explicit;
    return 'PROVOOS';
  }
  return explicit || 'PROVAUT';
}

function readGarantiPassword() {
  const level = readSecurityLevel();
  if (level === '3D_OOS' || level === 'CUSTOM_PAY') {
    return (
      readEnv('GARANTI_PROV_OOS_PASSWORD') ||
      readEnv('GARANTI_PROVISION_OOS_PASSWORD') ||
      readEnv('GARANTI_PROV_PASSWORD') ||
      readEnv('GARANTI_PROVISION_PASSWORD')
    );
  }
  return readEnv('GARANTI_PROV_PASSWORD') || readEnv('GARANTI_PROVISION_PASSWORD');
}

function garantiEnvCheck() {
  const missing = [];
  if (!readEnv('GARANTI_MERCHANT_ID')) missing.push('GARANTI_MERCHANT_ID');
  if (!readEnv('GARANTI_TERMINAL_ID')) missing.push('GARANTI_TERMINAL_ID');
  if (!readGarantiPassword()) missing.push('GARANTI_PROV_PASSWORD|GARANTI_PROVISION_PASSWORD');
  if (!readEnv('GARANTI_STORE_KEY')) missing.push('GARANTI_STORE_KEY');
  return {
    configured: missing.length === 0,
    missing,
    testMode: readEnv('GARANTI_MODE').toUpperCase() !== 'PROD',
    siteUrl: readEnv('SITE_URL') || null,
  };
}

function garantiConfig() {
  const merchantId = readEnv('GARANTI_MERCHANT_ID');
  const terminalId = readEnv('GARANTI_TERMINAL_ID');
  const provPassword = readGarantiPassword();
  const storeKey = readEnv('GARANTI_STORE_KEY');
  if (!merchantId || !terminalId || !provPassword || !storeKey) return null;

  const mode = readEnv('GARANTI_MODE').toUpperCase() === 'PROD' ? 'PROD' : 'TEST';
  const provUserId = readGarantiProvUser();
  const securityLevel = readSecurityLevel();
  return {
    merchantId,
    terminalId: String(terminalId),
    provUserId,
    terminalUserId: readEnv('GARANTI_TERMINAL_USER_ID') || provUserId,
    provPassword,
    storeKey,
    mode,
    securityLevel,
    apiVersion: readEnv('GARANTI_API_VERSION') || '512',
    companyName: readEnv('GARANTI_COMPANY_NAME') || 'Online VIP Dershane',
  };
}

/** ISO-8859-9 uyumlu hash (ASCII tutarlar/URL'ler için latin1 yeterli). */
function sha1HexUpper(text) {
  return crypto.createHash('sha1').update(String(text), 'latin1').digest('hex').toUpperCase();
}

function sha512HexUpper(text) {
  return crypto.createHash('sha512').update(String(text), 'latin1').digest('hex').toUpperCase();
}

/**
 * hashedPassword = SHA1(provPassword + "0" + terminalId)
 * 8 haneli terminal → "0"+8hane = 9 hane (C# / PHP resmi örneklerle aynı).
 */
function buildHashedPassword(provPassword, terminalId) {
  const tid = String(terminalId || '').replace(/\D/g, '');
  const padded = tid.length >= 9 ? tid : tid.padStart(9, '0');
  return sha1HexUpper(String(provPassword) + padded);
}

/** Peşin: hash ve formda "0" (resmi GetHashData int installmentCount = 0). */
function normalizeInstallment(installmentCount) {
  const raw = String(installmentCount == null ? '' : installmentCount).trim();
  if (!raw || raw === '0') return '0';
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n <= 0) return '0';
  return String(n);
}

/**
 * secure3dhash =
 * SHA512(terminalId + orderId + amount + currency + successUrl + errorUrl + type + installment + storeKey + hashedPassword)
 * amount: kuruş (100.50 TL → "10050"); peşin taksit hash'te "0"
 */
function buildSecure3dHash({
  terminalId,
  orderId,
  amountKurus,
  currencyCode = '949',
  successUrl,
  errorUrl,
  type = 'sales',
  installmentCount = 0,
  storeKey,
  provPassword,
}) {
  const hashedPassword = buildHashedPassword(provPassword, terminalId);
  const installment = normalizeInstallment(installmentCount);
  const raw =
    String(terminalId) +
    String(orderId) +
    String(amountKurus) +
    String(currencyCode) +
    String(successUrl) +
    String(errorUrl) +
    String(type) +
    installment +
    String(storeKey) +
    hashedPassword;
  return sha512HexUpper(raw);
}

function gatewayUrl(mode) {
  return mode === 'PROD'
    ? 'https://sanalposprov.garanti.com.tr/servlet/gt3dengine'
    : 'https://sanalposprovtest.garantibbva.com.tr/servlet/gt3dengine';
}

function makeOrderId() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `OVDG${Date.now()}${rand}`.slice(0, 36);
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const real = String(req.headers['x-real-ip'] || '').trim();
  return forwarded || real || '127.0.0.1';
}

/**
 * Ortak ödeme (kart bilgisi banka sayfasında) — peşin 3D_OOS satış formu.
 */
function buildCommonPaymentForm({
  cfg,
  orderId,
  amountKurus,
  email,
  userIp,
  successUrl,
  errorUrl,
  installmentCount = '',
  lang = 'tr',
}) {
  const type = 'sales';
  const currencyCode = '949';
  const installment = normalizeInstallment(installmentCount);
  const securityLevel = cfg.securityLevel || '3D_OOS';
  const secure3dhash = buildSecure3dHash({
    terminalId: cfg.terminalId,
    orderId,
    amountKurus,
    currencyCode,
    successUrl,
    errorUrl,
    type,
    installmentCount: installment,
    storeKey: cfg.storeKey,
    provPassword: cfg.provPassword,
  });

  const fields = {
    mode: cfg.mode,
    apiversion: cfg.apiVersion,
    terminalprovuserid: cfg.provUserId,
    terminaluserid: cfg.terminalUserId,
    terminalmerchantid: cfg.merchantId,
    terminalid: cfg.terminalId,
    orderid: orderId,
    customeremailaddress: String(email || '').slice(0, 64),
    customeripaddress: String(userIp || '127.0.0.1').slice(0, 40),
    txntype: type,
    txnamount: String(amountKurus),
    txncurrencycode: currencyCode,
    // Hash ile aynı değer olmalı (peşin = "0").
    txninstallmentcount: installment,
    successurl: successUrl,
    errorurl: errorUrl,
    secure3dsecuritylevel: securityLevel,
    secure3dhash,
    lang,
    txntimestamp: String(Math.floor(Date.now() / 1000)),
    refreshtime: '5',
    companyname: String(cfg.companyName || '').slice(0, 80),
  };

  return {
    action: gatewayUrl(cfg.mode),
    fields,
  };
}

/**
 * Bankadan dönen hash doğrulama.
 * hashparams: "clientid:oid:..." → değerler birleştirilir + storeKey
 * Eski akış: SHA1 · yeni (api 512): SHA512 — ikisini de kabul et.
 */
function verifyCallbackHash(body, cfg) {
  const hash = String(body.hash || body.Hash || '').trim().toUpperCase();
  const hashparams = String(body.hashparams || body.HashParams || '').trim();
  if (!hash || !hashparams) return false;

  const keys = hashparams.split(':').filter(Boolean);
  let concat = '';
  for (const key of keys) {
    const val =
      body[key] != null
        ? body[key]
        : body[key.toLowerCase()] != null
          ? body[key.toLowerCase()]
          : body[key.toUpperCase()];
    concat += val == null ? '' : String(val);
  }
  concat += cfg.storeKey;

  const sha1 = sha1HexUpper(concat);
  const sha512 = sha512HexUpper(concat);
  return hash === sha1 || hash === sha512;
}

function isPaymentSuccess(body) {
  const proc = String(body.procreturncode || body.ProcReturnCode || '').trim();
  const md = String(body.mdstatus || body.mdStatus || '').trim();
  // 3D başarılı: mdstatus 1,2,3,4 — provizyon OK: 00
  const mdOk = ['1', '2', '3', '4'].includes(md);
  return proc === '00' && mdOk;
}

module.exports = {
  garantiConfig,
  garantiEnvCheck,
  buildSecure3dHash,
  buildCommonPaymentForm,
  verifyCallbackHash,
  isPaymentSuccess,
  makeOrderId,
  clientIp,
  gatewayUrl,
};
