const { isValidTrMobile } = require('./assessment-phone');

function validateContact(c) {
  if (!c || !String(c.parentName || '').trim()) return 'Veli adı soyadı zorunludur.';
  if (!isValidTrMobile(c.phone)) return 'Geçerli bir Türkiye cep telefonu girin (05xx xxx xx xx).';
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email))) return 'Geçerli e-posta girin veya boş bırakın.';
  if (!c.kvkk) return 'Devam etmek için KVKK aydınlatma metnini kabul etmelisiniz.';
  return null;
}

function validateAnswers(a) {
  if (!a || !String(a.studentName || '').trim()) return 'Öğrenci adı zorunludur.';
  if (!a.grade) return 'Sınıf zorunludur.';
  return null;
}

module.exports = { validateContact, validateAnswers };
