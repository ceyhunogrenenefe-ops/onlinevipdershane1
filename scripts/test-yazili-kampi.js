var assert = require('assert');
var fs = require('fs');
var path = require('path');
var products = require('../api/_lib/products.js');

var SAYFA = path.join(__dirname, '..', 'programlar', 'yazili.html');
var html = fs.readFileSync(SAYFA, 'utf8');

/** Kurumun verdigi kamp ucretleri — sitede gosterilen tutar ile odenen tutar ayni olmali */
var BEKLENEN = [
  { id: 'yazili', fiyat: 3500, etiket: '3.500 &#8378;' },
  { id: 'yaziliOrtaokul', fiyat: 3000, etiket: '3.000 &#8378;' },
  { id: 'yaziliLisePaket', fiyat: 11990, etiket: '11.990 &#8378;' },
  { id: 'yaziliOrtaokulPaket', fiyat: 9990, etiket: '9.990 &#8378;' }
];

var EKIM = new Date('2026-10-20T12:00:00+03:00');
var OCAK = new Date('2027-01-20T12:00:00+03:00');

BEKLENEN.forEach(function (b) {
  var p = products.PRODUCTS[b.id];
  assert.ok(p, b.id + ' katalogda yok');
  assert.strictEqual(p.price, b.fiyat, b.id + ' katalog fiyati');

  // Kamp donemlik akademik fiyatlandirmaya tabi degil: yil icinde dusmemeli
  [EKIM, OCAK].forEach(function (t) {
    var satir = products.resolveLineItems([{ id: b.id, qty: 1 }], t)[0];
    assert.strictEqual(satir.unitAmount, b.fiyat * 100,
      b.id + ' odenecek tutar ' + t.toISOString().slice(0, 10) + ' tarihinde sabit kalmali');
  });

  // Sayfada gosterilen tutar katalogdaki ile ayni olmali
  assert.ok(html.indexOf(b.etiket) !== -1, b.id + ' tutari sayfada gorunmuyor: ' + b.etiket);
  // Sepete ekleme butonu dogru urun kimligini kullanmali
  assert.ok(html.indexOf("ykSepet('" + b.id + "')") !== -1, b.id + ' icin sepet butonu yok');
});

/** Paket, tek tek almaktan ucuz olmali — yoksa "avantaj" yazisi yalan olur */
var liseTek = products.PRODUCTS.yazili.price * 4;
var ortaTek = products.PRODUCTS.yaziliOrtaokul.price * 4;
assert.strictEqual(liseTek, 14000, 'lise 4 donem ayri ayri');
assert.strictEqual(ortaTek, 12000, 'ortaokul 4 donem ayri ayri');
assert.ok(products.PRODUCTS.yaziliLisePaket.price < liseTek, 'lise paketi ucuz olmali');
assert.ok(products.PRODUCTS.yaziliOrtaokulPaket.price < ortaTek, 'ortaokul paketi ucuz olmali');
assert.ok(html.indexOf('Ayr&#305; ayr&#305; 14.000 &#8378;') !== -1, 'lise karsilastirma tutari');
assert.ok(html.indexOf('Ayr&#305; ayr&#305; 12.000 &#8378;') !== -1, 'ortaokul karsilastirma tutari');
assert.strictEqual(liseTek - products.PRODUCTS.yaziliLisePaket.price, 2010, 'lise avantaji');
assert.strictEqual(ortaTek - products.PRODUCTS.yaziliOrtaokulPaket.price, 2010, 'ortaokul avantaji');

/** Gecmis sezonun tarihleri ve 2.500 TL fiyati sayfada kalmamali */
['23-24 May', '30-31 May', '6-7 Haziran', '2.500'].forEach(function (eski) {
  assert.ok(html.indexOf(eski) === -1, 'sayfada eski icerik duruyor: ' + eski);
});

console.log('yazili kampi testleri ok (' + BEKLENEN.length + ' urun)');
