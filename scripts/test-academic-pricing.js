var assert = require('assert');
var ap = require('../assets/academic-pricing.js');
var products = require('../api/_lib/products.js');

/** 119.000 ₺ örneği — istenen tablonun tamamı. */
var BASE = 119000;
var TABLE = [
  ['2026-09-01', 10, 119000],
  ['2026-09-30', 10, 119000],
  ['2026-10-01', 9, 107100],
  ['2026-10-31', 9, 107100],
  ['2026-11-01', 8, 95200],
  ['2026-12-01', 7, 83300],
  ['2027-01-01', 6, 71400],
  ['2027-02-01', 5, 59500],
  ['2027-03-01', 4, 47600],
  ['2027-04-01', 3, 35700],
  ['2027-05-01', 2, 23800],
  ['2027-06-01', 1, 11900],
  ['2027-06-30', 1, 11900]
];

TABLE.forEach(function (row) {
  var p = ap.priceFor(BASE, row[0]);
  assert.strictEqual(p.remaining, row[1], row[0] + ' kalan ay');
  assert.strictEqual(p.total, row[2], row[0] + ' toplam');
  assert.strictEqual(p.monthly, 11900, row[0] + ' aylık bedel sabit');
  assert.strictEqual(p.offSeason, false, row[0] + ' dönem içi');
});

// Yıl geçişi: Ocak aynı dönemin 6. ayı
assert.strictEqual(ap.termMonthIndex(9), 1);
assert.strictEqual(ap.termMonthIndex(12), 4);
assert.strictEqual(ap.termMonthIndex(1), 5);
assert.strictEqual(ap.termMonthIndex(6), 10);

// Temmuz–Ağustos dönem dışı: 0 ₺ değil, tam dönem fiyatı
['2027-07-01', '2027-07-15', '2027-08-31'].forEach(function (d) {
  var p = ap.priceFor(BASE, d);
  assert.strictEqual(p.offSeason, true, d + ' dönem dışı');
  assert.strictEqual(p.total, BASE, d + ' tam fiyat korunur');
  assert.strictEqual(p.discounted, false, d + ' indirim yok');
});
assert.strictEqual(ap.remainingMonths('2027-07-01'), null);
assert.strictEqual(ap.isOffSeason(7), true);
assert.strictEqual(ap.isOffSeason(8), true);
assert.strictEqual(ap.isOffSeason(9), false);

// Yeni dönem başı: 1 Eylül 2027 yine tam fiyat
var next = ap.priceFor(BASE, '2027-09-01');
assert.strictEqual(next.remaining, 10);
assert.strictEqual(next.total, BASE);

// Geçersiz girdilerde çökmeden null
assert.strictEqual(ap.priceFor(0, '2026-10-01'), null);
assert.strictEqual(ap.priceFor(-5, '2026-10-01'), null);
assert.strictEqual(ap.priceFor('abc', '2026-10-01'), null);
// Tarih okunamazsa bugüne düşer, yine de geçerli sonuç üretir
assert.ok(ap.priceFor(BASE, 'gecersiz-tarih').total > 0);

/** Katalogdaki bütün dönemlik paketler aynı formülle çalışmalı. */
var academic = Object.keys(products.PRODUCTS).filter(function (id) {
  return products.PRODUCTS[id].dynamicAcademicPricing;
});
assert.ok(academic.length >= 5, 'dönemlik paket bulunamadı');

academic.forEach(function (id) {
  var base = products.PRODUCTS[id].price;
  var eylul = ap.priceFor(base, '2026-09-15');
  var ocak = ap.priceFor(base, '2027-01-15');
  var haziran = ap.priceFor(base, '2027-06-15');
  assert.strictEqual(eylul.total, base, id + ' eylülde tam fiyat');
  assert.strictEqual(ocak.total, eylul.monthly * 6, id + ' ocakta 6 ay');
  assert.strictEqual(haziran.total, eylul.monthly, id + ' haziranda 1 ay');
  assert.ok(ocak.total < base, id + ' ocakta düşmeli');
});

/** Dönemlik olmayan ürünlerin fiyatına dokunulmamalı. */
var nonAcademic = ['kitap', 'yazili', 'ders-1', 'ders-10', 'kampLgs', 'kocluk', 'start'];
nonAcademic.forEach(function (id) {
  var p = products.PRODUCTS[id];
  assert.ok(p, id + ' katalogda yok');
  assert.ok(!p.dynamicAcademicPricing, id + ' dönemlik işaretlenmemeli');
  assert.strictEqual(ap.productPrice(p, '2027-03-01'), p.price, id + ' fiyatı sabit kalmalı');
});

/** Ödemeye giden tutar da güncel fiyatı kullanmalı. */
var ocakTarih = new Date('2027-01-10T12:00:00Z');
var lines = products.resolveLineItems([{ id: 'yks', qty: 1 }], ocakTarih);
assert.strictEqual(lines[0].unitAmount, 71400 * 100, 'ödeme tutarı güncel fiyat olmalı');

var kitapLines = products.resolveLineItems([{ id: 'kitap', qty: 2 }], ocakTarih);
assert.strictEqual(kitapLines[0].unitAmount, products.PRODUCTS.kitap.price * 100, 'kitap fiyatı değişmemeli');

// Temmuzda ödeme tutarı tam dönem fiyatı
var temmuzLines = products.resolveLineItems([{ id: 'yks', qty: 1 }], new Date('2027-07-10T12:00:00Z'));
assert.strictEqual(temmuzLines[0].unitAmount, BASE * 100, 'temmuzda tam fiyat');

console.log('academic pricing tests ok (' + academic.length + ' dönemlik paket)');
