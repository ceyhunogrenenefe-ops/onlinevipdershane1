const { paytrConfig, paytrEnvCheck } = require('./_lib/paytr');
const { garantiConfig, garantiEnvCheck } = require('./_lib/garanti');
const { ziraatConfig, ziraatEnvCheck } = require('./_lib/ziraat');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const paytr = paytrEnvCheck();
  const paytrCfg = paytrConfig();
  const garanti = garantiEnvCheck();
  const garantiCfg = garantiConfig();
  const ziraat = ziraatEnvCheck();
  const ziraatCfg = ziraatConfig();

  const forced = String(process.env.PAYMENT_PROVIDER || '')
    .trim()
    .toLowerCase();

  const providers = [];
  if (garantiCfg) providers.push('garanti');
  if (ziraatCfg) providers.push('ziraat');
  if (paytrCfg) providers.push('paytr');

  let provider = 'none';
  if (forced === 'garanti' && garantiCfg) provider = 'garanti';
  else if (forced === 'ziraat' && ziraatCfg) provider = 'ziraat';
  else if (forced === 'paytr' && paytrCfg) provider = 'paytr';
  else if (forced === 'stripe' && process.env.STRIPE_SECRET_KEY) provider = 'stripe';
  else if (garantiCfg) provider = 'garanti';
  else if (ziraatCfg) provider = 'ziraat';
  else if (paytrCfg) provider = 'paytr';
  else if (process.env.STRIPE_SECRET_KEY) provider = 'stripe';

  return res.status(200).json({
    provider,
    providers,
    paytr: paytrCfg
      ? {
          configured: true,
          testMode: paytrCfg.testMode === 1,
          callbackUrl: paytr.siteUrl
            ? `${paytr.siteUrl.replace(/\/$/, '')}/api/paytr-callback`
            : null,
        }
      : {
          configured: false,
          missingEnv: paytr.missing,
        },
    garanti: garantiCfg
      ? {
          configured: true,
          testMode: garantiCfg.mode !== 'PROD',
          mode: garantiCfg.mode,
          securityLevel: garantiCfg.securityLevel,
          provUserId: garantiCfg.provUserId,
          terminalUserId: garantiCfg.terminalUserId,
          passwordSource: garanti.passwordSource,
          passwordLen: garanti.passwordLen,
          storeKeyLen: garanti.storeKeyLen,
          storeKeyIs24Hex: garanti.storeKeyIs24Hex,
          storeKeyIs24ByteHex: garanti.storeKeyIs24Hex,
          storeKeyHasWhitespace: garanti.storeKeyHasWhitespace,
          label: 'Garanti Bonus POS (ortak ödeme)',
        }
      : {
          configured: false,
          missingEnv: garanti.missing,
          hint:
            garanti.missing.length > 0
              ? 'Vercel → Environment Variables: GARANTI_MERCHANT_ID, GARANTI_TERMINAL_ID, GARANTI_PROVISION_OOS_PASSWORD (PROVOOS), GARANTI_STORE_KEY (48 karakter = 24 byte HEX), GARANTI_MODE=PROD, GARANTI_SECURITY_LEVEL=3D_OOS_PAY.'
              : 'Garanti Bonus POS yapılandırılmamış.',
        },
    ziraat: ziraatCfg
      ? {
          configured: true,
          testMode: ziraatCfg.mode !== 'PROD',
          mode: ziraatCfg.mode,
          storeType: ziraatCfg.storeType,
          terminalId: ziraat.terminalId || ziraatCfg.terminalId || null,
          storeKeyLen: ziraat.storeKeyLen,
          storeKeyHasWhitespace: ziraat.storeKeyHasWhitespace,
          hasApiUser: ziraat.hasApiUser,
          label: 'Ziraat Sanal POS (ortak ödeme)',
        }
      : {
          configured: false,
          missingEnv: ziraat.missing,
          terminalId: ziraat.terminalId || null,
          hint:
            'Ziraat Payten/NestPay: Üye işyeri no → ZIRAAT_CLIENT_ID, terminal → ZIRAAT_TERMINAL_ID, 3D güvenlik anahtarı → ZIRAAT_STORE_KEY, canlı için ZIRAAT_MODE=PROD.',
        },
  });
};
