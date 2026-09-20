/**
 * Kommo kaynak / sohbet teşhisi — token yazdırmaz.
 * Kullanım: node scripts/probe-kommo-channels.js
 * Env: .env.production.local veya .env.kommo.tmp
 */
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  if (!fs.existsSync(file)) return false;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env) || !process.env[key]) process.env[key] = val;
  }
  return true;
}

[
  path.join(__dirname, '..', '.env.kommo.tmp'),
  path.join(__dirname, '..', '.env.production.local'),
  path.join(__dirname, '..', '.env.vercel.prod'),
].forEach(loadEnv);

function sanitizeToken(raw) {
  return String(raw || '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\s+/g, '');
}

const subdomain = String(process.env.KOMMO_SUBDOMAIN || '')
  .trim()
  .replace(/\.kommo\.com$/i, '');
const token = sanitizeToken(process.env.KOMMO_ACCESS_TOKEN);

if (!subdomain || !token) {
  console.log(JSON.stringify({ ok: false, error: 'kommo_env_missing', hasSubdomain: Boolean(subdomain), tokenLen: token.length }));
  process.exit(1);
}

const base = `https://${subdomain}.kommo.com/api/v4`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function get(p) {
  const res = await fetch(base + p, { headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = { raw: String(text).slice(0, 200) };
  }
  return { status: res.status, ok: res.ok, data };
}

function iso(ts) {
  const n = Number(ts);
  if (!n) return null;
  return new Date(n * 1000).toISOString();
}

(async () => {
  const account = await get('/account?with=amojo,drive_status,users');
  const sources = await get('/sources');
  const widgets = await get('/widgets');
  const talks = await get('/talks?limit=10');
  const events = await get('/events?limit=5&filter[type]=incoming_chat_message');
  const leads = await get('/leads?limit=15&order[created_at]=desc&with=contacts,source');
  const users = await get('/users?limit=20');

  const acc = account.data || {};
  const srcList = (sources.data && sources.data._embedded && sources.data._embedded.sources) || [];
  const widgetList = (widgets.data && widgets.data._embedded && widgets.data._embedded.widgets) || [];
  const talkList = (talks.data && talks.data._embedded && talks.data._embedded.talks) || [];
  const leadList = (leads.data && leads.data._embedded && leads.data._embedded.leads) || [];
  const userList = (users.data && users.data._embedded && users.data._embedded.users) || [];

  const igLike = srcList.filter((s) =>
    /instagram|facebook|whatsapp|telegram|tiktok|messenger|waba|ig/i.test(
      [s.name, s.type, s.origin_code, s.external_id, s.service_code].filter(Boolean).join(' ')
    )
  );

  const namedLeads = leadList.filter((l) => !/^Lead #\d+$/i.test(String(l.name || '')));
  const anonLeads = leadList.filter((l) => /^Lead #\d+$/i.test(String(l.name || '')));

  console.log(
    JSON.stringify(
      {
        ok: account.ok,
        account: account.ok
          ? {
              name: acc.name,
              id: acc.id,
              subdomain,
              amojo_id: acc.amojo_id || acc._embedded?.amojo?.id || null,
              current_user_id: acc.current_user_id || null,
            }
          : { status: account.status, error: (account.data && (account.data.title || account.data.detail)) || 'fail' },
        env: {
          has_pipeline_id: Boolean(process.env.KOMMO_PIPELINE_ID),
          has_status_id: Boolean(process.env.KOMMO_STATUS_ID),
          has_responsible_user_id: Boolean(String(process.env.KOMMO_RESPONSIBLE_USER_ID || '').trim()),
          token_len: token.length,
        },
        sources_status: sources.status,
        sources: srcList.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          origin: s.origin_code || s.origin || null,
          default: s.default || false,
        })),
        channel_like_sources: igLike.map((s) => ({ id: s.id, name: s.name, type: s.type })),
        widgets_status: widgets.status,
        widgets: widgetList.map((w) => ({
          code: w.code || w.widget_code,
          name: w.name,
          status: w.status,
          installed: w.is_lead_source || w.settings ? true : undefined,
        })),
        talks_status: talks.status,
        talks_error: talks.ok ? null : talks.data && (talks.data.title || talks.data.detail || talks.data['validation-errors']),
        recent_talks: talkList.map((t) => ({
          id: t.id,
          entity_id: t.entity_id,
          entity_type: t.entity_type,
          is_read: t.is_read,
          origin: t.origin || t.talk_origin || null,
          updated: iso(t.updated_at || t.last_message_at),
        })),
        events_status: events.status,
        recent_leads: leadList.map((l) => ({
          id: l.id,
          name: l.name,
          pipeline_id: l.pipeline_id,
          status_id: l.status_id,
          source_id: l.source_id || null,
          created: iso(l.created_at),
          origin: l.origin || null,
        })),
        named_vs_anon: { named: namedLeads.length, anon_lead_hash: anonLeads.length },
        users_status: users.status,
        users: userList.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email ? String(u.email).replace(/^(.{2}).*(@.*)$/, '$1***$2') : null,
          active: u.rights && u.rights.is_active,
        })),
      },
      null,
      2
    )
  );
})().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: String(e.message || e).slice(0, 200) }));
  process.exit(1);
});
