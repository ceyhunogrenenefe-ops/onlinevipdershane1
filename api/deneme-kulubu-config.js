/**
 * Deneme Kulübü — paket, fiyat ve kampanya durumu.
 *
 * Kampanyanın geçerli olup olmadığına BURASI karar verir. Tarayıcı saati
 * değiştirilebildiği için indirim istemcide hesaplanmaz; sayfa fiyatları
 * bu cevaptan alır. Kampanya bitince indirimli fiyat kendiliğinden düşer ve
 * normal fiyat gösterilir.
 *
 * Deneme takvimi burada DEĞİL: takvim koçluk panelinde yönetilir, sayfa
 * /api/public-exam-calendar üzerinden canlı okur. İki yerde takvim tutulmaz.
 */
const dk = require('../assets/deneme-kulubu-data.js');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const now = Date.now();
  const campaign = dk.CAMPAIGN;
  const active = dk.campaignActiveAt(now, campaign);

  const packages = dk.PACKAGES.map((p) => {
    const price = dk.priceFor(p, now, campaign);
    return {
      slug: p.slug,
      level: p.level,
      group: p.group,
      groupLabel: p.groupLabel,
      title: p.title,
      short: p.short,
      desc: p.desc,
      featured: Boolean(p.featured),
      denemeSayisi: p.denemeSayisi,
      normalPrice: price.normal,
      price: price.current,
      discounted: price.discounted,
      discountPercent: price.percent,
      url: `/deneme-kulubu/${p.slug}`
    };
  });

  /**
   * Kampanya bilgisi yalnız geçerliyken gönderilir; sayfanın "biten
   * kampanyayı" yanlışlıkla çizmesi mümkün olmasın.
   */
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.status(200).json({
    ok: true,
    serverTime: new Date(now).toISOString(),
    campaign: active
      ? {
          id: campaign.id,
          label: campaign.label,
          shortLabel: campaign.shortLabel,
          discountPercent: campaign.discountPercent,
          endsAt: campaign.endsAt,
          deadlineText: campaign.deadlineText
        }
      : null,
    groups: dk.GROUPS,
    packages
  });
};
