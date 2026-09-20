/**
 * 3 Günlük Ücretsiz Deneme Dersi
 * Modal + FAB + exit-intent — site genelinde yeniden kullanılabilir.
 */
(function () {
  if (window.__ovdFreeTrialReady) return;
  window.__ovdFreeTrialReady = true;

  var EXIT_KEY = 'ovd_ft_exit_at';
  var WA_URL =
    'https://wa.me/908503034014?text=' +
    encodeURIComponent(
      'Merhaba, 3 günlük ücretsiz deneme dersime kaydoldum. Canlı derse erişim için yönlendirir misiniz?'
    );

  function assetBase() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && /free-trial\.js/.test(scripts[i].src)) {
        return scripts[i].src.replace(/free-trial\.js.*$/, '');
      }
    }
    var path = location.pathname.replace(/\\/g, '/');
    return path.indexOf('/programlar/') !== -1 ? '../assets/' : '/assets/';
  }

  function loadCss() {
    if (document.getElementById('ovd-ft-css')) return;
    var l = document.createElement('link');
    l.id = 'ovd-ft-css';
    l.rel = 'stylesheet';
    l.href = assetBase() + 'free-trial.css?v=20260830b';
    document.head.appendChild(l);
  }

  function isTrMobile(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf('90') === 0 && d.length >= 12) d = d.slice(2);
    if (d.charAt(0) === '0') d = d.slice(1);
    if (d.length === 11 && d.indexOf('95') === 0) d = d.slice(1);
    return /^5\d{9}$/.test(d);
  }

  function canExit() {
    try {
      var prev = Number(localStorage.getItem(EXIT_KEY) || 0);
      return Date.now() - prev > 3 * 24 * 60 * 60 * 1000;
    } catch (e) {
      return true;
    }
  }

  function markExit() {
    try {
      localStorage.setItem(EXIT_KEY, String(Date.now()));
    } catch (e) {}
  }

  function ensureModal() {
    if (document.getElementById('ovdFreeTrial')) return;
    var wrap = document.createElement('div');
    wrap.className = 'ovd-ft-overlay';
    wrap.id = 'ovdFreeTrial';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.setAttribute('aria-labelledby', 'ovdFtTitle');
    wrap.innerHTML =
      '<div class="ovd-ft-card-wrap">' +
      '<button type="button" class="ovd-ft-close-x" data-close-ft aria-label="Kapat">×</button>' +
      '<div class="ovd-ft-card" id="deneme-dersi-formu">' +
      '<div class="ovd-ft-kicker">🎁 Yeni kayıtlara özel</div>' +
      '<h3 id="ovdFtTitle">3 Günlük Ücretsiz Deneme Dersi</h3>' +
      '<p>Öğrencimizi canlı derste görelim, sistemi birlikte deneyimleyin. Kredi kartı gerekmez.</p>' +
      '<div class="ovd-ft-trust">' +
      '<span>✓ Kredi kartı gerekmez</span>' +
      '<span>✓ Taahhütsüz</span>' +
      '<span>✓ Canlı derse anında erişim</span>' +
      '</div>' +
      '<form id="ovdFtForm">' +
      '<div class="ovd-ft-err" data-ft-err role="alert"></div>' +
      '<div class="ovd-ft-field"><label for="ftName">Veli adı &amp; soyadı *</label>' +
      '<input id="ftName" name="ad_soyad" autocomplete="name" required placeholder="Adınız soyadınız"></div>' +
      '<div class="ovd-ft-field"><label for="ftPhone">Telefon (WhatsApp) *</label>' +
      '<input id="ftPhone" name="telefon" type="tel" inputmode="tel" autocomplete="tel" required placeholder="05xx xxx xx xx"></div>' +
      '<div class="ovd-ft-field"><label for="ftGrade">Öğrencinin sınıfı *</label>' +
      '<select id="ftGrade" name="sinif" required>' +
      '<option value="">Seçiniz</option>' +
      '<option value="3">3. sınıf</option>' +
      '<option value="4">4. sınıf</option>' +
      '<option value="5">5. sınıf</option>' +
      '<option value="6">6. sınıf</option>' +
      '<option value="7">7. sınıf</option>' +
      '<option value="8">8. sınıf (LGS)</option>' +
      '<option value="9">9. sınıf</option>' +
      '<option value="10">10. sınıf</option>' +
      '<option value="11">11. sınıf</option>' +
      '<option value="12">12. sınıf (YKS)</option>' +
      '<option value="mezun">Mezun</option>' +
      '</select></div>' +
      '<div class="ovd-ft-actions">' +
      '<button type="submit" class="hbtn-red">Deneme Dersini Başlat</button>' +
      '<button type="button" class="hbtn-outline" data-close-ft>Vazgeç</button>' +
      '</div>' +
      '</form>' +
      '</div></div>';
    document.body.appendChild(wrap);
  }

  function ensureFab() {
    if (!document.getElementById('ovdFtPill')) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.id = 'ovdFtPill';
      pill.className = 'ovd-ft-pill';
      pill.setAttribute('data-open-ft', '');
      pill.setAttribute('aria-label', '3 gün ücretsiz deneyin');
      pill.innerHTML =
        '<span class="ovd-ft-pill-ico" aria-hidden="true">🎁</span>' +
        '<span><strong>3 Gün Ücretsiz Deneyin</strong><span>Kredi kartı gerekmez</span></span>';
      document.body.appendChild(pill);
    }
    if (!document.getElementById('ovdFtBar')) {
      var bar = document.createElement('div');
      bar.id = 'ovdFtBar';
      bar.className = 'ovd-ft-bar';
      bar.innerHTML =
        '<button type="button" data-open-ft>3 Gün Ücretsiz Deneyin (Kredi Kartı Gerekmez)</button>';
      document.body.appendChild(bar);
      document.body.classList.add('has-ovd-ft-bar');
    }
  }

  function openModal(opts) {
    ensureModal();
    var m = document.getElementById('ovdFreeTrial');
    if (!m) return;
    if (opts && opts.exit) {
      var title = m.querySelector('#ovdFtTitle');
      var lead = m.querySelector('.ovd-ft-card > p');
      if (title) title.textContent = 'Ayrılmadan önce: 3 günlük ücretsiz deneme';
      if (lead) {
        lead.textContent =
          'Çocuğunuz için canlı deneme dersini şimdi başlatın. Kredi kartı ve taahhüt yok.';
      }
      markExit();
    }
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    var first = m.querySelector('input');
    if (first) setTimeout(function () { first.focus(); }, 80);
    if (typeof gtag === 'function') gtag('event', 'free_trial_open', { event_category: 'lead' });
  }

  function closeModal() {
    var m = document.getElementById('ovdFreeTrial');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  }

  window.OVD_openFreeTrial = function (opts) {
    openModal(opts || {});
  };

  function showSuccess(form) {
    form.outerHTML =
      '<div class="ovd-ft-success">' +
      '<h3>Talebiniz alındı 🎉</h3>' +
      '<p style="margin:8px 0 0;color:#6e6e73;font-size:14px;line-height:1.55;">Danışmanımız kısa sürede sizi arayacak. Dilerseniz hemen WhatsApp’tan da yazabilirsiniz.</p>' +
      '<a class="ovd-ft-wa" href="' +
      WA_URL +
      '" target="_blank" rel="noopener">WhatsApp’tan Devam Et</a>' +
      '<div class="ovd-ft-actions" style="margin-top:12px;">' +
      '<button type="button" class="hbtn-outline" data-close-ft style="width:100%">Kapat</button>' +
      '</div></div>';
  }

  function bind() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-open-ft], [data-open-free-trial], a[href="#deneme-dersi-formu"]')) {
        e.preventDefault();
        openModal();
        return;
      }
      if (e.target.id === 'ovdFreeTrial' || e.target.closest('[data-close-ft]')) {
        if (e.target.id === 'ovdFreeTrial' || e.target.closest('[data-close-ft]')) {
          e.preventDefault();
          closeModal();
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    document.addEventListener('submit', function (e) {
      var form = e.target.closest('#ovdFtForm');
      if (!form) return;
      e.preventDefault();
      var err = form.querySelector('[data-ft-err]');
      var btn = form.querySelector('[type=submit]');
      err.style.display = 'none';
      var payload = {
        type: 'free_trial_3_days',
        ad_soyad: (form.querySelector('[name=ad_soyad]').value || '').trim(),
        telefon: (form.querySelector('[name=telefon]').value || '').trim(),
        sinif: form.querySelector('[name=sinif]').value || '',
        program: '3 Günlük Ücretsiz Deneme Dersi',
        not: 'Kampanya: 3 günlük ücretsiz deneme dersi · type=free_trial_3_days · sayfa=' + location.pathname,
      };
      if (!payload.ad_soyad) {
        err.textContent = 'Veli adı soyadı yazın.';
        err.style.display = 'block';
        return;
      }
      if (!isTrMobile(payload.telefon)) {
        err.textContent = 'Geçerli bir WhatsApp cep telefonu girin.';
        err.style.display = 'block';
        return;
      }
      if (!payload.sinif) {
        err.textContent = 'Öğrencinin sınıfını seçin.';
        err.style.display = 'block';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Gönderiliyor…';
      fetch('/api/iletisim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { ok: r.ok, j: j };
          });
        })
        .then(function (x) {
          if (!x.ok) throw new Error(x.j.error || 'Gönderilemedi');
          if (typeof gtag === 'function') {
            gtag('event', 'free_trial_submit', { event_category: 'lead', event_label: 'free_trial_3_days' });
          }
          showSuccess(form);
        })
        .catch(function (ex) {
          err.textContent = ex.message || 'Bir hata oluştu.';
          err.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Deneme Dersini Başlat';
        });
    });
  }

  function setupExitIntent() {
    var fired = false;
    var started = Date.now();
    function tryExit() {
      if (fired) return;
      if (!canExit()) return;
      if (document.getElementById('welcomeModal')) return;
      if (document.querySelector('.assess-popup.open')) return;
      var ft = document.getElementById('ovdFreeTrial');
      if (ft && ft.classList.contains('open')) return;
      var cb = document.getElementById('ovdCallback');
      if (cb && cb.classList.contains('open')) return;
      fired = true;
      openModal({ exit: true });
    }

    setTimeout(function () {
      tryExit();
    }, 45000);

    document.addEventListener('mouseout', function (e) {
      if (e.relatedTarget || e.clientY >= 8 || innerWidth < 720) return;
      // Analiz popup'ı henüz çıkmadıysa çakışmayı önle
      if (Date.now() - started < 20000) return;
      try {
        if (!localStorage.getItem('ovd_assess_popup_at') && Date.now() - started < 50000) return;
      } catch (err) {}
      tryExit();
    });
  }

  function boot() {
    loadCss();
    ensureModal();
    ensureFab();
    bind();
    setupExitIntent();
    // Eski WhatsApp deneme float'ını gizle (çakışmayı önle)
    var legacy = document.getElementById('ovd-trial-float');
    if (legacy) legacy.style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
