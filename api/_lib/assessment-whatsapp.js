const { maskPhone } = require('./assessment-phone');
const { idempotencyKey } = require('./assessment-token');

const sent = new Map();

function twilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_WHATSAPP_FROM || process.env.WHATSAPP_FROM)
  );
}

async function sendWhatsApp({ phone, body, event }) {
  if (!phone) return { skipped: true, reason: 'no-phone' };
  if (!twilioConfigured()) return { skipped: true, reason: 'whatsapp-not-configured' };
  var key = idempotencyKey(event, phone);
  if (sent.has(key)) return { skipped: true, reason: 'idempotent' };
  var from = process.env.TWILIO_WHATSAPP_FROM || process.env.WHATSAPP_FROM;
  var sid = process.env.TWILIO_ACCOUNT_SID;
  var token = process.env.TWILIO_AUTH_TOKEN;
  var to = 'whatsapp:' + phone;
  if (!String(from).startsWith('whatsapp:')) from = 'whatsapp:' + from;
  var auth = Buffer.from(sid + ':' + token).toString('base64');
  var res = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
  });
  if (!res.ok) {
    var err = new Error('WhatsApp gönderilemedi');
    err.status = res.status;
    throw err;
  }
  sent.set(key, Date.now());
  return { ok: true, to: maskPhone(phone) };
}

function messageFor(event, urls) {
  var report = urls.reportUrl || '';
  var test = urls.testUrl || '';
  var book = urls.bookUrl || '';
  if (event === 'contact') {
    return (
      'Merhaba Sayın Velimiz, öğrencimizin akademik ön değerlendirmesi tamamlandı. Kişisel sonuç raporunu ve ücretsiz seviye belirleme sınavı bağlantısını aşağıdan inceleyebilirsiniz.\n\nRapor: ' +
      report +
      '\nTest: ' +
      test
    );
  }
  if (event === 'test-reminder') {
    return (
      'Öğrencimizin ücretsiz seviye belirleme testi henüz tamamlanmamıştır. Ayrıntılı akademik analiz raporunu oluşturabilmemiz için teste aşağıdaki bağlantıdan devam edebilirsiniz.\n\n' +
      test
    );
  }
  if (event === 'test-complete') {
    return (
      'Öğrencimizin seviye belirleme sonuçları hazırlandı. Sonuçları ücretsiz olarak eğitim danışmanımızla değerlendirmek için uygun görüşme saatinizi seçebilirsiniz.\n\nRapor: ' +
      report +
      (book ? '\nRandevu: ' + book : '')
    );
  }
  return '';
}

module.exports = { twilioConfigured, sendWhatsApp, messageFor, _sent: sent };
