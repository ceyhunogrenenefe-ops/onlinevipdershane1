var assert = require('assert');
var products = require('../api/_lib/products.js');
var kupon = require('../api/_lib/kupon-lgskasim.js');

function memoryStore() {
  var row = null;
  return {
    load: async function () {
      return row ? JSON.parse(JSON.stringify(row)) : null;
    },
    create: async function (payload) {
      if (!row) row = { id: 1, rev: payload.rev, holds: payload.holds.slice() };
    },
    save: async function (id, rev, next) {
      if (!row || row.rev !== rev) return false;
      row = { id: id, rev: next.rev, holds: next.holds };
      return true;
    },
  };
}

function phone(n) {
  return '053200000' + String(n).padStart(2, '0');
}

(async function () {
  var clock = 1_700_000_000_000;
  var svc = kupon.createCouponService(memoryStore(), function () {
    return clock;
  });
  var camp = [{ id: 'araTatilMatematik', qty: 1 }];

  var bad = await svc.quote({ code: 'YANLIS', items: camp });
  assert.strictEqual(bad.ok, false);

  var wrongCart = await svc.quote({ code: 'lgskasim', items: [{ id: 'kamplar', qty: 1 }] });
  assert.strictEqual(wrongCart.ok, false);

  var q = await svc.quote({ code: 'lgs kasım', items: camp });
  assert.strictEqual(q.ok, true);
  assert.strictEqual(q.remaining, 10);
  assert.strictEqual(q.prices.araTatilMatematik, 5000);
  assert.strictEqual(q.prices.araTatilParagraf, 5000);

  for (var i = 1; i <= 10; i++) {
    var claimed = await svc.claim({
      code: 'LGSKASIM',
      items: camp,
      phone: phone(i),
      email: 'veli' + i + '@ornek.com',
      merchantOid: 'oid-' + i,
    });
    assert.strictEqual(claimed.ok, true, 'kisi ' + i);
  }

  var eleventh = await svc.claim({
    code: 'LGSKASIM',
    items: camp,
    phone: phone(11),
    email: 'veli11@ornek.com',
    merchantOid: 'oid-11',
  });
  assert.strictEqual(eleventh.ok, false);
  assert.ok(/kontenjan/.test(eleventh.error));

  var again = await svc.claim({
    code: 'LGSKASIM',
    items: [{ id: 'araTatilMatematik', qty: 1 }, { id: 'araTatilParagraf', qty: 1 }],
    phone: '+90 532 000 00 03',
    email: 'veli3@ornek.com',
    merchantOid: 'oid-3b',
  });
  assert.strictEqual(again.ok, true, 'ayni telefon yeni yer acmamali');
  var used = await svc.usage();
  assert.strictEqual(used.used, 10);

  await svc.release('oid-1');
  var afterRelease = await svc.quote({ code: 'LGSKASIM', items: camp });
  assert.strictEqual(afterRelease.remaining, 1);

  var twelfth = await svc.claim({
    code: 'LGSKASIM',
    items: camp,
    phone: phone(12),
    merchantOid: 'oid-12',
  });
  assert.strictEqual(twelfth.ok, true);

  await svc.confirm('oid-12');
  await svc.release('oid-12');
  var stillFull = await svc.quote({ code: 'LGSKASIM', items: camp });
  assert.strictEqual(stillFull.remaining, 0, 'odenen hak geri acilmaz');

  var paidAgain = await svc.claim({
    code: 'LGSKASIM',
    items: camp,
    phone: phone(12),
    merchantOid: 'oid-12b',
  });
  assert.strictEqual(paidAgain.ok, false);

  clock += 3 * 60 * 60 * 1000 + 1000;
  await svc.release('oid-2');
  var expired = await svc.quote({ code: 'LGSKASIM', items: camp });
  assert.ok(expired.remaining >= 1, 'suresi gecen ayirma kontenjani bosaltir');

  var withCoupon = products.resolveLineItems(camp, new Date('2026-11-10T12:00:00+03:00'), {
    coupon: { prices: { araTatilMatematik: 5000, araTatilParagraf: 5000 } },
  })[0];
  assert.strictEqual(withCoupon.unitAmount, 500000);

  var both = products.resolveLineItems(
    [
      { id: 'araTatilMatematik', qty: 1 },
      { id: 'araTatilParagraf', qty: 1 },
      { id: 'kamplar', qty: 1 },
    ],
    new Date('2026-11-10T12:00:00+03:00'),
    { coupon: { prices: { araTatilMatematik: 5000, araTatilParagraf: 5000 } } }
  );
  assert.strictEqual(both[0].unitAmount, 500000);
  assert.strictEqual(both[1].unitAmount, 500000);
  assert.strictEqual(both[2].unitAmount, 500000, 'yaz kampi kuponla degismemeli');

  var plain = products.resolveLineItems(camp, new Date('2026-11-10T12:00:00+03:00'))[0];
  assert.strictEqual(plain.unitAmount, 750000, 'kodsuz fiyat 7.500 TL kalir');

  console.log('lgskasim kupon: ok');
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
