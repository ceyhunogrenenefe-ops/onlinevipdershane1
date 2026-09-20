const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === '.git') continue;
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const tag =
  '<script src="https://www.dersonlinevipkocluk.com/crm-site-lead.js" defer></script>';
const re = /(<script[^>]*src="[^"]*wa-float\.js[^"]*"[^>]*><\/script>)/;

let updated = 0;
let already = 0;
let noWa = 0;

for (const f of walk(path.join(__dirname, '..'))) {
  let c = fs.readFileSync(f, 'utf8');
  if (/crm-site-lead\.js/.test(c)) {
    already++;
    continue;
  }
  if (!/wa-float\.js/.test(c)) {
    noWa++;
    continue;
  }
  if (!re.test(c)) continue;
  const nc = c.replace(re, `${tag}\n$1`);
  if (nc === c) continue;
  fs.writeFileSync(f, nc);
  updated++;
  console.log('updated', path.relative(path.join(__dirname, '..'), f));
}

console.log(JSON.stringify({ updated, already, noWa }));
