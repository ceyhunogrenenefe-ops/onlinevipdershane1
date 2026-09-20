/**
 * Panel öğretmen başvuru proxy
 * POST /api/teacher-applications
 * POST /api/teacher-applications?op=upload-photo|upload-document
 */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (_) {
      return {};
    }
  }
  return req.body;
}

function inferOp(body, queryOp) {
  var op = String(queryOp || body.op || '').trim().toLowerCase();
  if (op) return op;
  if (!(body.fileBase64 || body.file_base64 || body.dataUrl || body.data_url)) return '';
  var ct = String(body.contentType || body.content_type || '').toLowerCase();
  var name = String(body.fileName || body.file_name || '').toLowerCase();
  if (ct.indexOf('pdf') !== -1 || name.endsWith('.pdf')) return 'upload-document';
  if (ct.indexOf('image/') === 0 || /\.(jpe?g|png|webp)$/.test(name)) return 'upload-photo';
  return 'upload-document';
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const base = String(process.env.KOCLUK_PANEL_URL || '').replace(/\/$/, '');
  if (!base) return res.status(503).json({ error: 'panel_not_configured' });

  try {
    const body = parseBody(req);
    const queryOp = req.query && req.query.op;
    const op = inferOp(body, queryOp);
    if (op && !body.op) body.op = op;

    const qs = op ? '?op=' + encodeURIComponent(op) : '';
    const upstream = await fetch(`${base}/api/teacher-applications${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout ? AbortSignal.timeout(60000) : undefined
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[teacher-applications]', err);
    return res.status(502).json({ error: 'upstream_unreachable' });
  }
};
