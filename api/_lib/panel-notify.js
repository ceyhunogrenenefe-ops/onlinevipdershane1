/**
 * Siteden koçluk paneline giden sipariş/ödeme bildirimleri — güvenceli gönderim.
 *
 * NEDEN VAR: Eskiden bildirimler `notify(...).catch(...)` ile beklenmeden
 * atılıyordu. Vercel fonksiyonu cevabı döndürdüğü anda dondurulduğu için bu
 * istekler çoğu zaman panele hiç ulaşmadı; veli ödeme yaptı, sipariş CRM'e
 * düşmedi. Kural: ödeme akışındaki her bildirim cevaptan ÖNCE `await` edilir.
 *
 * Buradaki fonksiyonlar asla hata fırlatmaz (ödeme akışını bozmasın diye);
 * bunun yerine tekrar dener, yine olmazsa ekibe "PANELE DÜŞMEDİ" e-postası atar.
 */

const FORMSPREE_ID = process.env.FORMSPREE_FORM_ID || 'mpqnjdwd';

const DEFAULTS = { attempts: 3, timeoutMs: 6000, baseDelayMs: 400 };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function panelUrl() {
  return String(process.env.KOCLUK_PANEL_URL || '')
    .trim()
    .replace(/\/$/, '');
}

function ozelDersSecret() {
  return String(process.env.OZEL_DERS_WEBHOOK_SECRET || '').trim();
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** fn başarılı olana kadar (en fazla attempts kez) dener; son hatayı fırlatır. */
async function withRetry(label, fn, opts = {}) {
  const { attempts, baseDelayMs } = { ...DEFAULTS, ...opts };
  let lastErr;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await fn(i);
    } catch (err) {
      lastErr = err;
      console.warn(`[panel-notify] ${label} deneme ${i}/${attempts} başarısız:`, err && err.message);
      if (i < attempts) await sleep(baseDelayMs * 2 ** (i - 1));
    }
  }
  throw lastErr;
}

/** Ekibe uyarı e-postası. Kendi hatasını yutar. */
async function alertOps(subject, details) {
  try {
    await fetchWithTimeout(
      `https://formspree.io/f/${FORMSPREE_ID}`,
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: 'panel-bildirim-hatasi',
          _subject: subject,
          ...details,
          not:
            'Bu ödeme/sipariş koçluk paneline otomatik düşmedi. Banka POS panelinden kontrol edip siparişi elle girin.',
        }),
      },
      DEFAULTS.timeoutMs
    );
  } catch (err) {
    console.error('[panel-notify] uyarı e-postası da gönderilemedi', err && err.message);
  }
}

/** Panel ozel-ders-talepleri webhook'una tek POST; HTTP hatasında fırlatır. */
async function postOzelDersWebhook(payload, timeoutMs) {
  const url = panelUrl();
  const secret = ozelDersSecret();
  if (!url || !secret) {
    throw new Error('KOCLUK_PANEL_URL veya OZEL_DERS_WEBHOOK_SECRET tanımlı değil');
  }
  const res = await fetchWithTimeout(
    `${url}/api/ozel-ders-talepleri?op=webhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
      body: JSON.stringify(payload),
    },
    timeoutMs
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`panel webhook HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  return true;
}

/**
 * Siparişi/ödemeyi panele güvenceli iletir. Asla fırlatmaz.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function deliverToPanel(label, payload, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  try {
    await withRetry(label, () => postOzelDersWebhook(payload, cfg.timeoutMs), cfg);
    return { ok: true };
  } catch (err) {
    const error = (err && err.message) || String(err);
    console.error(`[panel-notify] ${label} PANELE DÜŞMEDİ`, payload && payload.merchant_oid, error);
    await alertOps(`PANELE DÜŞMEDİ — ${label} — ${(payload && payload.merchant_oid) || ''}`, {
      olay: label,
      hata: error,
      ...payload,
    });
    return { ok: false, error };
  }
}

/**
 * Kitap mağazası (commerce) ödeme bildirimini tekrar deneyerek iletir; olmazsa
 * ekibe uyarı atar. Asla fırlatmaz.
 */
async function deliverCommercePaid(notifyFn, args) {
  try {
    await withRetry('commerce order.paid', () => notifyFn(args));
    return { ok: true };
  } catch (err) {
    const error = (err && err.message) || String(err);
    console.error('[panel-notify] commerce order.paid PANELE DÜŞMEDİ', args && args.merchantOid, error);
    await alertOps(`PANELE DÜŞMEDİ — kitap/deneme siparişi ödendi — ${(args && args.merchantOid) || ''}`, {
      olay: 'commerce order.paid',
      hata: error,
      merchant_oid: args && args.merchantOid,
      tutar_kurus: args && args.totalAmount,
      saglayici: args && args.provider,
    });
    return { ok: false, error };
  }
}

module.exports = {
  withRetry,
  alertOps,
  deliverToPanel,
  deliverCommercePaid,
  _test: { postOzelDersWebhook, fetchWithTimeout },
};
