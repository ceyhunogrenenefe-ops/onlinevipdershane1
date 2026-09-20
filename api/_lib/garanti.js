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
 * Ortak ödeme (kart banka sayfasında) → 3D_OOS_PAY + PROVOOS
 * (Garanti e-ticaret destek: secure3dsecuritylevel = 3D_OOS_PAY)
 * İşyeri kendi sayfasında kart topluyorsa → 3D_PAY + PROVAUT (+ cardnumber).
 */
function readSecurityLevel() {
  const raw = readEnv('GARANTI_SECURITY_LEVEL').toUpperCase();
  if (
    raw === '3D_PAY' ||
    raw === '3D' ||
    raw === '3D_OOS' ||
    raw === '3D_OOS_PAY' ||
    raw === 'CUSTOM_PAY'
  ) {
    // Eski 3D_OOS değeri ortak ödemede 3D_OOS_PAY olarak düzeltilir
    if (raw === '3D_OOS') return '3D_OOS_PAY';
    return raw;
  }
  return '3D_OOS_PAY';
}

function isOosLevel(level) {
  return level === '3D_OOS' || level === '3D_OOS_PAY' || level === 'CUSTOM_PAY';
}

function readGarantiProvUser() {
  const level = readSecurityLevel();
  const explicit =
    readEnv('GARANTI_PROV_USER_ID') ||
    readEnv('GARANTI_PROVISION_USER') ||
    '';
  // Ortak ödeme: PROVOOS (env yanlışlıkla PROVAUT ise yine PROVOOS)
  if (isOosLevel(level)) {
    if (explicit && explicit.toUpperCase() === 'PROVOOS') return 'PROVOOS';
    return 'PROVOOS';
  }
  return explicit || 'PROVAUT';
}

function readGarantiPasswordSource() {
  const level = readSecurityLevel();
  if (isOosLevel(level)) {
    if (readEnv('GARANTI_PROV_OOS_PASSWORD')) return 'GARANTI_PROV_OOS_PASSWORD';
    if (readEnv('GARANTI_PROVISION_OOS_PASSWORD')) return 'GARANTI_PROVISION_OOS_PASSWORD';
    if (readEnv('GARANTI_PROV_PASSWORD')) return 'GARANTI_PROV_PASSWORD';
    if (readEnv('GARANTI_PROVISION_PASSWORD')) return 'GARANTI_PROVISION_PASSWORD';
    return null;
  }
  if (readEnv('GARANTI_PROV_PASSWORD')) return 'GARANTI_PROV_PASSWORD';
  if (readEnv('GARANTI_PROVISION_PASSWORD')) return 'GARANTI_PROVISION_PASSWORD';
  return null;
}

function readGarantiPassword() {
  const src = readGarantiPasswordSource();
  return src ? readEnv(src) : '';
}

function storeKeyMeta(storeKey) {
  const key = String(storeKey || '');
  const allHex = /^[0-9a-fA-F]+$/.test(key);
  // Garanti panel: "24 byte hexdata" → 48 hex karakter (24 bayt)
  const is24ByteHex = key.length === 48 && allHex;
  const is24CharHex = key.length === 24 && allHex;
  return {
    len: key.length,
    is24Hex: is24ByteHex,
    is24ByteHex,
    is24CharHex,
    hasWhitespace: /\s/.test(key),
  };
}

function garantiEnvCheck() {
  const missing = [];
  if (!readEnv('GARANTI_MERCHANT_ID')) missing.push('GARANTI_MERCHANT_ID');
  if (!readEnv('GARANTI_TERMINAL_ID')) missing.push('GARANTI_TERMINAL_ID');
  if (!readGarantiPassword()) missing.push('GARANTI_PROVISION_OOS_PASSWORD|GARANTI_PROVISION_PASSWORD');
  if (!readEnv('GARANTI_STORE_KEY')) missing.push('GARANTI_STORE_KEY');
  const store = storeKeyMeta(readEnv('GARANTI_STORE_KEY'));
  const pwdSrc = readGarantiPasswordSource();
  const pwd = readGarantiPassword();
  return {
    configured: missing.length === 0,
    missing,
    testMode: readEnv('GARANTI_MODE').toUpperCase() !== 'PROD',
    siteUrl: readEnv('SITE_URL') || null,
    passwordSource: pwdSrc,
    passwordLen: pwd ? pwd.length : 0,
    storeKeyLen: store.len,
    storeKeyIs24Hex: store.is24Hex,
    storeKeyHasWhitespace: store.hasWhitespace,
  };
}

function garantiConfig() {
  const merchantId = readEnv('GARANTI_MERCHANT_ID');
  const terminalId = String(readEnv('GARANTI_TERMINAL_ID') || '').replace(/\D/g, '');
  const provPassword = readGarantiPassword();
  const storeKey = readEnv('GARANTI_STORE_KEY');
  if (!merchantId || !terminalId || !provPassword || !storeKey) return null;

  const mode = readEnv('GARANTI_MODE').toUpperCase() === 'PROD' ? 'PROD' : 'TEST';
  const provUserId = readGarantiProvUser();
  const securityLevel = readSecurityLevel();
  // Resmi örneklerde terminaluserid = üye işyeri kullanıcı adı (merchant), PROVOOS değil
  const terminalUserId =
    readEnv('GARANTI_TERMINAL_USER_ID') || merchantId || provUserId;
  const autPassword =
    readEnv('GARANTI_PROV_PASSWORD') || readEnv('GARANTI_PROVISION_PASSWORD') || '';
  return {
    merchantId,
    terminalId,
    provUserId,
    terminalUserId,
    provPassword,
    autPassword,
    storeKey,
    mode,
    securityLevel,
    apiVersion: readEnv('GARANTI_API_VERSION') || '512',
    companyName: readEnv('GARANTI_COMPANY_NAME') || 'Online VIP Dershane',
    passwordSource: readGarantiPasswordSource(),
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
 * Resmi C#: Sha1(provisionPassword + "0" + terminalId) — baştaki sıfırlar atılır.
 */
function buildHashedPassword(provPassword, terminalId) {
  const tid = String(terminalId || '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');
  return sha1HexUpper(String(provPassword) + '0' + tid);
}

/**
 * Peşin taksit: resmi GetHashData(int) "0" birleştirir.
 * Boş bırakılırsa 3D geçip satış adımı düşebiliyor (TROY Success, tahsilat yok).
 */
function normalizeInstallmentForHash(installmentCount) {
  const raw = String(installmentCount == null ? '' : installmentCount).trim();
  if (!raw || raw === '0') return '0';
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n <= 1) return '0';
  return String(n);
}

function normalizeInstallmentForForm(installmentCount) {
  return normalizeInstallmentForHash(installmentCount);
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
  const installment = normalizeInstallmentForHash(installmentCount);
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

function txnTimestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function vpServletUrl(mode) {
  return mode === 'PROD'
    ? 'https://sanalposprov.garanti.com.tr/VPServlet'
    : 'https://sanalposprovtest.garantibbva.com.tr/VPServlet';
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
  const installmentHash = normalizeInstallmentForHash(installmentCount);
  const installmentForm = normalizeInstallmentForForm(installmentCount);
  const securityLevel = cfg.securityLevel || '3D_OOS_PAY';
  const secure3dhash = buildSecure3dHash({
    terminalId: cfg.terminalId,
    orderId,
    amountKurus,
    currencyCode,
    successUrl,
    errorUrl,
    type,
    installmentCount: installmentHash,
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
    txninstallmentcount: installmentForm,
    txnmotoind: 'N',
    successurl: successUrl,
    errorurl: errorUrl,
    secure3dsecuritylevel: securityLevel,
    secure3dhash,
    lang,
    txntimestamp: txnTimestamp(),
    refreshtime: '5',
    companyname: String(cfg.companyName || '').slice(0, 80),
  };

  return {
    action: gatewayUrl(cfg.mode),
    fields,
  };
}

function scalarValue(val) {
  if (val == null) return '';
  if (Array.isArray(val)) {
    for (let i = val.length - 1; i >= 0; i -= 1) {
      const s = scalarValue(val[i]);
      if (s !== '') return s;
    }
    return '';
  }
  if (typeof val === 'object') return '';
  return String(val);
}

/** Vercel duplicate form fields (terminalid twice) → dizi; hash'i bozar. */
function flattenFormBody(body) {
  const out = {};
  for (const [k, v] of Object.entries(body || {})) out[k] = scalarValue(v);
  return out;
}

function sha1Base64(text, enc = 'latin1') {
  return crypto.createHash('sha1').update(String(text), enc).digest('base64');
}

function sha512Base64(text, enc = 'latin1') {
  return crypto.createHash('sha512').update(String(text), enc).digest('base64');
}

function normalizeIncomingHash(raw) {
  return String(raw || '')
    .trim()
    .replace(/ /g, '+');
}

function hashesMatch(computed, incoming) {
  if (!computed || !incoming) return false;
  if (computed === incoming) return true;
  if (/^[0-9A-Fa-f]+$/.test(computed) && /^[0-9A-Fa-f]+$/.test(incoming)) {
    return computed.toUpperCase() === incoming.toUpperCase();
  }
  return false;
}

function hashParamValue(src, lower, key) {
  const aliases = {
    clientid: ['clientid', 'clientId', 'terminalid', 'terminalId'],
    oid: ['oid', 'orderid', 'OrderId'],
  };
  const names = aliases[String(key).toLowerCase()] || [key];
  for (const name of names) {
    const val =
      src[name] ?? src[name.toLowerCase()] ?? src[name.toUpperCase()] ?? lower[String(name).toLowerCase()];
    if (val != null && String(val) !== '') return String(val);
  }
  return '';
}

/**
 * Bankadan dönen hash doğrulama.
 * hashparams: "clientid:oid:..." → değerler birleştirilir + storeKey
 * Callback hash: SHA1 binary → Base64 (28 karakter). Eski/yeni hex SHA1-SHA512 da kabul.
 */
function verifyCallbackHash(body, cfg) {
  const src = flattenFormBody(body);
  const hash = normalizeIncomingHash(src.hash || src.Hash);
  const hashparams = String(src.hashparams || src.HashParams || '').trim();
  if (!hash || !cfg?.storeKey) return false;

  const lower = {};
  for (const k of Object.keys(src)) lower[String(k).toLowerCase()] = src[k];

  const plains = [];
  if (hashparams) {
    const keys = hashparams.split(':').filter(Boolean);
    let concat = '';
    for (const key of keys) concat += hashParamValue(src, lower, key);
    plains.push(concat);
  }
  const paramsVal = String(src.hashparamsval || src.HashParamsVal || '').trim();
  if (paramsVal) plains.push(paramsVal);

  const storeKeys = [String(cfg.storeKey), String(cfg.storeKey).toLowerCase()];
  const candidates = [];
  for (const plain of plains) {
    for (const sk of storeKeys) {
      const withKey = plain + sk;
      candidates.push(
        sha1HexUpper(withKey),
        sha512HexUpper(withKey),
        sha1Base64(withKey, 'latin1'),
        sha512Base64(withKey, 'latin1'),
        sha1Base64(withKey, 'utf8'),
        sha512Base64(withKey, 'utf8')
      );
      candidates.push(
        crypto.createHash('sha1').update(withKey, 'utf8').digest('hex').toUpperCase(),
        crypto.createHash('sha512').update(withKey, 'utf8').digest('hex').toUpperCase()
      );
    }
  }
  return candidates.some((c) => hashesMatch(c, hash));
}

function field(body, ...names) {
  const src = flattenFormBody(body);
  for (const name of names) {
    if (src[name] != null && String(src[name]).trim() !== '') return src[name];
  }
  const lower = {};
  for (const k of Object.keys(src)) lower[String(k).toLowerCase()] = src[k];
  for (const name of names) {
    const v = lower[String(name).toLowerCase()];
    if (v != null && String(v).trim() !== '') return v;
  }
  return '';
}

function normalizeProcReturnCode(raw) {
  const p = String(raw || '').trim();
  if (!p) return '';
  if (/^0+$/.test(p)) return '00';
  return p;
}

function isApprovedResponse(raw) {
  const r = String(raw || '').trim().toLowerCase();
  if (!r) return false;
  if (/^0+$/.test(r)) return true;
  return /^approved\b/.test(r);
}

/** Gerçek tahsilat kanıtı: banka onay kodu. Hostref / TROY / 00 tek başına çekim değildir. */
function hasCaptureProof(authCode) {
  const auth = String(authCode || '').trim();
  return /^[A-Za-z0-9]{4,10}$/.test(auth) && !/^0+$/.test(auth);
}

function isTroyHostSuccess(body) {
  const msg = [
    field(body, 'mderrormessage', 'mdErrorMessage'),
    field(body, 'errmsg', 'ErrMsg'),
    field(body, 'hostmsg', 'HostMsg', 'hostmessage', 'HostMessage'),
  ].join(' ');
  return /code:\s*'0+'\s*.*message:\s*'success/i.test(msg);
}

function is3dAuthenticated(body) {
  const md = String(field(body, 'mdstatus', 'mdStatus')).trim();
  return ['1', '2', '3', '4'].includes(md);
}

/** Karttan tahsilat yalnızca authcode/hostref ile. Approved+00 veya TROY Success yeterli değil. */
function isProvisioned(body) {
  const md = String(field(body, 'mdstatus', 'mdStatus')).trim();
  if (md && !is3dAuthenticated(body)) return false;
  const proc = normalizeProcReturnCode(field(body, 'procreturncode', 'ProcReturnCode'));
  if (proc && proc !== '00') return false;
  const auth = String(field(body, 'authcode', 'AuthCode', 'authCode')).trim();
  return hasCaptureProof(auth);
}

function isPaymentSuccess(body) {
  return isProvisioned(body);
}

function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlProvAttempts(cfg) {
  const aut = String(cfg.autPassword || '').trim();
  const oos = String(cfg.provPassword || '').trim();
  const attempts = [];
  if (aut) attempts.push({ userId: 'PROVAUT', password: aut });
  if (oos && oos !== aut) attempts.push({ userId: 'PROVOOS', password: oos });
  if (!attempts.length && oos) attempts.push({ userId: 'PROVOOS', password: oos });
  return attempts;
}

function buildXmlHashData({ orderId, terminalId, provPassword, amountKurus, algo = 'sha512' }) {
  const hashedPassword = buildHashedPassword(provPassword, terminalId);
  const raw = String(orderId) + String(terminalId) + hashedPassword + String(amountKurus);
  return algo === 'sha1' ? sha1HexUpper(raw) : sha512HexUpper(raw);
}

function xmlTag(xml, tag) {
  const m = String(xml || '').match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? String(m[1]).trim() : '';
}

function parseGvpsResponse(xml) {
  const proc = normalizeProcReturnCode(xmlTag(xml, 'ProcReturnCode'));
  const response = xmlTag(xml, 'Response');
  const authCode = xmlTag(xml, 'AuthCode');
  const hostRef = xmlTag(xml, 'RetrefNum') || xmlTag(xml, 'HostRefNum');
  const err = xmlTag(xml, 'ErrorMsg') || xmlTag(xml, 'SysErrMsg');
  const ok = proc === '00' && /^approved$/i.test(response) && hasCaptureProof(authCode);
  return { ok, proc, response, authCode, hostRef, err };
}

function buildGvpsXml(cfg, { type, body, include3d, cred }) {
  const orderId = String(field(body, 'orderid', 'OrderId', 'oid') || '').trim();
  const amount = String(field(body, 'txnamount', 'TxnAmount', 'amount') || '').trim();
  const email = String(field(body, 'customeremailaddress', 'customeremail') || '').slice(0, 64);
  const ip = String(field(body, 'customeripaddress', 'customerip') || '127.0.0.1').slice(0, 40);
  const installment = normalizeInstallmentForHash(
    field(body, 'txninstallmentcount', 'txnInstallmentCount')
  );
  const hashData = buildXmlHashData({
    orderId,
    terminalId: cfg.terminalId,
    provPassword: cred.password,
    amountKurus: amount,
    algo: cred.hashAlgo || 'sha512',
  });
  const secure3d = include3d
    ? `<Secure3D>
      <AuthenticationCode>${xmlEscape(field(body, 'cavv', 'Cavv'))}</AuthenticationCode>
      <SecurityLevel>${xmlEscape(field(body, 'eci', 'Eci'))}</SecurityLevel>
      <TxnID>${xmlEscape(field(body, 'xid', 'Xid'))}</TxnID>
      <Md>${xmlEscape(field(body, 'md', 'Md'))}</Md>
    </Secure3D>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<GVPSRequest>
  <Mode>${xmlEscape(cfg.mode)}</Mode>
  <Version>${xmlEscape(cfg.apiVersion || '512')}</Version>
  <ChannelCode></ChannelCode>
  <Terminal>
    <ProvUserID>${xmlEscape(cred.userId)}</ProvUserID>
    <HashData>${hashData}</HashData>
    <UserID>${xmlEscape(cfg.terminalUserId)}</UserID>
    <ID>${xmlEscape(cfg.terminalId)}</ID>
    <MerchantID>${xmlEscape(cfg.merchantId)}</MerchantID>
  </Terminal>
  <Customer>
    <IPAddress>${xmlEscape(ip)}</IPAddress>
    <EmailAddress>${xmlEscape(email)}</EmailAddress>
  </Customer>
  <Card>
    <Number></Number>
    <ExpireDate></ExpireDate>
    <CVV2></CVV2>
  </Card>
  <Order>
    <OrderID>${xmlEscape(orderId)}</OrderID>
    <GroupID></GroupID>
  </Order>
  <Transaction>
    <Type>${xmlEscape(type)}</Type>
    <InstallmentCnt>${installment === '0' ? '' : xmlEscape(installment)}</InstallmentCnt>
    <Amount>${xmlEscape(amount)}</Amount>
    <CurrencyCode>949</CurrencyCode>
    <CardholderPresentCode>${include3d ? '13' : '0'}</CardholderPresentCode>
    <MotoInd>N</MotoInd>
    ${secure3d}
  </Transaction>
</GVPSRequest>`;
}

async function postGvps(cfg, xml) {
  const res = await fetch(vpServletUrl(cfg.mode), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(xml),
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  return parseGvpsResponse(text);
}

/** 3D geçtiyse ama satış yoksa VPServlet ile tahsil et. orderinq 00 ≠ çekim; authcode şart. */
async function captureAfter3d(cfg, body) {
  if (!cfg) return { ok: false, err: 'Garanti yapılandırması eksik' };
  if (!is3dAuthenticated(body)) return { ok: false, err: '3D doğrulama yok' };
  if (isProvisioned(body)) {
    return { ok: true, already: true, authCode: field(body, 'authcode', 'AuthCode') };
  }

  const attempts = xmlProvAttempts(cfg);
  if (!attempts.length) return { ok: false, err: 'PROVAUT/PROVOOS şifresi yok' };

  try {
    const inq = await postGvps(
      cfg,
      buildGvpsXml(cfg, { type: 'orderinq', body, include3d: false, cred: attempts[0] })
    );
    if (inq.ok) {
      console.log('garanti-xml: order already captured', { hasAuth: Boolean(inq.authCode) });
      return { ...inq, already: true };
    }
  } catch (err) {
    console.warn('garanti-xml: orderinq', err.message);
  }

  if (!field(body, 'md', 'Md')) {
    return { ok: false, err: '3D md alanı yok, satış gönderilemedi' };
  }

  let last = { ok: false, err: 'XML satış başarısız' };
  const hashAlgos = ['sha512', 'sha1'];
  for (const cred of attempts) {
    for (const hashAlgo of hashAlgos) {
      try {
        const sales = await postGvps(
          cfg,
          buildGvpsXml(cfg, {
            type: 'sales',
            body,
            include3d: true,
            cred: { ...cred, hashAlgo },
          })
        );
        console.log('garanti-xml: sales', {
          user: cred.userId,
          hashAlgo,
          ok: sales.ok,
          proc: sales.proc,
          response: sales.response,
          hasAuth: Boolean(sales.authCode),
          err: sales.err,
        });
        if (sales.ok) return sales;
        last = sales.err ? sales : { ...sales, err: sales.response || sales.proc || 'XML satış başarısız' };
      } catch (err) {
        console.error('garanti-xml: sales error', cred.userId, hashAlgo, err.message);
        last = { ok: false, err: err.message || 'XML satış hatası' };
      }
    }
  }
  return last;
}

module.exports = {
  garantiConfig,
  garantiEnvCheck,
  buildHashedPassword,
  buildSecure3dHash,
  buildCommonPaymentForm,
  verifyCallbackHash,
  isPaymentSuccess,
  isTroyHostSuccess,
  is3dAuthenticated,
  isProvisioned,
  hasCaptureProof,
  flattenFormBody,
  captureAfter3d,
  makeOrderId,
  clientIp,
  gatewayUrl,
  storeKeyMeta,
};
