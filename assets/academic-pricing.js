/**
 * Eğitim dönemi fiyatlandırması — Eylül–Haziran, 10 ay.
 *
 * Katalogdaki fiyat her zaman EYLÜL'deki tam dönem bedelidir ve hiç
 * değişmez. Yıl ilerledikçe yeni kayıt olan öğrenciden geçmiş ayların ücreti
 * alınmasın diye güncel bedel, görüntülendiği anda kalan ay sayısına göre
 * hesaplanır:
 *
 *   aylık bedel     = eylül dönem fiyatı / 10        (yıl boyunca sabit)
 *   güncel toplam   = aylık bedel × kalan ay sayısı
 *
 * Fiyatı her ay veritabanında güncelleyen bir cron yok: ana fiyat sabit
 * kalır, hesap okuma anında yapılır. Böylece bir ay atlanırsa ya da geçmişe
 * dönük bakılırsa veri bozulmaz.
 *
 * Temmuz–Ağustos dönem dışıdır. O aylarda bir sonraki eğitim yılının fiyatı
 * henüz belli olmadığı için indirim UYGULANMAZ; katalogdaki tam dönem fiyatı
 * gösterilir. Yeni dönemin fiyatı değişecekse katalogdaki `price` alanı elle
 * güncellenmelidir — burada tahmin edilmez.
 *
 * Tek kaynak: hem tarayıcı (assets) hem sunucu (api/_lib/products.js) bu
 * dosyayı kullanır. İki kopya olsa biri değişip diğeri unutulur ve ekranda
 * başka, ödemede başka fiyat çıkar.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VIP_AcademicPricing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /** Eğitim dönemi: Eylül (9) → Haziran (6), toplam 10 ay. */
  var START_MONTH = 9;
  var END_MONTH = 6;
  var TOTAL_MONTHS = 10;

  /** Dönem dışı aylar — Temmuz ve Ağustos. */
  function isOffSeason(month) {
    return month === 7 || month === 8;
  }

  /**
   * Dönemin kaçıncı ayındayız (Eylül = 1 … Haziran = 10).
   * Dönem iki takvim yılına yayıldığı için Eylül–Aralık ile Ocak–Haziran
   * ayrı hesaplanır: Ocak, önceki Eylül'de başlayan dönemin 5. ayıdır.
   * @returns {number|null} dönem dışıysa null
   */
  function termMonthIndex(month) {
    if (isOffSeason(month)) return null;
    if (month >= START_MONTH) return month - START_MONTH + 1; // Eylül..Aralık → 1..4
    return month + (12 - START_MONTH) + 1; // Ocak..Haziran → 5..10
  }

  /** Bu ay dahil, dönemin sonuna kadar kaç ay kaldı (Eylül 10 … Haziran 1). */
  function remainingMonths(date) {
    var m = monthOf(date);
    var idx = termMonthIndex(m);
    if (idx == null) return null;
    return TOTAL_MONTHS - idx + 1;
  }

  function monthOf(date) {
    var d = date instanceof Date ? date : date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) return new Date().getMonth() + 1;
    return d.getMonth() + 1;
  }

  /**
   * Güncel dönem fiyatı.
   *
   * @param {number} basePrice Eylül'deki tam dönem fiyatı
   * @param {Date|string} [date] hesap tarihi (varsayılan: şimdi)
   * @returns {{
   *   total: number, monthly: number, remaining: number, months: number,
   *   basePrice: number, offSeason: boolean, discounted: boolean
   * }|null}
   */
  function priceFor(basePrice, date) {
    var base = Number(basePrice);
    if (!isFinite(base) || base <= 0) return null;

    // Aylık bedel yıl boyunca sabit; kuruş kaymasın diye tam liraya yuvarlanır
    var monthly = Math.round(base / TOTAL_MONTHS);
    var remaining = remainingMonths(date);

    if (remaining == null) {
      // Temmuz–Ağustos: yeni dönem fiyatı katalogdan gelir, dokunulmaz
      return {
        total: base,
        monthly: monthly,
        remaining: TOTAL_MONTHS,
        months: TOTAL_MONTHS,
        basePrice: base,
        offSeason: true,
        discounted: false
      };
    }

    // Eylül'de tam dönem: yuvarlama yüzünden katalog fiyatından sapmasın
    var total = remaining === TOTAL_MONTHS ? base : monthly * remaining;

    return {
      total: total,
      monthly: monthly,
      remaining: remaining,
      months: TOTAL_MONTHS,
      basePrice: base,
      offSeason: false,
      discounted: total < base
    };
  }

  /**
   * Ürün için güncel fiyat. Ürün dönemlik değilse katalog fiyatı aynen döner,
   * böylece çağıran taraf her yerde bu fonksiyonu kullanabilir.
   */
  function productPrice(product, date) {
    if (!product) return 0;
    var base = Number(product.price) || 0;
    if (!isAcademicProduct(product)) return base;
    var p = priceFor(base, date);
    return p ? p.total : base;
  }

  /** Dönemlik fiyatlandırmaya dahil mi? Katalogda açıkça işaretlenir. */
  function isAcademicProduct(product) {
    return Boolean(product && product.dynamicAcademicPricing);
  }

  return {
    START_MONTH: START_MONTH,
    END_MONTH: END_MONTH,
    TOTAL_MONTHS: TOTAL_MONTHS,
    isOffSeason: isOffSeason,
    termMonthIndex: termMonthIndex,
    remainingMonths: remainingMonths,
    priceFor: priceFor,
    productPrice: productPrice,
    isAcademicProduct: isAcademicProduct
  };
});
