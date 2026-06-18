const Stripe = require('stripe');
const { resolveLineItems } = require('./_lib/products');

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

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({
      error: 'Ödeme sistemi yapılandırılmamış. STRIPE_SECRET_KEY ortam değişkenini ayarlayın.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const customer = body.customer || {};
    const parentName = String(customer.parentName || '').trim();
    const phone = String(customer.phone || '').trim();
    const email = String(customer.email || '').trim().toLowerCase();
    const studentInfo = String(customer.studentInfo || '').trim();

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
    const origin = getOrigin(req);
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'tr',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: resolved.map(({ product, qty, unitAmount }) => ({
        quantity: qty,
        price_data: {
          currency: 'try',
          unit_amount: unitAmount,
          product_data: {
            name: product.name,
            description: 'Online VIP Dershane eğitim programı',
          },
        },
      })),
      success_url: `${origin}/odeme-tamamlandi.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/odeme-iptal.html`,
      metadata: {
        parent_name: parentName.slice(0, 120),
        phone: phone.slice(0, 40),
        student_info: studentInfo.slice(0, 500),
        product_ids: resolved.map((r) => r.product.id).join(','),
      },
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('checkout session error', err);
    return res.status(400).json({ error: err.message || 'Ödeme oturumu oluşturulamadı.' });
  }
};
