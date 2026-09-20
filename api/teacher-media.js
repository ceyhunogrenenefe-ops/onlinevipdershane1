/**
 * Drive tanıtım videosunu HTML5 <video> ile oynatılabilir hâle getirir.
 * GET /api/teacher-media?drive=FILE_ID
 *
 * Neden vekil: Drive büyük dosyalarda önce "virüs taraması" HTML sayfası döndürür
 * (<video> bunu oynatamaz). Burada o sayfadaki onay formu çözülüp gerçek video
 * baytları akıtılır. Range başlığı geçirilir; tarayıcı videoyu parça parça çeker.
 */
const { Readable } = require('stream');

const DOWNLOAD_BASE = 'https://drive.usercontent.google.com/download';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
}

/** Onay sayfasındaki formdan gerçek indirme adresini çıkarır */
function confirmUrlFromHtml(html) {
  const action = (html.match(/<form[^>]+action="([^"]+)"/i) || [])[1];
  if (!action) return '';
  const url = new URL(action.replace(/&amp;/g, '&'));
  const re = /<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) url.searchParams.set(m[1], m[2].replace(/&amp;/g, '&'));
  return url.toString();
}

function isHtml(response) {
  return String(response.headers.get('content-type') || '').toLowerCase().includes('text/html');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const driveId = String((req.query && req.query.drive) || '').trim();
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(driveId)) {
    return res.status(400).json({ error: 'invalid_id' });
  }

  const range = req.headers && req.headers.range ? String(req.headers.range) : '';
  const fetchOpts = { headers: { 'User-Agent': UA, ...(range ? { Range: range } : {}) }, redirect: 'follow' };

  try {
    let upstream = await fetch(`${DOWNLOAD_BASE}?id=${encodeURIComponent(driveId)}&export=download`, fetchOpts);

    if (isHtml(upstream)) {
      const html = await upstream.text();
      const confirmUrl = confirmUrlFromHtml(html);
      if (!confirmUrl) {
        // Dosya herkese açık değilse Google giriş sayfası döner
        return res.status(403).json({
          error: 'drive_not_public',
          hint: 'Drive dosyası "Bağlantıya sahip herkes" olarak paylaşılmalı.'
        });
      }
      upstream = await fetch(confirmUrl, fetchOpts);
      if (isHtml(upstream)) {
        return res.status(502).json({ error: 'drive_confirm_failed' });
      }
    }

    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status === 404 ? 404 : 502).json({ error: 'drive_fetch_failed', status: upstream.status });
    }

    const pass = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag'];
    pass.forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    });
    if (!upstream.headers.get('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=86400');
    res.status(upstream.status === 206 ? 206 : 200);

    if (req.method === 'HEAD' || !upstream.body) return res.end();
    return Readable.fromWeb(upstream.body).pipe(res);
  } catch (e) {
    return res.status(502).json({ error: 'drive_proxy_error', message: e instanceof Error ? e.message : String(e) });
  }
};
