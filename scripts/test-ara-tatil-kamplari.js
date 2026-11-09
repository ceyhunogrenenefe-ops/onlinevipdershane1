var assert = require('assert');
var fs = require('fs');
var path = require('path');
var products = require('../api/_lib/products.js');

var html = fs.readFileSync(path.join(__dirname, '..', 'programlar', 'ara-tatil-kamplari.html'), 'utf8');

/** Kasım 2026 ara tatil kampları: her biri 5.000 TL, dönemlik fiyatlamaya tabi değil */
['araTatilMatematik', 'araTatilParagraf'].forEach(function (id) {
  var p = products.PRODUCTS[id];
  assert.ok(p, id + ' katalogda yok');
  assert.strictEqual(p.price, 5000, id + ' katalog fiyati');
  var satir = products.resolveLineItems([{ id: id, qty: 1 }], new Date('2026-11-10T12:00:00+03:00'))[0];
  assert.strictEqual(satir.unitAmount, 500000, id + ' odenecek tutar sabit kalmali');
  assert.ok(html.indexOf("ykSepet('" + id + "')") !== -1, id + ' sepet butonu yok');
});

assert.ok(html.indexOf('5.000 &#8378;') !== -1, 'tutar sayfada gorunmuyor');
assert.ok(html.indexOf('17–21 Kasım') !== -1, 'matematik tarihi yok');
assert.ok(html.indexOf('17-18-19-20 Kasım') !== -1, 'paragraf tarihi yok');
assert.ok(html.indexOf('905061877494') !== -1, 'WhatsApp numarasi 0506 olmali');

console.log('ara tatil kamplari: ok');
