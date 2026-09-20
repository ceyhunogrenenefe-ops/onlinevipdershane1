/**
 * Drive tanıtım videosunu HTML5 <video> ile oynatmak için yönlendirir.
 * GET /api/teacher-media?drive=FILE_ID
 */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const driveId = String(req.query.drive || '').trim();
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(driveId)) {
    return res.status(400).json({ error: 'invalid_id' });
  }

  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  return res.redirect(
    302,
    'https://drive.usercontent.google.com/download?id=' + encodeURIComponent(driveId) + '&export=download'
  );
};
