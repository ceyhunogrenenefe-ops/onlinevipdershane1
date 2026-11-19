const { deliverToPanel, deliverCommercePaid } = require('./_lib/panel-notify');
const { paytrConfig, verifyCallbackHash } = require('./_lib/paytr');
const { confirmCoupon, releaseCoupon } = require('./_lib/checkout-amount');
const { createKommoLead } = require('./_lib/kommo');
const { isCommercePaymentRef, notifyCommerceOrderPaid } = require('./_lib/commerce-panel');

async function notifyPanelPaid({ merchantOid, totalAmount }) {
  return deliverToPanel('order_paid', {
    event: 'order_paid',
    merchant_oid: merchantOid,
    amount_kurus: Number(totalAmount) || null,
    source: 'onlinevipdershane.com',
  });
}

const FORMSPREE_ID = process.env.FORMSPREE_FORM_ID || 'mpqnjdwd';

async function notifyPaidOrder({ merchantOid, totalAmount }) {
  const results = { email: false, kommo: false };
  const errors = [];
  const amountTl = (Number(totalAmount) / 100).toLocaleString('tr-TR') + ' ₺';
  const note = `PayTR ödeme başarılı · Sipariş ${merchantOid} · ${amountTl}`;

  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form: 'paytr-odeme',
        merchant_oid: merchantOid,
        total: amountTl,
        _subject: `Yeni PayTR Ödemesi — ${merchantOid}`,
        program: 'Premium / Site Ödemesi',
        not: note,
      }),
    });
    if (!res.ok) throw new Error('Formspree error');
    results.email = true;
  } catch (err) {
    errors.push({ channel: 'email', message: err.message });
  }

  try {
    const kommo = await createKommoLead(
      {
        ad: 'PayTR',
        soyad: 'Ödeme',
        email: '',
        telefon: '',
        sinif: 'Ödeme',
        program: `Online Ödeme ${amountTl}`,
        not: note,
      },
      { tag: 'PayTR Ödeme' }
    );
    results.kommo = kommo.skipped ? 'skipped' : true;
  } catch (err) {
    errors.push({ channel: 'kommo', message: err.message });
  }

  return { results, errors };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('ERR');

  const cfg = paytrConfig();
  if (!cfg) return res.status(500).send('ERR');

  try {
    const body =
      typeof req.body === 'string'
        ? Object.fromEntries(new URLSearchParams(req.body))
        : req.body || {};
    const merchantOid = String(body.merchant_oid || '');
    const status = String(body.status || '');
    const totalAmount = String(body.total_amount || '');
    const hash = String(body.hash || '');

    if (!merchantOid || !verifyCallbackHash({ merchantOid, status, totalAmount, hash }, cfg)) {
      console.error('paytr-callback: invalid hash', merchantOid);
      return res.status(400).send('ERR');
    }

    if (status === 'success') {
      console.log('paytr-callback: success', merchantOid, totalAmount);
      if (isCommercePaymentRef(merchantOid)) {
        const delivered = await deliverCommercePaid(notifyCommerceOrderPaid, {
          merchantOid,
          totalAmount,
          provider: 'paytr',
        });
        // ERR dönersek PayTR bildirimi sonra tekrar gönderir.
        if (!delivered.ok) return res.status(500).send('ERR');
      } else {
        // Hepsi cevaptan ÖNCE beklenir; Vercel cevaptan sonra fonksiyonu dondurur.
        await Promise.allSettled([
          notifyPanelPaid({ merchantOid, totalAmount }),
          notifyPaidOrder({ merchantOid, totalAmount }),
          confirmCoupon(merchantOid),
        ]);
      }
    } else {
      console.log('paytr-callback: failed', merchantOid, status);
      await releaseCoupon(merchantOid).catch((err) => console.warn('paytr-callback coupon release', err));
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('paytr-callback error', err);
    return res.status(500).send('ERR');
  }
};
