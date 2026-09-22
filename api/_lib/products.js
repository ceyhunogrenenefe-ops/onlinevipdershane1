const PRODUCTS = {
  lgs: { id: 'lgs', name: 'LGS Hazırlık', price: 120000 },
  yks: { id: 'yks', name: 'YKS TYT-AYT Hazırlık', price: 119000 },
  ortaokul: { id: 'ortaokul', name: '5-6-7. Sınıf VIP Paketi', price: 98000 },
  lise: { id: 'lise', name: '9-10-11. Sınıf Programı', price: 112000 },
  ilkokul: { id: 'ilkokul', name: '3-4. Sınıf Programı', price: 84000 },
  yksMatGeo: { id: 'yksMatGeo', name: 'YKS Matematik & Geometri VIP Grup', price: 44900 },
  brans1: { id: 'brans1', name: 'VIP Branş Dersleri — 1 Branş', price: 25000, branchCount: 1 },
  brans2: { id: 'brans2', name: 'VIP Branş Dersleri — 2 Branş', price: 40000, branchCount: 2 },
  brans3: { id: 'brans3', name: 'VIP Branş Dersleri — 3 Branş', price: 50000, branchCount: 3 },
  kamplar: { id: 'kamplar', name: 'Yaz Kampları', price: 5000 },
  kamp9Hazirlik: { id: 'kamp9Hazirlik', name: '9. Sınıfa Hazırlık Kampı', price: 5000 },
  kampLgs: { id: 'kampLgs', name: 'LGS Yaz Kampı', price: 24000 },
  kamp56: { id: 'kamp56', name: "5'ten 6. Sınıfa Geçenler Yaz Kampı", price: 24000 },
  kamp910: { id: 'kamp910', name: "9'dan 10'a Geçenler Yaz Kampı", price: 24000 },
  kampMaarifTyt: { id: 'kampMaarifTyt', name: 'Maarif Model TYT Yaz Kampı', price: 24000 },
  kampTyt: { id: 'kampTyt', name: "11'den 12'ye TYT Yaz Kampı", price: 24000 },
  yazili: { id: 'yazili', name: 'Yazılıya Hazırlık', price: 2500 },
  kitap: { id: 'kitap', name: 'Kitap Atölyesi', price: 12000 },
  start: { id: 'start', name: 'VIP Start Paketi', price: 28000 },
  kocluk: { id: 'kocluk', name: 'Yıllık Premium Eğitim Koçluğu', price: 39900 },
  'ders-1': { id: 'ders-1', name: 'Premium Özel Ders — 1 Ders', price: 1100 },
  'ders-3': { id: 'ders-3', name: 'Premium Özel Ders — 3 Ders', price: 3000 },
  'ders-5': { id: 'ders-5', name: 'Premium Özel Ders — 5 Ders', price: 4900 },
  'ders-10': { id: 'ders-10', name: 'Premium Özel Ders — 10 Ders', price: 9500 },
};

const BRANS_BRANCHES = ['Matematik', 'Geometri', 'Fen Bilimleri', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Sosyal Bilimler', 'İngilizce'];

/** Branş paketinde seçilen branşları doğrular; fiyat paketten gelir (branş sayısı = paket). */
function withBranches(product, rawBranches) {
  if (!product.branchCount) return product;
  const list = Array.isArray(rawBranches) ? rawBranches : [];
  const picked = [...new Set(list.map((b) => String(b || '').trim()).filter((b) => BRANS_BRANCHES.includes(b)))];
  if (picked.length !== product.branchCount) {
    throw new Error(product.branchCount + ' branş seçilmelidir.');
  }
  return { ...product, branches: picked, name: product.name + ' (' + picked.join(', ') + ')' };
}

function resolveLineItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Sepet boş.');
  }

  return items.map((item) => {
    const base = PRODUCTS[item.id];
    if (!base) throw new Error('Geçersiz ürün: ' + item.id);
    const product = withBranches(base, item.branches);
    // Branş paketi öğrenci başına tek adet
    const qty = product.branchCount ? 1 : Math.max(1, Math.min(5, parseInt(item.qty, 10) || 1));
    return {
      product,
      qty,
      unitAmount: Math.round(product.price * 100),
    };
  });
}

module.exports = { PRODUCTS, BRANS_BRANCHES, resolveLineItems };
