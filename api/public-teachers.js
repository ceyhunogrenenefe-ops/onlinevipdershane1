/**
 * Panel public öğretmen API proxy (CORS / tek origin).
 * GET /api/public-teachers
 * GET /api/public-teachers?slug=
 */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const base = String(process.env.KOCLUK_PANEL_URL || '').replace(/\/$/, '');
  if (!base) {
    return res.status(200).json({ teachers: [], source: 'fallback', error: 'panel_not_configured' });
  }

  try {
    const slug = String(req.query.slug || '').trim();
    const url = slug
      ? `${base}/api/public/teachers?slug=${encodeURIComponent(slug)}`
      : `${base}/api/public/teachers`;

    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
    });
    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      if (upstream.status === 404) return res.status(404).json({ error: 'not_found' });
      return res.status(502).json({ error: 'upstream_error', status: upstream.status });
    }

    if (slug) return res.status(200).json({ teacher: data.teacher || null, source: 'panel' });
    return res.status(200).json({ teachers: data.teachers || [], source: 'panel' });
  } catch (err) {
    console.error('[public-teachers]', err);
    return res.status(200).json({ teachers: [], source: 'fallback', error: 'upstream_unreachable' });
  }
};
