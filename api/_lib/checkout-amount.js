const { resolveLineItems } = require('./products');
const { sepetOgretmenUcretleri } = require('./ogretmen-ucret-getir.js');
const kupon = require('./kupon-lgskasim');

/**
 * Sepetin tahsil edilecek tutarı. Kupon kodu varsa yer ayırır ve ara tatil
 * kampını 5.000 TL yapar. Kod yoksa katalog fiyatı aynı kalır.
 */
async function resolveChargedItems(body, merchantOid) {
  const items = body && body.items;
  const ogretmenUcretleri = await sepetOgretmenUcretleri(items);
  const code = String((body && (body.coupon || body.couponCode)) || '').trim();
  let coupon = null;
  if (code) {
    const customer = (body && body.customer) || {};
    coupon = await kupon.claim({
      code: code,
      items: items,
      phone: customer.phone,
      email: customer.email,
      merchantOid: merchantOid,
    });
    if (!coupon.ok) {
      throw new Error(coupon.error || 'Kupon uygulanamadı.');
    }
  }
  const resolved = resolveLineItems(items, undefined, { ogretmenUcretleri: ogretmenUcretleri, coupon: coupon });
  const paymentAmount = resolved.reduce((sum, row) => sum + row.unitAmount * row.qty, 0);
  return { resolved: resolved, paymentAmount: paymentAmount, couponApplied: Boolean(coupon && coupon.ok) };
}

function releaseCoupon(oid) {
  return kupon.release(oid);
}

function confirmCoupon(oid) {
  return kupon.confirm(oid);
}

module.exports = {
  resolveChargedItems: resolveChargedItems,
  releaseCoupon: releaseCoupon,
  confirmCoupon: confirmCoupon,
};
