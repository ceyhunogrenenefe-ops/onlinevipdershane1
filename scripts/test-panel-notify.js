/**
 * api/_lib/panel-notify.js — ödeme bildirimleri panele güvenceli gider mi?
 * Çalıştır: node scripts/test-panel-notify.js
 */
const assert = require('assert');

process.env.KOCLUK_PANEL_URL = 'https://panel.test/';
process.env.OZEL_DERS_WEBHOOK_SECRET = 'gizli';

const calls = [];
let plan = [];
global.fetch = async (url, opts) => {
  calls.push({ url, body: JSON.parse(opts.body), headers: opts.headers });
  const step = plan.shift() || 'ok';
  if (step === 'throw') throw new Error('ağ hatası');
  if (step === 'http500') return { ok: false, status: 500, text: async () => 'patladı' };
  return { ok: true, status: 200, text: async () => '{}' };
};

const notify = require('../api/_lib/panel-notify');
const fast = { baseDelayMs: 1 };

async function run() {
  // 1) İlk denemede başarılı: tek istek, doğru adres ve gizli anahtar
  calls.length = 0; plan = ['ok'];
  let r = await notify.deliverToPanel('order_created', { event: 'order_created', merchant_oid: 'OVD1' }, fast);
  assert.deepStrictEqual(r, { ok: true });
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].url, 'https://panel.test/api/ozel-ders-talepleri?op=webhook');
  assert.strictEqual(calls[0].headers['x-webhook-secret'], 'gizli');

  // 2) Geçici hata: tekrar dener ve başarır
  calls.length = 0; plan = ['throw', 'http500', 'ok'];
  r = await notify.deliverToPanel('order_paid', { event: 'order_paid', merchant_oid: 'OVD2' }, fast);
  assert.deepStrictEqual(r, { ok: true });
  assert.strictEqual(calls.length, 3);

  // 3) Kalıcı hata: fırlatmaz, ekibe "PANELE DÜŞMEDİ" uyarısı gider
  calls.length = 0; plan = ['http500', 'http500', 'http500', 'ok'];
  r = await notify.deliverToPanel('order_paid', { event: 'order_paid', merchant_oid: 'OVD3' }, fast);
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /HTTP 500/);
  assert.strictEqual(calls.length, 4);
  assert.match(calls[3].url, /formspree\.io/);
  assert.match(calls[3].body._subject, /PANELE DÜŞMEDİ/);
  assert.strictEqual(calls[3].body.merchant_oid, 'OVD3');

  // 4) Ayar eksikse sessizce geçmez, uyarı atar
  delete process.env.OZEL_DERS_WEBHOOK_SECRET;
  calls.length = 0; plan = ['ok'];
  r = await notify.deliverToPanel('order_created', { merchant_oid: 'OVD4' }, fast);
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /OZEL_DERS_WEBHOOK_SECRET/);
  assert.strictEqual(calls.length, 1);
  assert.match(calls[0].url, /formspree\.io/);
  process.env.OZEL_DERS_WEBHOOK_SECRET = 'gizli';

  // 5) Kitap/deneme siparişi (commerce): tekrar dener, olmazsa uyarı atar
  let n = 0;
  calls.length = 0; plan = ['ok'];
  r = await notify.deliverCommercePaid(async () => { n += 1; if (n < 3) throw new Error('panel kapalı'); }, { merchantOid: 'KTPabc', totalAmount: 250000, provider: 'garanti' });
  assert.deepStrictEqual(r, { ok: true });
  assert.strictEqual(n, 3);
  assert.strictEqual(calls.length, 0);

  calls.length = 0; plan = ['ok'];
  r = await notify.deliverCommercePaid(async () => { throw new Error('panel kapalı'); }, { merchantOid: 'KTPdef', totalAmount: 250000, provider: 'garanti' });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(calls.length, 1);
  assert.match(calls[0].body._subject, /PANELE DÜŞMEDİ.*KTPdef/);

  console.log('test-panel-notify: tüm testler geçti');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
