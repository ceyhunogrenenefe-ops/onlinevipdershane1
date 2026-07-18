/**
 * Öğretmen detay — /ozel-ders/ogretmen/{slug}
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

  function render(t) {
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
          '<a href="' + buy + '" class="mt-4 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-white shadow-lift hover:bg-accent-2">Bu öğretmenle eğitimi al</a>' +
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
        '</section>' +
      '</div>'
    );
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
        document.title = (t.name || 'Öğretmen') + ' — Online VIP Dershane';
        var desc = document.querySelector('meta[name="description"]');
        if (desc && t.short_bio) desc.setAttribute('content', t.short_bio.slice(0, 160));
        if (status) status.classList.add('hidden');
        if (box) {
          box.innerHTML = render(t);
          box.classList.remove('hidden');
        }
      })
      .catch(function () {
        if (status) status.classList.add('hidden');
        if (missing) missing.classList.remove('hidden');
      });
  }

  global.OVD_TEACHER_DETAIL = { init: init };
})(typeof window !== 'undefined' ? window : global);
