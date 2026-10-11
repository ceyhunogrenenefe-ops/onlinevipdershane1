/**
 * Deneme Kulübü — sayfa davranışı.
 *
 * Fiyat ve kampanya /api/deneme-kulubu-config'ten gelir (sunucu saati esas).
 * Takvim koçluk panelinden /api/public-exam-calendar ile canlı okunur; sitede
 * takvim kopyası tutulmaz.
 *
 * Sayfa, istekler başarısız olsa bile kullanılabilir kalır: fiyatlar yerel
 * veriden çizilir, takvim bölümü "yakında" der, kayıt formu çalışmaya devam
 * eder.
 */
(function () {
  var PANEL = 'https://www.dersonlinevipkocluk.com';
  var data = window.VIP_DenemeKulubu;
  if (!data) return;

  var state = { campaign: null, packages: null, counts: {} };

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function trDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return '—';
    return m[3] + '.' + m[2] + '.' + m[1];
  }

  /** Sunucu cevabı gelene kadar yerel veriyle çiz; gelince üstüne yaz. */
  function packagesNow() {
    if (state.packages) return state.packages;
    var now = Date.now();
    return data.PACKAGES.map(function (p) {
      var pr = data.priceFor(p, now);
      return {
        slug: p.slug, level: p.level, group: p.group, groupLabel: p.groupLabel,
        title: p.title, short: p.short, desc: p.desc, featured: !!p.featured,
        image: p.image, denemeSayisi: p.denemeSayisi, normalPrice: pr.normal, price: pr.current,
        discounted: pr.discounted, discountPercent: pr.percent,
        url: '/deneme-kulubu/' + p.slug
      };
    });
  }

  function campaignNow() {
    if (state.packages) return state.campaign;
    return data.campaignActiveAt(Date.now()) ? data.CAMPAIGN : null;
  }

  /** Paket slug'i -> katalog urun kimligi; sunucudaki kuralla ayni. */
  function productId(slug) {
    var s = String(slug);
    if (s === 'lgs') return 'denemeLgs';
    if (s === 'yks') return 'denemeYks';
    return 'deneme' + s.replace('-sinif', '');
  }

  function priceHtml(p) {
    var c = campaignNow();
    var out = '<div class="dk-price">';
    if (p.discounted) {
      out += '<span class="dk-price-old">' + esc(data.formatTl(p.normalPrice)) + '</span>';
      out += '<span class="dk-price-new">' + esc(data.formatTl(p.price)) + '</span>';
      out += '<span class="dk-off">%' + p.discountPercent + ' İndirim</span>';
    } else {
      out += '<span class="dk-price-new">' + esc(data.formatTl(p.price)) + '</span>';
    }
    out += '</div>';
    if (p.discounted && c && c.deadlineText) {
      out += '<div class="dk-deadline">' + esc(c.deadlineText) + '</div>';
    }
    return out;
  }

  /** Kart üzerindeki deneme sayısı: panelden gelen gerçek sayı varsa o. */
  function countLabel(p) {
    var live = state.counts[p.level];
    var n = (typeof live === 'number' && live > 0) ? live : p.denemeSayisi;
    if (!n) return '<span class="dk-count">Takvim hazırlanıyor</span>';
    return '<span class="dk-count">' + n + ' deneme sınavı</span>';
  }

  function renderCards() {
    var host = el('dkCards');
    if (!host) return;
    var list = packagesNow();
    host.innerHTML = list.map(function (p) {
      var img = p.image ? '<div class="dk-card-img"><img src="/' + esc(p.image) + '" alt="' + esc(p.short) + ' Deneme Kulübü" loading="lazy" width="400" height="220"></div>' : '';
      return '<article class="dk-card' + (p.featured ? ' dk-card--featured' : '') + '">'
        + img
        + '<div class="dk-card-top"><span class="dk-chip">' + esc(p.groupLabel) + '</span></div>'
        + '<h3>' + esc(p.short) + '</h3>'
        + countLabel(p)
        + '<p>' + esc(p.desc) + '</p>'
        + priceHtml(p)
        + '<a class="dk-btn dk-btn--primary dk-btn--wide dk-buy" data-urun="' + esc(productId(p.slug)) + '" href="/sepet.html?program=' + esc(productId(p.slug)) + '">Hemen Al</a>'
        + '<a class="dk-btn dk-btn--navy dk-btn--wide" href="' + esc(p.url) + '">İncele</a>'
        + '</article>';
    }).join('');
  }

  function renderCampaignBanner() {
    var host = el('dkCampaign');
    if (!host) return;
    var c = campaignNow();
    if (!c) { host.style.display = 'none'; host.innerHTML = ''; return; }
    host.style.display = '';
    host.innerHTML = '🔥 2026–2027 Deneme Kulübünde ' + esc(c.label) + ' — ' + esc(c.deadlineText);
  }

  /** Tek paketlik sayfalarda başlıktaki fiyat */
  function renderDetailPrice() {
    var host = el('dkDetailPrice');
    if (!host) return;
    var slug = host.getAttribute('data-slug');
    var p = packagesNow().filter(function (x) { return x.slug === slug; })[0];
    if (!p) return;
    var c = campaignNow();
    var out = '';
    if (p.discounted) {
      out += '<span class="dk-price-old">' + esc(data.formatTl(p.normalPrice)) + '</span>';
      out += '<span class="dk-price-new">' + esc(data.formatTl(p.price)) + '</span>';
      out += '<span class="dk-off">%' + p.discountPercent + ' İndirim</span>';
    } else {
      out += '<span class="dk-price-new">' + esc(data.formatTl(p.price)) + '</span>';
    }
    host.innerHTML = out;
    var dl = el('dkDetailDeadline');
    if (dl) dl.textContent = (p.discounted && c) ? c.deadlineText : '';
    var cnt = el('dkDetailCount');
    if (cnt) {
      var live = state.counts[p.level];
      var n = (typeof live === 'number' && live > 0) ? live : p.denemeSayisi;
      cnt.textContent = n ? n + ' deneme sınavı' : 'Takvim hazırlanıyor';
    }
  }

  function renderCalendar(level, rows) {
    var host = el('dkCalendar');
    if (!host) return;
    if (!rows || !rows.length) {
      host.innerHTML = '<div class="dk-empty">Bu sınıfın deneme takvimi hazırlanıyor. '
        + 'Tarihler belli olduğunda burada yayımlanacak.</div>';
      return;
    }
    var today = new Date().toISOString().slice(0, 10);
    var body = rows.map(function (r, i) {
      var gecti = String(r.exam_date || '') < today;
      return '<tr>'
        + '<td class="dk-no">' + (i + 1) + '. Deneme</td>'
        + '<td>' + esc(r.publisher || '—')
        + (r.content ? '<br><span style="font-size:12px;color:#6e6e73">' + esc(r.content) + '</span>' : '')
        + '</td>'
        + '<td class="dk-date">' + esc(trDate(r.exam_date)) + '</td>'
        + '<td><span class="dk-state ' + (gecti ? 'dk-state--done' : 'dk-state--plan') + '">'
        + (gecti ? 'Tamamlandı' : 'Planlandı') + '</span></td>'
        + '</tr>';
    }).join('');
    host.innerHTML = '<div class="dk-table-wrap"><table class="dk-table">'
      + '<thead><tr><th>Deneme</th><th>Yayın</th><th>Tarih</th><th>Durum</th></tr></thead>'
      + '<tbody>' + body + '</tbody></table></div>';
  }

  var calendarCache = {};
  function loadCalendar(level) {
    if (!level) return;
    var host = el('dkCalendar');
    if (calendarCache[level]) { renderCalendar(level, calendarCache[level]); return; }
    if (host) host.innerHTML = '<div class="dk-empty">Takvim yükleniyor…</div>';
    fetch(PANEL + '/api/public-exam-calendar?level=' + encodeURIComponent(level))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var rows = (j && j.data) || [];
        calendarCache[level] = rows;
        if (j && j.counts && typeof j.counts[level] === 'number') {
          state.counts[level] = j.counts[level];
          renderCards();
          renderDetailPrice();
        }
        renderCalendar(level, rows);
      })
      .catch(function () {
        renderCalendar(level, calendarCache[level] || []);
      });
  }

  /**
   * Takvim sekmeleri. Varsayilan sekme, TAKVIMI OLAN ilk kademedir: ilk sekme
   * 3. sinif oldugu ve onun takvimi henuz girilmedigi icin bolum bos aciliyor
   * ve ziyaretci "takvim yok" saniyordu. Sayilar panelden gelince dogru
   * sekme secilir.
   */
  function defaultLevel(list) {
    for (var i = 0; i < list.length; i += 1) {
      if (state.counts[list[i].level] > 0) return list[i].level;
    }
    // Sayim henuz gelmediyse takvimi bilinen kademeden basla
    for (var j = 0; j < list.length; j += 1) {
      if (list[j].denemeSayisi) return list[j].level;
    }
    return list[0] && list[0].level;
  }

  function initTabs() {
    var host = el('dkTabs');
    if (!host) return;
    var list = packagesNow();
    var secili = defaultLevel(list);
    host.innerHTML = list.map(function (p) {
      return '<button type="button" class="dk-tab" role="tab" data-level="' + esc(p.level) + '"'
        + ' aria-selected="' + (p.level === secili ? 'true' : 'false') + '">' + esc(p.short) + '</button>';
    }).join('');
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('.dk-tab');
      if (!btn) return;
      host.querySelectorAll('.dk-tab').forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
      btn.setAttribute('aria-selected', 'true');
      loadCalendar(btn.getAttribute('data-level'));
    });
    loadCalendar(secili);
  }

  /** Reklamdan gelen ziyaretçinin kaynağı forma taşınır */
  function utmFields() {
    var q = new URLSearchParams(location.search);
    return {
      utm_source: q.get('utm_source') || '',
      utm_medium: q.get('utm_medium') || '',
      utm_campaign: q.get('utm_campaign') || '',
      utm_content: q.get('utm_content') || ''
    };
  }

  /**
   * "Hemen Al": once sepete ekler, SONRA sepet sayfasina gider.
   *
   * Eskiden yalnizca /sepet.html?program=... adresine gidiliyordu ve ekleme
   * orada yapiliyordu; araya giren bir yonlendirme sorgu parametresini
   * dusurdugunde sepet sessizce bos kaliyor, kullanici "butona bastim bir sey
   * olmadi" diyordu. Artik ekleme tiklama aninda bu sayfada yapilir; adresteki
   * parametre yalnizca yedektir. Sepet API'si yuklenmediyse eski davranisa
   * donulur, akis hic kirilmaz.
   */
  function initBuy() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.dk-buy') : null;
      if (!a) return;
      var urun = a.getAttribute('data-urun');
      var cart = window.OVD_CART;
      if (!urun || !cart || typeof cart.add !== 'function') return; // href yedegi calisir
      e.preventDefault();
      try {
        cart.add(urun, 1);
        location.href = a.getAttribute('href');
      } catch (err) {
        // Sepete yazilamadi (ornegin depolama kapali) — kullaniciya soyle
        var msg = el('dkFormMsg');
        if (msg) {
          msg.className = 'dk-msg dk-msg--err';
          msg.textContent = 'Sepete eklenemedi. Tarayici depolaman kapali olabilir; WhatsApp’tan yazarsaniz kaydinizi biz olusturalim.';
          msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          alert('Sepete eklenemedi. Lutfen tekrar deneyin ya da WhatsApp’tan yazin.');
        }
      }
    });
  }

  function initForm() {
    var form = el('dkForm');
    if (!form) return;
    var sel = form.querySelector('[name="paket"]');
    if (sel && !sel.options.length) {
      sel.innerHTML = '<option value="">Paket seçin…</option>' + packagesNow().map(function (p) {
        return '<option value="' + esc(p.slug) + '">' + esc(p.title) + '</option>';
      }).join('');
    }
    var preset = form.getAttribute('data-paket');
    if (sel && preset) sel.value = preset;

    var msg = el('dkFormMsg');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var fd = new FormData(form);
      var payload = Object.assign({
        veli: fd.get('veli'),
        telefon: fd.get('telefon'),
        paket: fd.get('paket'),
        aranma: fd.get('aranma'),
        not: fd.get('not'),
        kvkk: form.querySelector('[name="kvkk"]').checked
      }, utmFields());

      msg.className = 'dk-msg';
      msg.textContent = '';
      if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }

      fetch('/api/deneme-kulubu-kayit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j && res.j.ok) {
            msg.className = 'dk-msg dk-msg--ok';
            msg.textContent = res.j.message || 'Başvurunuz alındı.';
            form.reset();
            if (sel && preset) sel.value = preset;
          } else {
            msg.className = 'dk-msg dk-msg--err';
            msg.textContent = (res.j && res.j.error) || 'Başvuru gönderilemedi. Lütfen tekrar deneyin.';
          }
        })
        .catch(function () {
          msg.className = 'dk-msg dk-msg--err';
          msg.textContent = 'Bağlantı kurulamadı. WhatsApp’tan da ulaşabilirsiniz.';
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Başvurumu Gönder'; }
        });
    });
  }

  function applyServerConfig(j) {
    if (!j || !j.packages) return;
    state.packages = j.packages;
    state.campaign = j.campaign || null;
    renderCampaignBanner();
    renderCards();
    renderDetailPrice();
  }

  function init() {
    renderCampaignBanner();
    renderCards();
    renderDetailPrice();
    initTabs();
    initForm();
    initBuy();

    /**
     * Butun kademelerin gercek deneme sayisi tek istekte alinir; kartlarda
     * paket vaadi yerine sistemdeki sayi gorunur ve takvim sekmesi dolu
     * kademede acilir.
     */
    fetch(PANEL + '/api/public-exam-calendar')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.counts) return;
        state.counts = j.counts;
        renderCards();
        renderDetailPrice();
        if (el('dkTabs')) initTabs();
      })
      .catch(function () { /* sayim olmadan da calisir */ });

    // Fiyatın doğrusu sunucudan; kampanya bitmişse indirim burada düşer
    fetch('/api/deneme-kulubu-config')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(applyServerConfig)
      .catch(function () { /* yerel fiyatlarla devam */ });

    // Detay sayfasında kendi takvimi
    var detail = el('dkCalendar');
    if (detail && detail.getAttribute('data-level') && !el('dkTabs')) {
      loadCalendar(detail.getAttribute('data-level'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
