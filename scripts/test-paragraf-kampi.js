var assert = require('assert');
var fs = require('fs');
var path = require('path');
var products = require('../api/_lib/products.js');

var html = fs.readFileSync(path.join(__dirname, '..', 'programlar', 'paragraf-kampi.html'), 'utf8');

/** Paragraf Kampı: 8 ders saati, 8 kişilik grup, 4 KTT, 3.500 TL */
var p = products.PRODUCTS.paragrafKampi;
assert.ok(p, 'paragrafKampi katalogda yok');
assert.strictEqual(p.price, 3500, 'paragrafKampi katalog fiyati');

// Kamp, donemlik akademik fiyatlandirmaya tabi degil: yil icinde dusmemeli
[new Date('2026-11-03T12:00:00+03:00'), new Date('2027-03-01T12:00:00+03:00')].forEach(function (t) {
  var satir = products.resolveLineItems([{ id: 'paragrafKampi', qty: 1 }], t)[0];
  assert.strictEqual(satir.unitAmount, 350000, 'odenecek tutar ' + t.toISOString().slice(0, 10) + ' tarihinde sabit kalmali');
});

assert.ok(html.indexOf('3.500 &#8378;') !== -1, 'tutar sayfada gorunmuyor');
assert.ok(html.indexOf("ykSepet('paragrafKampi')") !== -1, 'sepet butonu yok');
assert.ok(html.indexOf('8 Ders Saati') !== -1, 'ders saati sayfada yok');
assert.ok(html.indexOf('4 KTT') !== -1, 'KTT bilgisi sayfada yok');

console.log('paragraf kampi: ok');
