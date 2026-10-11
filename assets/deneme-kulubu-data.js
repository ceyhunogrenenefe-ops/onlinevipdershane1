/**
 * Deneme Kulübü — paketler ve kampanya (tek kaynak).
 *
 * Hem sunucu (api/*) hem tarayıcı bu dosyayı okur; fiyat iki yerde ayrı
 * yazılmaz. Deneme TAKVİMİ burada tutulmaz: takvim koçluk panelinde yönetilir
 * ve /api/public-exam-calendar üzerinden canlı okunur. Buradaki `denemeSayisi`
 * yalnız paket vaadidir (kart üzerinde yazan sayı); takvim dolunca gerçek
 * kayıt sayısıyla karşılaştırılır.
 *
 * KAMPANYA: indirimin geçerli olup olmadığına SUNUCU karar verir
 * (api/deneme-kulubu-config.js). Tarayıcı saati değiştirilebildiği için
 * istemcideki hesap yalnız ilk çizim içindir; sunucudan gelen cevap esastır.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VIP_DenemeKulubu = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  /** Ekim kampanyası — Türkiye saati 31 Ekim 2026 23:59:59 */
  var CAMPAIGN = {
    id: 'ekim-2026',
    label: '%50 Ekim Kampanyası',
    shortLabel: '%50 İndirim',
    discountPercent: 50,
    startsAt: '2026-10-01T00:00:00+03:00',
    endsAt: '2026-10-31T23:59:59+03:00',
    deadlineText: "31 Ekim'e kadar"
  };

  /**
   * Kademeler. `level` değeri koçluk panelindeki takvim kademesiyle BİREBİR
   * aynı olmalı (EXAM_CALENDAR_LEVELS), yoksa takvim eşleşmez.
   */
  var PACKAGES = [
    {
      slug: '3-sinif', image: 'assets/img/programlar/ilkokul.jpg', level: '3', group: 'ilkokul', groupLabel: 'İlkokul',
      title: '3. Sınıf Deneme Kulübü', short: '3. Sınıf',
      denemeSayisi: null, normalPrice: 6000,
      desc: 'Sınav alışkanlığını erken kazandıran, kaygı yaratmayan düzenli deneme programı.'
    },
    {
      slug: '4-sinif', image: 'assets/img/programlar/ilkokul.jpg', level: '4', group: 'ilkokul', groupLabel: 'İlkokul',
      title: '4. Sınıf Deneme Kulübü', short: '4. Sınıf',
      denemeSayisi: null, normalPrice: 6000,
      desc: 'Temel derslerde eksikleri erkenden gösteren, gelişimi takip edilebilir deneme seti.'
    },
    {
      slug: '5-sinif', image: 'assets/img/programlar/ortaokul.jpg', level: '5', group: 'ortaokul', groupLabel: 'Ortaokul',
      title: '5. Sınıf Deneme Kulübü', short: '5. Sınıf',
      denemeSayisi: 21, normalPrice: 10000,
      desc: 'Ortaokula geçişte düzenli deneme disiplini ve ders bazlı net takibi.'
    },
    {
      slug: '6-sinif', image: 'assets/img/programlar/ortaokul.jpg', level: '6', group: 'ortaokul', groupLabel: 'Ortaokul',
      title: '6. Sınıf Deneme Kulübü', short: '6. Sınıf',
      denemeSayisi: 21, normalPrice: 10000,
      desc: 'Soru çözme hızını ve doğruluğunu artıran, analizle desteklenen deneme programı.'
    },
    {
      slug: '7-sinif', image: 'assets/img/programlar/ortaokul.jpg', level: '7', group: 'ortaokul', groupLabel: 'Ortaokul',
      title: '7. Sınıf Deneme Kulübü', short: '7. Sınıf',
      denemeSayisi: 21, normalPrice: 10000,
      desc: 'LGS formatına alışmayı sağlayan, kayıp puan analizli deneme seti.'
    },
    {
      slug: 'lgs', image: 'assets/img/programlar/lgs.jpg', level: 'lgs', group: 'lgs', groupLabel: 'LGS',
      title: 'LGS Deneme Kulübü', short: 'LGS (8. Sınıf)',
      denemeSayisi: 55, normalPrice: 16500, featured: true,
      desc: 'Sınav yılı için tam program: düzenli deneme takibi, canlı gözetim, net analizi ve gelişim raporları.'
    },
    {
      slug: '9-sinif', image: 'assets/img/programlar/lise.jpg', level: '9', group: 'lise', groupLabel: 'Lise',
      title: '9. Sınıf Deneme Kulübü', short: '9. Sınıf',
      denemeSayisi: 18, normalPrice: 11000,
      desc: 'Liseye güçlü başlangıç: okul müfredatına paralel denemeler ve TYT temeli.'
    },
    {
      slug: '10-sinif', image: 'assets/img/programlar/lise.jpg', level: '10', group: 'lise', groupLabel: 'Lise',
      title: '10. Sınıf Deneme Kulübü', short: '10. Sınıf',
      denemeSayisi: 18, normalPrice: 11000,
      desc: 'Alan seçimine giderken eksikleri gösteren, gelişimi ölçülebilir deneme programı.'
    },
    {
      slug: '11-sinif', image: 'assets/img/programlar/lise.jpg', level: '11', group: 'lise', groupLabel: 'Lise',
      title: '11. Sınıf Deneme Kulübü', short: '11. Sınıf',
      denemeSayisi: 27, normalPrice: 11000,
      desc: 'TYT ve AYT dengesini kuran, net takibiyle desteklenen yoğun deneme seti.'
    },
    {
      slug: 'yks', image: 'assets/img/programlar/kamplar.jpg', level: 'yks', group: 'yks', groupLabel: 'YKS',
      title: 'YKS Deneme Kulübü', short: 'YKS (12 / Mezun)',
      denemeSayisi: 54, normalPrice: 16500, featured: true,
      desc: 'TYT ve AYT denemelerini kapsayan tam program; kayıp puan, net ve gelişim analizi.'
    }
  ];

  var GROUPS = [
    { id: 'ilkokul', label: 'İlkokul', note: '3 ve 4. sınıf' },
    { id: 'ortaokul', label: 'Ortaokul', note: '5, 6 ve 7. sınıf' },
    { id: 'lgs', label: 'LGS', note: '8. sınıf' },
    { id: 'lise', label: 'Lise', note: '9, 10 ve 11. sınıf' },
    { id: 'yks', label: 'YKS', note: '12. sınıf ve mezun' }
  ];

  function round(n) {
    return Math.round(Number(n) || 0);
  }

  /** Kampanya verilen ANDA geçerli mi? Zamanı çağıran verir (sunucu saati). */
  function campaignActiveAt(nowMs, campaign) {
    var c = campaign || CAMPAIGN;
    var t = Number(nowMs);
    if (!isFinite(t)) return false;
    var start = Date.parse(c.startsAt);
    var end = Date.parse(c.endsAt);
    if (!isFinite(start) || !isFinite(end)) return false;
    return t >= start && t <= end;
  }

  /** Kampanyalı fiyat. Kampanya geçersizse normal fiyata döner. */
  function priceFor(pkg, nowMs, campaign) {
    var c = campaign || CAMPAIGN;
    var normal = round(pkg && pkg.normalPrice);
    var active = campaignActiveAt(nowMs, c);
    if (!active) {
      return { normal: normal, current: normal, discounted: false, percent: 0 };
    }
    var pct = Math.max(0, Math.min(90, Number(c.discountPercent) || 0));
    return {
      normal: normal,
      current: round(normal * (100 - pct) / 100),
      discounted: pct > 0,
      percent: pct
    };
  }

  function bySlug(slug) {
    var s = String(slug || '').trim();
    for (var i = 0; i < PACKAGES.length; i += 1) {
      if (PACKAGES[i].slug === s) return PACKAGES[i];
    }
    return null;
  }

  function byLevel(level) {
    var s = String(level || '').trim().toLowerCase();
    for (var i = 0; i < PACKAGES.length; i += 1) {
      if (String(PACKAGES[i].level).toLowerCase() === s) return PACKAGES[i];
    }
    return null;
  }

  /** "16.500 ₺" */
  function formatTl(n) {
    return round(n).toLocaleString('tr-TR') + ' ₺';
  }

  return {
    CAMPAIGN: CAMPAIGN,
    PACKAGES: PACKAGES,
    GROUPS: GROUPS,
    campaignActiveAt: campaignActiveAt,
    priceFor: priceFor,
    bySlug: bySlug,
    byLevel: byLevel,
    formatTl: formatTl
  };
});
