(function (global) {
  var KEY = 'ovd_assess_draft_v1';
  var CITIES = ['Adana','Ankara','Antalya','Aydın','Balıkesir','Batman','Bursa','Denizli','Diyarbakır','Eskişehir','Gaziantep','Hatay','İstanbul','İzmir','Kayseri','Kocaeli','Konya','Mersin','Muğla','Samsun','Şanlıurfa','Trabzon','Van'];
  var SUBJECTS = {
    low: ['Matematik', 'Türkçe', 'Hayat Bilgisi', 'İngilizce'],
    mid: ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce'],
    high: ['Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Edebiyat', 'Tarih', 'Coğrafya', 'İngilizce'],
  };

  function isTrMobile(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf('90') === 0 && d.length >= 12) d = d.slice(2);
    if (d.charAt(0) === '0') d = d.slice(1);
    if (d.length === 11 && d.indexOf('95') === 0) d = d.slice(1);
    return /^5\d{9}$/.test(d);
  }

  function subjectsFor(grade) {
    var g = Number(grade);
    if (grade === 'mezun' || g >= 9) return SUBJECTS.high;
    if (g >= 5) return SUBJECTS.mid;
    return SUBJECTS.low;
  }

  function utm() {
    var q = new URLSearchParams(location.search);
    var fromUrl = {
      source: q.get('utm_source') || '',
      medium: q.get('utm_medium') || '',
      campaign: q.get('utm_campaign') || '',
      content: q.get('utm_content') || '',
    };
    if (fromUrl.source) {
      try { sessionStorage.setItem('ovd_utm', JSON.stringify(fromUrl)); } catch (e) {}
      return fromUrl;
    }
    try { return JSON.parse(sessionStorage.getItem('ovd_utm') || 'null') || fromUrl; } catch (e) { return fromUrl; }
  }

  function save(state) {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }

  function track(event, extra) {
    extra = extra || {};
    extra.page = location.pathname;
    extra.utm_source = utm().source;
    extra.device = innerWidth < 720 ? 'mobile' : 'desktop';
    if (typeof gtag === 'function') gtag('event', event, { event_category: 'assessment' });
    fetch('/api/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'event', event: event, page: extra.page, utm_source: extra.utm_source, device: extra.device, step: extra.step }),
      keepalive: true,
    }).catch(function () {});
  }

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstElementChild;
  }

  function optHtml(name, value, label, type) {
    type = type || 'radio';
    return (
      '<label class="assess-opt"><input type="' +
      type +
      '" name="' +
      name +
      '" value="' +
      value +
      '"> ' +
      label +
      '</label>'
    );
  }

  function initForm(root) {
    var restored = load() || { step: 0, answers: {}, contact: {} };
    var state = restored;
    track('assessment_start', { step: state.step });

    var steps = [
      {
        title: 'Değerlendirmeyi kim için yapıyorsunuz?',
        render: function () {
          return (
            '<div class="assess-opts" role="radiogroup">' +
            optHtml('who', 'cocuk', 'Çocuğum için') +
            optHtml('who', 'kendim', 'Kendim için') +
            '</div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('input[name=who]:checked') || {}).value;
          if (!v) return 'Lütfen bir seçenek işaretleyin.';
          state.answers.who = v;
        },
      },
      {
        title: 'Öğrencimizin adı nedir?',
        render: function () {
          return (
            '<div class="assess-field"><label for="stname">Adı</label>' +
            '<input id="stname" name="studentName" autocomplete="nickname" required placeholder="Örn. Elif"></div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('#stname').value || '').trim();
          if (v.length < 2) return 'Lütfen öğrencinin adını yazın.';
          state.answers.studentName = v;
        },
      },
      {
        title: 'Öğrencimiz kaçıncı sınıfta?',
        render: function () {
          var grades = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
          return (
            '<div class="assess-opts" role="radiogroup">' +
            grades.map(function (g) { return optHtml('grade', g, g + '. sınıf'); }).join('') +
            optHtml('grade', 'mezun', 'Mezun') +
            '</div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('input[name=grade]:checked') || {}).value;
          if (!v) return 'Sınıf seçiniz.';
          state.answers.grade = v;
        },
      },
      {
        title: 'Öğrencimizin hedefi nedir?',
        render: function () {
          return (
            '<div class="assess-opts" role="radiogroup">' +
            optHtml('targetExam', 'okul', 'Okul başarısını yükseltmek') +
            optHtml('targetExam', 'LGS', 'LGS') +
            optHtml('targetExam', 'TYT', 'TYT') +
            optHtml('targetExam', 'TYT–AYT', 'TYT–AYT') +
            optHtml('targetExam', 'YÖS', 'YÖS') +
            optHtml('targetExam', 'diger', 'Diğer') +
            '</div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('input[name=targetExam]:checked') || {}).value;
          if (!v) return 'Hedef seçiniz.';
          state.answers.targetExam = v;
        },
      },
      {
        title: 'En fazla zorlandığı dersler hangileridir?',
        render: function () {
          return (
            '<p class="assess-lead">Birden fazla seçebilirsiniz.</p><div class="assess-opts">' +
            subjectsFor(state.answers.grade)
              .map(function (s) { return optHtml('weak', s, s, 'checkbox'); })
              .join('') +
            '</div>'
          );
        },
        read: function (box) {
          var vals = [].map.call(box.querySelectorAll('input[name=weak]:checked'), function (i) { return i.value; });
          if (!vals.length) return 'En az bir ders seçiniz.';
          state.answers.weakSubjects = vals;
        },
      },
      {
        title: 'Son deneme sonucu, puanı veya yaklaşık neti nedir?',
        render: function () {
          var g = state.answers.targetExam;
          var ph = 'Örn. 70 net / 85 ortalama';
          if (g === 'LGS') ph = 'Örn. 380 puan veya 70 net';
          if (g === 'TYT' || g === 'TYT–AYT') ph = 'Örn. TYT 75 net';
          return (
            '<div class="assess-field"><label for="examResult">Sonuç (yaklaşık da olabilir)</label>' +
            '<input id="examResult" placeholder="' + ph + '">' +
            '<p class="assess-note">Bilmiyorsanız “bilmiyorum” yazabilirsiniz.</p></div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('#examResult').value || '').trim();
          if (!v) return 'Bir değer girin veya bilmiyorum yazın.';
          state.answers.examResult = v;
        },
      },
      {
        title: 'Düzenli bir haftalık çalışma programı var mı?',
        render: function () {
          return (
            '<div class="assess-opts">' +
            optHtml('weeklyPlan', 'yes', 'Evet, düzenli') +
            optHtml('weeklyPlan', 'partial', 'Kısmen') +
            optHtml('weeklyPlan', 'no', 'Hayır') +
            '</div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('input[name=weeklyPlan]:checked') || {}).value;
          if (!v) return 'Bir seçenek işaretleyin.';
          state.answers.weeklyPlan = v;
        },
      },
      {
        title: 'Ödevlerini kendi başına takip edebiliyor mu?',
        render: function () {
          return (
            '<div class="assess-opts">' +
            optHtml('homeworkSelf', 'yes', 'Evet') +
            optHtml('homeworkSelf', 'partial', 'Bazen') +
            optHtml('homeworkSelf', 'no', 'Hayır') +
            '</div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('input[name=homeworkSelf]:checked') || {}).value;
          if (!v) return 'Bir seçenek işaretleyin.';
          state.answers.homeworkSelf = v;
        },
      },
      {
        title: 'Deneme sınavlarına düzenli katılıyor mu?',
        render: function () {
          return (
            '<div class="assess-opts">' +
            optHtml('mocks', 'regular', 'Düzenli') +
            optHtml('mocks', 'sometimes', 'Ara sıra') +
            optHtml('mocks', 'no', 'Hayır') +
            '</div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('input[name=mocks]:checked') || {}).value;
          if (!v) return 'Bir seçenek işaretleyin.';
          state.answers.mocks = v;
        },
      },
      {
        title: 'Yanlış yaptığı soruların analizini yapıyor mu?',
        render: function () {
          return (
            '<div class="assess-opts">' +
            optHtml('mistakeReview', 'yes', 'Evet, düzenli') +
            optHtml('mistakeReview', 'sometimes', 'Bazen') +
            optHtml('mistakeReview', 'no', 'Hayır') +
            '</div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('input[name=mistakeReview]:checked') || {}).value;
          if (!v) return 'Bir seçenek işaretleyin.';
          state.answers.mistakeReview = v;
        },
      },
      {
        title: 'Günlük ortalama çalışma süresi nedir?',
        render: function () {
          return (
            '<div class="assess-opts">' +
            optHtml('dailyMinutes', '20', '30 dakikadan az') +
            optHtml('dailyMinutes', '45', '30–60 dakika') +
            optHtml('dailyMinutes', '90', '1–2 saat') +
            optHtml('dailyMinutes', '150', '2 saatten fazla') +
            '</div>'
          );
        },
        read: function (box) {
          var v = (box.querySelector('input[name=dailyMinutes]:checked') || {}).value;
          if (!v) return 'Bir seçenek işaretleyin.';
          state.answers.dailyMinutes = Number(v);
        },
      },
      {
        title: 'En fazla hangi konuda desteğe ihtiyaç duyuyor?',
        render: function () {
          var needs = [
            'Konu eksikliği',
            'Soru çözümü',
            'Çalışma disiplini',
            'Motivasyon',
            'Ödev takibi',
            'Deneme analizi',
            'Eğitim koçluğu',
            'Öğretmen takibi',
          ];
          return (
            '<p class="assess-lead">Birden fazla seçebilirsiniz.</p><div class="assess-opts">' +
            needs.map(function (s) { return optHtml('need', s, s, 'checkbox'); }).join('') +
            '</div>'
          );
        },
        read: function (box) {
          var vals = [].map.call(box.querySelectorAll('input[name=need]:checked'), function (i) { return i.value; });
          if (!vals.length) return 'En az bir alan seçiniz.';
          state.answers.supportNeeds = vals;
        },
      },
      {
        kind: 'contact',
        title: 'Ön analiziniz hazırlanıyor',
        render: function () {
          return (
            '<p class="assess-lead">Sonucu görmek için yalnızca ad ve telefon yeterli. İsterseniz diğer alanları da doldurun.</p>' +
            '<div class="assess-field"><label for="parentName">Veli adı soyadı *</label><input id="parentName" autocomplete="name" required></div>' +
            '<div class="assess-field"><label for="phone">Telefon *</label><input id="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" required></div>' +
            '<div class="assess-field"><label for="email">E-posta (isteğe bağlı)</label><input id="email" type="email" autocomplete="email"></div>' +
            '<div class="assess-field"><label for="city">İl (isteğe bağlı)</label><select id="city"><option value="">Seçiniz</option>' +
            CITIES.map(function (c) { return '<option>' + c + '</option>'; }).join('') +
            '</select></div>' +
            '<label class="assess-opt"><input type="checkbox" id="waConsent" checked> WhatsApp üzerinden bilgilendirme izni</label>' +
            '<label class="assess-opt"><input type="checkbox" id="kvkk"> <a href="/gizlilik.html" target="_blank" rel="noopener">KVKK aydınlatma metnini</a> okudum, kabul ediyorum *</label>' +
            '<input class="assess-hp" tabindex="-1" autocomplete="off" name="website" id="website">'
          );
        },
        read: function (box) {
          var c = {
            parentName: (box.querySelector('#parentName').value || '').trim(),
            phone: (box.querySelector('#phone').value || '').trim(),
            email: (box.querySelector('#email').value || '').trim(),
            city: box.querySelector('#city').value,
            district: '',
            preferredContact: 'whatsapp',
            whatsapp: box.querySelector('#waConsent').checked,
            kvkk: box.querySelector('#kvkk').checked,
            commercial: false,
            website: box.querySelector('#website').value,
          };
          if (!c.parentName) return 'Veli adı soyadı zorunludur.';
          if (!isTrMobile(c.phone)) return 'Geçerli cep telefonu girin.';
          if (!c.kvkk) return 'KVKK metnini kabul etmeden devam edilemez.';
          state.contact = c;
        },
      },
    ];

    function restoreFields(body, s) {
      var a = state.answers || {};
      var c = state.contact || {};
      function check(name, val) {
        if (val == null || val === '') return;
        body.querySelectorAll('input[name="' + name + '"]').forEach(function (i) {
          if (Array.isArray(val)) i.checked = val.indexOf(i.value) !== -1;
          else i.checked = String(i.value) === String(val);
        });
      }
      check('who', a.who);
      check('grade', a.grade);
      check('targetExam', a.targetExam);
      check('weak', a.weakSubjects);
      check('weeklyPlan', a.weeklyPlan);
      check('homeworkSelf', a.homeworkSelf);
      check('mocks', a.mocks);
      check('mistakeReview', a.mistakeReview);
      check('dailyMinutes', a.dailyMinutes);
      check('need', a.supportNeeds);
      if (body.querySelector('#stname') && a.studentName) body.querySelector('#stname').value = a.studentName;
      if (body.querySelector('#examResult') && a.examResult) body.querySelector('#examResult').value = a.examResult;
      if (s.kind === 'contact') {
        if (c.parentName) body.querySelector('#parentName').value = c.parentName;
        if (c.phone) body.querySelector('#phone').value = c.phone;
        if (c.email) body.querySelector('#email').value = c.email;
        if (c.city && body.querySelector('#city')) body.querySelector('#city').value = c.city;
        if (c.whatsapp && body.querySelector('#waConsent')) body.querySelector('#waConsent').checked = true;
        if (c.kvkk && body.querySelector('#kvkk')) body.querySelector('#kvkk').checked = true;
      }
      body.querySelectorAll('.assess-opt').forEach(function (x) {
        x.classList.toggle('is-on', !!(x.querySelector('input') && x.querySelector('input').checked));
      });
    }

    function paint() {
      var n = steps.length;
      var pct = Math.round((state.step / n) * 100);
      root.querySelector('.assess-progress span').style.width = pct + '%';
      root.querySelector('[data-step-label]').textContent = 'Adım ' + (state.step + 1) + ' / ' + n;
      root.querySelector('[data-pct]').textContent = '%' + pct;
      var s = steps[state.step];
      root.querySelector('[data-title]').textContent = s.title;
      var body = root.querySelector('[data-body]');
      body.innerHTML = s.render();
      restoreFields(body, s);
      var err = root.querySelector('[data-err]');
      err.style.display = 'none';
      root.querySelector('[data-back]').disabled = state.step === 0;
      root.querySelector('[data-next]').textContent = s.kind === 'contact' ? 'Sonucu gör' : 'Devam et';
      if (s.kind === 'contact') track('contact_form_view', { step: state.step });
      body.querySelectorAll('.assess-opt').forEach(function (lab) {
        lab.addEventListener('change', function () {
          body.querySelectorAll('.assess-opt').forEach(function (x) {
            x.classList.toggle('is-on', !!(x.querySelector('input') && x.querySelector('input').checked));
          });
        });
      });
      var first = body.querySelector('input,select');
      if (first) first.focus();
    }

    root.querySelector('[data-back]').addEventListener('click', function () {
      if (state.step > 0) {
        state.step -= 1;
        save(state);
        paint();
      }
    });

    root.querySelector('[data-next]').addEventListener('click', function () {
      var msg = steps[state.step].read(root.querySelector('[data-body]'));
      var err = root.querySelector('[data-err]');
      if (msg) {
        err.textContent = msg;
        err.style.display = 'block';
        return;
      }
      track('assessment_step_complete', { step: state.step });
      if (steps[state.step].kind === 'contact' || state.step === steps.length - 1) {
        submit();
        return;
      }
      state.step += 1;
      save(state);
      paint();
    });

    function submit() {
      var btn = root.querySelector('[data-next]');
      btn.disabled = true;
      btn.textContent = 'Hazırlanıyor…';
      fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'submit',
          answers: state.answers,
          contact: state.contact,
          source: 'ucretsiz-ogrenci-analizi',
          utm: utm(),
          landingPage: location.href,
          referrer: document.referrer,
        }),
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) throw new Error(x.j.error || 'Gönderilemedi');
          track('contact_submit');
          try { sessionStorage.removeItem(KEY); } catch (e) {}
          location.href = x.j.reportUrl;
        })
        .catch(function (e) {
          var err = root.querySelector('[data-err]');
          err.textContent = e.message || 'Bir hata oluştu.';
          err.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Devam et';
        });
    }

    paint();
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.type === 'checkbox')) return;
      e.preventDefault();
      root.querySelector('[data-next]').click();
    });
  }

  function bars(scores) {
    var labels = {
      academic: 'Akademik hazırbulunuşluk',
      routine: 'Çalışma düzeni',
      examPrep: 'Sınav hazırlık seviyesi',
      coaching: 'Takip ve koçluk ihtiyacı',
    };
    return Object.keys(labels)
      .map(function (k) {
        var v = (scores && scores[k]) || 0;
        return (
          '<div class="score-row"><span>' +
          labels[k] +
          '</span><span>' +
          v +
          '/100</span><div class="score-bar" aria-hidden="true"><i style="width:' +
          v +
          '%"></i></div></div>'
        );
      })
      .join('');
  }

  function radar(scores) {
    var keys = ['academic', 'routine', 'examPrep', 'coaching'];
    var cx = 110, cy = 110, r = 78;
    var pts = keys.map(function (k, i) {
      var ang = (-Math.PI / 2) + (i * Math.PI * 2) / 4;
      var v = Math.max(0, Math.min(100, (scores && scores[k]) || 0)) / 100;
      return [cx + Math.cos(ang) * r * v, cy + Math.sin(ang) * r * v].join(',');
    }).join(' ');
    var axes = keys.map(function (_, i) {
      var ang = (-Math.PI / 2) + (i * Math.PI * 2) / 4;
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(ang) * r) + '" y2="' + (cy + Math.sin(ang) * r) + '" stroke="#dde6f5"/>';
    }).join('');
    return (
      '<svg class="radar-svg" viewBox="0 0 220 220" role="img" aria-hidden="true">' +
      axes +
      '<polygon points="' + pts + '" fill="rgba(26,63,173,.2)" stroke="#1a3fad" stroke-width="2"/>' +
      '</svg>'
    );
  }

  function initReport(root, token) {
    fetch('/api/assessment?op=report&token=' + encodeURIComponent(token))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.error);
        track('preliminary_report_view');
        var L = j.lead;
        root.querySelector('[data-name]').textContent = L.studentName || 'Öğrenci';
        root.querySelector('[data-meta]').textContent = (L.grade || '') + (L.targetExam ? ' · ' + L.targetExam : '');
        root.querySelector('[data-scores]').innerHTML = radar(L.scores) + bars(L.scores);
        root.querySelector('[data-summary]').textContent = L.summary || '';
        root.querySelector('[data-disc]').textContent = L.disclaimer || '';
        root.querySelector('[data-next]').textContent = L.nextStep || '';
        var st = (L.strengths || []).map(function (x) { return x.label; }).join(', ') || 'Henüz netleşmedi';
        var gp = (L.gaps || []).map(function (x) { return x.label; }).join(', ') || 'Seviye testi sonrası netleşecek';
        root.querySelector('[data-strong]').textContent = st;
        root.querySelector('[data-gap]').textContent = gp;
        root.querySelectorAll('[data-test-href]').forEach(function (a) {
          a.href = '/seviye-testi/' + encodeURIComponent(token);
        });
        if (L.testResult) {
          var tr = L.testResult;
          var box = root.querySelector('[data-test-box]');
          box.hidden = false;
          box.querySelector('[data-test-pct]').textContent = '%' + tr.percent;
          box.querySelector('[data-test-counts]').textContent =
            tr.correct + ' doğru · ' + tr.wrong + ' yanlış · ' + tr.blank + ' boş';
          box.querySelector('[data-test-weak]').textContent = (tr.recommended || []).join(', ');
          var sub = root.querySelector('[data-test-subjects]');
          if (sub && tr.bySubject) {
            sub.textContent = tr.bySubject.map(function (s) {
              return s.subject + ': %' + s.percent + ' (' + s.correct + '/' + s.total + ')';
            }).join(' · ');
          }
        }
      })
      .catch(function (e) {
        root.querySelector('[data-err]').textContent = e.message || 'Rapor açılamadı.';
        root.querySelector('[data-err]').style.display = 'block';
      });

    var form = root.querySelector('[data-book]');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op: 'book',
            token: token,
            date: fd.get('date'),
            time: fd.get('time'),
            method: fd.get('method'),
          }),
        })
          .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (x) {
            if (!x.ok) throw new Error(x.j.error);
            track('counseling_booking_complete');
            form.innerHTML = '<p><strong>Randevunuz alındı:</strong> ' + x.j.appointment.date + ' ' + x.j.appointment.time + '</p>';
            if (x.j.token) history.replaceState({}, '', '/analiz-sonucu/' + encodeURIComponent(x.j.token));
          })
          .catch(function (err) {
            alert(err.message);
          });
      });
    }
  }

  function initTest(root, token) {
    fetch('/api/assessment?op=test&token=' + encodeURIComponent(token))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.error);
        track('placement_test_start');
        var qs = j.test.questions;
        root.querySelector('[data-title]').textContent = j.test.title;
        root.querySelector('[data-dur]').textContent = 'Süre önerisi: ' + j.test.durationMin + ' dk · ' + qs.length + ' soru';
        var html = qs
          .map(function (q, i) {
            return (
              '<fieldset class="assess-card" style="margin-bottom:14px"><legend><strong>' +
              (i + 1) +
              '. ' +
              q.subject +
              '</strong> · ' +
              q.topic +
              '</legend><p>' +
              q.prompt +
              '</p><div class="assess-opts">' +
              q.options
                .map(function (o, idx) {
                  return optHtml('q-' + q.id, String(idx), o);
                })
                .join('') +
              '</div></fieldset>'
            );
          })
          .join('');
        root.querySelector('[data-qs]').innerHTML = html;
        root.querySelector('[data-submit]').addEventListener('click', function () {
          var answers = qs.map(function (q) {
            var c = root.querySelector('input[name="q-' + q.id + '"]:checked');
            return { id: q.id, choice: c ? Number(c.value) : null };
          });
          fetch('/api/assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ op: 'grade-test', token: token, answers: answers }),
          })
            .then(function (r) { return r.json().then(function (j2) { return { ok: r.ok, j: j2 }; }); })
            .then(function (x) {
              if (!x.ok) throw new Error(x.j.error);
              track('placement_test_complete');
              location.href = x.j.reportUrl;
            })
            .catch(function (e) {
              alert(e.message);
            });
        });
      })
      .catch(function (e) {
        root.querySelector('[data-err]').textContent = e.message;
        root.querySelector('[data-err]').style.display = 'block';
      });
  }

  global.OVD_ASSESS = {
    initForm: initForm,
    initReport: initReport,
    initTest: initTest,
    track: track,
    tokenFrom: function () {
      var q = new URLSearchParams(location.search).get('token');
      if (q) return q;
      var m = location.pathname.match(/\/(?:analiz-sonucu|seviye-testi)\/([^/]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    },
  };
})(window);
