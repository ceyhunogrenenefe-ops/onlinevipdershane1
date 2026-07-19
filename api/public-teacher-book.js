/**
 * Panel public rezervasyon proxy
 * POST /api/public-teacher-book
 */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const base = String(process.env.KOCLUK_PANEL_URL || '').replace(/\/$/, '');
  if (!base) return res.status(503).json({ error: 'panel_not_configured' });

  try {
    const upstream = await fetch(`${base}/api/public-teacher-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[public-teacher-book]', err);
    return res.status(502).json({ error: 'upstream_unreachable' });
  }
};
