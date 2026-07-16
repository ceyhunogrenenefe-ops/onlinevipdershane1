const { createKommoLead, splitName } = require('./_lib/kommo');

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
  const tanitim = String(payload.tanitim || '').trim();
  const cvLink = String(payload.cv_link || '').trim();
  const notParts = [];
  if (tanitim) notParts.push(tanitim);
  if (cvLink) notParts.push(`CV: ${cvLink}`);

  return {
    ad: name.ad,
    soyad: name.soyad,
    telefon: String(payload.telefon || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    brans: String(payload.brans || '').trim(),
    deneyim: String(payload.deneyim || '').trim(),
    not: notParts.join('\n'),
  };
}

function validate(data) {
  if (!data.ad && !data.soyad) return 'Ad soyad zorunludur.';
  if (!data.telefon) return 'Telefon zorunludur.';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Geçerli e-posta girin.';
  if (!data.brans) return 'Branş seçin.';
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
      form: 'kariyer',
      ad_soyad: [data.ad, data.soyad].filter(Boolean).join(' '),
      telefon: data.telefon,
      email: data.email,
      brans: data.brans,
      deneyim: data.deneyim,
      tanitim: data.not,
      _subject: 'Yeni Öğretmen Başvurusu — Online VIP Dershane',
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
  const leadName = [data.ad, data.soyad].filter(Boolean).join(' ').trim();
  const kommoTitle = `${leadName} | ${data.brans} | ${data.deneyim || 'Deneyim belirtilmedi'}`;

  try {
    await sendFormspreeEmail(data);
    results.email = true;
  } catch (err) {
    errors.push({ channel: 'email', message: err.message, details: err.details || null });
  }

  try {
    const kommo = await createKommoLead(
      {
        ad: data.ad,
        soyad: data.soyad,
        telefon: data.telefon,
        email: data.email,
        sinif: data.deneyim,
        program: data.brans,
        not: data.not,
      },
      {
        tag: 'Kariyer Başvurusu',
        title: kommoTitle,
      }
    );
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
    error: 'Başvuru gönderilemedi. Lütfen tekrar deneyin veya info@onlinevipdershane.com adresine yazın.',
    results,
    errors,
  });
};
