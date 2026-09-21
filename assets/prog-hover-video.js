/**
 * Program kartı / LGS–YKS hero hover & autoplay video.
 * Güvenilir iframe yolu (YT API şart değil).
 * Mobil: ekranda ~1 sn bekleyince sessiz başlar; dokununca / Sesi aç ile konuşur.
 */
(function (global) {
  var DWELL_MS = 1000;
  var bound = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  var cardIO = null;

  function youtubeId(url) {
    var u = String(url || '');
    var m = u.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{6,15})/i
    );
    return m ? m[1] : '';
  }

  /** Instagram reel / gönderi kısa kodu (instagram.com/reel/XXXX) */
  function instagramCode(url) {
    var m = String(url || '').match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
    return m ? m[1] : '';
  }

  function isFinePointer() {
    return !!(global.matchMedia && global.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }

  function isBound(box) {
    if (bound) return bound.has(box);
    return box.getAttribute('data-prog-bound') === '1';
  }

  function markBound(box) {
    if (bound) bound.add(box);
    else box.setAttribute('data-prog-bound', '1');
  }

  function ensureChrome(box) {
    var layer = box.querySelector('.prog-video-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'prog-video-layer';
      layer.setAttribute('aria-hidden', 'true');
      box.appendChild(layer);
    }
    if (!box.querySelector('.prog-video-badge')) {
      var badge = document.createElement('span');
      badge.className = 'prog-video-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = '▶ Tanıtım';
      box.appendChild(badge);
    }
    if (!box.querySelector('.prog-unmute-btn')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prog-unmute-btn';
      btn.setAttribute('aria-label', 'Sesi aç');
      btn.textContent = '🔊 Sesi aç';
      box.appendChild(btn);
    }
    return layer;
  }

  function videoUrl(box) {
    return String(box.getAttribute('data-prog-video') || '').trim();
  }

  function clearTimer(box, key) {
    if (box[key]) {
      clearTimeout(box[key]);
      box[key] = null;
    }
  }

  function injectIframe(layer, id, muted) {
    layer.innerHTML =
      '<iframe src="https://www.youtube.com/embed/' +
      encodeURIComponent(id) +
      '?autoplay=1&mute=' +
      (muted ? '1' : '0') +
      '&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&loop=1&playlist=' +
      encodeURIComponent(id) +
      '" title="Program tanıtım videosu" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="eager"></iframe>';
  }

  // Instagram gömmesi otomatik/sessiz oynatmayı desteklemez: kart üzerinde
  // Instagram'ın kendi oynatıcısı açılır, izleyici tek dokunuşla oynatır.
  function injectInstagram(layer, code) {
    layer.innerHTML =
      '<iframe class="prog-ig-frame" src="https://www.instagram.com/reel/' +
      encodeURIComponent(code) +
      '/embed/" title="Program tanıtım videosu" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" scrolling="no" loading="eager"></iframe>';
  }

  function stopVideo(box) {
    clearTimer(box, '_dwellTimer');
    var layer = box.querySelector('.prog-video-layer');
    if (layer) layer.innerHTML = '';
    box.classList.remove('is-playing', 'is-muted', 'has-sound', 'is-touch-playing', 'is-instagram');
  }

  function startVideo(box, opts) {
    opts = opts || {};
    var muted = opts.muted !== false;
    var restart = !!opts.restart;
    var url = videoUrl(box);
    var id = youtubeId(url);
    var igCode = id ? '' : instagramCode(url);
    var layer = ensureChrome(box);
    if ((!id && !igCode) || !layer) return false;

    if (igCode) {
      if (box.classList.contains('is-playing')) return true;
      injectInstagram(layer, igCode);
      box.classList.add('is-playing', 'is-instagram');
      box.classList.remove('is-muted', 'has-sound');
      return true;
    }

    if (box.classList.contains('is-playing') && !restart) {
      if (!muted) return startVideo(box, { restart: true, muted: false });
      return true;
    }

    injectIframe(layer, id, muted);
    box.classList.add('is-playing');
    if (muted) {
      box.classList.add('is-muted');
      box.classList.remove('has-sound');
    } else {
      box.classList.remove('is-muted');
      box.classList.add('has-sound');
    }
    return true;
  }

  function enableSound(box) {
    stopOthers(box);
    box.classList.add('is-touch-playing');
    startVideo(box, { restart: true, muted: false });
  }

  function stopOthers(except) {
    document.querySelectorAll('.has-prog-video.is-playing').forEach(function (other) {
      if (other === except) return;
      if (other.hasAttribute('data-prog-autoplay')) return;
      stopVideo(other);
    });
  }

  function scheduleDwell(box) {
    clearTimer(box, '_dwellTimer');
    box._dwellTimer = setTimeout(function () {
      box._dwellTimer = null;
      if (!box.isConnected) return;
      stopOthers(box);
      box.classList.add('is-touch-playing');
      startVideo(box, { muted: true });
    }, DWELL_MS);
  }

  function bindBox(box) {
    if (isBound(box)) return;
    markBound(box);
    box.classList.add('has-prog-video');
    if (!videoUrl(box)) return;
    ensureChrome(box);

    var unmuteBtn = box.querySelector('.prog-unmute-btn');
    if (unmuteBtn && !unmuteBtn._progBound) {
      unmuteBtn._progBound = true;
      unmuteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        enableSound(box);
      });
    }

    var autoplay = box.hasAttribute('data-prog-autoplay');

    if (autoplay) {
      // Sayfa hero: görünür olunca hemen (kısa gecikmeyle) başlat
      if ('IntersectionObserver' in global) {
        var heroIO = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                if (!box.classList.contains('is-playing')) {
                  startVideo(box, { muted: true });
                }
              } else {
                stopVideo(box);
              }
            });
          },
          { threshold: 0.2 }
        );
        heroIO.observe(box);
      }
      startVideo(box, { muted: true });
      return;
    }

    if (isFinePointer()) {
      box.addEventListener('mouseenter', function () {
        stopOthers(box);
        startVideo(box, { muted: true });
      });
      box.addEventListener('mouseleave', function (e) {
        if (e.relatedTarget && box.contains(e.relatedTarget)) return;
        stopVideo(box);
      });
      return;
    }

    // Mobil dokunma
    box.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('.prog-unmute-btn')) return;
      e.preventDefault();
      e.stopPropagation();
      if (box.classList.contains('is-playing')) {
        enableSound(box);
        return;
      }
      stopOthers(box);
      box.classList.add('is-touch-playing');
      startVideo(box, { muted: true });
    });
  }

  function bindMobileDwell() {
    if (isFinePointer() || !('IntersectionObserver' in global)) return;
    if (cardIO) {
      cardIO.disconnect();
      cardIO = null;
    }
    cardIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var box = entry.target;
          if (box.hasAttribute('data-prog-autoplay')) return;
          clearTimer(box, '_dwellTimer');
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            scheduleDwell(box);
          } else if (box.classList.contains('is-playing') && !box.classList.contains('has-sound')) {
            stopVideo(box);
          }
        });
      },
      { threshold: [0.5, 0.65], rootMargin: '0px 0px -5% 0px' }
    );
    document.querySelectorAll('.has-prog-video:not([data-prog-autoplay])').forEach(function (el) {
      cardIO.observe(el);
    });
  }

  function enhance() {
    document.querySelectorAll('[data-prog-video]').forEach(bindBox);
    bindMobileDwell();
  }

  function boot() {
    enhance();
    // cart.js kart DOM’unu değiştirebilir — WeakSet ile yeni düğümler yeniden bağlanır
    setTimeout(enhance, 80);
    setTimeout(enhance, 450);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.OVD_PROG_HOVER_VIDEO = { enhance: enhance, start: startVideo, stop: stopVideo };
})(typeof window !== 'undefined' ? window : global);
