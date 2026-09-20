/**
 * TR cep: 05xx / 5xx / +90 5xx / +9 5xx → +90XXXXXXXXXX
 */
function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function normalizeTrPhone(raw) {
  var d = digitsOnly(raw);
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('90') && d.length >= 12) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 11 && d.startsWith('95')) d = d.slice(1);
  if (d.length >= 10 && d.startsWith('5')) return '+90' + d.slice(0, 10);
  return '';
}

function isValidTrMobile(raw) {
  return /^\+905\d{9}$/.test(normalizeTrPhone(raw));
}

function maskPhone(raw) {
  var n = normalizeTrPhone(raw);
  if (!n) return '';
  return n.slice(0, 6) + '****' + n.slice(-2);
}

module.exports = { digitsOnly, normalizeTrPhone, isValidTrMobile, maskPhone };
