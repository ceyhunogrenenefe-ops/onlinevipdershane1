(function (global) {
  var PRODUCTS = {
    lgs: {
      id: 'lgs',
      name: 'LGS Hazırlık',
      subtitle: '8. Sınıf · Yıllık program',
      price: 96000,
      period: 'yıl',
      slug: 'programlar/lgs.html',
    },
    yks: {
      id: 'yks',
      name: 'YKS TYT-AYT Hazırlık',
      subtitle: 'Üniversite · Yıllık program',
      price: 104000,
      period: 'yıl',
      slug: 'programlar/yks.html',
    },
    ortaokul: {
      id: 'ortaokul',
      name: '5-6-7. Sınıf VIP Paketi',
      subtitle: 'Ortaokul · Yıllık program',
      price: 88000,
      period: 'yıl',
      slug: 'programlar/ortaokul.html',
    },
    lise: {
      id: 'lise',
      name: '9-10-11. Sınıf Programı',
      subtitle: 'Lise · Yıllık program',
      price: 96000,
      period: 'yıl',
      slug: 'programlar/lise.html',
    },
    ilkokul: {
      id: 'ilkokul',
      name: '3-4. Sınıf Programı',
      subtitle: 'İlkokul · Yıllık program',
      price: 72000,
      period: 'yıl',
      slug: 'programlar/ilkokul.html',
    },
    kamplar: {
      id: 'kamplar',
      name: 'Yaz Kampları',
      subtitle: 'Temmuz-Ağustos · Kamp programı',
      price: 24000,
      period: 'kamp',
      slug: 'programlar/kamplar.html',
    },
    yazili: {
      id: 'yazili',
      name: 'Yazılıya Hazırlık',
      subtitle: '27 saatlik program',
      price: 2500,
      period: 'program',
      slug: 'programlar/yazili.html',
    },
    kitap: {
      id: 'kitap',
      name: 'Kitap Atölyesi',
      subtitle: '8 haftalık program',
      price: 12000,
      period: 'program',
      slug: 'programlar/kitap.html',
    },
    start: {
      id: 'start',
      name: 'VIP Start Paketi',
      subtitle: 'Yıl boyu tam entegre',
      price: 28000,
      period: 'paket',
      slug: 'programlar/start.html',
    },
  };

  var PATH_TO_ID = {
    'lgs.html': 'lgs',
    'yks.html': 'yks',
    'ortaokul.html': 'ortaokul',
    'lise.html': 'lise',
    'ilkokul.html': 'ilkokul',
    'kamplar.html': 'kamplar',
    'yazili.html': 'yazili',
    'kitap.html': 'kitap',
    'start.html': 'start',
  };

  function formatPrice(amount) {
    return amount.toLocaleString('tr-TR') + '₺';
  }

  function getProduct(id) {
    return PRODUCTS[id] || null;
  }

  function getProductByPath(pathname) {
    var file = pathname.split('/').pop() || '';
    var id = PATH_TO_ID[file];
    return id ? PRODUCTS[id] : null;
  }

  global.VIP_PRODUCTS = PRODUCTS;
  global.VIP_getProduct = getProduct;
  global.VIP_getProductByPath = getProductByPath;
  global.VIP_formatPrice = formatPrice;
})(typeof window !== 'undefined' ? window : global);
