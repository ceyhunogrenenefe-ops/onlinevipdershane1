const store = require('./_lib/assessment-store');
const { sendWhatsApp, messageFor, twilioConfigured } = require('./_lib/assessment-whatsapp');
const { signPayload } = require('./_lib/assessment-token');
const { createKommoLead, addKommoNote, splitName, extractKommoLeadId, findKommoContactsByPhone } = require('./_lib/kommo');

const FORMSPREE_ID = process.env.FORMSPREE_FORM_ID || 'mpqnjdwd';

function authorized(req) {
  var secret = String(process.env.CRON_SECRET || process.env.ASSESSMENT_ADMIN_KEY || '').trim();
  if (!secret) return false;
  var h = String(req.headers.authorization || '');
  var q = String((req.query && req.query.key) || '');
  return h === 'Bearer ' + secret || q === secret;
}

function origin() {
  return (process.env.SITE_URL || 'https://onlinevipdershane.com').replace(/\/$/, '');
}

async function sendFormspree(subject, payload) {
  await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ _subject: subject }, payload)),
  });
}

async function alreadyLogged(leadId, status) {
  var logs = await store.supabaseSelect(
    'integration_logs',
    'lead_id=eq.' + encodeURIComponent(leadId) + '&status=eq.' + encodeURIComponent(status) + '&limit=1'
  );
  return Boolean(logs.rows && logs.rows.length);
}

async function markLog(channel, status, leadId, extra) {
  try {
    await store.supabaseInsert(
      'integration_logs',
      Object.assign({ channel: channel, status: status, lead_id: leadId }, extra || {})
    );
  } catch (_) {}
}

async function retryKommo() {
  var since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  var rows = await store.supabaseSelect(
    'assessment_leads',
    'select=id,student_name,parent_name,phone,email,grade,target_exam,scores,kommo_lead_id,created_at&created_at=gte.' +
      encodeURIComponent(since) +
      '&order=created_at.desc&limit=40'
  );
  if (rows.error) {
    rows = await store.supabaseSelect(
      'assessment_leads',
      'select=id,student_name,parent_name,phone,email,grade,target_exam,scores,created_at&created_at=gte.' +
        encodeURIComponent(since) +
        '&order=created_at.desc&limit=40'
    );
  }
  var created = 0;
  var skipped = 0;
  var errors = 0;
  for (var i = 0; i < (rows.rows || []).length; i++) {
    var lead = rows.rows[i];
    if (lead.kommo_lead_id) {
      skipped += 1;
      continue;
    }
    var acts = await store.supabaseSelect(
      'lead_activities',
      'lead_id=eq.' + encodeURIComponent(lead.id) + '&type=eq.kommo_created&limit=1'
    );
    if (acts.rows && acts.rows.length) {
      skipped += 1;
      continue;
    }
    var existingId = null;
    try {
      var prior = await findKommoContactsByPhone(lead.phone);
      var contacts = (prior && prior.contacts) || [];
      for (var c = 0; c < contacts.length && !existingId; c++) {
        var leadsEmb = (contacts[c]._embedded && contacts[c]._embedded.leads) || [];
        if (leadsEmb[0] && leadsEmb[0].id) existingId = leadsEmb[0].id;
      }
    } catch (_) {}
    if (existingId) {
      try {
        await store.supabasePatch('assessment_leads', lead.id, { kommo_lead_id: existingId });
      } catch (_) {}
      try {
        await store.supabaseInsert('lead_activities', {
          lead_id: lead.id,
          type: 'kommo_created',
          payload: { kommoLeadId: existingId, via: 'cron-link' },
        });
      } catch (_) {}
      skipped += 1;
      continue;
    }
    try {
      var parent = splitName(lead.parent_name || '');
      var scores = lead.scores || {};
      var kommo = await createKommoLead(
        {
          ad: parent.ad || 'Veli',
          soyad: parent.soyad || lead.student_name,
          telefon: lead.phone,
          email: lead.email || '',
          sinif: lead.grade,
          program: 'Ücretsiz Öğrenci Analizi',
          not:
            'CRON yeniden deneme | Öğrenci: ' +
            lead.student_name +
            ' | Hedef: ' +
            lead.target_exam +
            ' | Skorlar: ' +
            (scores.academic || '-') +
            '/' +
            (scores.routine || '-') +
            '/' +
            (scores.examPrep || '-') +
            '/' +
            (scores.coaching || '-'),
        },
        {
          tag: 'Ücretsiz Öğrenci Analizi',
          title: (lead.student_name || 'Öğrenci') + ' | ' + (lead.grade || '') + ' | Analiz',
        }
      );
      var kid = extractKommoLeadId(kommo.data);
      if (kid) {
        try {
          await store.supabasePatch('assessment_leads', lead.id, { kommo_lead_id: kid });
        } catch (_) {}
        try {
          await store.supabaseInsert('lead_activities', {
            lead_id: lead.id,
            type: 'kommo_created',
            payload: { kommoLeadId: kid, via: 'cron' },
          });
        } catch (_) {}
        created += 1;
      } else {
        skipped += 1;
      }
    } catch (_) {
      errors += 1;
    }
  }
  return { created: created, skipped: skipped, errors: errors };
}

async function remindTests() {
  var now = Date.now();
  var from = new Date(now - 36 * 60 * 60 * 1000).toISOString();
  var to = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  var rows = await store.supabaseSelect(
    'assessment_leads',
    'select=id,phone,email,whatsapp_consent_at,test_status,student_name,grade,target_exam,scores,parent_name,kommo_lead_id&test_status=eq.not_started&created_at=gte.' +
      encodeURIComponent(from) +
      '&created_at=lte.' +
      encodeURIComponent(to) +
      '&limit=50'
  );
  if (rows.error) {
    rows = await store.supabaseSelect(
      'assessment_leads',
      'select=id,phone,email,whatsapp_consent_at,test_status,student_name,grade,target_exam,scores,parent_name&test_status=eq.not_started&created_at=gte.' +
        encodeURIComponent(from) +
        '&created_at=lte.' +
        encodeURIComponent(to) +
        '&limit=50'
    );
  }
  var sent = 0;
  var skipped = 0;
  var site = origin();
  var waOn = twilioConfigured();
  for (var i = 0; i < (rows.rows || []).length; i++) {
    var lead = rows.rows[i];
    if (await alreadyLogged(lead.id, 'test-reminder')) {
      skipped += 1;
      continue;
    }
    var token = signPayload({
      v: 1,
      id: lead.id,
      phone: lead.phone,
      studentName: lead.student_name,
      grade: lead.grade,
      targetExam: lead.target_exam,
      scores: lead.scores,
      kommoLeadId: lead.kommo_lead_id || null,
    });
    var urls = {
      reportUrl: site + '/analiz-sonucu/' + encodeURIComponent(token),
      testUrl: site + '/seviye-testi/' + encodeURIComponent(token),
    };
    var channel = 'email';
    try {
      if (waOn && lead.whatsapp_consent_at) {
        var wa = await sendWhatsApp({
          phone: lead.phone,
          event: 'test-reminder:' + lead.id,
          body: messageFor('test-reminder', urls),
        });
        channel = wa && wa.skipped ? 'email' : 'whatsapp';
      }
      if (channel === 'email') {
        await sendFormspree('Seviye testi hatırlatması', {
          form: 'analiz-test-hatirlatma',
          ogrenci: lead.student_name,
          veli: lead.parent_name,
          test: urls.testUrl,
          rapor: urls.reportUrl,
        });
      }
      if (lead.kommo_lead_id) {
        try {
          await addKommoNote(
            lead.kommo_lead_id,
            '24s hatırlatma: seviye testi tamamlanmadı.\nTest: ' + urls.testUrl
          );
        } catch (_) {}
      }
      await markLog(channel, 'test-reminder', lead.id);
      sent += 1;
    } catch (_) {
      skipped += 1;
    }
  }
  return { sent: sent, skipped: skipped, whatsapp: waOn };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!authorized(req)) return res.status(401).json({ error: 'Yetkisiz' });
  if (!store.configured()) {
    return res.status(200).json({ ok: true, skipped: 'supabase-not-configured' });
  }
  var kommo = await retryKommo();
  var remind = await remindTests();
  return res.status(200).json({
    ok: true,
    kommoRetry: kommo,
    testReminders: remind,
  });
};
