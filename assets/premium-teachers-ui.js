/**
 * Premium öğretmen filtresi + kart grid (ozel-ders.html)
 * Kaynak: panel yayınlı + panelde kaydı olmayan statik katalog. Panel pasifi statikten bile düşer.
 */
(function (global) {
  function mapApiTeacher(t) {
    var exams = Array.isArray(t.exam_areas) ? t.exam_areas.join(' / ') : '';
    return {
      slug: t.slug,
      name: t.name || 'Öğretmen',
      branch: t.branch || '',
      university: t.university || '',
      experience: Number(t.experience_years) || 0,
      rating: null,
      lessons: null,
      live: t.online_lessons !== false,
      available: t.accepting_students !== false,
      price: null,
      grades: Array.isArray(t.grade_levels) ? t.grade_levels.slice() : [],
      photo: t.photo_url || 'assets/img/ovd-logo.png',
      photoPos: 'center 20%',
      role: t.title || [t.branch, exams].filter(Boolean).join(' · '),
      fromApi: true,
      short_bio: t.short_bio || ''
    };
  }

  function initPremiumTeachersUi(opts) {
    opts = opts || {};
    var PAGE_SIZE = opts.pageSize || 6;
    var state = { page: 1, filtered: [] };
    var grid = document.getElementById('teacherGrid');
    if (!grid) return;

    var empty = document.getElementById('emptyState');
    var meta = document.getElementById('resultMeta');
    var pager = document.getElementById('pagination');
    var teachers = (global.OVD_PREMIUM_TEACHERS || []).slice();
    var sourceLabel = 'katalog';

    var els = {
      q: document.getElementById('q'),
      branch: document.getElementById('f-branch'),
      grade: document.getElementById('f-grade'),
      price: document.getElementById('f-price'),
      avail: document.getElementById('f-avail'),
      exp: document.getElementById('f-exp'),
      reset: document.getElementById('btnReset'),
    };

    function escapeHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function uniqueBranches() {
      var set = {};
      teachers.forEach(function (t) {
        if (t.branch) set[t.branch] = true;
      });
      return Object.keys(set).sort(function (a, b) {
        return a.localeCompare(b, 'tr');
      });
    }

    function fillBranches() {
      if (!els.branch) return;
      var html = '<option value="">Tümü</option>';
      uniqueBranches().forEach(function (b) {
        html += '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + '</option>';
      });
      els.branch.innerHTML = html;
    }

    function priceMatch(t, key) {
      if (!key) return true;
      if (t.price == null) return true;
      if (key === '0-650') return t.price <= 650;
      if (key === '651-800') return t.price >= 651 && t.price <= 800;
      if (key === '801+') return t.price >= 801;
      return true;
    }

    function expMatch(t, key) {
      if (!key) return true;
      if (key === '0-9') return t.experience <= 9;
      if (key === '10-15') return t.experience >= 10 && t.experience <= 15;
      if (key === '16+') return t.experience >= 16;
      return true;
    }

    function availMatch(t, key) {
      if (!key) return true;
      if (key === '1') return t.available === true;
      if (key === '0') return t.available === false;
      if (key === 'live') return t.live === true;
      return true;
    }

    function profileHref(slug) {
      return '/ozel-ders/ogretmen/' + encodeURIComponent(slug);
    }

    function cardHtml(t) {
      var liveBadge = t.live
        ? '<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>Canlı</span>'
        : '<span class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">Çevrimdışı</span>';
      var availBadge = t.available
        ? '<span class="inline-flex rounded-full bg-navy/10 px-2.5 py-1 text-[11px] font-bold text-navy">Müsait</span>'
        : '<span class="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">Dolu</span>';
      var pos = t.photoPos || 'center 20%';
      var ratingTxt = t.rating != null ? '★ ' + Number(t.rating).toFixed(1) : '—';
      var lessonsTxt = t.lessons != null ? Number(t.lessons).toLocaleString('tr-TR') : '—';

      return (
        '<article class="card-enter flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">' +
          '<div class="teacher-photo-box relative">' +
            '<img data-src="' + escapeHtml(t.photo) + '" alt="' + escapeHtml(t.name) + ' — ' + escapeHtml(t.branch) + '" width="480" height="600" class="lazy-img teacher-photo" style="object-position:' + escapeHtml(pos) + '" decoding="async">' +
            '<div class="absolute left-3 top-3 flex flex-wrap gap-1.5">' + liveBadge + availBadge + '</div>' +
          '</div>' +
          '<div class="flex flex-1 flex-col p-4 sm:p-5">' +
            '<h2 class="font-display text-lg font-bold text-ink">' + escapeHtml(t.name) + '</h2>' +
            '<p class="mt-0.5 text-sm font-bold text-navy">' + escapeHtml(t.role || t.branch) + '</p>' +
            '<p class="mt-1 text-xs font-semibold text-mute">' + escapeHtml(t.university) + '</p>' +
            '<dl class="mt-4 grid grid-cols-3 gap-2 text-center">' +
              '<div class="rounded-xl bg-soft px-2 py-2"><dt class="text-[10px] font-bold uppercase tracking-wide text-mute">Deneyim</dt><dd class="mt-0.5 text-sm font-extrabold text-ink">' + (t.experience || '—') + (t.experience ? ' yıl' : '') + '</dd></div>' +
              '<div class="rounded-xl bg-soft px-2 py-2"><dt class="text-[10px] font-bold uppercase tracking-wide text-mute">Puan</dt><dd class="mt-0.5 text-sm font-extrabold text-ink">' + ratingTxt + '</dd></div>' +
              '<div class="rounded-xl bg-soft px-2 py-2"><dt class="text-[10px] font-bold uppercase tracking-wide text-mute">Ders</dt><dd class="mt-0.5 text-sm font-extrabold text-ink">' + lessonsTxt + '</dd></div>' +
            '</dl>' +
            '<div class="mt-auto flex gap-2 pt-4">' +
              '<a href="' + profileHref(t.slug) + '" class="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-navy hover:border-navy hover:bg-soft">Profil</a>' +
              '<a href="premium-paketler.html?ogretmen=' + encodeURIComponent(t.slug) + '" class="inline-flex flex-1 items-center justify-center rounded-xl bg-accent px-3 py-2.5 text-sm font-bold text-white hover:bg-accent-2">Eğitimi Al</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }

    function observeLazy() {
      var imgs = grid.querySelectorAll('img.lazy-img[data-src]');
      if (!('IntersectionObserver' in window)) {
        imgs.forEach(function (img) {
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          img.classList.add('in');
        });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var img = e.target;
          var src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.onload = function () {
              var card = img.closest('.card-enter');
              if (card) card.classList.add('in');
            };
          }
          io.unobserve(img);
        });
      }, { rootMargin: '120px 0px', threshold: 0.01 });
      imgs.forEach(function (img) {
        io.observe(img);
      });

      var cards = grid.querySelectorAll('.card-enter');
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            cio.unobserve(e.target);
          }
        });
      }, { threshold: 0.08 });
      cards.forEach(function (c) {
        cio.observe(c);
      });
    }

    function pageSlice() {
      var start = (state.page - 1) * PAGE_SIZE;
      return state.filtered.slice(start, start + PAGE_SIZE);
    }

    function totalPages() {
      return Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    }

    function renderPager() {
      if (!pager) return;
      var pages = totalPages();
      if (state.filtered.length === 0) {
        pager.innerHTML = '';
        return;
      }
      var html = '';
      html +=
        '<button type="button" data-page="prev" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-navy disabled:opacity-40" ' +
        (state.page <= 1 ? 'disabled' : '') +
        '>‹ Önceki</button>';
      for (var i = 1; i <= pages; i++) {
        var active = i === state.page;
        html +=
          '<button type="button" data-page="' +
          i +
          '" class="min-w-[40px] rounded-xl px-3 py-2 text-sm font-bold ' +
          (active ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-navy hover:bg-soft') +
          '">' +
          i +
          '</button>';
      }
      html +=
        '<button type="button" data-page="next" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-navy disabled:opacity-40" ' +
        (state.page >= pages ? 'disabled' : '') +
        '>Sonraki ›</button>';
      pager.innerHTML = html;
    }

    function render() {
      var list = pageSlice();
      var total = state.filtered.length;
      var pages = totalPages();
      if (meta) {
        meta.textContent = total
          ? total + ' öğretmen · Sayfa ' + state.page + ' / ' + pages + (sourceLabel === 'panel' ? ' · canlı kadro' : '')
          : '0 öğretmen';
      }

      if (!total) {
        grid.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        renderPager();
        return;
      }
      if (empty) empty.classList.add('hidden');
      grid.innerHTML = list.map(cardHtml).join('');
      renderPager();
      observeLazy();
    }

    function applyFilters() {
      var q = ((els.q && els.q.value) || '').trim().toLocaleLowerCase('tr-TR');
      var branch = els.branch ? els.branch.value : '';
      var grade = els.grade ? els.grade.value : '';
      var price = els.price ? els.price.value : '';
      var avail = els.avail ? els.avail.value : '';
      var exp = els.exp ? els.exp.value : '';

      state.filtered = teachers.filter(function (t) {
        if (branch && t.branch !== branch) return false;
        if (grade && (t.grades || []).indexOf(grade) === -1) return false;
        if (!priceMatch(t, price)) return false;
        if (!availMatch(t, avail)) return false;
        if (!expMatch(t, exp)) return false;
        if (q) {
          var hay = (t.name + ' ' + t.branch + ' ' + t.university + ' ' + (t.role || '') + ' ' + (t.short_bio || ''))
            .toLocaleLowerCase('tr-TR');
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });

      state.filtered.sort(function (a, b) {
        if (a.live !== b.live) return a.live ? -1 : 1;
        if (a.available !== b.available) return a.available ? -1 : 1;
        return (b.rating || 0) - (a.rating || 0);
      });

      state.page = 1;
      render();
    }

    function bindUi() {
      var searchTimer;
      if (els.q) {
        els.q.addEventListener('input', function () {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(applyFilters, 180);
        });
      }
      ['branch', 'grade', 'price', 'avail', 'exp'].forEach(function (k) {
        if (els[k]) els[k].addEventListener('change', applyFilters);
      });
      if (els.reset) {
        els.reset.addEventListener('click', function () {
          if (els.q) els.q.value = '';
          if (els.branch) els.branch.value = '';
          if (els.grade) els.grade.value = '';
          if (els.price) els.price.value = '';
          if (els.avail) els.avail.value = '';
          if (els.exp) els.exp.value = '';
          applyFilters();
        });
      }

      if (pager) {
        pager.addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-page]');
          if (!btn || btn.disabled) return;
          var v = btn.getAttribute('data-page');
          var pages = totalPages();
          if (v === 'prev') state.page = Math.max(1, state.page - 1);
          else if (v === 'next') state.page = Math.min(pages, state.page + 1);
          else state.page = parseInt(v, 10) || 1;
          render();
          window.scrollTo({ top: grid.offsetTop - 80, behavior: 'smooth' });
        });
      }
    }

    function boot(list, label) {
      teachers = list;
      sourceLabel = label || 'katalog';
      fillBranches();
      applyFilters();
    }

    function mergeCatalog(staticList, liveList, managedSlugs) {
      var managed = {};
      (managedSlugs || []).forEach(function (slug) {
        if (slug) managed[String(slug)] = true;
      });
      var bySlug = {};
      // Statik kadro: panelde hic kaydi olmayanlar kalsin
      (staticList || []).forEach(function (t) {
        if (!t || !t.slug) return;
        if (managed[t.slug]) return; // panel yonetiyor (pasif dahil) -> statikten gosterme
        bySlug[t.slug] = t;
      });
      // Panel yayinlari ezsin / eklesin
      (liveList || []).forEach(function (t) {
        if (!t || !t.slug) return;
        bySlug[t.slug] = t;
      });
      return Object.keys(bySlug).map(function (k) { return bySlug[k]; });
    }

    bindUi();
    boot(teachers, 'katalog');

    fetch('/api/public-teachers')
      .then(function (r) {
        if (!r.ok) throw new Error('public_teachers_' + r.status);
        return r.json();
      })
      .then(function (data) {
        var live = Array.isArray(data.teachers) ? data.teachers.map(mapApiTeacher) : [];
        var managed = Array.isArray(data.managed_slugs) ? data.managed_slugs : [];
        // API basariliysa her zaman birlestir (bos liste = yalnizca panel disi statikler)
        boot(mergeCatalog(teachers, live, managed), managed.length || live.length ? 'panel+katalog' : 'katalog');
      })
      .catch(function () {
        /* ag hatasi: statik katalog kalir */
      });
  }

  global.OVD_PREMIUM_TEACHERS_UI = { init: initPremiumTeachersUi };
})(typeof window !== 'undefined' ? window : global);
