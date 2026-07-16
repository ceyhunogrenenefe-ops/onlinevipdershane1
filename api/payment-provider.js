const { paytrConfig, paytrEnvCheck } = require('./_lib/paytr');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const paytr = paytrEnvCheck();
  const cfg = paytrConfig();

  if (cfg) {
    return res.status(200).json({
      provider: 'paytr',
      testMode: cfg.testMode === 1,
      callbackUrl: paytr.siteUrl
        ? `${paytr.siteUrl.replace(/\/$/, '')}/api/paytr-callback`
        : null,
    });
  }

  if (process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ provider: 'stripe' });
  }

  return res.status(200).json({
    provider: 'none',
    paytr: {
      configured: false,
      missingEnv: paytr.missing,
      hint:
        paytr.missing.length > 0
          ? 'Vercel → onlinevipdershane1 → Settings → Environment Variables: PayTR değerleri boş veya eksik. Kaydettikten sonra yeniden deploy edin.'
          : 'Ödeme sağlayıcısı yapılandırılmamış.',
    },
  });
};
