const {
  garantiConfig,
  verifyCallbackHash,
  isPaymentSuccess,
  is3dAuthenticated,
  hasCaptureProof,
  captureAfter3d,
  flattenFormBody,
} = require('./_lib/garanti');
const { createKommoLead } = require('./_lib/kommo');
const { isCommercePaymentRef, notifyCommerceOrderPaid, extractCommercePaymentRef } = require('./_lib/commerce-panel');

const FORMSPREE_ID = process.env.FORMSPREE_FORM_ID || 'mpqnjdwd';

function getOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function parseBody(req) {
  if (!req.body) return {};
  if (Buffer.isBuffer(req.body)) {
    return Object.fromEntries(new URLSearchParams(req.body.toString('utf8')));
  }
  if (typeof req.body === 'string') {
    try {
      if (req.body.trim().startsWith('{')) return JSON.parse(req.body);
      return Object.fromEntries(new URLSearchParams(req.body));
    } catch (_) {
      return Object.fromEntries(new URLSearchParams(req.body));
    }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
}

function hasCallbackHash(body) {
  return !!(body.hash || body.Hash) && !!(body.hashparams || body.HashParams);
}

function mdStatusHint(md) {
  const m = String(md || '').trim();
  const map = {
    '0': '3-D Secure doğrulaması başarısız',
    '5': 'Doğrulama yapılamadı',
    '6': '3-D Secure hatası',
    '7': 'Sistem hatası (banka 3-D Secure)',
    '8': 'Bilinmeyen kart',
  };
  return map[m] || '';
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

function failRedirectUrl(origin, body, reason, sourceHint, orderId) {
  const params = new URLSearchParams();
  if (sourceHint === 'kitap') params.set('source', 'kitap');
  const oid = String(orderId || body.orderid || body.OrderId || body.oid || '').trim();
  if (oid) params.set('oid', oid.slice(0, 64));
  const bankMsg = String(
    body.mderrormessage || body.mdErrorMessage || body.errmsg || body.ErrMsg || ''
  ).trim();
  const bankLooksSuccessful = /code:\s*'0+'\s*.*message:\s*'success/i.test(bankMsg);
  const msg = String(reason || '').trim() || (bankLooksSuccessful ? '' : bankMsg) || mdStatusHint(body.mdstatus || body.mdStatus) || '';
  if (msg) params.set('reason', msg.slice(0, 180));
  const code = String(body.procreturncode || body.ProcReturnCode || '').trim();
  if (code) params.set('code', code);
  const md = String(body.mdstatus || body.mdStatus || '').trim();
  if (md) params.set('md', md);
  const q = params.toString();
  const base = `${origin}/odeme-iptal.html`;
  return q ? `${base}?${q}` : base;
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

  if (!cfg) {
    console.error('garanti-callback: not configured');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res
      .status(500)
      .send(redirectHtml(failRedirectUrl(origin, {}, 'Garanti yapılandırması eksik', sourceHint)));
  }

  try {
    const posted = flattenFormBody(parseBody(req));
    const query = flattenFormBody(req.query || {});
    const body = { ...query, ...posted };
    const resultHint = String(query.result || posted.result || '').toLowerCase();
    const queryOid = String(req.query?.oid || req.query?.merchant_oid || '').trim();
    const bodyOid = String(body.orderid || body.OrderId || body.oid || '').trim();
    const orderId = extractCommercePaymentRef(queryOid || bodyOid);
    const amount = String(body.txnamount || body.TxnAmount || body.amount || '').trim();

    // Garanti e-ticaret destek için response kaydı
    console.log(
      '[garanti-callback] RESPONSE',
      JSON.stringify({
        method: req.method,
        query: req.query || {},
        body,
      })
    );

    const hashOk = hasCallbackHash(body) ? verifyCallbackHash(body, cfg) : false;
    let paid = isPaymentSuccess(body);
    let captureAuth = String(body.authcode || body.AuthCode || '').trim();

    if (paid && hasCallbackHash(body) && !hashOk) {
      console.warn('garanti-callback: hash mismatch but bank captured — accepting', orderId, {
        md: body.mdstatus || body.mdStatus,
        proc: body.procreturncode || body.ProcReturnCode,
      });
    }

    if (!paid && is3dAuthenticated(body)) {
      const cap = await captureAfter3d(cfg, body);
      if (cap.ok && hasCaptureProof(cap.authCode)) {
        paid = true;
        captureAuth = String(cap.authCode || captureAuth).trim();
        console.log('garanti-callback: captured after 3D', orderId, cap.already ? 'already' : 'xml-sales');
      } else {
        paid = false;
        const reason =
          cap.err ||
          cap.response ||
          (cap.proc ? `Provizyon yok (kod ${cap.proc})` : '3D doğrulandı ancak karttan tahsilat yapılamadı');
        console.log('garanti-callback: 3D ok but not captured', orderId, cap.proc, cap.err, cap.response);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(
          redirectHtml(failRedirectUrl(origin, body, reason, sourceHint, orderId))
        );
      }
    }

    if (paid && !hasCaptureProof(captureAuth)) {
      console.warn('garanti-callback: blocking success without authcode', orderId);
      paid = false;
    }

    if (paid) {
      if (resultHint === 'fail') {
        console.warn('garanti-callback: success posted to errorurl, treating as paid', orderId);
      }
      console.log('garanti-callback: success', orderId, amount, hashOk ? 'hash:ok' : hasCallbackHash(body) ? 'hash:mismatch-accepted' : 'hash:absent');
      const commerceRef = orderId || queryOid || bodyOid;
      if (isCommercePaymentRef(commerceRef) || sourceHint === 'kitap') {
        try {
          await notifyCommerceOrderPaid({
            merchantOid: commerceRef,
            totalAmount: amount,
            provider: 'garanti',
            force: sourceHint === 'kitap',
          });
        } catch (err) {
          console.error('garanti-callback commerce', err);
        }
      } else {
        notifyPaidOrder({ merchantOid: orderId, totalAmount: amount }).catch((err) =>
          console.error('garanti-callback notify', err)
        );
        notifyPanelPaid({ merchantOid: orderId, totalAmount: amount }).catch((err) =>
          console.warn('garanti-callback panel', err)
        );
      }
      const okParams = new URLSearchParams();
      okParams.set('provider', 'garanti');
      if (sourceHint === 'kitap') okParams.set('source', 'kitap');
      if (orderId) okParams.set('oid', String(orderId).slice(0, 64));
      okParams.set('auth', captureAuth.slice(0, 16));
      const okUrl = `${origin}/odeme-tamamlandi.html${okParams.toString() ? `?${okParams}` : ''}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(redirectHtml(okUrl));
    }

    console.log(
      'garanti-callback: fail',
      orderId,
      body.procreturncode || body.ProcReturnCode,
      body.mdstatus || body.mdStatus,
      body.errmsg || body.ErrMsg,
      body.mderrormessage || body.mdErrorMessage,
      hasCallbackHash(body) ? 'hash:ok' : 'hash:absent'
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(redirectHtml(failRedirectUrl(origin, body, '', sourceHint, orderId)));
  } catch (err) {
    console.error('garanti-callback error', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(redirectHtml(failRedirectUrl(origin, {}, 'Beklenmeyen hata', sourceHint)));
  }
};
