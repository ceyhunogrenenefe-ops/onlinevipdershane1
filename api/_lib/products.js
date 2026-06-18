const PRODUCTS = {
  lgs: { id: 'lgs', name: 'LGS Hazırlık', price: 96000 },
  yks: { id: 'yks', name: 'YKS TYT-AYT Hazırlık', price: 104000 },
  ortaokul: { id: 'ortaokul', name: '5-6-7. Sınıf VIP Paketi', price: 88000 },
  lise: { id: 'lise', name: '9-10-11. Sınıf Programı', price: 96000 },
  ilkokul: { id: 'ilkokul', name: '3-4. Sınıf Programı', price: 72000 },
  kamplar: { id: 'kamplar', name: 'Yaz Kampları', price: 24000 },
  yazili: { id: 'yazili', name: 'Yazılıya Hazırlık', price: 2500 },
  kitap: { id: 'kitap', name: 'Kitap Atölyesi', price: 12000 },
  start: { id: 'start', name: 'VIP Start Paketi', price: 28000 },
};

function resolveLineItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Sepet boş.');
  }

  return items.map((item) => {
    const product = PRODUCTS[item.id];
    const qty = Math.max(1, Math.min(5, parseInt(item.qty, 10) || 1));
    if (!product) throw new Error('Geçersiz ürün: ' + item.id);
    return {
      product,
      qty,
      unitAmount: Math.round(product.price * 100),
    };
  });
}

module.exports = { PRODUCTS, resolveLineItems };
