/**
 * Premium özel ders paketleri — PayTR sepet ürünleriyle eşleşir
 */
const PACKAGES = [
  {
    id: 'ders-1',
    lessons: 1,
    title: '1 Ders',
    price: 1100,
    unitPrice: 1100,
    featured: false,
    perks: ['Canlı birebir ders', 'Ders kaydı', '7 gün tekrar izleme'],
  },
  {
    id: 'ders-3',
    lessons: 3,
    title: '3 Ders',
    price: 3000,
    unitPrice: 1000,
    featured: false,
    perks: ['3 canlı birebir ders', 'Ders kayıtları', 'Haftalık mini takip'],
  },
  {
    id: 'ders-5',
    lessons: 5,
    title: '5 Ders',
    price: 4500,
    unitPrice: 900,
    featured: false,
    perks: ['5 canlı birebir ders', 'AI koçluk özeti', 'Veli bilgilendirme'],
  },
  {
    id: 'ders-10',
    lessons: 10,
    title: '10 Ders',
    price: 8500,
    unitPrice: 850,
    featured: true,
    badge: 'En avantajlı',
    perks: ['10 canlı birebir ders', 'AI koçluk + haftalık rapor', 'Öncelikli saat seçimi', '1M+ soru havuzu'],
  },
];

function getPackageById(id) {
  return PACKAGES.find((p) => p.id === id) || null;
}

function publicPackages() {
  return PACKAGES.map((p) => ({
    id: p.id,
    lessons: p.lessons,
    title: p.title,
    price: p.price,
    unitPrice: p.unitPrice,
    featured: p.featured,
    badge: p.badge || null,
    perks: p.perks,
    available: true,
  }));
}

module.exports = {
  PACKAGES,
  getPackageById,
  publicPackages,
};
