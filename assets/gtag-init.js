window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
window.gtag = gtag;
gtag('js', new Date());

var cfg = window.OVD_ANALYTICS || {};
if (cfg.googleAds) {
  gtag('config', cfg.googleAds);
}
if (cfg.ga4) {
  gtag('config', cfg.ga4);
}

// WhatsApp tıklama ölçümü (GTM'den bağımsız).
// Sitedeki her WhatsApp bağlantısı (wa.me / api.whatsapp.com) tıklandığında:
//  1) dataLayer'a 'whatsapp_click' olayı itilir (GTM'de "Özel Etkinlik" tetikleyicisiyle kullanılabilir),
//  2) Google Ads "Whatshapp Dönüşümü" dönüşümü doğrudan gönderilir.
// Numara değişse bile çalışır; tetikleyicinin numaraya bağlı olmasına gerek kalmaz.
(function () {
  var WA_RE = /(^|\/\/)(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\b|^whatsapp:/i;
  var ADS_SEND_TO = 'AW-17235832134/lVYvCJe46ZcbEMba15pA';
  // Öğretmen başvurusu / kariyer sayfaları öğrenci-veli adayı değildir; dönüşüm sayılmaz.
  var SKIP_PATH_RE = /(kariyer|ogretmen-basvuru|ozel-ders-ogretmen)/i;
  var lastAt = 0;

  function track(href, el) {
    if (SKIP_PATH_RE.test(location.pathname)) return;
    var now = Date.now();
    if (now - lastAt < 800) return; // çift tıklamayı tek say
    lastAt = now;
    var label = '';
    try {
      label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    } catch (e) {}
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'whatsapp_click',
      wa_link_url: href,
      wa_link_text: label,
      wa_page_path: location.pathname,
    });
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: ADS_SEND_TO, transport_type: 'beacon' });
    }
  }

  document.addEventListener(
    'click',
    function (ev) {
      var el = ev.target;
      while (el && el !== document && el.tagName !== 'A') el = el.parentNode;
      if (!el || el === document) return;
      var href = el.getAttribute('href') || '';
      if (WA_RE.test(href)) track(href, el);
    },
    true
  );

  // window.open ile açılan WhatsApp bağlantıları (ör. form sonrası yönlendirme)
  var origOpen = window.open;
  if (typeof origOpen === 'function') {
    window.open = function (url) {
      try {
        if (url && WA_RE.test(String(url))) track(String(url), document.body);
      } catch (e) {}
      return origOpen.apply(window, arguments);
    };
  }
})();
