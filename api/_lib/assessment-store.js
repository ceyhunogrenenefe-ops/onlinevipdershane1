const { normalizeTrPhone } = require('./assessment-phone');

function stripEnv(v) {
  var s = String(v || '').trim();
  if ((s[0] === '"' && s.slice(-1) === '"') || (s[0] === "'" && s.slice(-1) === "'")) {
    s = s.slice(1, -1).trim();
  }
  if (/^Bearer\s+/i.test(s)) s = s.replace(/^Bearer\s+/i, '').trim();
  return s;
}

function creds() {
  var url = stripEnv(process.env.SUPABASE_URL).replace(/\/$/, '');
  var key = stripEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
  if (!url || !key) return null;
  if (url.indexOf('supabase.co') === -1 && url.indexOf('supabase.com') === -1 && url.indexOf('localhost') === -1) {
    return { url: url, key: key };
  }
  if (/supabase\.com\/dashboard/.test(url)) {
    return null;
  }
  return { url: url, key: key };
}

function headers(key, extra) {
  return Object.assign(
    {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Content-Profile': 'public',
      'Accept-Profile': 'public',
    },
    extra || {}
  );
}

function compact(row) {
  var out = {};
  Object.keys(row || {}).forEach(function (k) {
    if (row[k] !== undefined) out[k] = row[k];
  });
  return out;
}

function errMessage(data, status) {
  if (!data) return 'HTTP ' + status;
  if (typeof data === 'string') return data.slice(0, 180);
  return String(data.message || data.error_description || data.error || JSON.stringify(data)).slice(0, 180);
}

async function supabaseInsert(table, row) {
  var c = creds();
  if (!c) return { skipped: true, reason: 'supabase-not-configured' };
  var res = await fetch(c.url + '/rest/v1/' + table, {
    method: 'POST',
    headers: headers(c.key, { Prefer: 'return=representation' }),
    body: JSON.stringify(compact(row)),
  });
  var data = await res.json().catch(function () { return null; });
  if (!res.ok) {
    console.error('[assessment-supabase] insert', table, res.status, errMessage(data, res.status));
    var err = new Error(errMessage(data, res.status));
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return { ok: true, data: Array.isArray(data) ? data[0] : data };
}

async function supabaseSelect(table, query) {
  var c = creds();
  if (!c) return { skipped: true, rows: [] };
  var res = await fetch(c.url + '/rest/v1/' + table + '?' + query, {
    headers: headers(c.key),
  });
  var data = await res.json().catch(function () { return []; });
  if (!res.ok) {
    console.error('[assessment-supabase] select', table, res.status, errMessage(data, res.status));
    return { skipped: false, rows: [], error: errMessage(data, res.status), status: res.status };
  }
  return { ok: true, rows: data || [] };
}

async function supabasePatch(table, id, patch) {
  var c = creds();
  if (!c) return { skipped: true };
  var res = await fetch(c.url + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: headers(c.key, { Prefer: 'return=minimal' }),
    body: JSON.stringify(compact(patch)),
  });
  if (!res.ok) {
    var data = await res.json().catch(function () { return null; });
    console.error('[assessment-supabase] patch', table, res.status, errMessage(data, res.status));
    var err = new Error(errMessage(data, res.status));
    err.status = res.status;
    throw err;
  }
  return { ok: true };
}

async function findByPhone(phone) {
  var n = normalizeTrPhone(phone);
  if (!n) return null;
  var r = await supabaseSelect(
    'assessment_leads',
    'phone=eq.' + encodeURIComponent(n) + '&select=id,phone,created_at&order=created_at.desc&limit=1'
  );
  if (r.skipped || !r.rows || !r.rows.length) return null;
  return r.rows[0];
}

async function ping() {
  var c = creds();
  if (!c) return { ok: false, reason: 'supabase-not-configured' };
  var role = '';
  var keyKind = 'unknown';
  if (c.key.indexOf('sb_secret_') === 0) keyKind = 'secret';
  else if (c.key.indexOf('sb_publishable_') === 0 || c.key.indexOf('sb_anon_') === 0) keyKind = 'publishable';
  else if (c.key.indexOf('eyJ') === 0) {
    keyKind = 'jwt';
    try {
      var payload = JSON.parse(Buffer.from(c.key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
      role = payload.role || '';
      if (role === 'anon') keyKind = 'anon-jwt';
      if (role === 'service_role') keyKind = 'service-jwt';
    } catch (_) {}
  }
  var r = await supabaseSelect('assessment_leads', 'select=id&limit=1');
  var writeOk = false;
  var writeError = null;
  try {
    var w = await supabaseInsert('assessment_events', { event: 'connection_ping', page: '/api/status' });
    writeOk = Boolean(w && w.ok);
  } catch (e) {
    writeError = String(e.message || e).slice(0, 180);
  }
  var hint = null;
  if (keyKind === 'publishable' || keyKind === 'anon-jwt' || role === 'anon') {
    hint = 'Vercel’de SUPABASE_SERVICE_ROLE_KEY alanına anon/publishable key değil, service_role (secret) key yapıştırın.';
  } else if (!writeOk) {
    hint = 'Supabase SQL Editor’da sql/002_assessment_grants.sql dosyasını çalıştırın.';
  }
  return {
    ok: Boolean(r.ok) && writeOk,
    read: Boolean(r.ok),
    write: writeOk,
    role: role,
    keyKind: keyKind,
    status: r.status || (r.ok ? 200 : 0),
    error: writeError || r.error || null,
    hint: hint,
  };
}

module.exports = {
  supabaseInsert: supabaseInsert,
  supabaseSelect: supabaseSelect,
  supabasePatch: supabasePatch,
  findByPhone: findByPhone,
  ping: ping,
  configured: function () {
    return Boolean(creds());
  },
};
