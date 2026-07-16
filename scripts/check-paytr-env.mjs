import fs from 'fs';

const env = fs.readFileSync(new URL('../.env.probe.paytr', import.meta.url), 'utf8');
for (const k of ['PAYTR_MERCHANT_ID', 'PAYTR_MERCHANT_KEY', 'PAYTR_MERCHANT_SALT', 'PAYTR_TEST_MODE', 'SITE_URL']) {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  const v = m ? m[1].replace(/^"|"$/g, '').trim() : '';
  console.log(k, 'set=', v.length > 0, 'len=', v.length);
}
