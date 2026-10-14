/**
 * Seçilen öğretmenin özel ders ücretini panelden okur.
 *
 * Fiyat İSTEMCİDEN ALINMAZ: sepetteki ürün yalnız öğretmenin slug'ını
 * taşır, tutar her zaman sunucuda bu ücretle hesaplanır. Böylece
 * tarayıcıda fiyat değiştirip ucuza ders alınamaz.
 *
 * Panel ulaşılamazsa null döner ve katalog fiyatı geçerli olur —
 * ödeme akışı fiyat çekilemedi diye durmaz.
 */

const ONBELLEK = new Map();
const ONBELLEK_MS = 60 * 1000;

async function ogretmenUcretiGetir(slug) {
  const s = String(slug || '').trim();
  if (!s) return null;

  const simdi = Date.now();
  const kayit = ONBELLEK.get(s);
  if (kayit && simdi - kayit.t < ONBELLEK_MS) return kayit.v;

  const base = String(process.env.KOCLUK_PANEL_URL || '').replace(/\/$/, '');
  if (!base) return null;

  try {
    const r = await fetch(`${base}/api/public-teachers?slug=${encodeURIComponent(s)}`, {
      headers: { accept: 'application/json' },
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => ({}));
    const t = j && j.teacher ? j.teacher : null;
    const ucret = t && t.private_lesson_fee_tl != null ? Number(t.private_lesson_fee_tl) : null;
    const deger = Number.isFinite(ucret) && ucret > 0 ? ucret : null;
    ONBELLEK.set(s, { t: simdi, v: deger });
    return deger;
  } catch {
    return null;
  }
}

/** Sepetteki tüm öğretmen slug'ları için ücret haritası */
async function sepetOgretmenUcretleri(items) {
  const sluglar = [
    ...new Set(
      (Array.isArray(items) ? items : [])
        .map((i) => String((i && i.teacher) || '').trim())
        .filter(Boolean)
    ),
  ].slice(0, 10);
  const harita = {};
  for (const s of sluglar) harita[s] = await ogretmenUcretiGetir(s);
  return harita;
}

module.exports = { ogretmenUcretiGetir, sepetOgretmenUcretleri };
