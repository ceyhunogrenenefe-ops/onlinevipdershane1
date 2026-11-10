/**
 * LGSKASIM — Kasım ara tatil kamplarında ilk 10 kişiye 5.000 TL.
 * Kontenjan Supabase'te tek satırda tutulur. Ödeme başlarken yer ayrılır,
 * ödeme düşünce yer geri açılır, başarılı ödemede kişi hakkını kullanmış sayılır.
 * Ayrılan yer 3 saat içinde sonuçlanmazsa kontenjana geri döner.
 */
const storeApi = require('./assessment-store');

const CODE = 'LGSKASIM';
const LIMIT = 10;
const SALE_TL = 5000;
const HOLD_MS = 3 * 60 * 60 * 1000;
const CAMP_IDS = ['araTatilMatematik', 'araTatilParagraf'];
const ROW_TYPE = 'site_coupon_counter';

function normCode(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function normPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('90') && d.length >= 12) d = d.slice(-10);
  else if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  else if (d.length > 10) d = d.slice(-10);
  return d;
}

function normEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

function personKey(phone, email) {
  const p = normPhone(phone);
  if (p.length === 10) return 'p:' + p;
  const e = normEmail(email);
  if (e) return 'e:' + e;
  return '';
}

function activeHolds(holds, now) {
  const t = now || Date.now();
  return (holds || []).filter((h) => {
    if (!h) return false;
    if (h.status === 'paid') return true;
    if (h.status !== 'reserved') return false;
    const at = Date.parse(h.at || '');
    return Number.isFinite(at) && t - at < HOLD_MS;
  });
}

function explain(code, items) {
  const c = normCode(code);
  if (!c) return { ok: false, error: 'Kupon kodunu yazın.' };
  if (c !== CODE) return { ok: false, error: 'Kupon kodu geçersiz.' };
  const ids = (Array.isArray(items) ? items : [])
    .map((item) => item && item.id)
    .filter((id) => CAMP_IDS.indexOf(id) !== -1);
  if (!ids.length) {
    return { ok: false, error: 'Bu kupon yalnızca Kasım ara tatil kamplarında geçerlidir.' };
  }
  return { ok: true, code: CODE };
}

function priceMap() {
  const prices = {};
  CAMP_IDS.forEach((id) => {
    prices[id] = SALE_TL;
  });
  return prices;
}

function unavailable() {
  return { ok: false, error: 'Kupon şu an doğrulanamadı. Lütfen tekrar deneyin.' };
}

function createCouponService(store, nowFn) {
  const now = () => (nowFn ? nowFn() : Date.now());

  async function loadRow() {
    let row = await store.load();
    if (!row) {
      await store.create({ rev: 0, holds: [] });
      row = await store.load();
    }
    return row;
  }

  async function usage() {
    const row = await store.load();
    const holds = activeHolds(row && row.holds, now());
    return {
      holds: holds,
      used: holds.length,
      remaining: Math.max(0, LIMIT - holds.length),
    };
  }

  async function mutate(fn) {
    for (let i = 0; i < 6; i++) {
      const row = await loadRow();
      if (!row || row.id == null) continue;
      const holds = activeHolds(row.holds, now());
      const nextHolds = fn(holds);
      if (!Array.isArray(nextHolds)) return nextHolds;
      const next = { rev: Number(row.rev || 0) + 1, holds: nextHolds };
      const saved = await store.save(row.id, Number(row.rev || 0), next);
      if (saved) return { ok: true, holds: nextHolds };
    }
    return unavailable();
  }

  async function quote(input) {
    const v = explain(input && input.code, input && input.items);
    if (!v.ok) return v;
    let u;
    try {
      u = await usage();
    } catch (err) {
      console.warn('[lgskasim] quote', err && err.message);
      return unavailable();
    }
    if (u.remaining <= 0) {
      return { ok: false, error: 'İlk 10 kontenjan doldu.', remaining: 0 };
    }
    return {
      ok: true,
      code: CODE,
      price: SALE_TL,
      remaining: u.remaining,
      prices: priceMap(),
      message:
        'LGSKASIM uygulandı. Ara tatil kampı 5.000 TL. Kalan kontenjan: ' + u.remaining + '.',
    };
  }

  async function claim(input) {
    const v = explain(input && input.code, input && input.items);
    if (!v.ok) return v;
    const key = personKey(input && input.phone, input && input.email);
    if (!key) return { ok: false, error: 'Kupon için telefon numarası gerekli.' };
    const oid = String((input && input.merchantOid) || '').trim();
    if (!oid) return { ok: false, error: 'Sipariş numarası oluşmadı.' };
    let result;
    try {
      result = await mutate((holds) => {
        const mine = holds.find((h) => h.key === key);
        if (mine && mine.status === 'paid') {
          return { ok: false, error: 'Bu kupon bu telefon numarasıyla zaten kullanıldı.' };
        }
        const stamp = new Date(now()).toISOString();
        if (mine && mine.status === 'reserved') {
          return holds.map((h) =>
            h.key === key
              ? {
                  key: key,
                  status: 'reserved',
                  oid: oid,
                  phone: normPhone(input.phone),
                  email: normEmail(input.email),
                  at: stamp,
                }
              : h
          );
        }
        if (holds.length >= LIMIT) {
          return { ok: false, error: 'İlk 10 kontenjan doldu.' };
        }
        return holds.concat([
          {
            key: key,
            status: 'reserved',
            oid: oid,
            phone: normPhone(input.phone),
            email: normEmail(input.email),
            at: stamp,
          },
        ]);
      });
    } catch (err) {
      console.warn('[lgskasim] claim', err && err.message);
      return unavailable();
    }
    if (!result.ok) return result;
    const remaining = Math.max(0, LIMIT - result.holds.length);
    return {
      ok: true,
      code: CODE,
      prices: priceMap(),
      remaining: remaining,
      message: 'LGSKASIM uygulandı. Ara tatil kampı 5.000 TL. Kalan kontenjan: ' + remaining + '.',
    };
  }

  async function confirm(oid) {
    const id = String(oid || '').trim();
    if (!id) return;
    try {
      await mutate((holds) =>
        holds.map((h) =>
          h.oid === id && h.status === 'reserved'
            ? Object.assign({}, h, { status: 'paid', paidAt: new Date(now()).toISOString() })
            : h
        )
      );
    } catch (err) {
      console.warn('[lgskasim] confirm', err && err.message);
    }
  }

  async function release(oid) {
    const id = String(oid || '').trim();
    if (!id) return;
    try {
      await mutate((holds) => holds.filter((h) => !(h.oid === id && h.status === 'reserved')));
    } catch (err) {
      console.warn('[lgskasim] release', err && err.message);
    }
  }

  return { quote: quote, claim: claim, confirm: confirm, release: release, usage: usage };
}

function restHeaders(key) {
  return {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Content-Profile': 'public',
    'Accept-Profile': 'public',
  };
}

function createSupabaseStore() {
  function client() {
    const c = storeApi.creds();
    if (!c) {
      const err = new Error('supabase-not-configured');
      throw err;
    }
    return c;
  }

  return {
    async load() {
      const c = client();
      const q = new URLSearchParams({
        type: 'eq.' + ROW_TYPE,
        lead_id: 'eq.' + CODE,
        select: 'id,payload',
        order: 'id.asc',
        limit: '1',
      });
      const res = await fetch(c.url + '/rest/v1/lead_activities?' + q.toString(), {
        headers: restHeaders(c.key),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error('Kupon kaydı okunamadı');
      }
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) return null;
      const payload = row.payload || {};
      return {
        id: row.id,
        rev: Number(payload.rev) || 0,
        holds: Array.isArray(payload.holds) ? payload.holds : [],
      };
    },
    async create(payload) {
      const c = client();
      const res = await fetch(c.url + '/rest/v1/lead_activities', {
        method: 'POST',
        headers: Object.assign(restHeaders(c.key), { Prefer: 'return=minimal' }),
        body: JSON.stringify({
          lead_id: CODE,
          type: ROW_TYPE,
          payload: payload,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data && (data.message || data.error)) || 'Kupon kaydı açılamadı');
      }
    },
    async save(id, rev, next) {
      const c = client();
      const q = new URLSearchParams();
      q.set('id', 'eq.' + id);
      q.set('payload->>rev', 'eq.' + String(rev));
      const res = await fetch(c.url + '/rest/v1/lead_activities?' + q.toString(), {
        method: 'PATCH',
        headers: Object.assign(restHeaders(c.key), { Prefer: 'return=representation' }),
        body: JSON.stringify({ payload: next }),
      });
      const data = await res.json().catch(() => null);
      return Boolean(res.ok && Array.isArray(data) && data.length === 1);
    },
  };
}

const service = createCouponService(createSupabaseStore());

module.exports = {
  CODE: CODE,
  LIMIT: LIMIT,
  SALE_TL: SALE_TL,
  CAMP_IDS: CAMP_IDS,
  createCouponService: createCouponService,
  quote: function (input) {
    return service.quote(input);
  },
  claim: function (input) {
    return service.claim(input);
  },
  confirm: function (oid) {
    return service.confirm(oid);
  },
  release: function (oid) {
    return service.release(oid);
  },
};
