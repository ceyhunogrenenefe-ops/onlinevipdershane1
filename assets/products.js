(function (global) {
  var PRODUCTS = {
    lgs: {
      id: 'lgs',
      name: 'LGS Hazırlık',
      subtitle: '8. Sınıf · Yıllık program',
      price: 120000,
      listPrice: 171429,
      period: 'yıl',
      educationMonths: 10,
      slug: 'programlar/lgs.html',
    },
    yks: {
      id: 'yks',
      name: 'YKS TYT-AYT Hazırlık',
      subtitle: 'Üniversite · Yıllık program',
      price: 119000,
      listPrice: 170000,
      period: 'yıl',
      educationMonths: 10,
      slug: 'programlar/yks.html',
    },
    ortaokul: {
      id: 'ortaokul',
      name: '5-6-7. Sınıf VIP Paketi',
      subtitle: 'Ortaokul · Yıllık program',
      price: 98000,
      listPrice: 140000,
      period: 'yıl',
      educationMonths: 10,
      slug: 'programlar/ortaokul.html',
    },
    lise: {
      id: 'lise',
      name: '9-10-11. Sınıf Programı',
      subtitle: 'Lise · Yıllık program',
      price: 112000,
      listPrice: 160000,
      period: 'yıl',
      educationMonths: 10,
      slug: 'programlar/lise.html',
    },
    ilkokul: {
      id: 'ilkokul',
      name: '3-4. Sınıf Programı',
      subtitle: 'İlkokul · Yıllık program',
      price: 84000,
      listPrice: 120000,
      period: 'yıl',
      educationMonths: 10,
      slug: 'programlar/ilkokul.html',
    },
    sinif2: {
      id: 'sinif2',
      name: '2. Sınıf Canlı Dönem Programı',
      subtitle: 'İlkokul 2. Sınıf · Yıllık paket',
      price: 59900,
      period: 'yıl',
      slug: 'programlar/sinif-2.html',
    },
    kamplar: {
      id: 'kamplar',
      name: 'Yaz Kampları',
      subtitle: 'Temmuz-Ağustos · Kamp programı',
      price: 5000,
      period: 'kamp',
      slug: 'programlar/kamplar.html',
    },
    kamp9Hazirlik: {
      id: 'kamp9Hazirlik',
      name: '9. Sınıfa Hazırlık Kampı',
      subtitle: '4 hafta · 20 saat matematik · 3 Ağustos',
      price: 5000,
      period: 'kamp',
      slug: 'programlar/kamp-9-hazirlik.html',
    },
    kampLgs: {
      id: 'kampLgs',
      name: 'LGS Yaz Kampı',
      subtitle: '8. Sınıf · 9 haftalık kamp',
      price: 24000,
      period: 'kamp',
      slug: 'programlar/kamp-lgs.html',
    },
    kamp56: {
      id: 'kamp56',
      name: "5'ten 6. Sınıfa Geçenler Yaz Kampı",
      subtitle: '5-6. Sınıf · 9 haftalık kamp',
      price: 24000,
      period: 'kamp',
      slug: 'programlar/kamp-56.html',
    },
    kamp910: {
      id: 'kamp910',
      name: "9'dan 10'a Geçenler Yaz Kampı",
      subtitle: 'Lise geçiş · 9 haftalık kamp',
      price: 24000,
      period: 'kamp',
      slug: 'programlar/kamp-910.html',
    },
    kampMaarifTyt: {
      id: 'kampMaarifTyt',
      name: "Maarif Model TYT Yaz Kampı",
      subtitle: '10-11. sınıf · 9 haftalık kamp',
      price: 24000,
      period: 'kamp',
      slug: 'programlar/kamp-maarif-tyt.html',
    },
    kampTyt: {
      id: 'kampTyt',
      name: "11'den 12'ye TYT Yaz Kampı",
      subtitle: 'TYT hızlandırma · 9 haftalık kamp',
      price: 24000,
      period: 'kamp',
      slug: 'programlar/kamp-tyt.html',
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
      slug: 'kitap-atolyesi.html',
    },
    start: {
      id: 'start',
      name: 'VIP Start Paketi',
      subtitle: 'Yıl boyu tam entegre',
      price: 28000,
      period: 'paket',
      slug: 'programlar/start.html',
    },
    kocluk: {
      id: 'kocluk',
      name: 'Yıllık Premium Eğitim Koçluğu',
      subtitle: 'Yıllık birebir koçluk · Tek çekim veya taksit',
      price: 39900,
      period: 'yıl',
      slug: 'programlar/kocluk.html',
    },
    'ders-1': {
      id: 'ders-1',
      name: 'Premium Özel Ders — 1 Ders',
      subtitle: 'Birebir canlı özel ders',
      price: 1100,
      period: 'paket',
      slug: 'premium-paketler.html',
    },
    'ders-3': {
      id: 'ders-3',
      name: 'Premium Özel Ders — 3 Ders',
      subtitle: 'Birebir canlı özel ders paketi',
      price: 3000,
      period: 'paket',
      slug: 'premium-paketler.html',
    },
    'ders-5': {
      id: 'ders-5',
      name: 'Premium Özel Ders — 5 Ders',
      subtitle: 'Birebir canlı özel ders paketi',
      price: 4900,
      period: 'paket',
      slug: 'premium-paketler.html',
    },
    'ders-10': {
      id: 'ders-10',
      name: 'Premium Özel Ders — 10 Ders',
      subtitle: 'En avantajlı birebir paket',
      price: 9500,
      period: 'paket',
      slug: 'premium-paketler.html',
    },
  };

  var PATH_TO_ID = {
    'lgs.html': 'lgs',
    'yks.html': 'yks',
    'ortaokul.html': 'ortaokul',
    'lise.html': 'lise',
    'ilkokul.html': 'ilkokul',
    'sinif-2.html': 'sinif2',
    'kamplar.html': 'kamplar',
    'kamp-9-hazirlik.html': 'kamp9Hazirlik',
    'kamp-lgs.html': 'kampLgs',
    'kamp-56.html': 'kamp56',
    'kamp-910.html': 'kamp910',
    'kamp-maarif-tyt.html': 'kampMaarifTyt',
    'kamp-tyt.html': 'kampTyt',
    'yazili.html': 'yazili',
    'kitap.html': 'kitap',
    'kitap-atolyesi.html': 'kitap',
    'start.html': 'start',
    'kocluk.html': 'kocluk',
  };

  /** Sepetteki urunlere gore onerilecek ilgili programlar */
  var RELATED = {
    lgs: ['kampLgs', 'kamp9Hazirlik', 'yazili'],
    kampLgs: ['lgs', 'kamp9Hazirlik', 'kamplar'],
    kamp9Hazirlik: ['lise', 'kamp910', 'kampLgs'],
    yks: ['kampTyt', 'kampMaarifTyt', 'yazili'],
    kampTyt: ['yks', 'kampMaarifTyt', 'lise'],
    kampMaarifTyt: ['yks', 'kampTyt', 'lise'],
    ortaokul: ['kamp56', 'yazili', 'ilkokul'],
    kamp56: ['ortaokul', 'kampLgs', 'yazili'],
    lise: ['kamp9Hazirlik', 'kamp910', 'kampMaarifTyt'],
    kamp910: ['lise', 'kamp9Hazirlik', 'kampTyt'],
    ilkokul: ['sinif2', 'ortaokul', 'kamp56'],
    sinif2: ['ilkokul', 'start'],
    yazili: ['kitap', 'lgs', 'ortaokul', 'lise'],
    kitap: ['yazili', 'start', 'lgs'],
    start: ['yks', 'lgs', 'kocluk'],
    kocluk: ['start', 'lgs', 'yks'],
    kamplar: ['kamp9Hazirlik', 'kampLgs', 'kamp56', 'kamp910'],
  };

  function formatPrice(amount) {
    return amount.toLocaleString('tr-TR') + '₺';
  }

  function getProduct(id) {
    return PRODUCTS[id] || null;
  }

  function getEducationPricing(id) {
    var p = PRODUCTS[id];
    if (!p || !p.educationMonths) return null;
    var months = p.educationMonths;
    var monthly = Math.round(p.price / months);
    return {
      months: months,
      monthly: monthly,
      total: p.price,
      listPrice: p.listPrice || null,
      monthlyFormatted: formatPrice(monthly),
      totalFormatted: formatPrice(p.price),
      listFormatted: p.listPrice ? formatPrice(p.listPrice) : null,
    };
  }

  function getProductByPath(pathname) {
    var file = pathname.split('/').pop() || '';
    var id = PATH_TO_ID[file];
    return id ? PRODUCTS[id] : null;
  }

  function getRelatedProducts(cartIds, limit) {
    limit = limit || 4;
    var inCart = {};
    (cartIds || []).forEach(function (id) {
      inCart[id] = true;
    });
    var scores = {};
    (cartIds || []).forEach(function (id) {
      var related = RELATED[id] || [];
      related.forEach(function (relId, index) {
        if (inCart[relId] || !PRODUCTS[relId]) return;
        scores[relId] = (scores[relId] || 0) + (related.length - index);
      });
    });
    return Object.keys(scores)
      .sort(function (a, b) {
        return scores[b] - scores[a];
      })
      .slice(0, limit)
      .map(function (id) {
        return PRODUCTS[id];
      });
  }

  function educationDiscountPct(listPrice, price) {
    if (!listPrice || listPrice <= price) return null;
    return Math.round((1 - price / listPrice) * 100);
  }

  function renderEducationPricingHtml(pricing, compact) {
    var html = '<div class="price-edu' + (compact ? ' price-edu--compact' : '') + '">';
    html += '<span class="price-edu-badge">' + pricing.months + ' Aylık Kapsamlı Program</span>';

    if (pricing.listFormatted) {
      var pct = educationDiscountPct(pricing.listPrice, pricing.total);
      html += '<div class="price-edu-top">';
      html += '<s class="price-edu-old">' + pricing.listFormatted + '</s>';
      if (pct) html += '<span class="price-edu-discount">%' + pct + ' indirim</span>';
      html += '</div>';
    }

    html += '<div class="price-edu-hero">' + pricing.monthlyFormatted + ' <span class="price-edu-per">/ ay</span></div>';
    html += '<div class="price-edu-sub">' + pricing.months + ' Ay × ' + pricing.monthlyFormatted + '</div>';
    html +=
      '<div class="price-edu-total">' +
      pricing.months +
      ' Aylık Toplam Eğitim Bedeli: ' +
      pricing.totalFormatted +
      '</div>';
    html += '</div>';
    return html;
  }

  function hydrateEducationPrices() {
    if (typeof document === 'undefined') return;

    document.querySelectorAll('[data-vip-education-price]').forEach(function (el) {
      var id = el.getAttribute('data-vip-education-price');
      var pricing = getEducationPricing(id);
      if (!pricing) return;

      var isPriceBox = el.classList.contains('price-box');
      var html = renderEducationPricingHtml(pricing, !isPriceBox);
      var mount = el.querySelector('.price-edu-mount');

      if (mount) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var block = tmp.firstElementChild;
        if (block) {
          mount.className = 'price-edu-mount ' + block.className;
          mount.innerHTML = block.innerHTML;
        }
      } else if (isPriceBox) {
        var actions = [];
        Array.from(el.children).forEach(function (child) {
          actions.push(child);
        });
        var wrapper = document.createElement('div');
        wrapper.className = 'price-edu-mount';
        wrapper.innerHTML = html;
        el.insertBefore(wrapper, el.firstChild);
      } else {
        el.innerHTML = html;
        el.classList.add('prog-price--education');
      }

      if (isPriceBox) {
        var kayit = el.querySelector('.btn-kayit');
        if (kayit && !kayit.dataset.eduCta) {
          kayit.textContent = '📋 Programa Başvur';
          kayit.dataset.eduCta = '1';
        }
      }
    });
  }

  global.VIP_PRODUCTS = PRODUCTS;
  global.VIP_getProduct = getProduct;
  global.VIP_getEducationPricing = getEducationPricing;
  global.VIP_getProductByPath = getProductByPath;
  global.VIP_getRelatedProducts = getRelatedProducts;
  global.VIP_formatPrice = formatPrice;
  global.VIP_renderEducationPricingHtml = renderEducationPricingHtml;
  global.VIP_hydrateEducationPrices = hydrateEducationPrices;

  if (typeof document !== 'undefined') {
    function scheduleEducationPricing() {
      hydrateEducationPrices();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scheduleEducationPricing);
    } else {
      scheduleEducationPricing();
    }
  }
})(typeof window !== 'undefined' ? window : global);
