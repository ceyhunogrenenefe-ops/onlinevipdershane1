var assert = require('assert');
var dk = require('../assets/deneme-kulubu-data.js');

var EKIM = Date.parse('2026-10-15T12:00:00+03:00');
var KASIM = Date.parse('2026-11-01T00:00:01+03:00');
var EYLUL = Date.parse('2026-09-30T23:59:59+03:00');

/** Kurumun verdiği fiyatlar — normal / %50 kampanyalı */
var BEKLENEN = {
  '3-sinif': [6000, 3000],
  '4-sinif': [6000, 3000],
  '5-sinif': [10000, 5000],
  '6-sinif': [10000, 5000],
  '7-sinif': [10000, 5000],
  lgs: [16500, 8250],
  '9-sinif': [11000, 5500],
  '10-sinif': [11000, 5500],
  '11-sinif': [11000, 5500],
  yks: [16500, 8250]
};

assert.strictEqual(dk.PACKAGES.length, 10, '10 paket olmali');

Object.keys(BEKLENEN).forEach(function (slug) {
  var pkg = dk.bySlug(slug);
  assert.ok(pkg, slug + ' paketi yok');
  var normal = BEKLENEN[slug][0];
  var indirimli = BEKLENEN[slug][1];

  var k = dk.priceFor(pkg, EKIM);
  assert.strictEqual(k.normal, normal, slug + ' normal fiyat');
  assert.strictEqual(k.current, indirimli, slug + ' kampanyali fiyat');
  assert.strictEqual(k.discounted, true, slug + ' ekimde indirimli olmali');
  assert.strictEqual(k.percent, 50, slug + ' indirim orani');
});

// Kampanya bitince indirim kalkar, normal fiyat gosterilir
Object.keys(BEKLENEN).forEach(function (slug) {
  var pkg = dk.bySlug(slug);
  [KASIM, EYLUL].forEach(function (t) {
    var p = dk.priceFor(pkg, t);
    assert.strictEqual(p.discounted, false, slug + ' kampanya disi indirimsiz');
    assert.strictEqual(p.current, p.normal, slug + ' kampanya disi normal fiyat');
    assert.strictEqual(p.current, BEKLENEN[slug][0], slug + ' kampanya disi tutar');
  });
});

// Son saniye dahil, bir saniye sonrasi haric
assert.strictEqual(dk.campaignActiveAt(Date.parse('2026-10-31T23:59:59+03:00')), true, 'son saniye dahil');
assert.strictEqual(dk.campaignActiveAt(Date.parse('2026-11-01T00:00:00+03:00')), false, 'bitisten sonra');
assert.strictEqual(dk.campaignActiveAt(Date.parse('2026-10-01T00:00:00+03:00')), true, 'baslangic dahil');
assert.strictEqual(dk.campaignActiveAt(Date.parse('2026-09-30T23:59:59+03:00')), false, 'baslangictan once');

// Gecersiz zaman indirim acmaz
[NaN, null, undefined, 'abc'].forEach(function (t) {
  assert.strictEqual(dk.campaignActiveAt(t), false, 'gecersiz zaman: ' + String(t));
  var p = dk.priceFor(dk.bySlug('lgs'), t);
  assert.strictEqual(p.current, 16500, 'gecersiz zamanda normal fiyat');
});

/** Takvim kademeleri panelle birebir ayni olmali, yoksa takvim eslesmez */
var PANEL_LEVELS = ['3', '4', '5', '6', '7', 'lgs', '9', '10', '11', 'yks'];
dk.PACKAGES.forEach(function (p) {
  assert.ok(PANEL_LEVELS.indexOf(p.level) !== -1, p.slug + ' kademesi panelde yok: ' + p.level);
  assert.ok(p.slug && p.title && p.short && p.desc, p.slug + ' eksik alan');
  assert.ok(p.normalPrice > 0, p.slug + ' fiyat');
  assert.ok(dk.GROUPS.some(function (g) { return g.id === p.group; }), p.slug + ' grubu tanimsiz');
});

// Her kademe tek pakete baglanir
var levels = dk.PACKAGES.map(function (p) { return p.level; });
assert.strictEqual(new Set(levels).size, levels.length, 'kademe tekrar etmemeli');
var slugs = dk.PACKAGES.map(function (p) { return p.slug; });
assert.strictEqual(new Set(slugs).size, slugs.length, 'slug tekrar etmemeli');

// byLevel / bySlug
assert.strictEqual(dk.byLevel('LGS').slug, 'lgs', 'byLevel buyuk harf');
assert.strictEqual(dk.byLevel('11').denemeSayisi, 27, '11. sinif 27 deneme');
assert.strictEqual(dk.bySlug('yok'), null);
assert.strictEqual(dk.byLevel('8'), null, '8 degil lgs kullanilir');

assert.strictEqual(dk.formatTl(16500), '16.500 ₺');


/** Odeme: sepete giden tutar sitede gosterilen tutarla ayni olmali */
var prod = require('../api/_lib/products.js');
var EKIM_D = new Date('2026-10-15T12:00:00+03:00');
var KASIM_D = new Date('2026-11-05T12:00:00+03:00');

dk.PACKAGES.forEach(function (pkg) {
  var id = prod.denemeProductId(pkg);
  assert.ok(prod.PRODUCTS[id], pkg.slug + ' katalogda yok: ' + id);
  assert.strictEqual(prod.PRODUCTS[id].price, pkg.normalPrice, id + ' katalog normal fiyat');

  var ekim = prod.resolveLineItems([{ id: id, qty: 1 }], EKIM_D)[0];
  assert.strictEqual(ekim.unitAmount, dk.priceFor(pkg, EKIM_D.getTime()).current * 100,
    id + ' ekimde odenecek tutar kampanyali olmali');

  var kasim = prod.resolveLineItems([{ id: id, qty: 1 }], KASIM_D)[0];
  assert.strictEqual(kasim.unitAmount, pkg.normalPrice * 100,
    id + ' kampanya bitince normal fiyat');
});

// Deneme disi urunler etkilenmemeli
assert.strictEqual(prod.resolveLineItems([{ id: 'kitap', qty: 1 }], EKIM_D)[0].unitAmount,
  prod.PRODUCTS.kitap.price * 100, 'kitap fiyati degismemeli');

console.log('deneme kulubu odeme testleri ok');

console.log('deneme kulubu tests ok (' + dk.PACKAGES.length + ' paket)');
