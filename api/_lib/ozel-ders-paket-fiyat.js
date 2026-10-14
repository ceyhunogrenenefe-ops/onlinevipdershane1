/**
 * Öğretmene göre özel ders paket fiyatı.
 *
 * Paketler (1 / 3 / 5 / 10 ders) katalogta sabit fiyatlıydı ve tek ders
 * 1100 TL'ye göre indirimliydi. Öğretmen bazlı ücret geldiğinde paket
 * fiyatının da öğretmenin ücretine göre belirlenmesi gerekiyor.
 *
 * YÖNTEM: indirim ORANI korunur, taban ücret öğretmeninki olur.
 *   ders başı = öğretmen ücreti × (paketin birim fiyatı / 1100)
 * Bu sayede ücreti 1100 olan öğretmende sayfadaki fiyatlar BUGÜNKÜYLE
 * birebir aynı kalır; yalnız farklı ücretli öğretmenlerde ölçeklenir.
 * (Doğrudan "ücret × ders sayısı" denseydi toplu paket indirimi yok
 * olurdu; bu ticari kararı sessizce değiştirmemek için oran korunuyor.)
 */

/** Katalogdaki paketlerin dayandığı tek ders fiyatı */
const TABAN_TEK_DERS = 1100;

/** Paket kimliği -> ders adedi ve katalog birim fiyatı */
const PAKETLER = {
  'ders-1': { lessons: 1, unitPrice: 1100 },
  'ders-3': { lessons: 3, unitPrice: 1000 },
  'ders-5': { lessons: 5, unitPrice: 980 },
  'ders-10': { lessons: 10, unitPrice: 950 },
};

function paraYuvarla(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return Math.round(x);
}

/** Bu kimlik özel ders paketi mi */
function ozelDersPaketiMi(id) {
  return Object.prototype.hasOwnProperty.call(PAKETLER, String(id || ''));
}

/**
 * Öğretmenin ücretine göre paket fiyatı.
 * @param {string} paketId 'ders-1' | 'ders-3' | 'ders-5' | 'ders-10'
 * @param {number|null} ogretmenUcreti TL; null/geçersizse katalog fiyatı
 * @returns {{lessons:number, unitPrice:number, price:number, scaled:boolean}|null}
 */
function ozelDersPaketFiyati(paketId, ogretmenUcreti) {
  const pkg = PAKETLER[String(paketId || '')];
  if (!pkg) return null;

  const ucret = Number(ogretmenUcreti);
  // Ücret yoksa veya 0 ise katalog fiyatı geçerli: 0 ile çarpıp
  // bedava ders satmayalım.
  if (!Number.isFinite(ucret) || ucret <= 0) {
    return { lessons: pkg.lessons, unitPrice: pkg.unitPrice, price: pkg.unitPrice * pkg.lessons, scaled: false };
  }

  const oran = pkg.unitPrice / TABAN_TEK_DERS;
  const birim = paraYuvarla(ucret * oran);
  return {
    lessons: pkg.lessons,
    unitPrice: birim,
    price: birim * pkg.lessons,
    scaled: true,
  };
}

module.exports = { PAKETLER, TABAN_TEK_DERS, ozelDersPaketFiyati, ozelDersPaketiMi };
