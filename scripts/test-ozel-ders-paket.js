/* Ogretmen bazli ozel ders paket fiyatlandirmasi */
const assert = require('assert');
const { ozelDersPaketFiyati, ozelDersPaketiMi, PAKETLER } = require('../api/_lib/ozel-ders-paket-fiyat.js');

// 1) Ucreti 1100 olan ogretmende fiyatlar BUGUNKUYLE AYNI kalmali
const KATALOG = { 'ders-1': 1100, 'ders-3': 3000, 'ders-5': 4900, 'ders-10': 9500 };
for (const [id, beklenen] of Object.entries(KATALOG)) {
  const r = ozelDersPaketFiyati(id, 1100);
  assert.strictEqual(r.price, beklenen, id + ' 1100 TL ucrette katalog fiyatindan sapti: ' + r.price);
}

// 2) 1500 TL ogretmende indirim ORANI korunarak olceklenir
const bin5 = ozelDersPaketFiyati('ders-1', 1500);
assert.strictEqual(bin5.price, 1500, 'tek ders ogretmenin ucretine esit olmali');
const uc = ozelDersPaketFiyati('ders-3', 1500);
assert.strictEqual(uc.unitPrice, Math.round(1500 * (1000 / 1100)), '3 ders birim fiyati');
assert.strictEqual(uc.price, uc.unitPrice * 3);
assert.ok(uc.unitPrice < 1500, 'toplu pakette ders basi daha ucuz olmali');

// 3) Indirim yuzdesi ucretten bagimsiz ayni kalir
function indirimYuzdesi(id, ucret) {
  const r = ozelDersPaketFiyati(id, ucret);
  const tek = ozelDersPaketFiyati('ders-1', ucret);
  return Math.round((1 - r.unitPrice / tek.unitPrice) * 100);
}
for (const id of ['ders-3', 'ders-5', 'ders-10']) {
  assert.strictEqual(
    indirimYuzdesi(id, 1100),
    indirimYuzdesi(id, 1500),
    id + ' indirim yuzdesi ucrete gore degisti'
  );
}

// 4) Ucret yoksa / gecersizse katalog fiyati gecerli, BEDAVA DERS OLMAZ
for (const bos of [null, undefined, 0, -5, 'abc', NaN]) {
  const r = ozelDersPaketFiyati('ders-5', bos);
  assert.strictEqual(r.price, 4900, 'ucret ' + String(bos) + ' icin katalog fiyatina dusmeli');
  assert.strictEqual(r.scaled, false);
}

// 5) Ders adetleri dogru
assert.strictEqual(ozelDersPaketFiyati('ders-10', 1500).lessons, 10);
assert.strictEqual(ozelDersPaketFiyati('ders-1', 1500).lessons, 1);

// 6) Bilinmeyen paket null doner
assert.strictEqual(ozelDersPaketFiyati('yazili', 1500), null);
assert.strictEqual(ozelDersPaketiMi('ders-3'), true);
assert.strictEqual(ozelDersPaketiMi('yazili'), false);

// 7) Toplam = birim x adet (kurus kaymasi olmasin)
for (const id of Object.keys(PAKETLER)) {
  const r = ozelDersPaketFiyati(id, 1337);
  assert.strictEqual(r.price, r.unitPrice * r.lessons, id + ' toplam carpimdan sapti');
  assert.ok(Number.isInteger(r.price), id + ' tutar tam sayi olmali');
}

console.log('ozel ders paket fiyat testleri ok (4 paket)');

/* resolveLineItems entegrasyonu: tutar sunucuda ogretmene gore hesaplanir */
const { resolveLineItems } = require('../api/_lib/products.js');

// Ogretmensiz sepet: bugunku davranis aynen korunur
const normal = resolveLineItems([{ id: 'ders-3', qty: 1 }]);
assert.strictEqual(normal[0].unitAmount, 300000, 'ogretmensiz 3 ders 3000 TL olmali');
assert.strictEqual(normal[0].product.teacher, null);

// 1500 TL ogretmen secilince tutar olceklenir
const ctx = { ogretmenUcretleri: { 'dogan-akturk': 1500 } };
const ogr = resolveLineItems([{ id: 'ders-3', qty: 1, teacher: 'dogan-akturk' }], undefined, ctx);
const beklenen = Math.round(1500 * (1000 / 1100)) * 3;
assert.strictEqual(ogr[0].unitAmount, beklenen * 100, '3 ders ogretmen ucretine gore hesaplanmali');
assert.strictEqual(ogr[0].product.teacher, 'dogan-akturk');

// Ucret cekilemezse katalog fiyatina duser, bedava olmaz
const ucretsiz = resolveLineItems(
  [{ id: 'ders-5', qty: 1, teacher: 'bilinmeyen' }],
  undefined,
  { ogretmenUcretleri: { bilinmeyen: null } }
);
assert.strictEqual(ucretsiz[0].unitAmount, 490000, 'ucret yoksa katalog fiyati gecerli olmali');

// Ogretmen slug'i ozel ders DISI urunde fiyati etkilemez
const kamp = resolveLineItems([{ id: 'yazili', qty: 1, teacher: 'dogan-akturk' }], undefined, ctx);
assert.strictEqual(kamp[0].unitAmount, 350000, 'kamp fiyati ogretmenden etkilenmemeli');
assert.strictEqual(kamp[0].product.teacher, null);

console.log('resolveLineItems ogretmen fiyatlandirmasi ok');
