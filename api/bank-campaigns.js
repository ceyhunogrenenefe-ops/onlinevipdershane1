const { buildCampaignPayload } = require('./_lib/bank-campaigns');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const refresh = String(req.query?.refresh || '') === '1';
    const data = await buildCampaignPayload({ refresh, timeoutMs: refresh ? 5000 : 0 });
    return res.status(200).json({ ok: true, ...data });
  } catch (_) {
    return res.status(200).json({
      ok: true,
      title: 'Bankaların Eğitime Taksit Avantajları',
      disclaimer: 'Kampanya bilgisi şu an gösterilemiyor. Bankanın resmi sayfasını kontrol edin.',
      updatedAt: null,
      banks: [],
    });
  }
};
