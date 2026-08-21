/** Kitap siparişi ödeme callback → koçluk paneli */

function isCommercePaymentRef(ref) {
  return /^KTP[a-f0-9]{32}$/i.test(String(ref || '').trim());
}

async function notifyCommerceOrderPaid({ merchantOid, totalAmount, provider }) {
  if (!isCommercePaymentRef(merchantOid)) return false;

  const url = String(process.env.KOCLUK_PANEL_URL || '')
    .trim()
    .replace(/\/$/, '');
  const secret =
    String(process.env.COMMERCE_CHECKOUT_SECRET || '').trim() ||
    String(process.env.OZEL_DERS_WEBHOOK_SECRET || '').trim();
  if (!url || !secret) {
    console.warn('[commerce-panel] KOCLUK_PANEL_URL veya webhook secret eksik');
    return false;
  }

  const res = await fetch(`${url}/api/commerce-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': secret,
    },
    body: JSON.stringify({
      op: 'order.paid',
      merchant_oid: merchantOid,
      amount_kurus: Number(totalAmount) || null,
      provider: provider || 'paytr',
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
  isCommercePaymentRef,
  notifyCommerceOrderPaid,
};
