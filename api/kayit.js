const { createKommoLead } = require('./_lib/kommo');

const FORMSPREE_ID = process.env.FORMSPREE_FORM_ID || 'mpqnjdwd';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return req.body;
}

function normalize(payload) {
  return {
    ad: String(payload.ad || '').trim(),
    soyad: String(payload.soyad || '').trim(),
    telefon: String(payload.telefon || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    sinif: String(payload.sinif || '').trim(),
    program: String(payload.program || '').trim(),
    okul: String(payload.okul || '').trim(),
    not: String(payload.not || '').trim(),
  };
}

function validate(data) {
  if (!data.ad || !data.soyad) return 'Ad ve soyad zorunludur.';
  if (!data.telefon) return 'Telefon zorunludur.';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Geçerli e-posta girin.';
  if (!data.sinif) return 'Sınıf seçin.';
  if (!data.program) return 'Program seçin.';
  return null;
}

async function sendFormspreeEmail(data) {
  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      form: 'kayit',
      ad: data.ad,
      soyad: data.soyad,
      telefon: data.telefon,
      email: data.email,
      sinif: data.sinif,
      program: data.program,
      okul: data.okul,
      not: data.not,
      _subject: 'Yeni Kayıt Talebi — Online VIP Dershane',
      _replyto: data.email,
    }),
  });

  if (!res.ok) {
    const err = new Error('Formspree error');
    err.status = res.status;
    err.details = await res.text();
    throw err;
  }
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = normalize(parseBody(req));
  const validationError = validate(data);
  if (validationError) return res.status(400).json({ error: validationError });

  const results = { email: false, kommo: false };
  const errors = [];

  try {
    await sendFormspreeEmail(data);
    results.email = true;
  } catch (err) {
    errors.push({ channel: 'email', message: err.message, details: err.details || null });
  }

  try {
    const kommo = await createKommoLead(data);
    results.kommo = kommo.skipped ? 'skipped' : true;
    if (kommo.skipped) results.kommoReason = kommo.reason;
  } catch (err) {
    errors.push({
      channel: 'kommo',
      message: err.message,
      status: err.status || null,
      details: err.details || null,
    });
  }

  if (results.email || results.kommo === true) {
    return res.status(200).json({ ok: true, results, errors });
  }

  return res.status(502).json({
    error: 'Kayıt gönderilemedi. Lütfen tekrar deneyin veya 0850 303 40 14 numarayı arayın.',
    results,
    errors,
  });
};
