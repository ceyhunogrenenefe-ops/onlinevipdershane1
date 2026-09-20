/** Live Ziraat hash probe — no charge unless bank page is completed. */
(async () => {
  const initRes = await fetch('https://onlinevipdershane.com/api/ziraat-init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: 'yazili', qty: 1 }],
      customer: {
        parentName: 'Test Veli Kontrol',
        phone: '05013715302',
        email: 'ceyhunogrenenefe@gmail.com',
        studentInfo: 'Ziraat hash test',
      },
    }),
  });
  const init = await initRes.json();
  if (!init.action || !init.fields) {
    console.log('INIT_FAIL', initRes.status, JSON.stringify(init).slice(0, 600));
    process.exit(1);
  }
  console.log(
    'INIT_OK',
    JSON.stringify({
      orderId: init.orderId,
      amount: init.paymentAmount,
      mode: init.mode,
      action: init.action,
      storetype: init.fields.storetype,
      clientid: init.fields.clientid,
      amountTl: init.fields.amount,
      hashLen: String(init.fields.HASH || init.fields.hash || '').length,
    })
  );

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(init.fields)) {
    body.append(k, v == null ? '' : String(v));
  }

  const bankRes = await fetch(init.action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    redirect: 'manual',
  });
  const loc = bankRes.headers.get('location') || '';
  const text = await bankRes.text();
  const guvenlik = /guvenlik kodu|3d-1004|hash.*hatal/i.test(text);
  const kullanim = /kullanim tipi|kullanım tipi|storetype/i.test(text) && /desteklenmiyor|hata/i.test(text);
  const mdMatch =
    text.match(/name=["']mdStatus["'][^>]*value=["']([^"']+)/i) ||
    text.match(/name=["']mdstatus["'][^>]*value=["']([^"']+)/i);
  const md = mdMatch ? mdMatch[1] : null;
  const errMatch =
    text.match(/mdErrorMsg["']?\s*[:=]\s*["']?([^"'<]+)/i) ||
    text.match(/ErrMsg["']?\s*[:=]\s*["']?([^"'<]+)/i) ||
    text.match(/<h[1-3][^>]*>([^<]{8,80})/i);
  const reason = errMatch ? String(errMatch[1]).trim() : guvenlik ? 'Guvenlik/Hash' : '';
  const paymentPage = /kart|card|cvv|3d secure|ortak ödeme|ödeme sayfas/i.test(text) && !guvenlik;

  console.log(
    'BANK',
    JSON.stringify({
      status: bankRes.status,
      location: loc.slice(0, 220),
      md,
      reason: reason.slice(0, 140),
      guvenlik,
      kullanim,
      paymentPage,
      bodyLen: text.length,
      snippet: text.replace(/\s+/g, ' ').slice(0, 360),
    })
  );

  if (guvenlik || (md && !['1', '2', '3', '4', ''].includes(md) && md !== null && Number(md) >= 5)) {
    process.exit(2);
  }
  if (bankRes.status >= 200 && bankRes.status < 400 && paymentPage) {
    console.log('RESULT: Ziraat payment page accepted');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
