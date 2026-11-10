var assert = require('assert');
var fs = require('fs');
var path = require('path');
var products = require('../api/_lib/products.js');

var html = fs.readFileSync(path.join(__dirname, '..', 'programlar', 'ara-tatil-kamplari.html'), 'utf8');

/** Kasım 2026 ara tatil kampları: liste 10.000 TL, satış %25 indirimle 7.500 TL */
['araTatilMatematik', 'araTatilParagraf'].forEach(function (id) {
  var p = products.PRODUCTS[id];
  assert.ok(p, id + ' katalogda yok');
  assert.strictEqual(p.price, 7500, id + ' satis fiyati');
  assert.strictEqual(p.listPrice, 10000, id + ' liste fiyati');
  var satir = products.resolveLineItems([{ id: id, qty: 1 }], new Date('2026-11-10T12:00:00+03:00'))[0];
  assert.strictEqual(satir.unitAmount, 750000, id + ' odenecek tutar 7.500 TL olmali');
  assert.ok(html.indexOf("ykSepet('" + id + "')") !== -1, id + ' sepet butonu yok');
});

assert.ok(html.indexOf('7.500 &#8378;') !== -1, 'satis tutari sayfada gorunmuyor');
assert.ok(html.indexOf('LGSKASIM') !== -1, 'ilk 10 kisi kupon kodu sayfada yok');
assert.ok(html.indexOf('5.000') !== -1, 'kuponlu fiyat sayfada yok');
assert.ok(html.indexOf('10.000 &#8378;') !== -1, 'ustu cizili liste fiyati yok');
assert.ok(html.indexOf('17–21 Kasım') !== -1, 'matematik tarihi yok');
assert.ok(html.indexOf('17-18-19-20 Kasım') !== -1, 'paragraf tarihi yok');
assert.ok(html.indexOf('905061877494') !== -1, 'WhatsApp numarasi 0506 olmali');

console.log('ara tatil kamplari: ok');
