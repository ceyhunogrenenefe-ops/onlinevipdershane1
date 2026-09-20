/**
 * Ön değerlendirme puanlama kuralları (0–100).
 * Dağınık if'ler yerine tek config.
 */
var WEIGHTS = {
  academic: {
    base: 78,
    perWeakSubject: -9,
    exam: {
      unknown: -8,
      low: -18,
      mid: -4,
      high: 8,
    },
    gradeBoost: {
      '3': 4,
      '4': 4,
      mezun: -4,
    },
  },
  routine: {
    base: 42,
    weeklyPlan: { yes: 22, partial: 10, no: -6 },
    homeworkSelf: { yes: 16, partial: 6, no: -8 },
    dailyMinutes: [
      { min: 120, add: 22 },
      { min: 90, add: 16 },
      { min: 60, add: 10 },
      { min: 30, add: 4 },
      { min: 0, add: -8 },
    ],
  },
  examPrep: {
    base: 38,
    mocks: { regular: 24, sometimes: 10, no: -10 },
    mistakeReview: { yes: 22, sometimes: 8, no: -8 },
    goal: {
      LGS: 6,
      TYT: 6,
      'TYT–AYT': 8,
      YÖS: 4,
      okul: 0,
      diger: 0,
    },
  },
  coaching: {
    base: 35,
    needs: {
      'Konu eksikliği': 8,
      'Soru çözümü': 6,
      'Çalışma disiplini': 16,
      Motivasyon: 14,
      'Ödev takibi': 14,
      'Deneme analizi': 10,
      'Eğitim koçluğu': 18,
      'Öğretmen takibi': 12,
    },
    noPlan: 12,
    noHomework: 10,
    noMocks: 8,
  },
};

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

function examBand(answers) {
  var raw = String(answers.examResult || '').trim().toLowerCase();
  if (!raw || raw === 'bilmiyorum' || raw === 'yok') return 'unknown';
  var num = parseFloat(String(raw).replace(',', '.').replace(/[^\d.]/g, ''));
  if (!isFinite(num)) return 'unknown';
  var goal = answers.targetExam;
  if (goal === 'LGS') {
    if (num >= 400) return 'high';
    if (num >= 320) return 'mid';
    return 'low';
  }
  if (goal === 'TYT' || goal === 'TYT–AYT') {
    if (num >= 80) return 'high';
    if (num >= 50) return 'mid';
    return 'low';
  }
  if (num >= 80) return 'high';
  if (num >= 60) return 'mid';
  return 'low';
}

function scoreAcademic(a) {
  var w = WEIGHTS.academic;
  var s = w.base;
  var weak = Array.isArray(a.weakSubjects) ? a.weakSubjects.length : 0;
  s += weak * w.perWeakSubject;
  s += w.exam[examBand(a)] || 0;
  if (w.gradeBoost[a.grade] != null) s += w.gradeBoost[a.grade];
  return clamp(s);
}

function scoreRoutine(a) {
  var w = WEIGHTS.routine;
  var s = w.base;
  s += w.weeklyPlan[a.weeklyPlan] || 0;
  s += w.homeworkSelf[a.homeworkSelf] || 0;
  var mins = Number(a.dailyMinutes);
  if (!isFinite(mins)) mins = 0;
  var add = w.dailyMinutes[w.dailyMinutes.length - 1].add;
  for (var i = 0; i < w.dailyMinutes.length; i++) {
    if (mins >= w.dailyMinutes[i].min) {
      add = w.dailyMinutes[i].add;
      break;
    }
  }
  s += add;
  return clamp(s);
}

function scoreExamPrep(a) {
  var w = WEIGHTS.examPrep;
  var s = w.base;
  s += w.mocks[a.mocks] || 0;
  s += w.mistakeReview[a.mistakeReview] || 0;
  s += w.goal[a.targetExam] || 0;
  return clamp(s);
}

function scoreCoaching(a) {
  var w = WEIGHTS.coaching;
  var s = w.base;
  var needs = Array.isArray(a.supportNeeds) ? a.supportNeeds : [];
  needs.forEach(function (n) {
    s += w.needs[n] || 0;
  });
  if (a.weeklyPlan === 'no') s += w.noPlan;
  if (a.homeworkSelf === 'no') s += w.noHomework;
  if (a.mocks === 'no') s += w.noMocks;
  return clamp(s);
}

function strengthsAndGaps(scores) {
  var labels = {
    academic: 'Akademik hazırbulunuşluk',
    routine: 'Çalışma düzeni',
    examPrep: 'Sınav hazırlık seviyesi',
    coaching: 'Takip ve eğitim koçluğu ihtiyacı',
  };
  var entries = Object.keys(labels).map(function (k) {
    return { key: k, label: labels[k], value: scores[k] };
  });
  var sorted = entries.slice().sort(function (a, b) {
    return b.value - a.value;
  });
  var strengths = sorted.filter(function (x) {
    return x.key !== 'coaching' && x.value >= 62;
  }).slice(0, 2);
  var gaps = sorted
    .filter(function (x) {
      if (x.key === 'coaching') return x.value >= 55;
      return x.value < 62;
    })
    .sort(function (a, b) {
      if (a.key === 'coaching') return -1;
      if (b.key === 'coaching') return 1;
      return a.value - b.value;
    })
    .slice(0, 3);
  return { strengths: strengths, gaps: gaps };
}

function narrative(answers, scores) {
  var name = String(answers.studentName || 'Öğrencimiz').trim() || 'Öğrencimiz';
  var parts = [];
  parts.push(
    name +
      ' için verilen yanıtlara göre bir ön değerlendirme oluşturuldu. Bu sonuç kesin ders/kazanım ölçümü değildir.'
  );
  if (scores.routine < 55) {
    parts.push('Çalışma düzeni henüz oturmamış görünüyor; haftalık plan ve ödev takibi öncelikli destek alanı olabilir.');
  } else {
    parts.push('Çalışma düzeninde temel alışkanlıklar kısmen oluşmuş; bunları sürdürmek faydalı olacaktır.');
  }
  if (scores.coaching >= 60) {
    parts.push('Eğitim koçluğu ve düzenli öğretmen takibi, mevcut tempoyu yükseltmede belirgin katkı sağlayabilir.');
  }
  if (Array.isArray(answers.weakSubjects) && answers.weakSubjects.length) {
    parts.push('Zorlanılan dersler olarak belirtilen alanlar: ' + answers.weakSubjects.join(', ') + '.');
  }
  return parts.join(' ');
}

function nextStep(scores) {
  if (scores.examPrep < 50 || scores.academic < 55) {
    return 'Ücretsiz seviye belirleme testi ile konu ve kazanım bazlı gerçek tabloyu çıkaralım.';
  }
  return 'Seviye belirleme testi sonrasında eğitim danışmanımızla ücretsiz görüşerek yol haritasını netleştirelim.';
}

function scoreAssessment(answers) {
  var scores = {
    academic: scoreAcademic(answers),
    routine: scoreRoutine(answers),
    examPrep: scoreExamPrep(answers),
    coaching: scoreCoaching(answers),
  };
  var sg = strengthsAndGaps(scores);
  return {
    scores: scores,
    strengths: sg.strengths,
    gaps: sg.gaps,
    summary: narrative(answers, scores),
    nextStep: nextStep(scores),
    disclaimer:
      'Bu sonuç, verilen cevaplardan oluşturulan bir ön değerlendirmedir. Konu ve kazanım bazlı akademik seviye, ücretsiz seviye belirleme testi tamamlandıktan sonra oluşturulacaktır.',
  };
}

module.exports = {
  WEIGHTS: WEIGHTS,
  clamp: clamp,
  examBand: examBand,
  scoreAcademic: scoreAcademic,
  scoreRoutine: scoreRoutine,
  scoreExamPrep: scoreExamPrep,
  scoreCoaching: scoreCoaching,
  scoreAssessment: scoreAssessment,
};
