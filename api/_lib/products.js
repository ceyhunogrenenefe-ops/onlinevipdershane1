const academicPricing = require('../../assets/academic-pricing.js');
const denemeKulubu = require('../../assets/deneme-kulubu-data.js');

/**
 * Fiyatlar Eylül'deki TAM DÖNEM bedelidir ve sabit kalır.
 * `dynamicAcademicPricing: true` olan paketlerde ödemeye giden tutar, kalan
 * eğitim ayına göre okuma anında hesaplanır (assets/academic-pricing.js).
 * Tek seferlik ürünler (kitap, yazılı, kamp, özel ders, koçluk, start)
 * işaretlenmez; fiyatları hiç değişmez.
 */
const PRODUCTS = {
  lgs: { id: 'lgs', dynamicAcademicPricing: true, name: 'LGS Hazırlık', price: 120000 },
  yks: { id: 'yks', dynamicAcademicPricing: true, name: 'YKS TYT-AYT Hazırlık', price: 119000 },
  ortaokul: { id: 'ortaokul', dynamicAcademicPricing: true, name: '5-6-7. Sınıf VIP Paketi', price: 98000 },
  lise: { id: 'lise', dynamicAcademicPricing: true, name: '9-10-11. Sınıf Programı', price: 112000 },
  ilkokul: { id: 'ilkokul', dynamicAcademicPricing: true, name: '3-4. Sınıf Programı', price: 84000 },
  yksMatGeo: { id: 'yksMatGeo', name: 'YKS Matematik & Geometri VIP Grup', price: 44900 },
  brans1: { id: 'brans1', dynamicAcademicPricing: true, name: 'VIP Branş Dersleri — 1 Branş', price: 25000, branchCount: 1 },
  brans2: { id: 'brans2', dynamicAcademicPricing: true, name: 'VIP Branş Dersleri — 2 Branş', price: 40000, branchCount: 2 },
  brans3: { id: 'brans3', dynamicAcademicPricing: true, name: 'VIP Branş Dersleri — 3 Branş', price: 50000, branchCount: 3 },
  kamplar: { id: 'kamplar', name: 'Yaz Kampları', price: 5000 },
  kamp9Hazirlik: { id: 'kamp9Hazirlik', name: '9. Sınıfa Hazırlık Kampı', price: 5000 },
  kampLgs: { id: 'kampLgs', name: 'LGS Yaz Kampı', price: 24000 },
  kamp56: { id: 'kamp56', name: "5'ten 6. Sınıfa Geçenler Yaz Kampı", price: 24000 },
  kamp910: { id: 'kamp910', name: "9'dan 10'a Geçenler Yaz Kampı", price: 24000 },
  kampMaarifTyt: { id: 'kampMaarifTyt', name: 'Maarif Model TYT Yaz Kampı', price: 24000 },
  kampTyt: { id: 'kampTyt', name: "11'den 12'ye TYT Yaz Kampı", price: 24000 },
  // Deneme Kulubu: donemlik fiyatlama yok; indirim Ekim kampanyasindan gelir
  deneme3: { id: 'deneme3', name: '3. Sınıf Deneme Kulübü', price: 6000 },
  deneme4: { id: 'deneme4', name: '4. Sınıf Deneme Kulübü', price: 6000 },
  deneme5: { id: 'deneme5', name: '5. Sınıf Deneme Kulübü', price: 10000 },
  deneme6: { id: 'deneme6', name: '6. Sınıf Deneme Kulübü', price: 10000 },
  deneme7: { id: 'deneme7', name: '7. Sınıf Deneme Kulübü', price: 10000 },
  denemeLgs: { id: 'denemeLgs', name: 'LGS Deneme Kulübü', price: 16500 },
  deneme9: { id: 'deneme9', name: '9. Sınıf Deneme Kulübü', price: 11000 },
  deneme10: { id: 'deneme10', name: '10. Sınıf Deneme Kulübü', price: 11000 },
  deneme11: { id: 'deneme11', name: '11. Sınıf Deneme Kulübü', price: 11000 },
  denemeYks: { id: 'denemeYks', name: 'YKS Deneme Kulübü', price: 16500 },
  // Yazılıya Hazırlık Kampı. 'yazili' id'si eski sepetlerde duruyor olabilir;
  // kaldırılırsa resolveLineItems 'Geçersiz ürün' atar, o yüzden lise tek dönem olarak korunuyor.
  yazili: { id: 'yazili', name: 'Yazılıya Hazırlık Kampı — Lise (9-10-11)', price: 3500 },
  yaziliOrtaokul: { id: 'yaziliOrtaokul', name: 'Yazılıya Hazırlık Kampı — Ortaokul (5-6-7-8)', price: 3000 },
  yaziliLisePaket: { id: 'yaziliLisePaket', name: 'Yazılıya Hazırlık Kampı — Lise · 4 Dönem Paketi', price: 11990 },
  yaziliOrtaokulPaket: { id: 'yaziliOrtaokulPaket', name: 'Yazılıya Hazırlık Kampı — Ortaokul · 4 Dönem Paketi', price: 9990 },
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

/**
 * Sepet satirlari.
 *
 * Tutar HER ZAMAN sunucudaki katalogdan ve sunucudaki tarihten hesaplanir;
 * istemciden yalniz urun kimligi, adet ve brans secimi alinir. Boylece
 * ekranda gorunen ile odemeye giden tutar ayrisamaz ve istemci fiyati
 * degistirerek daha az odeyemez.
 *
 * @param {Array} items istemciden gelen sepet
 * @param {Date} [now] yalniz testlerde tarih sabitlemek icin
 */
/** Paket slug'i -> katalog urun kimligi (3-sinif -> deneme3, lgs -> denemeLgs). */
function denemeProductId(pkg) {
  const s = String(pkg.slug || '');
  if (s === 'lgs') return 'denemeLgs';
  if (s === 'yks') return 'denemeYks';
  return 'deneme' + s.replace('-sinif', '');
}

function nowMs(now) {
  if (now instanceof Date) return now.getTime();
  const t = Date.parse(String(now || ''));
  return isFinite(t) ? t : Date.now();
}

const { ozelDersPaketFiyati, ozelDersPaketiMi } = require('./ozel-ders-paket-fiyat.js');

/**
 * @param {object} [ctx] ctx.ogretmenUcretleri: { slug: ucretTL }
 *        Ucret ISTEMCIDEN gelmez; cagiran panelden okuyup verir.
 */
function resolveLineItems(items, now, ctx) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Sepet boş.');
  }

  return items.map((item) => {
    const base = PRODUCTS[item.id];
    if (!base) throw new Error('Geçersiz ürün: ' + item.id);
    const withBr = withBranches(base, item.branches);
    /**
     * Deneme Kulubu paketlerinde odenecek tutar kampanyaya baglidir; sitede
     * gosterilen indirimli fiyatla odeme tutari ayrismasin diye ayni
     * hesaplayici (deneme-kulubu-data.js) burada da kullanilir. Kampanya
     * bitince tutar kendiliginden normal fiyata doner.
     */
    const denemePkg = denemeKulubu.PACKAGES.find((p) => denemeProductId(p) === withBr.id);
    const currentPrice = denemePkg
      ? denemeKulubu.priceFor(denemePkg, nowMs(now)).current
      : academicPricing.productPrice(withBr, now);
    /**
     * Ozel ders paketi bir ogretmene baglanmissa tutar O OGRETMENIN
     * ucretine gore hesaplanir. Sepet yalniz slug tasir; ucret sunucuda
     * okunur, boylece tarayicida fiyat degistirilemez.
     */
    let finalPrice = currentPrice;
    let ogretmenSlug = String(item.teacher || '').trim() || null;
    if (ogretmenSlug && ozelDersPaketiMi(withBr.id)) {
      const ucret = ctx && ctx.ogretmenUcretleri ? ctx.ogretmenUcretleri[ogretmenSlug] : null;
      const hesap = ozelDersPaketFiyati(withBr.id, ucret);
      if (hesap) finalPrice = hesap.price;
    } else {
      ogretmenSlug = null;
    }
    const product = { ...withBr, price: finalPrice, teacher: ogretmenSlug };
    // Branş paketi öğrenci başına tek adet
    const qty = product.branchCount ? 1 : Math.max(1, Math.min(5, parseInt(item.qty, 10) || 1));
    return {
      product,
      qty,
      unitAmount: Math.round(finalPrice * 100),
    };
  });
}

module.exports = { PRODUCTS, BRANS_BRANCHES, resolveLineItems, academicPricing, denemeProductId };
