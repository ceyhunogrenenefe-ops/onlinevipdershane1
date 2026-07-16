const fs = require('fs');
const path = require('path');
const { createKommoLead, kommoConfig } = require(path.join(__dirname, '..', 'api', '_lib', 'kommo'));

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const key = line.slice(0, i);
    let val = line.slice(i + 1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[key] = val;
  }
}

loadEnv(path.join(__dirname, '..', '.env.production.local'));
const cfg = kommoConfig();
const token = process.env.KOMMO_ACCESS_TOKEN || '';
console.log('configured', !!cfg);
console.log('subdomain', process.env.KOMMO_SUBDOMAIN);
console.log('token_len', token.length);
console.log('has_newline', /[\r\n]/.test(token));

(async () => {
  const res = await fetch(
    `https://${cfg.subdomain}.kommo.com/api/v4/leads?limit=5&order[created_at]=desc`,
    { headers: { Authorization: `Bearer ${token.trim()}` } }
  );
  const data = await res.json();
  console.log('leads_status', res.status);
  const items = data._embedded?.leads || [];
  console.log(
    'recent_leads',
    items.map((l) => ({ id: l.id, name: l.name, created: l.created_at }))
  );
})();
