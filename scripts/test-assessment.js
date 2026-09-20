var assert = require('assert');
var scoring = require('../api/_lib/assessment-scoring');
var phone = require('../api/_lib/assessment-phone');
var token = require('../api/_lib/assessment-token');
var questions = require('../api/_lib/assessment-questions');
var wa = require('../api/_lib/assessment-whatsapp');
var validate = require('../api/_lib/assessment-validate');
var kommo = require('../api/_lib/kommo');

function sample(over) {
  return Object.assign(
    {
      who: 'cocuk',
      studentName: 'Deniz',
      grade: '8',
      targetExam: 'LGS',
      weakSubjects: ['Matematik', 'Fen'],
      examResult: '280',
      weeklyPlan: 'no',
      homeworkSelf: 'no',
      mocks: 'no',
      mistakeReview: 'no',
      dailyMinutes: 20,
      supportNeeds: ['Eğitim koçluğu', 'Çalışma disiplini'],
    },
    over || {}
  );
}

var r = scoring.scoreAssessment(sample());
assert.ok(r.scores.academic >= 0 && r.scores.academic <= 100);
assert.ok(r.scores.routine >= 0 && r.scores.routine <= 100);
assert.ok(r.scores.examPrep >= 0 && r.scores.examPrep <= 100);
assert.ok(r.scores.coaching > 50, 'koçluk ihtiyacı yüksek olmalı');
assert.ok(r.disclaimer.indexOf('ön değerlendirme') !== -1);

var strong = scoring.scoreAssessment(
  sample({
    weakSubjects: [],
    examResult: '450',
    weeklyPlan: 'yes',
    homeworkSelf: 'yes',
    mocks: 'regular',
    mistakeReview: 'yes',
    dailyMinutes: 150,
    supportNeeds: [],
  })
);
assert.ok(strong.scores.routine > r.scores.routine);
assert.ok(strong.scores.examPrep > r.scores.examPrep);

assert.strictEqual(phone.normalizeTrPhone('0532 111 22 33'), '+905321112233');
assert.strictEqual(phone.normalizeTrPhone('5321112233'), '+905321112233');
assert.strictEqual(phone.normalizeTrPhone('+90 532 111 22 33'), '+905321112233');
assert.strictEqual(phone.normalizeTrPhone('+905321112233'), '+905321112233');
assert.strictEqual(phone.normalizeTrPhone('+9 532 111 22 33'), '+905321112233');
assert.ok(phone.isValidTrMobile('05551234567'));
assert.ok(phone.isValidTrMobile('+90 555 123 45 67'));
assert.ok(!phone.isValidTrMobile('02121234567'));
assert.ok(!phone.isValidTrMobile('123'));
assert.ok(phone.maskPhone('05551234567').indexOf('****') !== -1);

assert.ok(validate.validateContact({ parentName: 'Ayşe Yılmaz', phone: '05551234567', city: 'İstanbul', kvkk: true }) === null);
assert.ok(validate.validateContact({ parentName: 'Ayşe Yılmaz', phone: '05551234567', kvkk: true }) === null);
assert.ok(validate.validateContact({ parentName: 'Ayşe', phone: '05551234567', city: 'İstanbul', kvkk: false }));
assert.ok(validate.validateContact({ parentName: '', phone: '05551234567', city: 'İstanbul', kvkk: true }));
assert.ok(validate.validateContact({ parentName: 'Ayşe', phone: '02121234567', city: 'İstanbul', kvkk: true }));
assert.ok(validate.validateAnswers({ studentName: 'Deniz', grade: '8' }) === null);
assert.ok(validate.validateAnswers({ studentName: '', grade: '8' }));

process.env.ASSESSMENT_TOKEN_SECRET = 'test-secret-32-chars-minimum-value';
var packed = token.signPayload({ id: 'abc', phone: '+905321112233' });
var opened = token.openPayload(packed);
assert.strictEqual(opened.id, 'abc');
assert.throws(function () { token.openPayload('xxx'); });
assert.throws(function () { token.openPayload(packed.slice(0, 12) + 'aaaa'); });
var id = token.randomId();
assert.ok(/^[0-9a-f-]{36}$/i.test(id), 'uuid format');

var pub = questions.publicQuestions('lgs');
assert.ok(pub.questions.length > 0);
assert.strictEqual(pub.questions[0].answer, undefined);
assert.ok(!('answer' in pub.questions[0]));
var firstId = pub.questions[0].id;
var bank = questions.BANK.lgs;
var correctChoice = bank.questions[0].answer;
var allCorrect = bank.questions.map(function (q) { return { id: q.id, choice: q.answer }; });
var gradedAll = questions.gradeAttempt('lgs', allCorrect);
assert.strictEqual(gradedAll.correct, gradedAll.total);
assert.strictEqual(gradedAll.percent, 100);
var graded = questions.gradeAttempt('lgs', [{ id: firstId, choice: correctChoice === 0 ? 1 : 0 }]);
assert.ok(graded.wrong >= 1);
assert.ok(graded.correct + graded.wrong + graded.blank === graded.total);
assert.ok(Array.isArray(graded.weakTopics));
assert.ok(questions.pickBank('8', 'LGS') === 'lgs');
assert.ok(questions.pickBank('11', 'TYT–AYT') === 'tyt');
assert.ok(questions.pickBank('9', '') === 'lise');
assert.strictEqual(questions.BANK.lise.questions.length, 20);
var liseSubjects = {};
questions.BANK.lise.questions.forEach(function (q) {
  liseSubjects[q.subject] = (liseSubjects[q.subject] || 0) + 1;
});
assert.strictEqual(liseSubjects['Türk Dili ve Edebiyatı'], 5);
assert.strictEqual(liseSubjects['Sosyal Bilimler'], 5);
assert.strictEqual(liseSubjects['Matematik'], 5);
assert.strictEqual(liseSubjects['Fen Bilimleri'], 5);
var liseGraded = questions.gradeAttempt(
  'lise',
  questions.BANK.lise.questions.map(function (q) { return { id: q.id, choice: q.answer }; })
);
assert.strictEqual(liseGraded.percent, 100);

var k1 = token.idempotencyKey('contact', '+905321112233');
var k2 = token.idempotencyKey('contact', '+905321112233');
assert.strictEqual(k1, k2);
assert.notStrictEqual(k1, token.idempotencyKey('contact', '+905399999999'));

wa._sent.set(token.idempotencyKey('dup', '+905321112233'), Date.now());
assert.ok(wa._sent.has(token.idempotencyKey('dup', '+905321112233')));

assert.strictEqual(kommo.extractKommoLeadId([{ id: 99 }]), 99);
assert.strictEqual(kommo.extractKommoLeadId({ _embedded: { leads: [{ id: 7 }] } }), 7);
assert.ok(kommo.kommoConfig() === null || kommo.kommoConfig().pipelineId);

return wa.sendWhatsApp({ phone: '+905321112233', event: 'unit', body: 'x' }).then(function (out) {
  assert.ok(out.skipped, 'Twilio yokken mesaj atlanmalı');
  console.log('assessment tests ok');
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
