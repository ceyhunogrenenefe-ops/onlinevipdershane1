(function () {
  var STORAGE_KEY = 'ovd_welcome_dismissed';

  function isHomePage() {
    var path = location.pathname.replace(/\/+$/, '') || '/';
    return path === '' || path === '/' || path.endsWith('/index.html') || path.endsWith('index.html');
  }

  function videoPage() {
    var base = location.pathname.replace(/\/+$/, '');
    if (base.indexOf('programlar') !== -1) return '../videolar.html#intro-video';
    return 'videolar.html#intro-video';
  }

  function init() {
    if (!isHomePage()) return;

    try {
      if (localStorage.getItem(STORAGE_KEY) || localStorage.getItem('ovd_video_welcome_dismissed')) return;
    } catch (e) {
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.id = 'welcomeModal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'welcomeModalTitle');
    overlay.innerHTML =
      '<div class="welcome-modal">' +
      '<div class="welcome-modal-icon">▶</div>' +
      '<h2 id="welcomeModalTitle">Bizi tanımak ister misiniz?</h2>' +
      '<p>Online VIP Dershane\'nin canlı ders sistemi, VIP gruplar ve koçluk modelini anlatan kısa tanıtım videosunu izleyebilirsiniz.</p>' +
      '<div class="welcome-modal-actions">' +
      '<button type="button" class="welcome-btn-primary" id="welcomeWatch">Evet, tanıtım videosunu izle</button>' +
      '<button type="button" class="welcome-btn-outline" id="welcomeSkip">Hayır, siteye göz atmaya devam et</button>' +
      '</div>' +
      '<label class="welcome-check"><input type="checkbox" id="welcomeNever"> Bir daha gösterme</label>' +
      '</div>';

    document.body.appendChild(overlay);

    function close(goToVideo) {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
      var never = document.getElementById('welcomeNever');
      if (never && never.checked) {
        try {
          localStorage.setItem(STORAGE_KEY, '1');
        } catch (err) {}
      }
      if (goToVideo) {
        location.href = videoPage();
      }
    }

    document.getElementById('welcomeWatch').addEventListener('click', function () {
      close(true);
    });
    document.getElementById('welcomeSkip').addEventListener('click', function () {
      close(false);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close(false);
    });

    setTimeout(function () {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
