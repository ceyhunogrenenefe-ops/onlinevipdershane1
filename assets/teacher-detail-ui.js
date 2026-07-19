/**
 * Öğretmen detay — /ozel-ders/ogretmen/{slug}
 * Müsaitlik: panel availability_slots (yeşil/gri/kırmızı)
 */
(function (global) {
  function escapeHtml(s) {
    return String(s == null ? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function slugFromLocation() {
    var q = new URLSearchParams(location.search).get('slug');
    if (q) return q.trim().toLowerCase();
    var parts = location.pathname.replace(/\/+$/, '').split('/');
    var i = parts.indexOf('ogretmen');
    if (i >= 0 && parts[i + 1]) return decodeURIComponent(parts[i + 1]).toLowerCase();
    return '';
  }

  function chips(arr) {
    if (!arr || !arr.length) return '';
    return (
      '<div class="mt-3 flex flex-wrap gap-2">' +
      arr
        .map(function (x) {
          return (
            '<span class="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">' +
            escapeHtml(x) +
            '</span>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function slotClass(status) {
    if (status === 'free') return 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer';
    if (status === 'busy') return 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed opacity-80';
    if (status === 'closed') return 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed';
    return 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed';
  }

  function slotLabel(status) {
    if (status === 'free') return 'Seçilebilir';
    if (status === 'busy') return 'Dolu';
    if (status === 'closed') return 'Kapalı';
    return 'Geçmiş';
  }

  function renderAvailability(t, slots) {
    var list = (slots || []).filter(function (s) {
      return s.start_time;
    });
    if (!list.length) {
      return (
        '<div class="mt-10 rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-mute" id="availSection">' +
        '<h2 class="font-display text-lg font-bold text-ink">Müsaitlik takvimi</h2>' +
        '<p class="mt-2">Bu öğretmen için henüz yayınlanmış saat aralığı yok.</p></div>'
      );
    }

    var byDate = {};
    list.forEach(function (s) {
      if (!byDate[s.date]) byDate[s.date] = [];
      byDate[s.date].push(s);
    });

    var html =
      '<div class="mt-10" id="availSection">' +
      '<h2 class="font-display text-lg font-bold text-ink">Müsaitlik takvimi</h2>' +
      '<p class="mt-1 text-sm text-mute">Yeşil: seçilebilir · Gri: kapalı · Kırmızı: dolu · Soluk: geçmiş</p>' +
      '<div class="mt-4 space-y-4">';

    Object.keys(byDate)
      .sort()
      .forEach(function (date) {
        var daySlots = byDate[date];
        var label = daySlots[0].day_label || date;
        html +=
          '<div class="rounded-xl border border-slate-200 p-3">' +
          '<div class="text-sm font-bold text-navy">' +
          escapeHtml(label) +
          ' · ' +
          escapeHtml(date) +
          '</div>' +
          '<div class="mt-2 flex flex-wrap gap-2">';
        daySlots.forEach(function (s) {
          var disabled = s.status !== 'free';
          html +=
            '<button type="button" class="slot-btn rounded-lg border px-2.5 py-2 text-xs font-bold ' +
            slotClass(s.status) +
            '" data-status="' +
            escapeHtml(s.status) +
            '" data-starts="' +
            escapeHtml(s.starts_at || '') +
            '" data-ends="' +
            escapeHtml(s.ends_at || '') +
            '"' +
            (disabled ? ' disabled' : '') +
            '>' +
            escapeHtml(s.start_time) +
            '–' +
            escapeHtml(s.end_time) +
            '<span class="mt-0.5 block text-[10px] font-semibold opacity-80">' +
            slotLabel(s.status) +
            '</span></button>';
        });
        html += '</div></div>';
      });

    html +=
      '</div>' +
      '<form id="bookForm" class="mt-6 hidden rounded-2xl border border-navy/20 bg-soft p-4">' +
      '<h3 class="font-bold text-navy">Saat rezervasyonu</h3>' +
      '<p class="mt-1 text-xs text-mute" id="bookSlotLabel"></p>' +
      '<div class="mt-3 grid gap-2 sm:grid-cols-2">' +
      '<input required name="student_name" placeholder="Ad soyad" class="rounded-xl border border-slate-200 px-3 py-2 text-sm">' +
      '<input required name="student_phone" placeholder="Telefon" class="rounded-xl border border-slate-200 px-3 py-2 text-sm">' +
      '<input type="email" name="student_email" placeholder="E-posta" class="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2">' +
      '</div>' +
      '<input type="hidden" name="starts_at" id="bookStarts">' +
      '<input type="hidden" name="ends_at" id="bookEnds">' +
      '<button type="submit" class="mt-3 rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white">Rezervasyon talebi gönder</button>' +
      '<p class="mt-2 text-xs text-mute" id="bookMsg"></p>' +
      '</form></div>';

    return html;
  }

  function render(t, slots) {
    var exams = Array.isArray(t.exam_areas) ? t.exam_areas : [];
    var grades = Array.isArray(t.grade_levels) ? t.grade_levels : [];
    var specs = Array.isArray(t.specialties) ? t.specialties : [];
    var role = t.title || [t.branch, exams.join(' / ')].filter(Boolean).join(' · ');
    var photo = t.photo_url || '/assets/img/ovd-logo.png';
    var bio = t.full_bio || t.short_bio || '';
    var buy = '/premium-paketler.html?ogretmen=' + encodeURIComponent(t.slug);

    return (
      '<div class="grid gap-8 lg:grid-cols-[340px_1fr] lg:gap-12">' +
        '<aside>' +
          '<div class="overflow-hidden rounded-2xl border border-slate-200 bg-soft shadow-soft">' +
            '<img src="' + escapeHtml(photo) + '" alt="' + escapeHtml(t.name) + '" class="teacher-hero-photo" width="480" height="600">' +
          '</div>' +
          '<a href="#availSection" class="mt-4 flex w-full items-center justify-center rounded-xl border border-navy px-4 py-3 text-sm font-bold text-navy hover:bg-soft">Müsait Saatleri Gör</a>' +
          '<a href="' + buy + '" class="mt-2 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-white shadow-lift hover:bg-accent-2">Özel Ders Al</a>' +
          '<a href="/ozel-ders.html#ogretmenler" class="mt-2 flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-navy hover:bg-soft">Tüm öğretmenler</a>' +
        '</aside>' +
        '<section>' +
          '<p class="text-sm font-bold uppercase tracking-wider text-accent">Özel ders öğretmeni</p>' +
          '<h1 class="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">' + escapeHtml(t.name) + '</h1>' +
          '<p class="mt-2 text-lg font-bold text-navy">' + escapeHtml(role) + '</p>' +
          (t.university ? '<p class="mt-1 text-sm font-semibold text-mute">' + escapeHtml(t.university) + (t.department ? ' · ' + escapeHtml(t.department) : '') + '</p>' : '') +
          '<dl class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">' +
            '<div class="rounded-xl bg-soft px-3 py-3 text-center"><dt class="text-[10px] font-bold uppercase text-mute">Deneyim</dt><dd class="mt-1 text-sm font-extrabold">' + (t.experience_years != null ? escapeHtml(t.experience_years) + ' yıl' : '—') + '</dd></div>' +
            '<div class="rounded-xl bg-soft px-3 py-3 text-center"><dt class="text-[10px] font-bold uppercase text-mute">Şehir</dt><dd class="mt-1 text-sm font-extrabold">' + escapeHtml(t.city || 'Online') + '</dd></div>' +
            '<div class="rounded-xl bg-soft px-3 py-3 text-center"><dt class="text-[10px] font-bold uppercase text-mute">Format</dt><dd class="mt-1 text-sm font-extrabold">' + escapeHtml(t.lesson_format || 'online') + '</dd></div>' +
            '<div class="rounded-xl bg-soft px-3 py-3 text-center"><dt class="text-[10px] font-bold uppercase text-mute">Müsait</dt><dd class="mt-1 text-sm font-extrabold">' + (t.accepting_students === false ? 'Dolu' : 'Evet') + '</dd></div>' +
          '</dl>' +
          (grades.length ? '<div class="mt-8"><h2 class="font-display text-lg font-bold">Seviyeler</h2>' + chips(grades) + '</div>' : '') +
          (exams.length ? '<div class="mt-6"><h2 class="font-display text-lg font-bold">Sınav alanları</h2>' + chips(exams) + '</div>' : '') +
          (specs.length ? '<div class="mt-6"><h2 class="font-display text-lg font-bold">Uzmanlık</h2>' + chips(specs) + '</div>' : '') +
          (bio
            ? '<div class="mt-8"><h2 class="font-display text-lg font-bold">Hakkında</h2><p class="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-mute">' +
              escapeHtml(bio) +
              '</p></div>'
            : '') +
          (t.teaching_approach
            ? '<div class="mt-8"><h2 class="font-display text-lg font-bold">Öğretim yaklaşımı</h2><p class="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-mute">' +
              escapeHtml(t.teaching_approach) +
              '</p></div>'
            : '') +
          (t.video_url
            ? '<div class="mt-8"><h2 class="font-display text-lg font-bold">Tanıtım videosu</h2><a class="mt-3 inline-flex text-sm font-bold text-navy underline" href="' +
              escapeHtml(t.video_url) +
              '" target="_blank" rel="noopener">Videoyu izle</a></div>'
            : '') +
          renderAvailability(t, slots) +
        '</section>' +
      '</div>'
    );
  }

  function bindBooking(slug) {
    var form = document.getElementById('bookForm');
    if (!form) return;
    document.querySelectorAll('.slot-btn[data-status="free"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        form.classList.remove('hidden');
        document.getElementById('bookStarts').value = btn.getAttribute('data-starts') || '';
        document.getElementById('bookEnds').value = btn.getAttribute('data-ends') || '';
        document.getElementById('bookSlotLabel').textContent =
          'Seçilen saat: ' + (btn.textContent || '').replace(/\s+/g, ' ').trim();
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('bookMsg');
      var fd = new FormData(form);
      var payload = {
        slug: slug,
        starts_at: fd.get('starts_at'),
        ends_at: fd.get('ends_at'),
        student_name: fd.get('student_name'),
        student_phone: fd.get('student_phone'),
        student_email: fd.get('student_email')
      };
      msg.textContent = 'Gönderiliyor…';
      fetch('/api/public-teacher-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { ok: r.ok, j: j };
          });
        })
        .then(function (res) {
          if (!res.ok) {
            var err = res.j && res.j.error;
            var map = {
              slot_unavailable: 'Bu saat artık müsait değil.',
              slot_already_taken: 'Bu saat az önce doldu. Başka saat seçin.',
              slot_in_past: 'Geçmiş saat seçilemez.',
              profile_not_bookable: 'Öğretmen şu an rezervasyon almıyor.'
            };
            throw new Error(map[err] || err || 'Rezervasyon başarısız');
          }
          msg.textContent = 'Rezervasyon alındı. Ekibimiz sizinle iletişime geçecek.';
          form.querySelector('button[type="submit"]').disabled = true;
        })
        .catch(function (err) {
          msg.textContent = err.message || 'Hata';
        });
    });
  }

  function init() {
    var status = document.getElementById('teacherStatus');
    var box = document.getElementById('teacherDetail');
    var missing = document.getElementById('teacherMissing');
    var slug = slugFromLocation();
    if (!slug) {
      if (status) status.classList.add('hidden');
      if (missing) missing.classList.remove('hidden');
      return;
    }

    fetch('/api/public-teachers?slug=' + encodeURIComponent(slug))
      .then(function (r) {
        if (!r.ok) throw new Error('not_found');
        return r.json();
      })
      .then(function (data) {
        var t = data.teacher;
        if (!t) throw new Error('not_found');
        var slots = data.availability_slots || t.availability_slots || [];
        document.title = (t.name || 'Öğretmen') + ' — Online VIP Dershane';
        var desc = document.querySelector('meta[name="description"]');
        if (desc && t.short_bio) desc.setAttribute('content', t.short_bio.slice(0, 160));
        if (status) status.classList.add('hidden');
        if (box) {
          box.innerHTML = render(t, slots);
          box.classList.remove('hidden');
          bindBooking(t.slug);
        }
      })
      .catch(function () {
        if (status) status.classList.add('hidden');
        if (missing) missing.classList.remove('hidden');
      });
  }

  global.OVD_TEACHER_DETAIL = { init: init };
})(typeof window !== 'undefined' ? window : global);
