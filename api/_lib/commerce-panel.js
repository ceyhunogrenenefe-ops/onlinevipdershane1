/** Kitap siparişi ödeme callback → koçluk paneli */

function paymentRefFromOrderId(orderId) {
  const hex = String(orderId || '').replace(/-/g, '').toLowerCase();
  if (hex.length !== 32) return '';
  return `KTP${hex}`;
}

function extractCommercePaymentRef(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const ktp = s.match(/KTP[a-f0-9]{32}/i);
  if (ktp) return `KTP${ktp[0].slice(3).toLowerCase()}`;
  const uuid = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuid) return paymentRefFromOrderId(uuid[0]) || s;
  return s;
}

function isCommercePaymentRef(ref) {
  return /^KTP[a-f0-9]{32}$/i.test(extractCommercePaymentRef(ref));
}

async function notifyCommerceOrderPaid({ merchantOid, totalAmount, provider, force = false }) {
  const ref = extractCommercePaymentRef(merchantOid);
  if (!isCommercePaymentRef(ref) && !force) return false;

  const url = String(process.env.KOCLUK_PANEL_URL || '')
    .trim()
    .replace(/\/$/, '');
  const secret =
    String(process.env.COMMERCE_CHECKOUT_SECRET || '').trim() ||
    String(process.env.OZEL_DERS_WEBHOOK_SECRET || '').trim();
  if (!url || !secret) {
    throw new Error('[commerce-panel] KOCLUK_PANEL_URL veya webhook secret eksik');
  }

  const res = await fetch(`${url}/api/commerce-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': secret,
    },
    body: JSON.stringify({
      op: 'order.paid',
      merchant_oid: ref || merchantOid,
      amount_kurus: Number(totalAmount) || null,
      provider: provider || 'garanti',
      source: 'onlinevipdershane.com',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `commerce order.paid HTTP ${res.status}`);
  }
  return true;
}

module.exports = {
  extractCommercePaymentRef,
  isCommercePaymentRef,
  notifyCommerceOrderPaid,
};
