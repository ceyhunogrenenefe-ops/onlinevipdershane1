/**
 * Deneme Kulübü kayıt başvurusu.
 *
 * Başvuru koçluk panelindeki CRM'e `deneme_kulubu` kaynağıyla düşer; hangi
 * paketten geldiği ve Instagram reklamından mı geldiği (UTM) kayda yazılır.
 * E-posta bildirimi mevcut Formspree akışını kullanır.
 */
const { isValidTrMobile, normalizeTrPhone } = require('./_lib/assessment-phone');
const { sendCrmLeadSafe } = require('./_lib/crm-lead');
const dk = require('../assets/deneme-kulubu-data.js');

const FORMSPREE_ID = process.env.FORMSPREE_FORM_ID || 'mpqnjdwd';

/** Velinin seçebileceği aranma zamanları — serbest metin kabul edilmez. */
const CALL_SLOTS = ['Fark etmez', 'Sabah (09-12)', 'Öğleden sonra (12-17)', 'Akşam (17-21)'];

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

function clip(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

function normalize(payload) {
  const slug = clip(payload.paket, 40);
  const pkg = dk.bySlug(slug);
  const slot = clip(payload.aranma, 40);
  return {
    veli: clip(payload.veli, 120),
    telefon: normalizeTrPhone(payload.telefon) || clip(payload.telefon, 20),
    sinif: pkg ? pkg.short : clip(payload.sinif, 60),
    paketSlug: pkg ? pkg.slug : '',
    paketAdi: pkg ? pkg.title : '',
    aranma: CALL_SLOTS.indexOf(slot) !== -1 ? slot : CALL_SLOTS[0],
    kvkk: payload.kvkk === true || payload.kvkk === 'true' || payload.kvkk === 1,
    not: clip(payload.not, 500),
    utm: {
      source: clip(payload.utm_source, 60),
      medium: clip(payload.utm_medium, 60),
      campaign: clip(payload.utm_campaign, 80),
      content: clip(payload.utm_content, 80)
    }
  };
}

function validate(d) {
  if (!d.veli) return 'Veli adı soyadı zorunludur.';
  if (!d.telefon) return 'Telefon zorunludur.';
  if (!isValidTrMobile(d.telefon)) return 'Geçerli bir cep telefonu girin.';
  if (!d.paketSlug) return 'Paket seçin.';
  if (!d.kvkk) return 'Devam etmek için aydınlatma metnini onaylamanız gerekir.';
  return null;
}

function utmText(utm) {
  const parts = [];
  if (utm.source) parts.push('kaynak: ' + utm.source);
  if (utm.medium) parts.push('ortam: ' + utm.medium);
  if (utm.campaign) parts.push('kampanya: ' + utm.campaign);
  if (utm.content) parts.push('içerik: ' + utm.content);
  return parts.join(' · ');
}

async function sendFormspreeEmail(d) {
  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form: 'deneme_kulubu',
      veli: d.veli,
      telefon: d.telefon,
      sinif: d.sinif,
      paket: d.paketAdi,
      aranma: d.aranma,
      not: d.not,
      utm: utmText(d.utm),
      _subject: `Deneme Kulübü Başvurusu — ${d.paketAdi}`
    })
  });
  if (!res.ok) {
    const err = new Error('Formspree error');
    err.status = res.status;
    throw err;
  }
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const d = normalize(parseBody(req));
  const hata = validate(d);
  if (hata) return res.status(400).json({ error: hata });

  const results = { crm: false, email: false };
  const errors = [];

  const notlar = [
    `Paket: ${d.paketAdi}`,
    `Aranma tercihi: ${d.aranma}`,
    d.not ? `Not: ${d.not}` : '',
    utmText(d.utm) ? `Reklam: ${utmText(d.utm)}` : ''
  ].filter(Boolean).join('\n');

  try {
    const crm = await sendCrmLeadSafe({
      form_kind: 'deneme_kulubu',
      ad_soyad: d.veli,
      telefon: d.telefon,
      sinif: d.sinif,
      program: d.paketAdi,
      not: notlar,
      page: String(req.headers.referer || '')
    });
    results.crm = crm.ok;
    if (!crm.ok && !crm.skipped) errors.push({ channel: 'crm', message: crm.error || 'crm_failed' });
  } catch (err) {
    errors.push({ channel: 'crm', message: err.message });
  }

  try {
    await sendFormspreeEmail(d);
    results.email = true;
  } catch (err) {
    errors.push({ channel: 'email', message: err.message });
  }

  // CRM ya da e-postadan biri gittiyse başvuru alınmış sayılır; veliye hata gösterme
  const ok = results.crm || results.email;
  return res.status(ok ? 200 : 500).json({
    ok,
    results,
    errors: errors.length ? errors : undefined,
    message: ok ? 'Başvurunuz alındı. En kısa sürede sizi arayacağız.' : 'Başvuru kaydedilemedi.'
  });
};
