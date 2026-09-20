/**
 * Öğretmen tanıtım videosu — YouTube / Drive / Instagram / mp4
 * Hover ve profil gömme aynı kuralları kullanır.
 */
(function (global) {
  function youtubeIdFromUrl(url) {
    var u = String(url || '').trim();
    if (!u) return '';
    if (/youtube\.com\/(?:@|channel\/|c\/|user\/)/i.test(u)) return '';
    var m = u.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{6,15})/i
    );
    if (m) return m[1];
    try {
      var parsed = new URL(u);
      if (!/youtube\.com|youtu\.be/i.test(parsed.hostname)) return '';
      var q = parsed.searchParams.get('v');
      if (q && /^[A-Za-z0-9_-]{6,15}$/.test(q)) return q;
    } catch (e) {
      /* ignore */
    }
    return '';
  }

  function driveFileIdFromUrl(url) {
    var u = String(url || '').trim();
    if (!/drive\.google\.com|docs\.google\.com/i.test(u)) return '';
    var m = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (m) return m[1];
    m = u.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    return m ? m[1] : '';
  }

  function instagramEmbedSrc(url) {
    var u = String(url || '').trim();
    var m = u.match(/instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (!m) return '';
    return 'https://www.instagram.com/' + m[1].toLowerCase() + '/' + m[2] + '/embed';
  }

  function isDirectVideoUrl(url) {
    var u = String(url || '').trim();
    if (!u) return false;
    if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(u)) return false;
    if (/\.(mp4|webm|ogg|m4v|mov)(\?|#|$)/i.test(u)) return true;
    if (/\/storage\/v1\/object\//i.test(u) && /video/i.test(u)) return true;
    return false;
  }

  function isPlayableVideoUrl(url) {
    var u = String(url || '').trim();
    if (!u) return false;
    if (/\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(u)) return false;
    return !!(youtubeIdFromUrl(u) || driveFileIdFromUrl(u) || instagramEmbedSrc(u) || isDirectVideoUrl(u));
  }

  function itemUrl(item) {
    if (typeof item === 'string') return String(item || '').trim();
    if (item && typeof item === 'object') {
      return String(item.url || item.public_url || item.video_url || '').trim();
    }
    return '';
  }

  function primaryVideoUrl(t) {
    var seen = [];
    if (Array.isArray(t && t.videos)) {
      t.videos.forEach(function (item) {
        var url = itemUrl(item);
        if (url) seen.push(url);
      });
    }
    var legacy = String((t && t.video_url) || (t && t.video) || '').trim();
    if (legacy) seen.push(legacy);
    for (var i = 0; i < seen.length; i++) {
      if (isPlayableVideoUrl(seen[i])) return seen[i];
    }
    return '';
  }

  function ensureYtApi() {
    if (global.YT && global.YT.Player) return Promise.resolve(global.YT);
    if (global._ovdYtApi) return global._ovdYtApi;
    global._ovdYtApi = new Promise(function (resolve) {
      var prev = global.onYouTubeIframeAPIReady;
      global.onYouTubeIframeAPIReady = function () {
        if (typeof prev === 'function') prev();
        resolve(global.YT);
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        var s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.async = true;
        document.head.appendChild(s);
      }
      if (global.YT && global.YT.Player) resolve(global.YT);
    });
    return global._ovdYtApi;
  }

  function ytEmbedSrc(id, muted) {
    return (
      'https://www.youtube.com/embed/' +
      encodeURIComponent(id) +
      '?autoplay=1&mute=' +
      (muted ? '1' : '0') +
      '&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&loop=1&fs=0&iv_load_policy=3&disablekb=1&playlist=' +
      encodeURIComponent(id)
    );
  }

  function escapeAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function ytCommand(iframe, func, args) {
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: func, args: args || [] }),
        '*'
      );
    } catch (e) {
      /* ignore */
    }
  }

  function playYtPlayer(player, muted) {
    if (!player) return;
    try {
      if (muted !== false) {
        if (player.mute) player.mute();
      } else if (player.unMute) {
        player.unMute();
        if (player.setVolume) player.setVolume(100);
      }
      if (player.seekTo) player.seekTo(0, true);
      if (player.playVideo) player.playVideo();
    } catch (e) {
      /* ignore */
    }
  }

  function kickYouTubePlay(iframe, muted) {
    if (!iframe) return;
    var n = 0;
    function tick() {
      ytCommand(iframe, muted ? 'mute' : 'unMute');
      ytCommand(iframe, 'playVideo');
      n += 1;
      if (n < 8) setTimeout(tick, 280);
    }
    iframe.addEventListener('load', function () {
      tick();
    });
    setTimeout(tick, 350);
  }

  function kickHtmlVideo(video) {
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.playsInline = true;
    video.volume = 1;
    function tryPlay() {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
    video.addEventListener('loadeddata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    tryPlay();
  }

  function injectHoverMedia(layer, url, muted) {
    if (!layer) return false;
    muted = muted !== false;
    var yt = youtubeIdFromUrl(url);
    if (yt) {
      layer.innerHTML = '<div class="teacher-yt-mount"></div>';
      var mount = layer.querySelector('.teacher-yt-mount');
      ensureYtApi().then(function (YT) {
        if (!layer.isConnected || !mount.isConnected) return;
        try {
          if (layer._ytPlayer && layer._ytPlayer.destroy) layer._ytPlayer.destroy();
        } catch (e) {
          /* ignore */
        }
        layer._ytPlayer = new YT.Player(mount, {
          videoId: yt,
          host: 'https://www.youtube.com',
          playerVars: {
            autoplay: 1,
            mute: muted ? 1 : 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            loop: 1,
            playlist: yt,
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
            origin: global.location.origin
          },
          events: {
            onReady: function (e) {
              playYtPlayer(e.target, muted);
            },
            onStateChange: function (e) {
              if (!global.YT) return;
              if (e.data === YT.PlayerState.CUED || e.data === YT.PlayerState.UNSTARTED) {
                playYtPlayer(e.target, muted);
              }
              if (e.data === YT.PlayerState.ENDED) {
                playYtPlayer(e.target, muted);
              }
            }
          }
        });
      });
      return true;
    }

    var driveId = driveFileIdFromUrl(url);
    if (driveId) {
      var proxySrc = '/api/teacher-media?drive=' + encodeURIComponent(driveId);
      var directSrc =
        'https://drive.usercontent.google.com/download?id=' +
        encodeURIComponent(driveId) +
        '&export=download';
      layer.innerHTML =
        '<video autoplay loop playsinline muted preload="auto">' +
        '<source src="' +
        escapeAttr(proxySrc) +
        '" type="video/mp4">' +
        '<source src="' +
        escapeAttr(directSrc) +
        '" type="video/mp4">' +
        '</video>';
      kickHtmlVideo(layer.querySelector('video'));
      return true;
    }

    var ig = instagramEmbedSrc(url);
    if (ig) {
      layer.setAttribute('data-platform', 'instagram');
      layer.innerHTML =
        '<iframe src="' +
        escapeAttr(ig) +
        '" title="Tanıtım videosu" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" loading="eager"></iframe>';
      return true;
    }

    if (isDirectVideoUrl(url)) {
      layer.innerHTML =
        '<video src="' +
        escapeAttr(url) +
        '" autoplay loop playsinline muted></video>';
      kickHtmlVideo(layer.querySelector('video'));
      return true;
    }
    return false;
  }

  function hasMedia(layer) {
    return !!(
      layer &&
      (layer._ytPlayer || layer.querySelector('iframe, video, .teacher-yt-mount'))
    );
  }

  function pauseMedia(layer) {
    if (!layer) return;
    if (layer._ytPlayer && layer._ytPlayer.pauseVideo) {
      try {
        layer._ytPlayer.pauseVideo();
      } catch (e) {
        /* ignore */
      }
    }
    var iframe = layer.querySelector('iframe');
    if (iframe) ytCommand(iframe, 'pauseVideo');
    var video = layer.querySelector('video');
    if (video && !video.paused) video.pause();
  }

  function resumeMedia(layer, muted) {
    if (!layer) return;
    muted = muted !== false;
    if (layer._ytPlayer) {
      playYtPlayer(layer._ytPlayer, muted);
      return;
    }
    var iframe = layer.querySelector('iframe');
    if (iframe) {
      kickYouTubePlay(iframe, muted);
      ytCommand(iframe, 'seekTo', [0, true]);
    }
    var video = layer.querySelector('video');
    if (video) {
      try {
        video.currentTime = 0;
      } catch (e) {
        /* ignore */
      }
      kickHtmlVideo(video);
    }
  }

  function preloadHoverMedia(layer, url) {
    if (!layer || !url) return false;
    if (hasMedia(layer)) return true;
    return injectHoverMedia(layer, url, true);
  }

  global.OVD_TEACHER_VIDEO = {
    youtubeIdFromUrl: youtubeIdFromUrl,
    driveFileIdFromUrl: driveFileIdFromUrl,
    instagramEmbedSrc: instagramEmbedSrc,
    isDirectVideoUrl: isDirectVideoUrl,
    isPlayableVideoUrl: isPlayableVideoUrl,
    primaryVideoUrl: primaryVideoUrl,
    injectHoverMedia: injectHoverMedia,
    preloadHoverMedia: preloadHoverMedia,
    pauseMedia: pauseMedia,
    resumeMedia: resumeMedia,
    hasMedia: hasMedia
  };
})(typeof window !== 'undefined' ? window : global);
