(function () {
  var SESSION_KEY = 'ovd_kamp_lgs_intro_session';
  var STORAGE_KEY = 'ovd_kamp_lgs_intro_dismissed';
  var VIDEO_ID = 'g4ODF3UNxLY';

  function markIntroSeen(never) {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
      if (never) localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {}
  }

  function shouldShowIntro() {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return false;
      if (sessionStorage.getItem(SESSION_KEY)) return false;
    } catch (e) {
      return false;
    }
    return true;
  }

  function closeIntroOverlay() {
    var overlay = document.getElementById('kampIntroOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    var videoModal = document.getElementById('campVideoModal');
    if (!videoModal || !videoModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function previewHtml() {
    return (
      '<div class="prog-video-preview prog-video-preview--popup">' +
      '<div class="prog-video-preview-label">▶ Tanıtım Videosu</div>' +
      '<h3>LGS\'de neler yapıyoruz, öğrenmek ister misin?</h3>' +
      '<p>9 haftalık LGS Yaz Kampı programımızı kısa videoda izleyin; canlı dersler, denemeler ve koçluk desteğini keşfedin.</p>' +
      '<button type="button" class="prog-video-preview-card" data-kamp-watch aria-label="LGS Yaz Kampı tanıtım videosunu izle">' +
      '<div class="prog-video-preview-thumb">' +
      '<img src="https://img.youtube.com/vi/' + VIDEO_ID + '/hqdefault.jpg" alt="LGS Yaz Kampı tanıtım videosu önizlemesi" width="280" height="498">' +
      '<div class="prog-video-preview-overlay">' +
      '<div class="prog-video-preview-play">▶</div>' +
      '<span class="prog-video-preview-play-text">Videoyu izle</span>' +
      '</div></div></button>' +
      '<button type="button" class="prog-video-preview-cta" data-kamp-watch>Evet, tanıtım videosunu izle</button>' +
      '</div>'
    );
  }

  function bindWatchButtons(root) {
    root.querySelectorAll('[data-kamp-watch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (typeof window.openCampVideo === 'function') window.openCampVideo();
        closeIntroOverlay();
      });
    });
  }

  function showIntro() {
    if (!shouldShowIntro() || document.getElementById('kampIntroOverlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.id = 'kampIntroOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="kamp-intro-modal">' +
      previewHtml() +
      '<div class="kamp-intro-actions">' +
      '<button type="button" class="welcome-btn-outline" id="kampIntroSkip">Hayır, siteye göz atmaya devam et</button>' +
      '<label class="welcome-check"><input type="checkbox" id="kampIntroNever"> Bir daha gösterme</label>' +
      '</div></div>';

    document.body.appendChild(overlay);
    bindWatchButtons(overlay);

    document.getElementById('kampIntroSkip').addEventListener('click', function () {
      var never = document.getElementById('kampIntroNever');
      markIntroSeen(!!(never && never.checked));
      closeIntroOverlay();
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        var never = document.getElementById('kampIntroNever');
        markIntroSeen(!!(never && never.checked));
        closeIntroOverlay();
      }
    });

    requestAnimationFrame(function () {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('kampIntroOverlay')) {
      markIntroSeen(false);
      closeIntroOverlay();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showIntro);
  } else {
    showIntro();
  }
})();
