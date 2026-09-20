const assert = require('assert');
const { extractInstallments, parseCampaignHtml } = require('../api/_lib/bank-campaigns');

assert.deepStrictEqual(extractInstallments('2 taksite +4 taksit ve 3 ve üzeri taksite +5 taksit. Maksimum 12 taksit.'), [
  2, 4, 5, 12,
]);
assert.deepStrictEqual(extractInstallments("ilave 6'ya varan taksit"), [6]);

const parsed = parseCampaignHtml(
  '<html><head><title>x</title></head><body><h1>Okul ödemelerinde +taksit</h1><p>2 taksite +4 taksit verilir. 1 Eylül 2026 - 30 Eylül 2026</p></body></html>',
  { title: 'fallback', summary: 'fb', installments: [12], period: 'fb-period' }
);
assert.strictEqual(parsed.title, 'Okul ödemelerinde +taksit');
assert.ok(parsed.installments.includes(4));
assert.strictEqual(parsed.source, 'live');

console.log('test-bank-campaigns.js OK');
