const {
  ziraatConfig,
  verifyCallbackHash,
  isPaymentSuccess,
  nestpayAmountToKurus,
} = require('./_lib/ziraat');
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
  return !!(body.HASH || body.hash);
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

function safeCallbackLog(body) {
  const copy = { ...(body || {}) };
  delete copy.storeKey;
  delete copy.storekey;
  delete copy.password;
  delete copy.Password;
  return copy;
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
      payment_provider: 'ziraat',
    }),
  });
}

async function notifyPaidOrder({ merchantOid, totalAmount }) {
  const amountTl = (Number(totalAmount) / 100).toLocaleString('tr-TR') + ' ₺';
  const note = `Ziraat Sanal POS ödeme başarılı · Sipariş ${merchantOid} · ${amountTl}`;

  try {
    await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form: 'ziraat-odeme',
        merchant_oid: merchantOid,
        total: amountTl,
        _subject: `Yeni Ziraat Sanal POS Ödemesi — ${merchantOid}`,
        program: 'Premium / Site Ödemesi',
        not: note,
      }),
    });
  } catch (err) {
    console.warn('[ziraat-callback] formspree', err.message);
  }

  try {
    await createKommoLead(
      {
        ad: 'Ziraat',
        soyad: 'Sanal POS',
        email: '',
        telefon: '',
        sinif: 'Ödeme',
        program: `Ziraat Sanal POS ${amountTl}`,
        not: note,
      },
      { tag: 'Ziraat Sanal POS' }
    );
  } catch (err) {
    console.warn('[ziraat-callback] kommo', err.message);
  }
}

function failRedirectUrl(origin, body, reason, sourceHint) {
  const params = new URLSearchParams();
  if (sourceHint === 'kitap') params.set('source', 'kitap');
  const msg =
    String(
      body.mdErrorMsg ||
        body.mderrormessage ||
        body.ErrMsg ||
        body.errmsg ||
        body.ErrorMessage ||
        ''
    ).trim() ||
    mdStatusHint(body.mdStatus || body.mdstatus) ||
    reason ||
    '';
  if (msg) params.set('reason', msg.slice(0, 180));
  const code = String(body.ProcReturnCode || body.procreturncode || '').trim();
  if (code) params.set('code', code);
  const md = String(body.mdStatus || body.mdstatus || '').trim();
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
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const cfg = ziraatConfig();
  const origin = getOrigin(req);
  const sourceHint = String(req.query?.source || '').toLowerCase();
  const okUrl =
    sourceHint === 'kitap'
      ? `${origin}/odeme-tamamlandi.html?source=kitap`
      : `${origin}/odeme-tamamlandi.html`;

  if (!cfg) {
    console.error('ziraat-callback: not configured');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res
      .status(500)
      .send(redirectHtml(failRedirectUrl(origin, {}, 'Ziraat yapılandırması eksik', sourceHint)));
  }

  try {
    const posted = parseBody(req);
    const query = req.query || {};
    const body = { ...posted, ...query };
    const resultHint = String(query.result || posted.result || '').toLowerCase();
    const queryOid = String(query.oid || query.merchant_oid || '').trim();
    const bodyOid = String(posted.oid || posted.ReturnOid || posted.orderid || body.oid || body.ReturnOid || body.orderid || '').trim();
    const orderId = extractCommercePaymentRef(queryOid || bodyOid);
    const amountKurus = nestpayAmountToKurus(body.amount || body.Amount);

    console.log(
      '[ziraat-callback] RESPONSE',
      JSON.stringify({
        method: req.method,
        query: req.query || {},
        body: safeCallbackLog(body),
      })
    );

    const hashSource = hasCallbackHash(posted) ? posted : body;
    const hashOk = hasCallbackHash(hashSource) ? verifyCallbackHash(hashSource, cfg) : false;
    const paid = isPaymentSuccess(body);

    if (paid && hasCallbackHash(hashSource) && !hashOk) {
      console.error('ziraat-callback: success rejected — hash missing or invalid', orderId, {
        hasHash: hasCallbackHash(body),
        md: body.mdStatus || body.mdstatus,
        proc: body.ProcReturnCode || body.procreturncode,
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res
        .status(400)
        .send(
          redirectHtml(
            failRedirectUrl(origin, body, 'Ödeme doğrulanamadı (hash). Destek ile iletişime geçin.', sourceHint)
          )
        );
    }

    if (paid) {
      if (resultHint === 'fail') {
        console.warn('ziraat-callback: success posted to errorurl, treating as paid', orderId);
      }
      console.log('ziraat-callback: success', orderId, amountKurus);
      const commerceRef = orderId || queryOid || bodyOid;
      if (isCommercePaymentRef(commerceRef) || sourceHint === 'kitap') {
        try {
          await notifyCommerceOrderPaid({
            merchantOid: commerceRef,
            totalAmount: amountKurus,
            provider: 'ziraat',
            force: sourceHint === 'kitap',
          });
        } catch (err) {
          console.error('ziraat-callback commerce', err);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res
            .status(500)
            .send(
              redirectHtml(
                failRedirectUrl(
                  origin,
                  body,
                  'Ödeme alındı ancak sipariş güncellenemedi. Lütfen destek ile iletişime geçin.',
                  sourceHint
                )
              )
            );
        }
      } else {
        notifyPaidOrder({ merchantOid: orderId, totalAmount: amountKurus }).catch((err) =>
          console.error('ziraat-callback notify', err)
        );
        notifyPanelPaid({ merchantOid: orderId, totalAmount: amountKurus }).catch((err) =>
          console.warn('ziraat-callback panel', err)
        );
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(redirectHtml(okUrl));
    }

    console.log(
      'ziraat-callback: fail',
      orderId,
      body.ProcReturnCode || body.procreturncode,
      body.mdStatus || body.mdstatus,
      body.ErrMsg || body.errmsg,
      body.mdErrorMsg || body.mderrormessage,
      hasCallbackHash(body) ? (hashOk ? 'hash:ok' : 'hash:mismatch') : 'hash:absent'
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(redirectHtml(failRedirectUrl(origin, body, '', sourceHint)));
  } catch (err) {
    console.error('ziraat-callback error', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(redirectHtml(failRedirectUrl(origin, {}, 'Beklenmeyen hata', sourceHint)));
  }
};
