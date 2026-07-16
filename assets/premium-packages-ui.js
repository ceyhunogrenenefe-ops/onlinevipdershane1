/**
 * Premium paket kartları — sepete ekle → PayTR ödeme (odeme.html)
 */
(function (global) {
  var FALLBACK_PACKAGES = [
    {
      id: 'ders-1',
      lessons: 1,
      title: '1 Ders',
      price: 1100,
      unitPrice: 1100,
      featured: false,
      perks: ['Canlı birebir ders', 'Ders kaydı', '7 gün tekrar izleme'],
      available: true,
    },
    {
      id: 'ders-3',
      lessons: 3,
      title: '3 Ders',
      price: 3000,
      unitPrice: 1000,
      featured: false,
      perks: ['3 canlı birebir ders', 'Ders kayıtları', 'Haftalık mini takip'],
      available: true,
    },
    {
      id: 'ders-5',
      lessons: 5,
      title: '5 Ders',
      price: 4500,
      unitPrice: 900,
      featured: false,
      perks: ['5 canlı birebir ders', 'AI koçluk özeti', 'Veli bilgilendirme'],
      available: true,
    },
    {
      id: 'ders-10',
      lessons: 10,
      title: '10 Ders',
      price: 8500,
      unitPrice: 850,
      featured: true,
      badge: 'En avantajlı',
      perks: ['10 canlı birebir ders', 'AI koçluk + haftalık rapor', 'Öncelikli saat', '1M+ soru havuzu'],
      available: true,
    },
  ];

  function qs(name) {
    return new URLSearchParams(global.location.search).get(name) || '';
  }

  function formatPrice(n) {
    return Number(n).toLocaleString('tr-TR') + ' ₺';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function odemeHref(packageId, teacher) {
    var params = new URLSearchParams({ paket: packageId });
    if (teacher) params.set('ogretmen', teacher);
    return 'odeme.html?' + params.toString();
  }

  function cardHtml(pkg) {
    var featured = pkg.featured;
    var wrap =
      'group relative flex flex-col overflow-hidden rounded-2xl p-6 sm:p-7 transition duration-300 ' +
      (featured
        ? 'border-2 border-accent bg-white text-ink shadow-lift scale-[1.02] lg:-translate-y-2 z-[1]'
        : 'border border-slate-200/80 bg-white/90 text-ink shadow-soft hover:-translate-y-1 hover:shadow-lift');

    var badge = pkg.badge
      ? '<span class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">' +
        escapeHtml(pkg.badge) +
        '</span>'
      : '';

    var perks = (pkg.perks || [])
      .map(function (p) {
        return (
          '<li class="flex gap-2 text-sm ' +
          (featured ? 'text-ink/80' : 'text-mute') +
          '"><span class="text-emerald-500 font-bold">✔</span><span>' +
          escapeHtml(p) +
          '</span></li>'
        );
      })
      .join('');

    var savings =
      pkg.unitPrice < 1100
        ? '<p class="mt-1 text-xs font-bold text-emerald-600">Ders başı ' +
          formatPrice(pkg.unitPrice) +
          ' · %' +
          Math.round((1 - pkg.unitPrice / 1100) * 100) +
          ' tasarruf</p>'
        : '';

    var btnClass = featured
      ? 'mt-8 inline-flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white transition hover:bg-accent-2'
      : 'mt-8 inline-flex w-full items-center justify-center rounded-xl border-2 border-navy bg-white px-5 py-3.5 text-sm font-bold text-navy transition hover:bg-navy hover:text-white';

    return (
      '<article class="' +
      wrap +
      '" data-package="' +
      escapeHtml(pkg.id) +
      '">' +
      badge +
      '<div class="flex items-start justify-between gap-3">' +
      '<div>' +
      '<p class="text-xs font-bold uppercase tracking-wider text-navy">' +
      pkg.lessons +
      ' ders paketi</p>' +
      '<h3 class="mt-1 font-display text-2xl font-extrabold text-ink">' +
      escapeHtml(pkg.title) +
      '</h3>' +
      savings +
      '</div>' +
      '<div class="rounded-xl bg-soft px-3 py-2 text-right">' +
      '<p class="font-display text-3xl font-extrabold leading-none text-navy">' +
      formatPrice(pkg.price) +
      '</p>' +
      '</div>' +
      '</div>' +
      '<ul class="mt-6 flex flex-1 flex-col gap-2.5">' +
      perks +
      '</ul>' +
      '<button type="button" class="pkg-buy ' +
      btnClass +
      '" data-package="' +
      escapeHtml(pkg.id) +
      '">Paketi Seç → PayTR ile Öde</button>' +
      '</article>'
    );
  }

  function renderGrid(el, packages) {
    if (!el) return;
    el.innerHTML = packages.map(cardHtml).join('');
  }

  function buyPackage(packageId, teacher) {
    if (!global.OVD_CART || !global.VIP_getProduct) {
      throw new Error('Sepet sistemi yüklenemedi. Sayfayı yenileyin.');
    }
    if (!global.VIP_getProduct(packageId)) {
      throw new Error('Geçersiz paket.');
    }
    global.OVD_CART.write([{ id: packageId, qty: 1 }]);
    if (teacher) {
      try {
        sessionStorage.setItem('ovd_premium_teacher', teacher);
      } catch (_) {}
    }
    global.location.href = odemeHref(packageId, teacher);
  }

  function bindClicks(root, teacher) {
    if (!root || root._pkgBound) return;
    root._pkgBound = true;
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('.pkg-buy');
      if (!btn) return;
      var id = btn.getAttribute('data-package');
      btn.disabled = true;
      var old = btn.textContent;
      btn.textContent = 'Ödemeye gidiliyor…';
      try {
        buyPackage(id, teacher);
      } catch (err) {
        alert(err.message || 'Bir hata oluştu.');
        btn.disabled = false;
        btn.textContent = old;
      }
    });
  }

  async function init(opts) {
    opts = opts || {};
    var grid = document.getElementById(opts.gridId || 'premiumPackageGrid');
    var teacher = opts.teacher || qs('ogretmen') || qs('teacher') || '';

    var packages = FALLBACK_PACKAGES;
    try {
      var res = await fetch('/api/premium-packages');
      var data = await res.json();
      if (data.ok && data.packages && data.packages.length) packages = data.packages;
    } catch (_) {}

    renderGrid(grid, packages);
    bindClicks(grid, teacher);
  }

  global.OVD_PREMIUM_PACKAGES = { init: init, formatPrice: formatPrice, buyPackage: buyPackage };
})(typeof window !== 'undefined' ? window : global);
