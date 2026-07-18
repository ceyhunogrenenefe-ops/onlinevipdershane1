/**
 * Panel → site öğretmen yayın sync webhook.
 * POST /api/teachers-sync
 * Headers: x-webhook-secret, x-signature (HMAC-SHA256 hex of raw body)
 */
const crypto = require('crypto');

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function rawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  return JSON.stringify(req.body || {});
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret, x-signature, x-request-id');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const secret = String(process.env.SITE_TEACHERS_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return res.status(503).json({ error: 'webhook_not_configured' });
  }

  const headerSecret = req.headers['x-webhook-secret'];
  const signature = req.headers['x-signature'];
  const raw = rawBody(req);
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');

  if (!safeEqual(headerSecret, secret) || !safeEqual(signature, expected)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }

  const event = String(payload.event || '');
  const slug = String(payload.slug || '');
  console.log('[teachers-sync]', event, slug || '(no-slug)', payload.request_id || '');

  // Canlı liste panel public API'den okunur; bu endpoint onay/senkron ACK içindir.
  return res.status(200).json({
    ok: true,
    event,
    slug,
    request_id: payload.request_id || null,
  });
};
