const { resolveLineItems } = require('./_lib/products');
const {
  garantiConfig,
  buildCommonPaymentForm,
  makeOrderId,
  clientIp,
} = require('./_lib/garanti');

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
      payment_provider: 'garanti',
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

  const cfg = garantiConfig();
  if (!cfg) {
    return res.status(500).json({
      error:
        'Garanti Bonus POS yapılandırılmamış. Vercel ortam değişkenlerine GARANTI_MERCHANT_ID, GARANTI_TERMINAL_ID, GARANTI_PROV_PASSWORD ve GARANTI_STORE_KEY ekleyin.',
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
    const installment = String(body.installment || '').replace(/\D/g, '');

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
    const orderId = makeOrderId();
    const userIp = clientIp(req);
    const successUrl = `${origin}/api/garanti-callback?result=ok`;
    const errorUrl = `${origin}/api/garanti-callback?result=fail`;

    const form = buildCommonPaymentForm({
      cfg,
      orderId,
      amountKurus: paymentAmount,
      email,
      userIp,
      successUrl,
      errorUrl,
      installmentCount: installment,
      lang: 'tr',
    });

    notifyPanelLead({
      merchantOid: orderId,
      parentName,
      phone,
      email,
      studentInfo,
      teacherSlug,
      productIds: resolved.map((r) => r.product.id).join(','),
      packageTitle: resolved.map((r) => r.product.name).join(', '),
      amountKurus: paymentAmount,
    }).catch((err) => console.warn('[garanti-init] panel lead notify failed', err));

    return res.status(200).json({
      provider: 'garanti',
      orderId,
      paymentAmount,
      action: form.action,
      fields: form.fields,
      mode: cfg.mode,
      metadata: {
        parent_name: parentName,
        phone,
        student_info: studentInfo,
        teacher_slug: normalizeTeacherSlug(teacherSlug),
        product_ids: resolved.map((r) => r.product.id).join(','),
      },
    });
  } catch (err) {
    console.error('garanti-init error', err);
    return res.status(400).json({ error: err.message || 'Garanti ödeme başlatılamadı.' });
  }
};
