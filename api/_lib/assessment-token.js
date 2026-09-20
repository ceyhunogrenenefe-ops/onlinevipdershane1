var crypto = require('crypto');

function secret() {
  return String(process.env.ASSESSMENT_TOKEN_SECRET || process.env.KOMMO_ACCESS_TOKEN || 'ovd-assess-dev').trim();
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromB64url(s) {
  var pad = s.length % 4 === 0 ? '' : '===='.slice(s.length % 4);
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function signPayload(obj) {
  var json = JSON.stringify(obj);
  var iv = crypto.randomBytes(12);
  var key = crypto.createHash('sha256').update(secret()).digest();
  var cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  var enc = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  var tag = cipher.getAuthTag();
  var pack = Buffer.concat([iv, tag, enc]);
  return b64url(pack);
}

function openPayload(token) {
  var raw = fromB64url(String(token || ''));
  if (raw.length < 29) throw new Error('Geçersiz bağlantı');
  var iv = raw.subarray(0, 12);
  var tag = raw.subarray(12, 28);
  var enc = raw.subarray(28);
  var key = crypto.createHash('sha256').update(secret()).digest();
  var decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  var json = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  return JSON.parse(json);
}

function randomId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  var b = crypto.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  var h = b.toString('hex');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}

function idempotencyKey(event, phone) {
  return crypto
    .createHash('sha256')
    .update(String(event) + '|' + String(phone || ''))
    .digest('hex');
}

module.exports = { signPayload, openPayload, randomId, idempotencyKey };
