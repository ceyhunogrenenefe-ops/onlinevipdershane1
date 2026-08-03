/**
 * Özel ders hero — tanıtım videolu öğretmen şeridi
 * Hover / dokununca ilk video oynar (liste kartlarıyla aynı mantık).
 * Sayıya göre kolon: 1–2 → o kadar, 3 → 3, 4 → 4, 5–6 → 3×2
 */
(function (global) {
  /** Hero’da gösterilecek öğretmen slug’ları (sıra korunur) */
  var FEATURED_SLUGS = [
    'elif-denk',
    'merve-matematik'
    // Alakdış Hoca panelde bulunamadı — slug gelince buraya ekleyin
  ];

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function titleCaseTr(s) {
    return String(s == null ? '' : s)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) {
        if (/^(LGS|TYT|AYT|YKS|KPSS|VIP)$/i.test(w)) return w.toUpperCase();
        var lower = w.toLocaleLowerCase('tr-TR');
        return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
      })
      .join(' ');
  }

  function youtubeIdFromUrl(url) {
    var u = String(url || '').trim();
    if (!u) return '';
    var m = u.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{6,11})/i
    );
    if (m) return m[1];
    try {
      var q = new URL(u).searchParams.get('v');
      if (q && /^[A-Za-z0-9_-]{6,11}$/.test(q)) return q;
    } catch (e) {
      /* ignore */
    }
    return '';
  }

  function isDirectVideoUrl(url) {
    var u = String(url || '').trim();
    if (!u) return false;
    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(u)) return true;
    if (/\/storage\/v1\/object\//i.test(u) && /video/i.test(u)) return true;
    return false;
  }

  function isPlayableVideoUrl(url) {
    return !!(youtubeIdFromUrl(url) || isDirectVideoUrl(url));
  }

  function primaryVideoUrl(t) {
    if (Array.isArray(t.videos)) {
      for (var i = 0; i < t.videos.length; i++) {
        var item = t.videos[i];
        var url =
          typeof item === 'string'
            ? String(item || '').trim()
            : String((item && (item.url || item.public_url || item.video_url)) || '').trim();
        if (url) return url;
      }
    }
    return String(t.video_url || '').trim();
  }

  function colsForCount(n) {
    if (n <= 1) return 1;
    if (n === 2) return 2;
    if (n === 3) return 3;
    if (n === 4) return 4;
    return 3;
  }

  function profileHref(slug) {
    return '/ozel-ders/ogretmen/' + encodeURIComponent(slug);
  }

  function cardHtml(t) {
    var name = titleCaseTr(t.name) || 'Öğretmen';
    var role = titleCaseTr(t.title || t.branch || '');
    var photo = String(t.photo_url || '').trim() || '/assets/img/ovd-logo.png';
    var videoUrl = primaryVideoUrl(t);
    var canHover = isPlayableVideoUrl(videoUrl);
    return (
      '<article class="hero-teacher-card">' +
      '<a class="hero-teacher-link" href="' +
      profileHref(t.slug) +
      '" aria-label="' +
      escapeHtml(name) +
      ' profili">' +
      '<div class="teacher-photo-box hero-teacher-photo' +
      (canHover ? ' has-video' : '') +
      '"' +
      (canHover ? ' data-video="' + escapeHtml(videoUrl) + '"' : '') +
      '>' +
      '<img src="' +
      escapeHtml(photo) +
      '" alt="' +
      escapeHtml(name) +
      '" class="teacher-photo" width="640" height="800" decoding="async">' +
      (canHover
        ? '<div class="teacher-video-layer" aria-hidden="true"></div>' +
          '<span class="teacher-video-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Tanıtım</span>' +
          '<button type="button" class="teacher-unmute-btn" aria-label="Sesi aç">🔊 Sesi aç</button>'
        : '') +
      '<div class="hero-teacher-meta">' +
      '<p class="hero-teacher-name">' +
      escapeHtml(name) +
      '</p>' +
      (role ? '<p class="hero-teacher-role">' + escapeHtml(role) + '</p>' : '') +
      '</div>' +
      '</div></a></article>'
    );
  }

  function bindHover(root) {
    if (!root) return;
    function stop(box) {
      if (!box) return;
      if (box._videoInjectTimer) {
        clearTimeout(box._videoInjectTimer);
        box._videoInjectTimer = null;
      }
      if (box._videoClearTimer) {
        clearTimeout(box._videoClearTimer);
        box._videoClearTimer = null;
      }
      box.classList.remove('is-playing', 'is-muted', 'has-sound', 'is-touch-playing');
      var layer = box.querySelector('.teacher-video-layer');
      box._videoClearTimer = setTimeout(function () {
        box._videoClearTimer = null;
        if (!box.classList.contains('is-playing') && layer) layer.innerHTML = '';
      }, 700);
    }

    function ytEmbedSrc(id, muted) {
      var origin = '';
      try {
        origin = '&origin=' + encodeURIComponent(window.location.origin);
      } catch (e) {
        /* ignore */
      }
      return (
        'https://www.youtube.com/embed/' +
        encodeURIComponent(id) +
        '?autoplay=1&mute=' +
        (muted ? '1' : '0') +
        '&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&loop=1&playlist=' +
        encodeURIComponent(id) +
        origin
      );
    }

    function markSoundOn(box) {
      box.classList.remove('is-muted');
      box.classList.add('has-sound');
    }

    function forceUnmute(box) {
      var iframe = box.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
            '*'
          );
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
            '*'
          );
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        } catch (e) {
          /* ignore */
        }
      }
      var video = box.querySelector('video');
      if (video) {
        video.muted = false;
        video.volume = 1;
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      }
      markSoundOn(box);
    }

    function inject(box, layer, url, muted) {
      var yt = youtubeIdFromUrl(url);
      if (yt) {
        layer.innerHTML =
          '<iframe src="' +
          ytEmbedSrc(yt, muted) +
          '" title="Tanıtım videosu" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="eager"></iframe>';
      } else if (isDirectVideoUrl(url)) {
        layer.innerHTML =
          '<video src="' +
          escapeHtml(url) +
          '" autoplay loop playsinline controls' +
          (muted ? ' muted' : '') +
          '></video>';
        var video = layer.querySelector('video');
        if (video) {
          video.muted = !!muted;
          video.volume = 1;
          var playPromise = video.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch(function () {
              video.muted = true;
              box.classList.add('is-muted');
              video.play().catch(function () {
                video.controls = true;
              });
            });
          }
        }
      } else return false;
      if (muted) {
        box.classList.add('is-muted');
        box.classList.remove('has-sound');
      } else {
        markSoundOn(box);
        forceUnmute(box);
      }
      return true;
    }

    function start(box, opts) {
      opts = opts || {};
      var restart = !!opts.restart;
      var muted = !!opts.muted;
      var fromUnmute = !!opts.fromUnmute;
      if (!box) return;
      if (box.classList.contains('is-playing') && !restart) {
        if (!muted) start(box, { restart: true, muted: false, fromUnmute: true });
        return;
      }
      var url = box.getAttribute('data-video') || '';
      var layer = box.querySelector('.teacher-video-layer');
      if (!layer || !url || !isPlayableVideoUrl(url)) return;
      if (box._videoClearTimer) {
        clearTimeout(box._videoClearTimer);
        box._videoClearTimer = null;
      }
      if (box._videoInjectTimer) {
        clearTimeout(box._videoInjectTimer);
        box._videoInjectTimer = null;
      }
      root.querySelectorAll('.teacher-photo-box.has-video.is-playing').forEach(function (other) {
        if (other !== box) stop(other);
      });
      if (restart) layer.innerHTML = '';
      box.classList.add('is-playing');
      if (muted) box.classList.add('is-muted');
      else box.classList.remove('is-muted');
      var reduceMotion =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var delay = reduceMotion || fromUnmute ? 0 : 140;
      box._videoInjectTimer = setTimeout(function () {
        box._videoInjectTimer = null;
        if (!box.classList.contains('is-playing')) return;
        inject(box, layer, url, !!muted);
      }, delay);
    }

    root.querySelectorAll('.teacher-photo-box.has-video').forEach(function (box) {
      if (box.dataset.heroVideoBound === '1') return;
      box.dataset.heroVideoBound = '1';
      var unmuteBtn = box.querySelector('.teacher-unmute-btn');
      if (unmuteBtn) {
        unmuteBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          start(box, { restart: true, muted: false, fromUnmute: true });
        });
      }
      var hoverCapable =
        window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (hoverCapable) {
        box.addEventListener('mouseenter', function () {
          start(box, { muted: false });
          setTimeout(function () {
            if (box.classList.contains('is-playing') && !box.classList.contains('has-sound')) {
              box.classList.add('is-muted');
            }
          }, 800);
        });
        box.addEventListener('mouseleave', function () {
          stop(box);
        });
      } else {
        box.addEventListener('click', function (e) {
          if (e.target && e.target.closest && e.target.closest('.teacher-unmute-btn')) return;
          e.preventDefault();
          if (box.classList.contains('is-playing')) {
            stop(box);
            return;
          }
          box.classList.add('is-touch-playing');
          start(box, { restart: true, muted: false, fromUnmute: true });
        });
      }
    });
  }

  function init() {
    var grid = document.getElementById('heroTeacherGrid');
    if (!grid) return;
    var slugs = Array.isArray(global.OVD_OZEL_HERO_SLUGS)
      ? global.OVD_OZEL_HERO_SLUGS.slice()
      : FEATURED_SLUGS.slice();

    fetch('/api/public-teachers')
      .then(function (r) {
        if (!r.ok) throw new Error('api');
        return r.json();
      })
      .then(function (data) {
        var bySlug = {};
        (data.teachers || []).forEach(function (t) {
          if (t && t.slug) bySlug[String(t.slug)] = t;
        });
        var list = [];
        slugs.forEach(function (slug) {
          var t = bySlug[slug];
          if (t) list.push(t);
        });
        if (!list.length) {
          grid.innerHTML =
            '<p class="hero-teacher-fallback">Öğretmen tanıtımları yükleniyor… <a href="#ogretmenler">Tüm kadroya git</a></p>';
          return;
        }
        grid.setAttribute('data-cols', String(colsForCount(list.length)));
        grid.innerHTML = list.map(cardHtml).join('');
        bindHover(grid);
      })
      .catch(function () {
        grid.innerHTML =
          '<p class="hero-teacher-fallback"><a class="text-white underline" href="#ogretmenler">Öğretmenleri incele</a></p>';
      });
  }

  global.OVD_OZEL_HERO_TEACHERS = { init: init, FEATURED_SLUGS: FEATURED_SLUGS };
})(typeof window !== 'undefined' ? window : global);
