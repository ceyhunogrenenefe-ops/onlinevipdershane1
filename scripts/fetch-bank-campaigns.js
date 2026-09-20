/**
 * Banka eğitim kampanya sayfalarını çekip fallback üzerine yazar.
 * Kullanım: node scripts/fetch-bank-campaigns.js
 * Banka HTML'i değişirse parse başarısız olur; mevcut fallback korunur.
 */
const fs = require('fs');
const {
  loadConfig,
  loadLive,
  LIVE_PATH,
  scrapeBank,
} = require('../api/_lib/bank-campaigns');

(async () => {
  const config = loadConfig();
  const prev = loadLive();
  const banks = { ...(prev.banks || {}) };
  const report = [];

  for (const bank of config.banks || []) {
    try {
      const live = await scrapeBank(bank, 12000);
      banks[bank.id] = { ...live, fetchedAt: new Date().toISOString() };
      report.push({ id: bank.id, ok: true, title: live.title, installments: live.installments });
    } catch (err) {
      report.push({ id: bank.id, ok: false, error: String(err.message || err) });
    }
  }

  const out = {
    updatedAt: new Date().toISOString(),
    banks,
  };
  fs.writeFileSync(LIVE_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ wrote: LIVE_PATH, report }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
