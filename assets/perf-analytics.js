(function () {
  var cfg = window.OVD_ANALYTICS || {};
  window.dataLayer = window.dataLayer || [];

  function load(src, cb) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    if (cb) s.onload = cb;
    document.head.appendChild(s);
  }

  function run() {
    if (cfg.gtm) {
      load('https://www.googletagmanager.com/gtm.js?id=' + cfg.gtm);
    }

    if (cfg.clarity) {
      load('https://www.clarity.ms/tag/' + cfg.clarity);
    }

    if (cfg.metaPixel) {
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', cfg.metaPixel);
      window.fbq('track', 'PageView');
    }

    if (cfg.tiktokPixel) {
      !(function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready',
          'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent',
        ];
        ttq.setAndDefer = function (o, e) {
          o[e] = function () {
            o.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.load = function (e, n) {
          var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {};
          ttq._i[e] = [];
          ttq._i[e]._u = r;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          var s = d.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = r + '?sdkid=' + e + '&lib=' + t;
          var x = d.getElementsByTagName('script')[0];
          x.parentNode.insertBefore(s, x);
        };
        ttq.load(cfg.tiktokPixel);
        ttq.page();
      })(window, document, 'ttq');
    }
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 3000 });
  } else {
    window.addEventListener('load', function () {
      setTimeout(run, 1500);
    });
  }
})();
