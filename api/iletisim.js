const { createKommoLead, splitName } = require('./_lib/kommo');
const { isValidTrMobile, normalizeTrPhone } = require('./_lib/assessment-phone');
const { sendCrmLeadSafe } = require('./_lib/crm-lead');

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
  const adSoyad = String(payload.ad_soyad || '').trim();
  const name = splitName(adSoyad);
  const type = String(payload.type || '').trim();
  const isFreeTrial = type === 'free_trial_3_days';
  return {
    ad: name.ad,
    soyad: name.soyad,
    telefon: normalizeTrPhone(payload.telefon) || String(payload.telefon || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    sinif: String(payload.sinif || '').trim(),
    program: isFreeTrial
      ? '3 Günlük Ücretsiz Deneme Dersi'
      : String(payload.program || '').trim(),
    not: String(payload.not || '').trim(),
    type: type,
  };
}

function validate(data) {
  if (!data.ad && !data.soyad) return 'Ad soyad zorunludur.';
  if (!data.telefon) return 'Telefon zorunludur.';
  if (!isValidTrMobile(data.telefon)) return 'Geçerli cep telefonu girin.';
  if (data.program === 'Sizi Arayalım') {
    if (!data.sinif) data.sinif = 'Belirtilmedi';
  } else if (data.type === 'free_trial_3_days') {
    if (!data.sinif) return 'Sınıf seçin.';
  } else if (!data.sinif) {
    return 'Sınıf seçin.';
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Geçerli e-posta girin.';
  return null;
}

async function sendFormspreeEmail(data) {
  const isFreeTrial = data.type === 'free_trial_3_days';
  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      form: isFreeTrial ? 'free_trial_3_days' : 'iletisim',
      type: data.type || '',
      ad_soyad: [data.ad, data.soyad].filter(Boolean).join(' '),
      telefon: data.telefon,
      email: data.email,
      sinif: data.sinif,
      program: data.program,
      not: data.not,
      _subject: isFreeTrial
        ? '3 Günlük Ücretsiz Deneme — Online VIP Dershane'
        : data.program === 'Sizi Arayalım'
          ? 'Sizi Arayalım — Online VIP Dershane'
          : 'Yeni Tanışma Dersi Talebi — Online VIP Dershane',
      _replyto: data.email || undefined,
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

  const results = { email: false, kommo: false, crm: false };
  const errors = [];
  const leadName = [data.ad, data.soyad].filter(Boolean).join(' ').trim();

  // Tarayıcı kopyası (crm-site-lead.js) düşmezse yedek; panel aynı kaydı iki kez yazmaz.
  try {
    const crm = await sendCrmLeadSafe({
      form_kind: data.program === 'Sizi Arayalım' ? 'callback' : 'iletisim',
      ad_soyad: leadName,
      telefon: data.telefon,
      email: data.email,
      sinif: data.sinif,
      program: data.program,
      not: data.not,
      page: String(req.headers.referer || ''),
    });
    results.crm = crm.ok;
    if (!crm.ok && !crm.skipped) errors.push({ channel: 'crm', message: crm.error || 'crm_failed' });
  } catch (err) {
    errors.push({ channel: 'crm', message: err.message });
  }
  const kommoTitle = `${leadName} | ${data.sinif} | ${data.program || 'Tanışma Dersi'}`;

  try {
    await sendFormspreeEmail(data);
    results.email = true;
  } catch (err) {
    errors.push({ channel: 'email', message: err.message, details: err.details || null });
  }

  try {
    const kommoTag =
      data.type === 'free_trial_3_days'
        ? '3 Gün Ücretsiz Deneme'
        : data.program === 'Sizi Arayalım'
          ? 'Sizi Arayalım'
          : 'İletişim Formu';
    const kommo = await createKommoLead(data, {
      tag: kommoTag,
      title: kommoTitle,
    });
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

  if (results.email || results.kommo === true || results.crm) {
    return res.status(200).json({ ok: true, results, errors });
  }

  return res.status(502).json({
    error: 'Form gönderilemedi. Lütfen tekrar deneyin veya 0850 303 40 14 numarayı arayın.',
    results,
    errors,
  });
};
