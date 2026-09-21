/**
 * Site formları → koçluk panelindeki CRM (Kayıt Takibi + Gelen Kutusu)
 *
 * Neden sunucudan: crm-site-lead.js tarayıcıda çalışır; reklam engelleyici,
 * CSP ya da script yüklenememesi durumunda lead CRM'e hiç düşmez. Kayıt formu
 * (/api/kayit) zaten hiç aktarılmıyordu. Burası formun asıl gönderimini
 * beklemeden, hata verse bile akışı bozmadan aynı veriyi CRM'e kopyalar.
 *
 * Panel tarafı aynı telefonu + form türünü 30 dakikalık pencerede tek kayıt
 * sayar; tarayıcı kopyası da gelse ikinci kez yazılmaz.
 */
const PANEL_FALLBACK = 'https://www.dersonlinevipkocluk.com';
const SITE_FALLBACK = 'https://www.onlinevipdershane.com';

function panelBase() {
  const raw = String(process.env.KOCLUK_PANEL_URL || PANEL_FALLBACK).trim();
  return raw.replace(/\/$/, '');
}

/** Panelin izinli listesindeki alan adı; SITE_URL başka bir yeri gösteriyorsa yedeğe döner. */
function siteOrigin() {
  const raw = String(process.env.SITE_URL || '').trim().replace(/\/$/, '');
  return /^https:\/\/(www\.)?onlinevipdershane\.com$/i.test(raw) ? raw : SITE_FALLBACK;
}

function clean(v) {
  const s = v == null ? '' : String(v).trim();
  return s || undefined;
}

/**
 * @param {object} lead
 * @param {string} lead.form_kind  'kayit' | 'iletisim' | 'callback' | 'assessment'
 * @param {string} lead.telefon    zorunlu; yoksa gönderilmez
 * @returns {Promise<{ ok: boolean, status?: number, error?: string, skipped?: boolean }>}
 */
async function sendCrmLead(lead) {
  const payload = {};
  for (const [k, v] of Object.entries(lead || {})) {
    const val = typeof v === 'object' && v !== null ? v : clean(v);
    if (val !== undefined) payload[k] = val;
  }
  if (!payload.telefon) return { ok: false, skipped: true, error: 'telefon_yok' };

  const url = `${panelBase()}/api/site-leads`;
  // Panel çağıranı Origin ya da gizli anahtarla tanır. Origin olarak sitenin kendi
  // alan adını yolluyoruz (isteği gerçekten o site yapıyor); anahtar tanımlıysa o da eklenir.
  const secret = String(
    process.env.SITE_LEAD_WEBHOOK_SECRET || process.env.OZEL_DERS_WEBHOOK_SECRET || ''
  ).trim();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: siteOrigin(),
  };
  if (secret) headers['x-site-lead-secret'] = secret;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text.slice(0, 200) };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err).slice(0, 200) };
  }
}

/** Formun kendi yanıtını geciktirmeden CRM'e kopyalar; hata yutulur. */
async function sendCrmLeadSafe(lead) {
  try {
    const out = await sendCrmLead(lead);
    if (!out.ok && !out.skipped) console.warn('[crm-lead]', out.status || '', out.error || '');
    return out;
  } catch (err) {
    console.warn('[crm-lead]', String((err && err.message) || err).slice(0, 200));
    return { ok: false, error: 'crm_lead_failed' };
  }
}

module.exports = { sendCrmLead, sendCrmLeadSafe };
