const { createKommoLead, splitName, addKommoNote, findKommoContactsByPhone, extractKommoLeadId, pingKommo } = require('./_lib/kommo');
const { scoreAssessment } = require('./_lib/assessment-scoring');
const { normalizeTrPhone, maskPhone } = require('./_lib/assessment-phone');
const { validateContact } = require('./_lib/assessment-validate');
const { signPayload, openPayload, randomId } = require('./_lib/assessment-token');
const { pickBank, publicQuestions, gradeAttempt } = require('./_lib/assessment-questions');
const store = require('./_lib/assessment-store');
const { sendWhatsApp, messageFor, twilioConfigured } = require('./_lib/assessment-whatsapp');

const FORMSPREE_ID = process.env.FORMSPREE_FORM_ID || 'mpqnjdwd';
const hits = new Map();
const KVKK_VERSION = '2026-08-18';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }
  return req.body;
}

function clientIp(req) {
  var xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.socket?.remoteAddress || 'unknown';
}

function rateLimit(req, res) {
  var ip = clientIp(req);
  var now = Date.now();
  var row = hits.get(ip) || [];
  row = row.filter(function (t) { return now - t < 10 * 60 * 1000; });
  if (row.length >= 12) {
    res.status(429).json({ error: 'Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.' });
    return false;
  }
  row.push(now);
  hits.set(ip, row);
  return true;
}

function siteOrigin(req) {
  return (
    process.env.SITE_URL ||
    (req.headers['x-forwarded-proto'] && req.headers.host
      ? req.headers['x-forwarded-proto'] + '://' + req.headers.host
      : 'https://onlinevipdershane.com')
  ).replace(/\/$/, '');
}

function urlsFor(origin, token) {
  return {
    reportUrl: origin + '/analiz-sonucu/' + encodeURIComponent(token),
    testUrl: origin + '/seviye-testi/' + encodeURIComponent(token),
    bookUrl: origin + '/analiz-sonucu/' + encodeURIComponent(token) + '#randevu',
  };
}

function publicLead(record) {
  if (!record) return null;
  return {
    id: record.id,
    studentName: record.student_name || record.studentName,
    grade: record.grade,
    targetExam: record.target_exam || record.targetExam,
    assessmentStatus: record.assessment_status,
    testStatus: record.test_status,
    appointmentStatus: record.appointment_status,
    scores: record.scores,
    testResult: record.test_result || record.testResult,
    summary: record.summary,
    strengths: record.strengths,
    gaps: record.gaps,
    nextStep: record.nextStep || record.next_step,
    disclaimer: record.disclaimer,
    weakSubjects: record.weak_subjects || record.weakSubjects,
  };
}

function sanitizeAnswers(raw) {
  var a = raw || {};
  return {
    who: String(a.who || '').slice(0, 40),
    studentName: String(a.studentName || '').trim().slice(0, 80),
    grade: String(a.grade || '').slice(0, 16),
    targetExam: String(a.targetExam || '').slice(0, 24),
    weakSubjects: Array.isArray(a.weakSubjects) ? a.weakSubjects.map(String).slice(0, 8) : [],
    examResult: String(a.examResult || '').slice(0, 40),
    weeklyPlan: String(a.weeklyPlan || '').slice(0, 16),
    homeworkSelf: String(a.homeworkSelf || '').slice(0, 16),
    mocks: String(a.mocks || '').slice(0, 16),
    mistakeReview: String(a.mistakeReview || '').slice(0, 16),
    dailyMinutes: Number(a.dailyMinutes) || 0,
    supportNeeds: Array.isArray(a.supportNeeds) ? a.supportNeeds.map(String).slice(0, 8) : [],
  };
}

async function sendFormspree(subject, payload) {
  var res = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ _subject: subject }, payload)),
  });
  if (!res.ok) {
    var err = new Error('Formspree error');
    err.status = res.status;
    throw err;
  }
}

function trackSafe(event, extra) {
  try {
    if (typeof extra !== 'object') extra = {};
    var row = {
      event: String(event || '').slice(0, 64),
      page: String(extra.page || '').slice(0, 180),
      source: String(extra.source || '').slice(0, 80),
      utm_source: String(extra.utm_source || '').slice(0, 80),
      device: String(extra.device || '').slice(0, 24),
      step: extra.step != null ? Number(extra.step) : null,
      created_at: new Date().toISOString(),
    };
    store.supabaseInsert('assessment_events', row).catch(function () {});
  } catch (_) {}
}

async function submitLead(req, body, origin) {
  if (body.website) return { honeypot: true };
  var answers = sanitizeAnswers(body.answers);
  var contact = body.contact || {};
  var err = validateContact(contact);
  if (err) return { error: err, status: 400 };
  if (!answers.studentName || !answers.grade) {
    return { error: 'Öğrenci adı ve sınıfı zorunludur.', status: 400 };
  }

  var phone = normalizeTrPhone(contact.phone);
  var parent = splitName(contact.parentName);
  var scored = scoreAssessment(answers);
  var existing = await store.findByPhone(phone);
  var now = new Date().toISOString();
  var leadId = existing && existing.id ? existing.id : randomId();
  var duplicate = Boolean(existing);

  var record = {
    id: leadId,
    student_name: answers.studentName,
    parent_name: String(contact.parentName).trim(),
    phone: phone,
    email: String(contact.email || '').trim().toLowerCase() || null,
    grade: answers.grade,
    target_exam: answers.targetExam,
    city: String(contact.city || '').slice(0, 40),
    district: String(contact.district || '').slice(0, 40) || null,
    preferred_contact_method: String(contact.preferredContact || 'whatsapp').slice(0, 24),
    source: String(body.source || 'website').slice(0, 40),
    utm_source: String(body.utm && body.utm.source || '').slice(0, 80) || null,
    utm_medium: String(body.utm && body.utm.medium || '').slice(0, 80) || null,
    utm_campaign: String(body.utm && body.utm.campaign || '').slice(0, 80) || null,
    utm_content: String(body.utm && body.utm.content || '').slice(0, 80) || null,
    landing_page: String(body.landingPage || '').slice(0, 180) || null,
    referrer: String(body.referrer || '').slice(0, 180) || null,
    assessment_status: 'contact',
    test_status: 'not_started',
    appointment_status: 'unscheduled',
    crm_status: 'İletişim bilgisi alındı',
    kvkk_consent_at: now,
    kvkk_version: KVKK_VERSION,
    whatsapp_consent_at: contact.whatsapp ? now : null,
    commercial_consent_at: contact.commercial ? now : null,
    answers: answers,
    scores: scored.scores,
    summary: scored.summary,
    strengths: scored.strengths,
    gaps: scored.gaps,
    weak_subjects: answers.weakSubjects,
    updated_at: now,
  };
  if (!duplicate) record.created_at = now;

  var integrations = { email: false, kommo: false, whatsapp: false, supabase: false };
  var errors = [];

  try {
    var saved;
    if (duplicate) saved = await store.supabasePatch('assessment_leads', leadId, record);
    else saved = await store.supabaseInsert('assessment_leads', record);
    integrations.supabase = Boolean(saved && saved.ok);
    if (saved && saved.skipped) {
      integrations.supabase = false;
      errors.push({ channel: 'supabase', message: saved.reason || 'atlandı' });
    }
  } catch (e) {
    integrations.supabase = false;
    errors.push({ channel: 'supabase', message: String(e.message || 'kayıt hatası').slice(0, 180) });
    try {
      await store.supabaseInsert('assessment_leads', {
        id: leadId,
        student_name: answers.studentName,
        parent_name: String(contact.parentName).trim(),
        phone: phone,
        email: record.email,
        grade: answers.grade,
        target_exam: answers.targetExam,
        city: record.city,
        kvkk_consent_at: now,
        answers: answers,
        scores: scored.scores,
      });
      integrations.supabase = true;
    } catch (e2) {
      errors.push({ channel: 'supabase-retry', message: String(e2.message || 'kayıt hatası').slice(0, 180) });
    }
  }

  try {
    await store.supabaseInsert('lead_activities', {
      lead_id: leadId,
      type: duplicate ? 'repeat_submit' : 'contact_submit',
      payload: { scores: scored.scores },
    });
  } catch (_) {}

  try {
    await sendFormspree('Ücretsiz Öğrenci Analizi — Online VIP Dershane', {
      form: 'ogrenci-analizi',
      ogrenci: answers.studentName,
      veli: contact.parentName,
      telefon: phone,
      email: record.email || '',
      sinif: answers.grade,
      hedef: answers.targetExam,
      il: record.city,
      skorlar: JSON.stringify(scored.scores),
      tekrar: duplicate ? 'evet' : 'hayır',
    });
    integrations.email = true;
  } catch (e) {
    errors.push({ channel: 'email', message: e.message });
  }

  var kommoLeadId = null;
  try {
    var prior = await findKommoContactsByPhone(phone);
    var kommo = await createKommoLead(
      {
        ad: parent.ad || 'Veli',
        soyad: parent.soyad || answers.studentName,
        telefon: phone,
        email: record.email || '',
        sinif: answers.grade,
        program: 'Ücretsiz Öğrenci Analizi',
        not:
          'Öğrenci: ' +
          answers.studentName +
          ' | Hedef: ' +
          answers.targetExam +
          ' | Skorlar A/R/S/K: ' +
          scored.scores.academic +
          '/' +
          scored.scores.routine +
          '/' +
          scored.scores.examPrep +
          '/' +
          scored.scores.coaching,
      },
      {
        tag: 'Ücretsiz Öğrenci Analizi',
        title: answers.studentName + ' | ' + answers.grade + ' | Analiz',
      }
    );
    integrations.kommo = kommo.skipped ? 'skipped' : true;
    kommoLeadId = extractKommoLeadId(kommo.data);
    if (kommoLeadId) {
      try {
        await store.supabasePatch('assessment_leads', leadId, { kommo_lead_id: kommoLeadId });
      } catch (_) {}
      try {
        await store.supabaseInsert('lead_activities', {
          lead_id: leadId,
          type: 'kommo_created',
          payload: { kommoLeadId: kommoLeadId },
        });
      } catch (_) {}
    }
    if (prior && prior.contacts && prior.contacts.length) {
      duplicate = true;
    }
  } catch (e) {
    errors.push({ channel: 'kommo', message: e.message });
    try {
      await store.supabaseInsert('integration_logs', {
        channel: 'kommo',
        status: 'failed',
        lead_id: leadId,
        error: String(e.message || '').slice(0, 200),
      });
    } catch (_) {}
  }

  var token = signPayload({
    v: 1,
    id: leadId,
    phone: phone,
    studentName: answers.studentName,
    grade: answers.grade,
    targetExam: answers.targetExam,
    scores: scored.scores,
    strengths: scored.strengths,
    gaps: scored.gaps,
    summary: scored.summary,
    nextStep: scored.nextStep,
    disclaimer: scored.disclaimer,
    weakSubjects: answers.weakSubjects,
    whatsapp: Boolean(contact.whatsapp),
    testResult: null,
    appointment: null,
    kommoLeadId: kommoLeadId,
  });

  var u = urlsFor(origin, token);
  if (kommoLeadId) {
    try {
      await addKommoNote(
        kommoLeadId,
        'Rapor: ' + u.reportUrl + '\nTest: ' + u.testUrl
      );
    } catch (_) {}
  }

  if (contact.whatsapp) {
    try {
      var wa = await sendWhatsApp({
        phone: phone,
        event: 'contact:' + leadId,
        body: messageFor('contact', u),
      });
      integrations.whatsapp = wa.skipped ? wa.reason : true;
    } catch (e) {
      errors.push({ channel: 'whatsapp', message: e.message });
    }
  }

  return {
    ok: true,
    token: token,
    duplicate: duplicate,
    reportUrl: u.reportUrl,
    testUrl: u.testUrl,
    scores: scored.scores,
    disclaimer: scored.disclaimer,
    integrations: integrations,
    errors: errors,
    phoneMasked: maskPhone(phone),
  };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  var op = String((req.query && req.query.op) || '').trim();
  var origin = siteOrigin(req);

  if (req.method === 'GET' && (op === 'report' || op === 'test')) {
    try {
      var token = String((req.query && req.query.token) || '');
      var data = openPayload(token);
      if (op === 'test') {
        var key = pickBank(data.grade, data.targetExam);
        return res.status(200).json({
          ok: true,
          lead: publicLead(data),
          test: publicQuestions(key),
          bankKey: key,
        });
      }
      return res.status(200).json({ ok: true, lead: publicLead(data), token: token });
    } catch (_) {
      return res.status(404).json({ error: 'Rapor bulunamadı veya bağlantı geçersiz.' });
    }
  }

  if (req.method === 'GET' && op === 'status') {
    var ping = await store.ping();
    var kommoPing = await pingKommo();
    return res.status(200).json({
      ok: true,
      supabase: store.configured(),
      supabasePing: ping,
      kommo: kommoPing.ok,
      kommoPing: kommoPing,
      whatsapp: twilioConfigured(),
      cron: Boolean(process.env.CRON_SECRET || process.env.ASSESSMENT_ADMIN_KEY),
    });
  }

  if (req.method === 'GET' && op === 'admin') {
    var adminKey = process.env.ASSESSMENT_ADMIN_KEY;
    var given = String(req.headers['x-admin-key'] || (req.query && req.query.key) || '');
    if (!adminKey || given !== adminKey) {
      return res.status(401).json({ error: 'Yetkisiz' });
    }
    try {
      var leads = await store.supabaseSelect(
        'assessment_leads',
        'select=id,student_name,parent_name,phone,grade,target_exam,source,utm_source,scores,assessment_status,test_status,appointment_status,crm_status,assigned_user_id,created_at&order=created_at.desc&limit=300'
      );
      var events = await store.supabaseSelect(
        'assessment_events',
        'select=event&limit=2000'
      );
      var counts = {};
      (events.rows || []).forEach(function (e) {
        counts[e.event] = (counts[e.event] || 0) + 1;
      });
      var rows = (leads.rows || []).map(function (r) {
        return Object.assign({}, r, { phone: maskPhone(r.phone) });
      });
      return res.status(200).json({
        ok: true,
        supabase: store.configured(),
        counts: counts,
        leads: rows,
      });
    } catch (e) {
      return res.status(500).json({ error: 'Admin verisi okunamadı.' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = parseBody(req);
  op = String(body.op || op || 'submit').trim();

  if (op === 'event') {
    trackSafe(body.event, body);
    return res.status(204).end();
  }

  if (!rateLimit(req, res)) return;

  if (op === 'submit') {
    var out = await submitLead(req, body, origin);
    if (out.honeypot) return res.status(200).json({ ok: true, reportUrl: origin + '/ucretsiz-ogrenci-analizi' });
    if (out.error) return res.status(out.status || 400).json({ error: out.error });
    return res.status(200).json(out);
  }

  if (op === 'grade-test') {
    try {
      var tdata = openPayload(body.token);
      var bankKey = pickBank(tdata.grade, tdata.targetExam);
      var result = gradeAttempt(bankKey, body.answers || []);
      tdata.testResult = result;
      tdata.testStatus = 'completed';
      var newToken = signPayload(tdata);
      var u2 = urlsFor(origin, newToken);
      if (tdata.id) {
        try {
          await store.supabasePatch('assessment_leads', tdata.id, {
            test_status: 'completed',
            test_result: result,
            crm_status: 'Test tamamlandı',
            updated_at: new Date().toISOString(),
          });
        } catch (_) {}
      }
      if (tdata.whatsapp) {
        try {
          await sendWhatsApp({
            phone: tdata.phone,
            event: 'test-complete:' + tdata.id,
            body: messageFor('test-complete', u2),
          });
        } catch (_) {}
      }
      if (tdata.kommoLeadId) {
        try {
          await addKommoNote(
            tdata.kommoLeadId,
            'Seviye testi tamamlandı: %' +
              result.percent +
              ' (' +
              result.correct +
              'D/' +
              result.wrong +
              'Y/' +
              result.blank +
              'B)\nRapor: ' +
              u2.reportUrl
          );
        } catch (_) {}
      }
      return res.status(200).json({
        ok: true,
        token: newToken,
        result: result,
        reportUrl: u2.reportUrl,
      });
    } catch (_) {
      return res.status(400).json({ error: 'Test oturumu geçersiz. Rapor bağlantısından tekrar deneyin.' });
    }
  }

  if (op === 'book') {
    try {
      var bdata = openPayload(body.token);
      var slot = {
        date: String(body.date || '').slice(0, 16),
        time: String(body.time || '').slice(0, 8),
        method: String(body.method || 'telefon').slice(0, 24),
        status: 'scheduled',
      };
      if (!slot.date || !slot.time) {
        return res.status(400).json({ error: 'Tarih ve saat seçiniz.' });
      }
      bdata.appointment = slot;
      var newTok = signPayload(bdata);
      try {
        await store.supabaseInsert('counseling_appointments', {
          lead_id: bdata.id,
          date: slot.date,
          time: slot.time,
          method: slot.method,
          status: 'scheduled',
        });
        await store.supabasePatch('assessment_leads', bdata.id, {
          appointment_status: 'scheduled',
          crm_status: 'Danışman görüşmesi planlandı',
        });
      } catch (_) {}
      try {
        await sendFormspree('Analiz danışman randevusu', {
          form: 'analiz-randevu',
          ogrenci: bdata.studentName,
          telefon: maskPhone(bdata.phone),
          tarih: slot.date,
          saat: slot.time,
          yontem: slot.method,
        });
      } catch (_) {}
      if (bdata.kommoLeadId) {
        try {
          await addKommoNote(
            bdata.kommoLeadId,
            'Randevu: ' + slot.date + ' ' + slot.time + ' · ' + slot.method
          );
        } catch (_) {}
      }
      return res.status(200).json({
        ok: true,
        token: newTok,
        appointment: slot,
        reportUrl: urlsFor(origin, newTok).reportUrl,
      });
    } catch (_) {
      return res.status(400).json({ error: 'Randevu için geçerli rapor bağlantısı gerekli.' });
    }
  }

  return res.status(400).json({ error: 'Bilinmeyen işlem' });
};
