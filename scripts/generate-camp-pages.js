const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'programlar');

const camps = [
  {
    id: 'kamp56',
    slug: 'kamp-56.html',
    imageFile: 'kamp-56.png',
    heroPhoto: 'slide-ortaokul.jpg',
    heroAlt: '5-6. sınıf yaz kampı — öğretmen ve öğrenciler ders çalışıyor',
    title: "5'ten 6. Sınıfa Geçenler Yaz Kampı",
    tag: 'Ortaokul · 5-6. Sınıf · Yaz 2025',
    heroDesc:
      'Yaz tatilinde sadece dinlenmek yetmez… Çocuğunuz geri düşmeden, eğlenerek gelişsin! Matematik, fen ve kitap okuma atölyesi ile yazı verimli geçirin.',
    metaDescription:
      "5'ten 6. sınıfa geçen öğrenciler için online yaz kampı. Matematik, fen bilimleri, kitap okuma atölyesi ve birebir eğitim koçluğu.",
    meta: ['⛺ 9 Haftalık Kamp', '💻 Canlı Ders', '👥 Max. 10 Kişi', '🎓 Birebir Koçluk'],
  },
  {
    id: 'kamp910',
    slug: 'kamp-910.html',
    imageFile: 'kamp-910.png',
    heroPhoto: 'slide-ana.jpg',
    heroAlt: "9'dan 10'a geçiş yaz kampı — lise öğrencileri birlikte çalışıyor",
    title: "9'dan 10'a Geçenler Yaz Kampı",
    tag: 'Lise · 9-10. Sınıf · Geçiş Dönemi',
    heroDesc:
      "9'dan 10. sınıfa geçişte en kritik yaz! Matematik, fizik ve kitap okuma atölyesi ile 10. sınıfa hazır başlayın.",
    metaDescription:
      "9'dan 10. sınıfa geçen öğrenciler için yaz kampı. Matematik, fizik, kitap okuma atölyesi, koçluk ve deneme programı.",
    meta: ['⛺ 9 Haftalık Kamp', '💻 Canlı Ders', '👥 Max. 10 Kişi', '🎓 Birebir Koçluk'],
  },
  {
    id: 'kampMaarifTyt',
    slug: 'kamp-maarif-tyt.html',
    imageFile: 'kamp-maarif-tyt.png',
    heroPhoto: 'slide-lgs.jpg',
    heroAlt: 'Maarif Model TYT yaz kampı — öğrenci ders çalışıyor',
    title: "10'dan 11'e Geçenler Maarif Model TYT Yaz Kampı",
    tag: 'Lise · Maarif Model · TYT Başlangıç',
    heroDesc:
      '10. sınıfa geçen öğrenciler için en kritik dönem: TYT başlangıcı. Doğru sistemle başlayanlar rakiplerinden 1 yıl öne geçer.',
    metaDescription:
      "10'dan 11. sınıfa geçenler için Maarif Model TYT yaz kampı. Konu tekrarları, soru çözümü, koçluk ve denemeler.",
    meta: ['⛺ 9 Haftalık Kamp', '💻 Canlı Ders', '👥 Max. 10 Kişi', '🎯 TYT Başlangıç'],
  },
  {
    id: 'kampTyt',
    slug: 'kamp-tyt.html',
    imageFile: 'kamp-tyt.png',
    heroPhoto: 'slide-vip-start.jpg',
    heroAlt: 'TYT yaz kampı — öğrenci masada yoğun çalışıyor',
    title: "11'den 12'ye Geçenler TYT Yaz Kampı",
    tag: 'Lise · TYT Hızlandırma · 11-12. Sınıf',
    heroDesc:
      "12. sınıfa geçenler için son kritik yaz. TYT'yi bitirenler 12. sınıfta sadece tekrar yapar ve netlerini erken yükseltir.",
    metaDescription:
      "11'den 12. sınıfa geçenler için TYT yaz kampı. TYT hızlandırma, eksik tamamlama, deneme analizleri ve birebir koçluk.",
    meta: ['⛺ 9 Haftalık Kamp', '💻 Canlı Ders', '👥 Max. 10 Kişi', '🚀 TYT Hızlandırma'],
  },
];

function campPage(camp) {
  const canonical = `https://onlinevipdershane.com/programlar/${camp.slug}`;
  const waText = encodeURIComponent(`Merhaba, ${camp.title} hakkında bilgi almak istiyorum.`);
  const metaHtml = camp.meta.map((m) => `<span>${m}</span>`).join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${camp.title} — Online VIP Dershane</title>
<meta property="og:image" content="https://onlinevipdershane.com/assets/img/programlar/${camp.imageFile}">
<meta name="description" content="${camp.metaDescription}">
<link rel="canonical" href="${canonical}">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/cart.css">
<link rel="stylesheet" href="../assets/icons.css">
<link rel="stylesheet" href="../assets/nav-logo.css">
<link rel="stylesheet" href="../assets/program-page.css">
<link rel="stylesheet" href="../assets/program-nav.css">
<link rel="stylesheet" href="../assets/camp-detail.css">
<link rel="stylesheet" href="../assets/camp-page.css">
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17235832134"></script>
<script src="../assets/analytics-config.js"></script>
<script src="../assets/gtag-init.js"></script>
</head>
<body class="camp-page camp-page--${camp.id}" data-camp="${camp.id}">
<nav style="position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);border-bottom:1px solid #e5e5e7;backdrop-filter:blur(12px);">
  <div style="max-width:1200px;margin:0 auto;padding:0 5%;display:flex;align-items:center;gap:16px;height:68px;">
    <a href="../index.html"><img src="../assets/img/ovd-logo.png" alt="Online VIP Dershane" style="height:52px;width:auto;object-fit:contain;"></a>
    <div style="flex:1;display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
      <a href="../index.html" style="font-size:14px;font-weight:600;color:#6e6e73;padding:7px 12px;border-radius:9px;">Ana Sayfa</a>
      <a href="kamplar.html" style="font-size:14px;font-weight:700;color:#1a3fad;padding:7px 12px;border-radius:9px;background:#f0f5ff;">Yaz Kampları</a>
      <a href="../iletisim.html" style="font-size:14px;font-weight:600;color:#6e6e73;padding:7px 12px;border-radius:9px;">İletişim</a>
    </div>
    <a href="../kayit.html" style="padding:9px 16px;border-radius:10px;font-size:13px;font-weight:700;background:#e8232a;color:#fff;white-space:nowrap;">📋 Kayıt Ol</a>
  </div>
</nav>
<section class="prog-hero">
  <div class="prog-hero-in">
    <div class="prog-hero-copy">
      <div class="prog-tag">${camp.tag}</div>
      <h1>${camp.title}</h1>
      <p>${camp.heroDesc}</p>
      <div class="prog-meta">${metaHtml}</div>
    </div>
    <div class="prog-hero-poster prog-hero-poster--photo">
      <img src="../assets/img/hero/${camp.heroPhoto}" alt="${camp.heroAlt}" loading="eager" width="960" height="600">
    </div>
    <div class="price-box">
      <div class="price">24.000₺</div>
      <div class="period">9 Haftalık Kamp</div>
      <a href="../kayit.html" class="btn-kayit">📋 Hemen Kayıt Ol</a>
      <a href="https://wa.me/908503034014?text=${waText}" target="_blank" rel="noopener" class="btn-wa">💬 WhatsApp</a>
      <button class="btn-share" onclick="copyURL('${canonical}')">🔗 Linki Paylaş</button>
    </div>
  </div>
</section>
<div class="prog-body">
  <div class="prog-grid">
    <div>
      <div class="prog-brochure-wrap">
        <h2>Program Afişi</h2>
        <img class="prog-brochure" src="../assets/img/programlar/${camp.imageFile}" alt="${camp.title} afişi" loading="lazy" width="600" height="750">
      </div>
      <div id="camp-sections"></div>
    </div>
    <div>
      <div class="sidebar-box">
        <h3>🎁 Ücretsiz Başlayın</h3>
        <p>Tanışma dersini alın. Ödeme yapmadan sistemi deneyin.</p>
        <a href="../iletisim.html" class="btn-kayit" style="margin-bottom:10px;">📋 Ücretsiz Tanışma</a>
        <a href="https://wa.me/908503034014?text=${waText}" target="_blank" rel="noopener" class="btn-wa">💬 WhatsApp'tan Sor</a>
        <a href="kamplar.html" class="back-link">← Tüm Yaz Kampları</a>
      </div>
    </div>
  </div>
</div>
<footer style="background:#0a1a4e;color:rgba(255,255,255,.5);padding:32px 5%;text-align:center;font-size:12px;">© 2025 Online VIP Dershane</footer>
<a href="https://wa.me/908503034014" target="_blank" rel="noopener" style="position:fixed;bottom:24px;right:24px;z-index:300;width:52px;height:52px;border-radius:50%;background:#25d366;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 16px rgba(37,211,102,.4);text-decoration:none;">💬</a>
<div id="copy-toast" style="position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(16px);background:#1a3fad;color:#fff;padding:11px 22px;border-radius:12px;font-size:13px;font-weight:700;z-index:99999;display:none;opacity:0;transition:opacity .25s,transform .25s;white-space:nowrap;">✅ Link kopyalandı!</div>
<script>
function copyURL(url){
  if(navigator.clipboard)navigator.clipboard.writeText(url).then(showToast);
  else{var e=document.createElement("textarea");e.value=url;document.body.appendChild(e);e.select();document.execCommand("copy");document.body.removeChild(e);showToast();}
}
function showToast(){
  var t=document.getElementById("copy-toast");
  t.style.display="block";
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.style.opacity="1";t.style.transform="translateX(-50%) translateY(0)";});});
  clearTimeout(t._t);
  t._t=setTimeout(function(){t.style.opacity="0";t.style.transform="translateX(-50%) translateY(16px)";setTimeout(function(){t.style.display="none";},300);},2500);
}
</script>
<script src="../assets/program-nav.js" defer></script>
<script src="../assets/icons.js" defer></script>
<script src="../assets/products.js"></script>
<script src="../assets/cart.js"></script>
<script src="../assets/camps-data.js"></script>
<script src="../assets/camp-detail.js"></script>
<script src="../assets/perf-analytics.js" defer></script>
</body>
</html>`;
}

camps.forEach((camp) => {
  fs.writeFileSync(path.join(OUT, camp.slug), campPage(camp), 'utf8');
  console.log('wrote', camp.slug);
});
