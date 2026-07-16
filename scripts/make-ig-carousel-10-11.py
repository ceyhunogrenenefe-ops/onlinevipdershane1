from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "assets" / "img" / "instagram" / "10-11-maarif-tyt"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (26, 63, 173)
NAVY_DEEP = (13, 31, 92)
RED = (232, 35, 42)
WHITE = (255, 255, 255)
LIGHT = (244, 247, 255)
MUTED = (100, 116, 139)
TEXT = (26, 31, 54)

font_r = lambda s: ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", s)
font_b = lambda s: ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", s)

W = H = 1080
TOTAL = 7


def wrap(draw, text, font, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def footer(draw, page):
    brand = font_b(28)
    draw.text((72, 1000), "online vip dershane", font=brand, fill=NAVY)
    draw.text((72, 1038), "onlinevipdershane.com/blog", font=font_r(22), fill=MUTED)
    draw.text((780, 1020), f"{page}/{TOTAL}", font=font_b(26), fill=RED)


def base_slide(bg=WHITE):
    im = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 16], fill=RED)
    d.rectangle([0, 16, W, 22], fill=NAVY)
    return im, d


def save(im, name):
    path = OUT / name
    im.save(path, "PNG", optimize=True)
    print("saved", path.name)


# 1 COVER
im = Image.new("RGB", (W, H), NAVY_DEEP)
d = ImageDraw.Draw(im)
d.rectangle([0, 0, W, 18], fill=RED)
d.text((72, 120), "10. SINIF → 11. SINIF", font=font_b(36), fill=(255, 180, 185))
y = 200
for ln in wrap(d, "Maarif Model TYT kısmı bitti.", font_b(58), 920):
    d.text((72, y), ln, font=font_b(58), fill=WHITE)
    y += 72
y += 10
for ln in wrap(d, "Nasıl değerlendirmelisin?", font_b(52), 920):
    d.text((72, y), ln, font=font_b(52), fill=(245, 197, 66))
    y += 66
d.rounded_rectangle([72, 520, 1008, 700], radius=24, fill=NAVY)
ty = 560
for ln in wrap(d, "Deneme + konu sepeti + hata tipi = sağlıklı geçiş", font_b(34), 860):
    d.text((100, ty), ln, font=font_b(34), fill=WHITE)
    ty += 48
d.text((72, 780), "Online VIP Dershane", font=font_b(40), fill=WHITE)
d.text((72, 840), "Blog rehberi · Karusel 1/7", font=font_r(28), fill=(180, 195, 230))
d.text((72, 1000), "Kaydır →", font=font_b(36), fill=RED)
save(im, "01-kapak.png")

# 2 NEDEN
im, d = base_slide()
d.text((72, 80), "01 · NEDEN ÖNEMLİ?", font=font_b(28), fill=RED)
y = 140
for ln in wrap(d, "TYT bitişi bitiş çizgisi değil", font_b(48), 920):
    d.text((72, y), ln, font=font_b(48), fill=TEXT)
    y += 58
items = [
    "Konu listesini bitirmek = başarı garantisi değil",
    "11. sınıfta AYT temposu yükselir",
    "TYT açıkları AYT yılında daha pahalıya mal olur",
    "Yaz = toparlama dönemi, boş geçirme dönemi değil",
]
y = 320
for it in items:
    d.rounded_rectangle([72, y, 1008, y + 110], radius=18, fill=LIGHT)
    d.ellipse([96, y + 38, 128, y + 70], fill=NAVY)
    for i, ln in enumerate(wrap(d, it, font_b(30), 820)):
        d.text((150, y + 28 + i * 36), ln, font=font_b(30), fill=TEXT)
    y += 130
footer(d, 2)
save(im, "02-neden.png")

# 3 DENEME
im, d = base_slide()
d.text((72, 80), "02 · VERİYE BAK", font=font_b(28), fill=RED)
y = 140
for ln in wrap(d, "Son 4–6 TYT denemeni çıkar", font_b(46), 920):
    d.text((72, y), ln, font=font_b(46), fill=TEXT)
    y += 56
cards = [
    ("Ortalama net", "Türkçe / Sosyal / Mat / Fen ayrı yaz"),
    ("İstikrar", "En yüksek–en düşük farkına bak"),
    ("Süre mi bilgi mi?", "Nerede takıldığını ayır"),
    ("Tek iyi deneme yok", "Ortalama = gerçek seviye"),
]
y = 300
for i, (h, s) in enumerate(cards):
    x0 = 72 if i % 2 == 0 else 556
    if i % 2 == 0 and i > 0:
        y += 220
    d.rounded_rectangle([x0, y, x0 + 452, y + 200], radius=20, fill=NAVY if i % 2 == 0 else RED)
    d.text((x0 + 28, y + 36), h, font=font_b(32), fill=WHITE)
    for j, ln in enumerate(wrap(d, s, font_r(26), 390)):
        d.text((x0 + 28, y + 90 + j * 34), ln, font=font_r(26), fill=(230, 235, 255))
footer(d, 3)
save(im, "03-deneme.png")

# 4 SEPET
im, d = base_slide()
d.text((72, 80), "03 · KONU SEPETİ", font=font_b(28), fill=RED)
d.text((72, 140), "Her konuyu 3'e ayır", font=font_b(48), fill=TEXT)
seps = [
    ((16, 185, 129), "YEŞİL", "Güçlü — güvenle çözüyorsun"),
    ((245, 158, 11), "SARI", "Orta — bazen hata / süre kaçırıyorsun"),
    (RED, "KIRMIZI", "Zayıf — anlatınca anlıyor, soruda kayboluyor"),
]
y = 240
for color, name, desc in seps:
    d.rounded_rectangle([72, y, 1008, y + 160], radius=20, fill=LIGHT)
    d.rounded_rectangle([72, y, 96, y + 160], radius=12, fill=color)
    d.text((130, y + 36), name, font=font_b(40), fill=color)
    for j, ln in enumerate(wrap(d, desc, font_r(28), 820)):
        d.text((130, y + 90 + j * 34), ln, font=font_r(28), fill=TEXT)
    y += 190
d.text((72, 830), "11'e geçmeden kırmızı listeyi incelt.", font=font_b(30), fill=NAVY)
footer(d, 4)
save(im, "04-sepet.png")

# 5 HATA
im, d = base_slide()
d.text((72, 80), "04 · HATA TİPİ", font=font_b(28), fill=RED)
d.text((72, 140), "Yanlışı sınıflandır", font=font_b(48), fill=TEXT)
rows = [
    ("Bilgi eksikliği", "Konuya dön + kısa set"),
    ("Dikkatsizlik", "Tempo yavaşlat, rutin kur"),
    ("Süre yönetimi", "Sıralama / strateji düzelt"),
    ("Yorum & grafik", "Maarif tarzı ekstra set"),
]
y = 250
for a, b in rows:
    d.rounded_rectangle([72, y, 1008, y + 120], radius=18, fill=LIGHT)
    d.text((100, y + 38), a, font=font_b(32), fill=NAVY)
    d.text((520, y + 40), b, font=font_r(28), fill=TEXT)
    y += 140
footer(d, 5)
save(im, "05-hata.png")

# 6 PLAN
im, d = base_slide()
d.text((72, 80), "05 · GEÇİŞ PLANI", font=font_b(28), fill=RED)
d.text((72, 140), "4 haftalık yol haritası", font=font_b(46), fill=TEXT)
plan = [
    ("1", "Deneme analizi + kırmızı liste"),
    ("2-3", "Kırmızı konulara yoğun tekrar"),
    ("4", "2 tam TYT + AYT'ye yumuşak giriş"),
    ("+", "Okulda: haftalık TYT bakım denemesi"),
]
y = 250
for n, t in plan:
    d.ellipse([72, y + 10, 160, y + 98], fill=RED if n != "+" else NAVY)
    tw = d.textlength(n, font=font_b(28))
    d.text((116 - tw / 2, y + 36), n, font=font_b(28), fill=WHITE)
    for j, ln in enumerate(wrap(d, t, font_b(32), 780)):
        d.text((190, y + 28 + j * 40), ln, font=font_b(32), fill=TEXT)
    y += 140
footer(d, 6)
save(im, "06-plan.png")

# 7 CTA
im = Image.new("RGB", (W, H), NAVY_DEEP)
d = ImageDraw.Draw(im)
d.rectangle([0, 0, W, 18], fill=RED)
d.text((72, 90), "CHECKLIST", font=font_b(28), fill=(255, 180, 185))
d.text((72, 140), "11'e geçmeden sor", font=font_b(48), fill=WHITE)
checks = [
    "Son 4–6 deneme ortalaması çıktı mı?",
    "Yeşil / sarı / kırmızı sepet yapıldı mı?",
    "Kırmızıda ilk 5 öncelik seçildi mi?",
    "Hata defteri tutuluyor mu?",
    "Haftalık TYT bakım saati planlandı mı?",
]
y = 260
for c in checks:
    d.rounded_rectangle([72, y, 1008, y + 92], radius=16, fill=NAVY)
    d.text((100, y + 28), "✓  " + c, font=font_b(28), fill=WHITE)
    y += 110
d.rounded_rectangle([72, 860, 1008, 980], radius=20, fill=RED)
d.text((100, 890), "Ücretsiz danışma: onlinevipdershane.com", font=font_b(30), fill=WHITE)
d.text((100, 935), "Blog: /blog · YKS Programı", font=font_r(24), fill=(255, 220, 220))
save(im, "07-cta.png")

print("DONE", len(list(OUT.glob("*.png"))))
