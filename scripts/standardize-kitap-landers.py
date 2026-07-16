#!/usr/bin/env python3
"""Apply standard prog-hero + live photo layout to kitap.html and gece-etutu.html."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LGS = ROOT / "programlar" / "lgs.html"

NAV_BLOCK = re.search(
    r"(<nav style=\"position:sticky.*?</script>\n)",
    LGS.read_text(encoding="utf-8"),
    re.DOTALL,
).group(1)

KITAP_HERO = """<section class="prog-hero">
  <div class="prog-hero-in">
    <div class="prog-hero-copy">
      <div class="prog-tag"><span class="ovd-icon-inline" data-icon="book"></span> Yaz 2026 · Kitap &amp; Gece Etüt</div>
      <h1>Kitap Okuma Atölyesi &amp; Gece Etütü</h1>
      <p>Uzman öğretmen kadrosu ve YZ destekli sistemle öğrencilerimizi okuyan, düşünen ve başaran bireyler olarak yetiştiriyoruz.</p>
      <div class="prog-meta">
        <span><span class="ovd-icon-inline" data-icon="book-open"></span> Kitap Atölyesi</span>
        <span><span class="ovd-icon-inline" data-icon="moon"></span> Gece Etüt</span>
        <span><span class="ovd-icon-inline" data-icon="users"></span> 10 Sınıf Seviyesi</span>
        <span><span class="ovd-icon-inline" data-icon="monitor"></span> Online Canlı</span>
      </div>
    </div>
    <div class="prog-hero-poster">
      <img src="../assets/img/programlar/kitap.png" alt="Kitap Okuma Atölyesi" loading="eager" width="600" height="750">
    </div>
    <div class="price-box">
      <div class="price">12.000₺</div>
      <div class="period">8 Haftalık Program</div>
      <a href="../kayit.html" class="btn-kayit">📋 Hemen Kayıt Ol</a>
      <a href="https://wa.me/908503034014?text=Merhaba%2C+Kitap+Okuma+At%C3%B6lyesi+hakk%C4%B1nda+bilgi+almak+istiyorum." target="_blank" rel="noopener" class="btn-wa">💬 WhatsApp</a>
      <button class="btn-share" onclick="copyURL('https://onlinevipdershane.com/programlar/kitap.html')">🔗 Linki Paylaş</button>
    </div>
  </div>
</section>

<div class="prog-body prog-body--intro">
  <div class="prog-poster-feature prog-poster-feature--live">
    <img src="../assets/img/hero/slide-kitap.jpg" alt="Kitap okuma atölyesi — öğrenciler kitap okuyor" loading="lazy" width="960" height="600">
  </div>
</div>
"""

LIVE_GECE = """    <div class="prog-poster-feature prog-poster-feature--live prog-poster-feature--section">
      <img src="../assets/img/hero/slide-vip-start.jpg" alt="Gece etütü — öğrenci akşam ders çalışıyor" loading="lazy" width="960" height="600">
    </div>
"""

COPY_SCRIPT = """
<div id="copy-toast" style="position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(16px);background:#1a3fad;color:#fff;padding:11px 22px;border-radius:12px;font-size:13px;font-weight:700;z-index:99999;display:none;opacity:0;transition:opacity .25s,transform .25s;white-space:nowrap;">✅ Link kopyalandı!</div>
<script>
function copyURL(url){
  if(navigator.clipboard) navigator.clipboard.writeText(url).then(showToast);
  else{ var e=document.createElement("textarea");e.value=url;document.body.appendChild(e);e.select();document.execCommand("copy");document.body.removeChild(e);showToast(); }
}
function showToast(){
  var t=document.getElementById("copy-toast");
  if(!t) return;
  t.style.display="block";
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.style.opacity="1";t.style.transform="translateX(-50%) translateY(0)";});});
  clearTimeout(t._t);
  t._t=setTimeout(function(){t.style.opacity="0";t.style.transform="translateX(-50%) translateY(16px)";setTimeout(function(){t.style.display="none";},300);},2500);
}
</script>
"""


def patch_head(text: str) -> str:
    if "program-page.css" not in text:
        text = text.replace(
            '<link rel="stylesheet" href="../assets/welcome-modal.css">',
            '<link rel="stylesheet" href="../assets/welcome-modal.css">\n'
            '  <link rel="stylesheet" href="../assets/program-page.css">',
            1,
        )
    if "Bricolage Grotesque" not in text:
        text = text.replace(
            '<link href="https://fonts.googleapis.com/css2?family=Nunito',
            '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Nunito',
            1,
        )
    return text


def patch_kitap(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = patch_head(text)

    old_top = re.search(
        r"<header class=\"header\">.*?<!-- KİTAP OKUMA ATÖLYESİ -->",
        text,
        re.DOTALL,
    )
    if not old_top:
        raise RuntimeError("kitap header block not found")
    text = text.replace(
        old_top.group(0),
        NAV_BLOCK + KITAP_HERO + "\n<!-- KİTAP OKUMA ATÖLYESİ -->",
        1,
    )

    text = re.sub(
        r'\s*<div class="hero-poster-wrap hero-poster-wrap--live".*?</div>\s*',
        "\n",
        text,
        count=1,
        flags=re.DOTALL,
    )

    if "prog-poster-feature--section" not in text:
        text = text.replace(
            '<div class="night-header">',
            LIVE_GECE + '\n    <div class="night-header">',
            1,
        )

    if "function copyURL" not in text:
        text = text.replace(
            '<script src="../assets/icons.js"></script>',
            COPY_SCRIPT + '<script src="../assets/icons.js"></script>',
            1,
        )

    path.write_text(text, encoding="utf-8")


def patch_gece(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = patch_head(text)

    old_top = re.search(
        r"<header class=\"header\">.*?<!-- KİTAP OKUMA ATÖLYESİ -->",
        text,
        re.DOTALL,
    )
    if not old_top:
        raise RuntimeError("gece-etutu header block not found")

    gece_hero = KITAP_HERO.replace("kitap.html", "gece-etutu.html").replace(
        "Kitap+Okuma+At%C3%B6lyesi",
        "Gece+Et%C3%BCt%C3%BC+Program%C4%B1",
    )
    text = text.replace(
        old_top.group(0),
        NAV_BLOCK + gece_hero + "\n<!-- KİTAP OKUMA ATÖLYESİ -->",
        1,
    )

    if "prog-body--intro" not in text:
        # gece-etutu had no intro live photo in hero replacement - KITAP_HERO includes it
        pass

    if "prog-poster-feature--section" not in text:
        text = text.replace(
            '<div class="night-header">',
            LIVE_GECE + '\n    <div class="night-header">',
            1,
        )

    if "function copyURL" not in text:
        text = text.replace(
            '<script src="../assets/icons.js"></script>',
            COPY_SCRIPT + '<script src="../assets/icons.js"></script>',
            1,
        )

    path.write_text(text, encoding="utf-8")


def main() -> None:
    patch_kitap(ROOT / "programlar" / "kitap.html")
    patch_gece(ROOT / "programlar" / "gece-etutu.html")
    print("Patched kitap.html and gece-etutu.html")


if __name__ == "__main__":
    main()
