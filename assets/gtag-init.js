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
