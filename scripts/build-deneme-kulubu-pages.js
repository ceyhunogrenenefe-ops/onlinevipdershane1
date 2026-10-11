/**
 * Deneme Kulübü sınıf sayfalarını üretir: /deneme-kulubu/<slug>.html
 *
 * 10 sayfa elle tutulmaz — SEO başlığı, açıklaması ve kanonik adresi dışında
 * hepsi aynı iskelet. Paket eklenince/çıkınca betik yeniden çalıştırılır:
 *
 *   node scripts/build-deneme-kulubu-pages.js
 *
 * Fiyat ve takvim sayfaya GÖMÜLMEZ; çalışma anında /api/deneme-kulubu-config
 * ve koçluk panelindeki takvim ucundan okunur. Böylece kampanya bitince ya da
 * takvim değişince sayfaları yeniden üretmek gerekmez.
 */
const fs = require('fs');
const path = require('path');
const dk = require('../assets/deneme-kulubu-data.js');

const OUT_DIR = path.join(__dirname, '..', 'deneme-kulubu');

/** Paket slug'i -> katalog urun kimligi; api/_lib/products.js ile ayni kural. */
function productId(pkg) {
  const s = String(pkg.slug);
  if (s === 'lgs') return 'denemeLgs';
  if (s === 'yks') return 'denemeYks';
  return 'deneme' + s.replace('-sinif', '');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function seoDescription(pkg) {
  const adet = pkg.denemeSayisi ? `${pkg.denemeSayisi} deneme sınavı, ` : '';
  return `${pkg.short} Deneme Kulübü: ${adet}canlı gözetimli sınavlar, düzenli takvim ve dijital analiz karnesi. ${pkg.desc}`;
}

function page(pkg) {
  const url = `https://onlinevipdershane.com/deneme-kulubu/${pkg.slug}`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(pkg.title)} — Canlı Gözetimli Denemeler | Online VIP Dershane</title>
<meta name="description" content="${esc(seoDescription(pkg))}">
<meta property="og:title" content="${esc(pkg.title)} — Online VIP Dershane">
<meta property="og:description" content="${esc(pkg.desc)}">
<meta property="og:image" content="https://onlinevipdershane.com/${pkg.image}">
<link rel="canonical" href="${url}">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/icons.css">
<link rel="stylesheet" href="../assets/nav-logo.css">
<link rel="stylesheet" href="../assets/cart.css?v=4">
<link rel="stylesheet" href="../assets/deneme-kulubu.css?v=2">
<style>
:root{--navy:#1a3fad;--navy2:#0f2a7a;--navy3:#0a1a4e;--accent:#e8232a;--accent2:#c8191f;--gold:#f5c542;--light:#f5f5f7;--border:#e5e5e7;--text:#1a1f36;--muted:#6e6e73;--shadow:0 4px 24px rgba(26,63,173,.08);}
*{box-sizing:border-box;}
body{margin:0;font-family:'Nunito',system-ui,-apple-system,sans-serif;color:var(--text);background:#fff;-webkit-font-smoothing:antialiased;}
a{color:inherit;}
.dk-nav{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);border-bottom:1px solid var(--border);backdrop-filter:blur(12px);}
.dk-nav-in{max-width:1200px;margin:0 auto;padding:0 5%;display:flex;align-items:center;gap:14px;height:68px;}
.dk-nav-in img{height:50px;width:auto;object-fit:contain;}
.dk-nav-mid{flex:1;display:flex;justify-content:center;gap:6px;flex-wrap:wrap;}
.dk-nav-mid a{font-size:14px;font-weight:600;color:var(--muted);padding:7px 12px;border-radius:9px;text-decoration:none;}
.dk-nav-mid a.on{color:var(--navy);font-weight:800;background:#f0f5ff;}
.dk-nav-cta{padding:9px 16px;border-radius:10px;font-size:13px;font-weight:800;background:var(--accent);color:#fff;white-space:nowrap;text-decoration:none;}
@media(max-width:760px){.dk-nav-mid{display:none;}}
footer.dk-foot{background:var(--navy3);color:rgba(255,255,255,.82);padding:34px 0;}
footer.dk-foot .dk-wrap{display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;align-items:center;}
footer.dk-foot a{color:#fff;text-decoration:none;font-size:14px;}
</style>
</head>
<body>

<nav class="dk-nav">
  <div class="dk-nav-in">
    <a href="/"><img src="../assets/img/ovd-logo.png" alt="Online VIP Dershane"></a>
    <div class="dk-nav-mid">
      <a href="/">Ana Sayfa</a>
      <a href="/deneme-kulubu" class="on">Deneme Kulübü</a>
      <a href="/kitap-atolyesi.html">Kitap Atölyesi</a>
      <a href="/iletisim.html">İletişim</a>
    </div>
    <a class="dk-nav-cta" href="#kayit">Kayıt Ol</a>
  </div>
</nav>

<header class="dk-detail-hero">
  <div class="dk-wrap">
    <div class="dk-breadcrumb"><a href="/">Ana Sayfa</a> › <a href="/deneme-kulubu">Deneme Kulübü</a> › ${esc(pkg.short)}</div>
    <span class="dk-badge">${esc(pkg.groupLabel)} · Canlı gözetimli deneme</span>
    <h1>${esc(pkg.title)}</h1>
    <p style="max-width:640px;line-height:1.65;color:rgba(255,255,255,.9);margin:0 0 6px;">${esc(pkg.desc)}</p>
    <p style="font-weight:800;color:var(--gold);margin:0;" id="dkDetailCount"></p>
    <div class="dk-detail-price" id="dkDetailPrice" data-slug="${esc(pkg.slug)}"></div>
    <div class="dk-deadline" style="color:#ffd9a8;" id="dkDetailDeadline"></div>
    <div class="dk-hero-img" style="max-width:560px;">
      <img src="/${pkg.image}" alt="${esc(pkg.short)} Deneme Kulübü" width="560" height="315" loading="eager">
    </div>
    <div class="dk-cta-row" style="margin-top:18px;">
      <a class="dk-btn dk-btn--primary dk-buy" data-urun="${productId(pkg)}" href="/sepet.html?program=${productId(pkg)}">Kredi Kartıyla Hemen Al</a>
      <a class="dk-btn dk-btn--ghost dk-buy" data-urun="${productId(pkg)}" href="/sepet.html?program=${productId(pkg)}">Sepete Ekle</a>
      <a class="dk-btn dk-btn--ghost" href="#kayit">Önce Bilgi Alayım</a>
      <a class="dk-btn dk-btn--ghost" href="#takvim">Takvimi Gör</a>
    </div>
  </div>
</header>

<section class="dk-sec">
  <div class="dk-wrap">
    <h2 class="dk-h2">Bu pakette neler var?</h2>
    <div class="dk-feats">
      <div class="dk-feat"><b>Canlı gözetimli sınavlar</b><span>Belirlenen gün ve saatte çevrim içi oturum; gözetmenler katılımı takip eder.</span></div>
      <div class="dk-feat"><b>Düzenli takvim</b><span>Hangi denemenin ne zaman çözüleceği baştan bellidir.</span></div>
      <div class="dk-feat"><b>Dijital analiz karnesi</b><span>Ders bazlı doğru/yanlış/boş, net, konu bazlı eksik ve gelişim grafiği.</span></div>
      <div class="dk-feat"><b>Gelişim takibi</b><span>Önceki denemelerle karşılaştırma; sezon boyunca gelişim eğrisi.</span></div>
    </div>
  </div>
</section>

<section class="dk-sec dk-sec--alt" id="takvim">
  <div class="dk-wrap">
    <h2 class="dk-h2">${esc(pkg.short)} deneme takvimi</h2>
    <p class="dk-lead">Takvim eğitim sistemimizden canlı okunur; tarih değiştiğinde burası da güncellenir.</p>
    <div id="dkCalendar" data-level="${esc(pkg.level)}"></div>
  </div>
</section>

<section class="dk-sec" id="kayit">
  <div class="dk-wrap">
    <h2 class="dk-h2">${esc(pkg.short)} için kayıt</h2>
    <p class="dk-lead">Formu doldurun, size uygun saatte arayalım.</p>
    <div class="dk-form-grid">
      <form class="dk-form" id="dkForm" data-paket="${esc(pkg.slug)}" novalidate>
        <div class="dk-field">
          <label for="dkVeli">Veli adı soyadı</label>
          <input id="dkVeli" name="veli" type="text" autocomplete="name" required placeholder="Ad Soyad">
        </div>
        <div class="dk-field">
          <label for="dkTel">Telefon numarası</label>
          <input id="dkTel" name="telefon" type="tel" inputmode="tel" autocomplete="tel" required placeholder="05XX XXX XX XX">
        </div>
        <div class="dk-field">
          <label for="dkPaket">İlgilenilen paket</label>
          <select id="dkPaket" name="paket" required></select>
        </div>
        <div class="dk-field">
          <label for="dkAranma">Tercih edilen aranma zamanı</label>
          <select id="dkAranma" name="aranma">
            <option>Fark etmez</option>
            <option>Sabah (09-12)</option>
            <option>Öğleden sonra (12-17)</option>
            <option>Akşam (17-21)</option>
          </select>
        </div>
        <div class="dk-field">
          <label for="dkNot">Eklemek istedikleriniz <span style="font-weight:400;color:#6e6e73">(isteğe bağlı)</span></label>
          <textarea id="dkNot" name="not" placeholder="Varsa sorularınız"></textarea>
        </div>
        <label class="dk-check">
          <input type="checkbox" name="kvkk" required>
          <span>Kişisel verilerimin, başvurumun değerlendirilmesi ve tarafımla iletişime geçilmesi amacıyla işlenmesine onay veriyorum. <a href="/gizlilik.html" target="_blank" rel="noopener">Aydınlatma metni</a></span>
        </label>
        <button type="submit" class="dk-btn dk-btn--primary dk-btn--wide">Başvurumu Gönder</button>
        <div class="dk-msg" id="dkFormMsg" role="status" aria-live="polite"></div>
      </form>
      <aside class="dk-side">
        <h3>Hemen konuşalım</h3>
        <ul>
          <li>${esc(pkg.short)} takvimini anlatalım</li>
          <li>Gönderim planını paylaşalım</li>
          <li>Analiz karnesini örnekle gösterelim</li>
        </ul>
        <a class="dk-wa" href="https://wa.me/908503034014?text=${encodeURIComponent('Merhaba, ' + pkg.title + ' hakkında bilgi almak istiyorum.')}" target="_blank" rel="noopener">WhatsApp'tan yazın</a>
      </aside>
    </div>
    <p style="text-align:center;margin-top:26px;"><a href="/deneme-kulubu" style="color:var(--navy);font-weight:700;">← Bütün sınıfları gör</a></p>
  </div>
</section>

<footer class="dk-foot">
  <div class="dk-wrap">
    <span>© <span id="dkYear"></span> Online VIP Dershane · Olduğunuz yerden, olmak istediğiniz yere.</span>
    <span><a href="/">Ana Sayfa</a> · <a href="/deneme-kulubu">Deneme Kulübü</a> · <a href="/gizlilik.html">Gizlilik</a></span>
  </div>
</footer>

<script>document.getElementById('dkYear').textContent=new Date().getFullYear();</script>
<script src="../assets/deneme-kulubu-data.js?v=2"></script>
<script src="../assets/products.js?v=20261011a"></script>
<script src="../assets/cart.js?v=20261011a"></script>
<script src="../assets/deneme-kulubu.js?v=2"></script>
</body>
</html>
`;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written = [];
  for (const pkg of dk.PACKAGES) {
    const file = path.join(OUT_DIR, `${pkg.slug}.html`);
    fs.writeFileSync(file, page(pkg), 'utf8');
    written.push(`${pkg.slug}.html`);
  }
  console.log(`deneme kulubu sayfalari uretildi (${written.length}): ${written.join(', ')}`);
}

main();
