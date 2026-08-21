const {
  garantiConfig,
  verifyCallbackHash,
  isPaymentSuccess,
} = require('./_lib/garanti');
const { createKommoLead } = require('./_lib/kommo');
const { isCommercePaymentRef, notifyCommerceOrderPaid } = require('./_lib/commerce-panel');

const FORMSPREE_ID = process.env.FORMSPREE_FORM_ID || 'mpqnjdwd';

function getOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      if (req.body.trim().startsWith('{')) return JSON.parse(req.body);
      return Object.fromEntries(new URLSearchParams(req.body));
    } catch (_) {
      return Object.fromEntries(new URLSearchParams(req.body));
    }
  }
  return req.body;
}

async function notifyPanelPaid({ merchantOid, totalAmount }) {
  const url = process.env.KOCLUK_PANEL_URL;
  const secret = process.env.OZEL_DERS_WEBHOOK_SECRET;
  if (!url || !secret) return;
  await fetch(`${url.replace(/\/$/, '')}/api/ozel-ders-talepleri?op=webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
    body: JSON.stringify({
      event: 'order_paid',
      merchant_oid: merchantOid,
      amount_kurus: Number(totalAmount) || null,
      source: 'onlinevipdershane.com',
      payment_provider: 'garanti',
    }),
  });
}

async function notifyPaidOrder({ merchantOid, totalAmount }) {
  const amountTl = (Number(totalAmount) / 100).toLocaleString('tr-TR') + ' ₺';
  const note = `Garanti Bonus POS ödeme başarılı · Sipariş ${merchantOid} · ${amountTl}`;

  try {
    await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form: 'garanti-odeme',
        merchant_oid: merchantOid,
        total: amountTl,
        _subject: `Yeni Garanti Bonus POS Ödemesi — ${merchantOid}`,
        program: 'Premium / Site Ödemesi',
        not: note,
      }),
    });
  } catch (err) {
    console.warn('[garanti-callback] formspree', err.message);
  }

  try {
    await createKommoLead(
      {
        ad: 'Garanti',
        soyad: 'Bonus POS',
        email: '',
        telefon: '',
        sinif: 'Ödeme',
        program: `Garanti Bonus POS ${amountTl}`,
        not: note,
      },
      { tag: 'Garanti Bonus POS' }
    );
  } catch (err) {
    console.warn('[garanti-callback] kommo', err.message);
  }
}

function failRedirectUrl(origin, body, reason) {
  const params = new URLSearchParams();
  const msg =
    String(body.mderrormessage || body.mdErrorMessage || body.errmsg || body.ErrMsg || '').trim() ||
    reason ||
    '';
  if (msg) params.set('reason', msg.slice(0, 180));
  const code = String(body.procreturncode || body.ProcReturnCode || '').trim();
  if (code) params.set('code', code);
  const md = String(body.mdstatus || body.mdStatus || '').trim();
  if (md) params.set('md', md);
  const q = params.toString();
  return q ? `${origin}/odeme-iptal.html?${q}` : `${origin}/odeme-iptal.html`;
}

function redirectHtml(url) {
  const safe = String(url).replace(/"/g, '&quot;');
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=${safe}"><title>Yönlendiriliyor…</title></head><body><p>Yönlendiriliyorsunuz… <a href="${safe}">Devam</a></p><script>location.replace(${JSON.stringify(url)});</script></body></html>`;
}

module.exports = async function handler(req, res) {
  // Banka genelde POST gönderir; GET de kabul
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const cfg = garantiConfig();
  const origin = getOrigin(req);
  const sourceHint = String(req.query?.source || '').toLowerCase();
  const okUrl =
    sourceHint === 'kitap'
      ? `${origin}/odeme-tamamlandi.html?source=kitap`
      : `${origin}/odeme-tamamlandi.html`;

  if (!cfg) {
    console.error('garanti-callback: not configured');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(redirectHtml(failRedirectUrl(origin, {}, 'Garanti yapılandırması eksik')));
  }

  try {
    const body = { ...parseBody(req), ...(req.query || {}) };
    const resultHint = String(req.query?.result || body.result || '').toLowerCase();
    const orderId = String(body.orderid || body.OrderId || body.oid || '').trim();
    const amount = String(body.txnamount || body.TxnAmount || body.amount || '').trim();

    const hashOk = verifyCallbackHash(body, cfg);
    if (!hashOk) {
      console.error('garanti-callback: invalid hash', orderId, {
        hasHash: !!(body.hash || body.Hash),
        hasParams: !!(body.hashparams || body.HashParams),
        md: body.mdstatus || body.mdStatus,
        proc: body.procreturncode || body.ProcReturnCode,
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res
        .status(400)
        .send(redirectHtml(failRedirectUrl(origin, body, 'Güvenlik doğrulaması başarısız')));
    }

    const paid = isPaymentSuccess(body) && resultHint !== 'fail';
    if (paid) {
      console.log('garanti-callback: success', orderId, amount);
      if (isCommercePaymentRef(orderId)) {
        await notifyCommerceOrderPaid({
          merchantOid: orderId,
          totalAmount: amount,
          provider: 'garanti',
        }).catch((err) => console.error('garanti-callback commerce', err));
      } else {
        notifyPaidOrder({ merchantOid: orderId, totalAmount: amount }).catch((err) =>
          console.error('garanti-callback notify', err)
        );
        notifyPanelPaid({ merchantOid: orderId, totalAmount: amount }).catch((err) =>
          console.warn('garanti-callback panel', err)
        );
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(redirectHtml(okUrl));
    }

    console.log(
      'garanti-callback: fail',
      orderId,
      body.procreturncode || body.ProcReturnCode,
      body.mdstatus || body.mdStatus,
      body.errmsg || body.ErrMsg,
      body.mderrormessage || body.mdErrorMessage
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(redirectHtml(failRedirectUrl(origin, body)));
  } catch (err) {
    console.error('garanti-callback error', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(redirectHtml(failRedirectUrl(origin, {}, 'Beklenmeyen hata')));
  }
};
