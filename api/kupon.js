const { quote } = require('./_lib/kupon-lgskasim');
const { PRODUCTS, resolveLineItems } = require('./_lib/products');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const result = await quote({ code: body.code || body.coupon, items: body.items });
    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        error: result.error,
        remaining: result.remaining,
      });
    }
    const resolved = resolveLineItems(body.items, undefined, { coupon: result });
    const lines = resolved.map((row) => {
      const unit = row.unitAmount / 100;
      const catalog = PRODUCTS[row.product.id] ? PRODUCTS[row.product.id].price : unit;
      return {
        id: row.product.id,
        name: row.product.name,
        qty: row.qty,
        unit: unit,
        compare: catalog > unit ? catalog : null,
      };
    });
    const total = lines.reduce((sum, line) => sum + line.unit * line.qty, 0);
    return res.status(200).json({
      ok: true,
      code: result.code,
      remaining: result.remaining,
      message: result.message,
      lines: lines,
      total: total,
    });
  } catch (err) {
    console.error('[kupon]', err);
    return res.status(400).json({ ok: false, error: err.message || 'Kupon doğrulanamadı.' });
  }
};
