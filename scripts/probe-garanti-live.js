/** Live Garanti hash probe — no real card charge unless bank page completed. */
(async () => {
  const initRes = await fetch('https://onlinevipdershane.com/api/garanti-init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: 'ders-1', qty: 1 }],
      customer: {
        parentName: 'Test Veli Kontrol',
        phone: '05013715302',
        email: 'ceyhunogrenenefe@gmail.com',
        studentInfo: 'Garanti hash test',
      },
    }),
  });
  const init = await initRes.json();
  if (!init.action || !init.fields) {
    console.log('INIT_FAIL', initRes.status, JSON.stringify(init).slice(0, 500));
    process.exit(1);
  }
  console.log(
    'INIT_OK',
    JSON.stringify({
      orderId: init.orderId,
      amount: init.paymentAmount,
      mode: init.mode,
      action: init.action,
      security: init.fields.secure3dsecuritylevel,
      prov: init.fields.terminalprovuserid,
      terminalUser: init.fields.terminaluserid,
      installment: init.fields.txninstallmentcount,
      hashLen: String(init.fields.secure3dhash || '').length,
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
  const lower = text.toLowerCase();
  const guvenlik = /guvenlik kodu/i.test(text);
  const kullanim = /kullanim tipi|kullanım tipi/i.test(text);
  const mdMatch = text.match(/name=["']mdstatus["'][^>]*value=["']([^"']+)/i);
  const md = mdMatch ? mdMatch[1] : null;
  const errMatch =
    text.match(/mderrormessage["']?\s*[:=]\s*["']?([^"'<]+)/i) ||
    text.match(/errmsg["']?\s*[:=]\s*["']?([^"'<]+)/i);
  const reason = errMatch ? String(errMatch[1]).trim() : guvenlik ? 'Guvenlik Kodu' : kullanim ? 'Kullanim Tipi' : '';

  console.log(
    'BANK',
    JSON.stringify({
      status: bankRes.status,
      location: loc.slice(0, 220),
      md,
      reason: reason.slice(0, 120),
      guvenlik,
      kullanim,
      bodyLen: text.length,
      snippet: text.replace(/\s+/g, ' ').slice(0, 320),
    })
  );

  if (guvenlik || kullanim || (md && md === '7')) {
    process.exit(2);
  }
  if (bankRes.status >= 200 && bankRes.status < 400 && !guvenlik) {
    console.log('RESULT: hash accepted or payment page returned (no Guvenlik Kodu)');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
