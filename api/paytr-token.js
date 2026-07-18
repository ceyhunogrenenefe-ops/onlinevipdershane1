const { resolveLineItems } = require('./_lib/products');
const {
  paytrConfig,
  buildUserBasket,
  buildPaytrToken,
  clientIp,
  makeMerchantOid,
} = require('./_lib/paytr');

function normalizeTeacherSlug(raw) {
  const slug = String(raw || '')
    .trim()
    .toLowerCase();
  if (!slug) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

async function notifyPanelLead({
  merchantOid,
  parentName,
  phone,
  email,
  studentInfo,
  teacherSlug,
  productIds,
  packageTitle,
  amountKurus,
}) {
  const url = process.env.KOCLUK_PANEL_URL;
  const secret = process.env.OZEL_DERS_WEBHOOK_SECRET;
  if (!url || !secret) return;

  let slug = normalizeTeacherSlug(teacherSlug);
  if (!slug) {
    // Eski formlar: "Öğretmen: dogan-akturk" (tireli) — boşluklu metinden çıkarılmaz
    const teacherMatch = (studentInfo || '').match(/[öo][ğg]retmen[:\s]+([a-z0-9]+(?:-[a-z0-9]+)*)/i);
    slug = teacherMatch ? normalizeTeacherSlug(teacherMatch[1]) : null;
  }

  const packageId = productIds ? productIds.split(',')[0] : null;

  await fetch(`${url.replace(/\/$/, '')}/api/ozel-ders-talepleri?op=webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
    body: JSON.stringify({
      event: 'order_created',
      merchant_oid: merchantOid,
      parent_name: parentName,
      phone,
      email,
      student_info: studentInfo,
      teacher_slug: slug,
      package_id: packageId,
      package_title: packageTitle,
      amount_kurus: amountKurus,
      source: 'onlinevipdershane.com',
    }),
  });
}

function getOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cfg = paytrConfig();
  if (!cfg) {
    return res.status(500).json({
      error: 'PayTR yapılandırılmamış. Vercel ortam değişkenlerine PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY ve PAYTR_MERCHANT_SALT ekleyin.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const customer = body.customer || {};
    const parentName = String(customer.parentName || '').trim();
    const phone = String(customer.phone || '').trim();
    const email = String(customer.email || '').trim().toLowerCase();
    const studentInfo = String(customer.studentInfo || '').trim();
    const teacherSlug = String(customer.teacherSlug || customer.teacher_slug || '').trim();

    if (!parentName || parentName.length < 3) {
      return res.status(400).json({ error: 'Veli adı soyadı en az 3 karakter olmalıdır.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Geçerli bir telefon numarası girin.' });
    }

    const resolved = resolveLineItems(body.items);
    const paymentAmount = resolved.reduce((sum, row) => sum + row.unitAmount * row.qty, 0);
    if (paymentAmount < 100) {
      return res.status(400).json({ error: 'Ödeme tutarı geçersiz.' });
    }

    const origin = getOrigin(req);
    const merchantOid = makeMerchantOid();
    const userBasket = buildUserBasket(resolved);
    const userIp = clientIp(req);
    const paytr_token = buildPaytrToken({
      merchantId: cfg.merchantId,
      merchantKey: cfg.merchantKey,
      merchantSalt: cfg.merchantSalt,
      userIp,
      merchantOid,
      email,
      paymentAmount,
      userBasket,
      testMode: cfg.testMode,
    });

    const form = new URLSearchParams({
      merchant_id: cfg.merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email,
      payment_amount: String(paymentAmount),
      paytr_token,
      user_basket: userBasket,
      debug_on: cfg.testMode ? '1' : '0',
      no_installment: '0',
      max_installment: '0',
      user_name: parentName.slice(0, 60),
      user_address: 'Türkiye',
      user_phone: phone.replace(/\D/g, '').slice(0, 20),
      merchant_ok_url: `${origin}/odeme-tamamlandi.html`,
      merchant_fail_url: `${origin}/odeme-iptal.html`,
      timeout_limit: '30',
      currency: 'TL',
      test_mode: String(cfg.testMode),
      lang: 'tr',
    });

    const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const paytrJson = await paytrRes.json().catch(() => ({}));

    if (paytrJson.status !== 'success' || !paytrJson.token) {
      const reason = paytrJson.reason || paytrJson.err_msg || 'PayTR token alınamadı';
      return res.status(400).json({ error: reason });
    }

    // Panele talep kaydı gönder (başarısız olsa da ödemeyi engelleme)
    notifyPanelLead({
      merchantOid,
      parentName,
      phone,
      email,
      studentInfo,
      teacherSlug,
      productIds: resolved.map((r) => r.product.id).join(','),
      packageTitle: resolved.map((r) => r.product.name).join(', '),
      amountKurus: paymentAmount,
    }).catch((err) => console.warn('[paytr-token] panel lead notify failed', err));

    return res.status(200).json({
      token: paytrJson.token,
      merchantOid,
      paymentAmount,
      metadata: {
        parent_name: parentName,
        phone,
        student_info: studentInfo,
        teacher_slug: normalizeTeacherSlug(teacherSlug),
        product_ids: resolved.map((r) => r.product.id).join(','),
      },
    });
  } catch (err) {
    console.error('paytr-token error', err);
    return res.status(400).json({ error: err.message || 'PayTR ödeme başlatılamadı.' });
  }
};
