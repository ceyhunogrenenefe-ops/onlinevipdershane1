/**
 * Seviye belirleme soru bankası — doğru şık yalnızca sunucuda.
 */
var BANK = {
  lgs: {
    title: 'LGS seviye belirleme',
    durationMin: 12,
    questions: [
      {
        id: 'lgs-mat-1',
        subject: 'Matematik',
        topic: 'Kesirler',
        kazanım: 'M.8.1.3 Kesirlerle işlemler',
        difficulty: 2,
        prompt: '3/4 + 1/6 işleminin sonucu nedir?',
        options: ['11/12', '4/10', '5/12', '1/2'],
        answer: 0,
        explain: 'Paydalar 12: 9/12 + 2/12 = 11/12.',
      },
      {
        id: 'lgs-mat-2',
        subject: 'Matematik',
        topic: 'Cebir',
        kazanım: 'M.8.2.1 Cebirsel ifadeler',
        difficulty: 2,
        prompt: '2x + 5 = 17 denkleminde x kaçtır?',
        options: ['5', '6', '7', '12'],
        answer: 1,
        explain: '2x = 12 → x = 6.',
      },
      {
        id: 'lgs-fen-1',
        subject: 'Fen',
        topic: 'Basınç',
        kazanım: 'F.8.3.1 Katı basıncı',
        difficulty: 2,
        prompt: 'Katı cisimlerde basınç hangi durumda artar?',
        options: ['Kuvvet azalırsa', 'Temas yüzeyi küçülürse', 'Kütle azalırsa', 'Yükseklik artarsa'],
        answer: 1,
        explain: 'P = F/A; yüzey küçülünce basınç artar.',
      },
      {
        id: 'lgs-tur-1',
        subject: 'Türkçe',
        topic: 'Sözcükte anlam',
        kazanım: 'T.8.3.1 Sözcük anlamı',
        difficulty: 1,
        prompt: '“İnce” sözcüğü hangi cümlede mecaz anlamda kullanılmıştır?',
        options: [
          'İnce bir ip aldı.',
          'İnce bir defter kullanıyor.',
          'İnce bir düşünce ortaya koydu.',
          'İnce bir kalem arıyorum.',
        ],
        answer: 2,
        explain: 'Düşünce için “ince” mecazdır.',
      },
      {
        id: 'lgs-sos-1',
        subject: 'T.C. İnkılap Tarihi',
        topic: 'Kurtuluş Savaşı',
        kazanım: 'İTA.8.2.1 Milli mücadele',
        difficulty: 2,
        prompt: 'TBMM hangi yılda açılmıştır?',
        options: ['1919', '1920', '1922', '1923'],
        answer: 1,
        explain: 'TBMM 23 Nisan 1920’de açıldı.',
      },
      {
        id: 'lgs-ing-1',
        subject: 'İngilizce',
        topic: 'Simple past',
        kazanım: 'E.8.2 Geçmiş zaman',
        difficulty: 1,
        prompt: '“She ____ to school yesterday.”',
        options: ['go', 'goes', 'went', 'going'],
        answer: 2,
        explain: 'Yesterday → simple past: went.',
      },
    ],
  },
  tyt: {
    title: 'TYT seviye belirleme',
    durationMin: 14,
    questions: [
      {
        id: 'tyt-mat-1',
        subject: 'Matematik',
        topic: 'Temel kavramlar',
        kazanım: 'TYT.MAT.Sayı kümeleri',
        difficulty: 2,
        prompt: '√50 ifadesinin sadeleştirilmiş hali hangisidir?',
        options: ['5√2', '25√2', '2√5', '10√5'],
        answer: 0,
        explain: '√50 = √(25·2) = 5√2.',
      },
      {
        id: 'tyt-mat-2',
        subject: 'Matematik',
        topic: 'Fonksiyon',
        kazanım: 'TYT.MAT.Fonksiyon değeri',
        difficulty: 3,
        prompt: 'f(x) = 2x − 3 ise f(5) kaçtır?',
        options: ['7', '8', '10', '13'],
        answer: 0,
        explain: '2·5 − 3 = 7.',
      },
      {
        id: 'tyt-fiz-1',
        subject: 'Fizik',
        topic: 'Hareket',
        kazanım: 'TYT.FİZ.Hız',
        difficulty: 2,
        prompt: 'Sabit süratle 2 saatte 120 km giden bir taşıtın hızı nedir?',
        options: ['40 km/s', '60 km/s', '80 km/s', '240 km/s'],
        answer: 1,
        explain: 'v = x/t = 120/2 = 60 km/s.',
      },
      {
        id: 'tyt-kim-1',
        subject: 'Kimya',
        topic: 'Periyodik sistem',
        kazanım: 'TYT.KİM.Grup-periyot',
        difficulty: 2,
        prompt: 'Aynı grupta yukarıdan aşağı inildikçe atom yarıçapı genelde nasıl değişir?',
        options: ['Küçülür', 'Değişmez', 'Büyür', 'Önce küçülür sonra büyür'],
        answer: 2,
        explain: 'Katman sayısı artar, yarıçap büyür.',
      },
      {
        id: 'tyt-bio-1',
        subject: 'Biyoloji',
        topic: 'Hücre',
        kazanım: 'TYT.BİY.Organel',
        difficulty: 1,
        prompt: 'Protein sentezinde görevli organel hangisidir?',
        options: ['Mitokondri', 'Ribozom', 'Lizozom', 'Golgi'],
        answer: 1,
        explain: 'Ribozom protein sentezler.',
      },
      {
        id: 'tyt-tur-1',
        subject: 'Türkçe',
        topic: 'Paragraf',
        kazanım: 'TYT.TÜR.Ana fikir',
        difficulty: 2,
        prompt: 'Bir paragrafın ana fikri en doğru nasıl bulunur?',
        options: [
          'Yalnızca ilk cümleden',
          'Yalnızca son cümleden',
          'Tüm metnin savunduğu temel düşünceden',
          'En uzun cümleden',
        ],
        answer: 2,
        explain: 'Ana fikir metnin bütünündeki temel savdır.',
      },
    ],
  },
  ortaokul: {
    title: 'Ortaokul seviye belirleme',
    durationMin: 10,
    questions: [
      {
        id: 'ort-mat-1',
        subject: 'Matematik',
        topic: 'Doğal sayılar',
        kazanım: 'M.6.1.1 İşlemler',
        difficulty: 1,
        prompt: '48 ÷ 6 + 2 işleminin sonucu nedir?',
        options: ['6', '8', '10', '12'],
        answer: 2,
        explain: '48÷6=8, 8+2=10.',
      },
      {
        id: 'ort-mat-2',
        subject: 'Matematik',
        topic: 'Oran',
        kazanım: 'M.7.1.4 Oran',
        difficulty: 2,
        prompt: '12’nin 3’e oranı nedir?',
        options: ['1/4', '3/12', '4', '1/3'],
        answer: 2,
        explain: '12/3 = 4.',
      },
      {
        id: 'ort-fen-1',
        subject: 'Fen',
        topic: 'Kuvvet',
        kazanım: 'F.7.3.1 Kuvvet ve enerji',
        difficulty: 2,
        prompt: 'Kütlesi olan cisimler birbirini hangi kuvvetle çeker?',
        options: ['Sürtünme', 'Manyetik', 'Yerçekimi', 'Elektrostatik'],
        answer: 2,
        explain: 'Yerçekimi (kütleçekim) kuvveti.',
      },
      {
        id: 'ort-tur-1',
        subject: 'Türkçe',
        topic: 'Yazım',
        kazanım: 'T.6.4.1 Yazım kuralları',
        difficulty: 1,
        prompt: 'Hangisi büyük harfle başlamalıdır?',
        options: ['haftanın günleri her zaman', 'özel isimler', 'tüm sıfatlar', 'tüm fiiller'],
        answer: 1,
        explain: 'Özel isimler büyük harfle yazılır.',
      },
    ],
  },
  lise: {
    title: '9. Sınıf seviye belirleme',
    durationMin: 25,
    questions: [
      // —— Türk Dili ve Edebiyatı (5) ——
      {
        id: 'lis-tur-1',
        subject: 'Türk Dili ve Edebiyatı',
        topic: 'Sözcükte anlam',
        kazanım: '9.TDE.1 Sözcük ve kavram',
        difficulty: 2,
        prompt: '“Kalın bir sesle konuştu.” cümlesinde “kalın” sözcüğü hangi anlamda kullanılmıştır?',
        options: ['Gerçek anlam', 'Mecaz anlam', 'Terim anlam', 'Eş anlamlı'],
        answer: 1,
        explain: 'Ses için “kalın” mecaz kullanımdır.',
      },
      {
        id: 'lis-tur-2',
        subject: 'Türk Dili ve Edebiyatı',
        topic: 'Cümlede anlam',
        kazanım: '9.TDE.2 Anlatım bozukluğu',
        difficulty: 2,
        prompt: 'Hangisinde anlatım bozukluğu vardır?',
        options: [
          'Kitabı bitirince yorumunu yazdı.',
          'Sabah erken kalkıp yürüyüş yaptı.',
          'Ödevleri yapıp ve teslim etti.',
          'Sınava düzenli çalışarak hazırlandı.',
        ],
        answer: 2,
        explain: '“yapıp ve” gereksiz bağlaç kullanımına yol açar.',
      },
      {
        id: 'lis-tur-3',
        subject: 'Türk Dili ve Edebiyatı',
        topic: 'Yazım kuralları',
        kazanım: '9.TDE.3 Yazım ve noktalama',
        difficulty: 1,
        prompt: 'Hangisinin yazımı doğrudur?',
        options: ['herkez', 'herkes', 'her kes', 'herkesi'],
        answer: 1,
        explain: 'Doğru yazım: herkes.',
      },
      {
        id: 'lis-tur-4',
        subject: 'Türk Dili ve Edebiyatı',
        topic: 'Edebiyat bilgisi',
        kazanım: '9.TDE.4 Edebiyat nedir',
        difficulty: 2,
        prompt: 'Edebiyatın temel malzemesi hangisidir?',
        options: ['Ses', 'Renk', 'Dil', 'Hareket'],
        answer: 2,
        explain: 'Edebiyatın malzemesi dildir.',
      },
      {
        id: 'lis-tur-5',
        subject: 'Türk Dili ve Edebiyatı',
        topic: 'Paragraf',
        kazanım: '9.TDE.5 Ana fikir',
        difficulty: 2,
        prompt: 'Bir paragrafın ana fikri genellikle nerede bulunur?',
        options: [
          'Yalnızca ilk cümlede',
          'Yalnızca son cümlede',
          'Giriş, gelişme veya sonuçta; metnin bütününde',
          'Yalnızca örneklerde',
        ],
        answer: 2,
        explain: 'Ana fikir metnin bütününe yayılabilir.',
      },
      // —— Sosyal Bilimler (5) ——
      {
        id: 'lis-sos-1',
        subject: 'Sosyal Bilimler',
        topic: 'Tarih bilimi',
        kazanım: '9.TAR.1 Tarih bilimine giriş',
        difficulty: 2,
        prompt: 'Tarih biliminde olayların yer aldığı zaman dilimini gösteren kavram hangisidir?',
        options: ['Kronoloji', 'Coğrafya', 'Arkeoloji', 'Antropoloji'],
        answer: 0,
        explain: 'Zaman sıralaması kronoloji ile yapılır.',
      },
      {
        id: 'lis-sos-2',
        subject: 'Sosyal Bilimler',
        topic: 'İlk çağ',
        kazanım: '9.TAR.2 Yazının icadı',
        difficulty: 2,
        prompt: 'Yazının icadı tarih öncesi ile tarihi çağları ayıran temel gelişmedir. Yazı ilk olarak hangi uygarlıkta ortaya çıkmıştır?',
        options: ['Roma', 'Sümer', 'Hitit', 'Pers'],
        answer: 1,
        explain: 'Çivi yazısı Sümerlerde doğmuştur.',
      },
      {
        id: 'lis-sos-3',
        subject: 'Sosyal Bilimler',
        topic: 'Coğrafya',
        kazanım: '9.COĞ.1 Harita bilgisi',
        difficulty: 1,
        prompt: 'Haritada yön bulmada kullanılan temel yönlerden biri değildir?',
        options: ['Kuzey', 'Doğu', 'Merkez', 'Güney'],
        answer: 2,
        explain: 'Ana yönler: kuzey, güney, doğu, batı.',
      },
      {
        id: 'lis-sos-4',
        subject: 'Sosyal Bilimler',
        topic: 'Uygarlık',
        kazanım: '9.TAR.3 Uygarlık özellikleri',
        difficulty: 2,
        prompt: 'Bir topluluğun “uygarlık” sayılabilmesi için hangisi daha belirleyicidir?',
        options: [
          'Yalnızca savaş gücü',
          'Yazı, yerleşik yaşam ve örgütlü toplum',
          'Yalnızca tarım yapmak',
          'Yalnızca ticaret yapmak',
        ],
        answer: 1,
        explain: 'Yazı, yerleşiklik ve toplumsal örgütlenme temel göstergelerdir.',
      },
      {
        id: 'lis-sos-5',
        subject: 'Sosyal Bilimler',
        topic: 'Din Kültürü',
        kazanım: '9.DKAB.1 İnanç bilgisi',
        difficulty: 1,
        prompt: 'İslam’da inancın temelini oluşturan kavram hangisidir?',
        options: ['İbadet', 'Tevhid', 'Ahlak', 'Zekât'],
        answer: 1,
        explain: 'Tevhid, Allah’ın birliği inancıdır.',
      },
      // —— Matematik (5) ——
      {
        id: 'lis-mat-1',
        subject: 'Matematik',
        topic: 'Üslü sayılar',
        kazanım: '9.1.2 Üslü ifadeler',
        difficulty: 2,
        prompt: '2³ · 2² işleminin sonucu nedir?',
        options: ['2⁵', '2⁶', '4⁵', '32'],
        answer: 0,
        explain: 'Tabanlar aynı: 2³⁺² = 2⁵.',
      },
      {
        id: 'lis-mat-2',
        subject: 'Matematik',
        topic: 'Köklü sayılar',
        kazanım: '9.1.3 Köklü ifadeler',
        difficulty: 2,
        prompt: '√50 ifadesinin sadeleştirilmiş hali hangisidir?',
        options: ['5√2', '25√2', '2√5', '10√5'],
        answer: 0,
        explain: '√50 = √(25·2) = 5√2.',
      },
      {
        id: 'lis-mat-3',
        subject: 'Matematik',
        topic: 'Denklem',
        kazanım: '9.2.1 Birinci dereceden denklem',
        difficulty: 2,
        prompt: '3x − 7 = 8 denkleminde x kaçtır?',
        options: ['3', '5', '7', '15'],
        answer: 1,
        explain: '3x = 15 → x = 5.',
      },
      {
        id: 'lis-mat-4',
        subject: 'Matematik',
        topic: 'Oran-orantı',
        kazanım: '9.2.2 Oran',
        difficulty: 2,
        prompt: '12’nin 3’e oranı nedir?',
        options: ['1/4', '3', '4', '9'],
        answer: 2,
        explain: '12 ÷ 3 = 4.',
      },
      {
        id: 'lis-mat-5',
        subject: 'Matematik',
        topic: 'Kümeler',
        kazanım: '9.1.1 Kümeler',
        difficulty: 2,
        prompt: 'A = {1, 2, 3} ve B = {2, 3, 4} ise A ∩ B kümesi hangisidir?',
        options: ['{1, 2, 3, 4}', '{2, 3}', '{1, 4}', '{1, 2, 3}'],
        answer: 1,
        explain: 'Kesişim ortak elemanlardır: 2 ve 3.',
      },
      // —— Fen Bilimleri (5) ——
      {
        id: 'lis-fen-1',
        subject: 'Fen Bilimleri',
        topic: 'Fizik — Vektör',
        kazanım: '9.FİZ.1 Vektörler',
        difficulty: 2,
        prompt: 'Skaler büyüklüğe örnek hangisidir?',
        options: ['Hız', 'Kuvvet', 'Sıcaklık', 'Yer değiştirme'],
        answer: 2,
        explain: 'Sıcaklık skalerdir; yönü yoktur.',
      },
      {
        id: 'lis-fen-2',
        subject: 'Fen Bilimleri',
        topic: 'Kimya — Bağlar',
        kazanım: '9.KİM.1 Kimyasal bağ',
        difficulty: 2,
        prompt: 'NaCl bileşiğindeki bağ türü nedir?',
        options: ['Kovalent', 'İyonik', 'Metalik', 'Hidrojen'],
        answer: 1,
        explain: 'Metal-ametal: iyonik bağ.',
      },
      {
        id: 'lis-fen-3',
        subject: 'Fen Bilimleri',
        topic: 'Biyoloji — Canlılık',
        kazanım: '9.BİY.1 Canlıların ortak özellikleri',
        difficulty: 2,
        prompt: 'Aşağıdakilerden hangisi tüm canlılarda ortaktır?',
        options: [
          'Fotosentez yapmak',
          'Hücresel yapıya sahip olmak',
          'Hareket etmek',
          'Tohum oluşturmak',
        ],
        answer: 1,
        explain: 'Tüm canlılar hücrelerden oluşur.',
      },
      {
        id: 'lis-fen-4',
        subject: 'Fen Bilimleri',
        topic: 'Fizik — Hareket',
        kazanım: '9.FİZ.2 Hareket',
        difficulty: 2,
        prompt: 'Sabit süratle 2 saatte 120 km giden bir taşıtın hızı nedir?',
        options: ['40 km/s', '60 km/s', '80 km/s', '240 km/s'],
        answer: 1,
        explain: 'v = x/t = 120/2 = 60 km/s.',
      },
      {
        id: 'lis-fen-5',
        subject: 'Fen Bilimleri',
        topic: 'Kimya — Periyodik sistem',
        kazanım: '9.KİM.2 Elementler',
        difficulty: 2,
        prompt: 'Periyodik tabloda aynı dikey sütundaki elementler için doğru olan hangisidir?',
        options: [
          'Aynı proton sayısına sahiptirler',
          'Benzer kimyasal özellikler gösterirler',
          'Aynı kütle numarasına sahiptirler',
          'Hepsi metaldir',
        ],
        answer: 1,
        explain: 'Grup (sütun) elementleri benzer özellik gösterir.',
      },
    ],
  },
};

function pickBank(grade, targetExam) {
  if (targetExam === 'LGS' || grade === '8') return 'lgs';
  if (targetExam === 'TYT' || targetExam === 'TYT–AYT' || targetExam === 'YÖS' || grade === 'mezun') return 'tyt';
  var g = Number(grade);
  if (g >= 9) return 'lise';
  return 'ortaokul';
}

function publicQuestions(bankKey) {
  var bank = BANK[bankKey] || BANK.ortaokul;
  return {
    key: bankKey,
    title: bank.title,
    durationMin: bank.durationMin,
    questions: bank.questions.map(function (q) {
      return {
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        kazanım: q.kazanım,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options,
      };
    }),
  };
}

function gradeAttempt(bankKey, answers) {
  var bank = BANK[bankKey] || BANK.ortaokul;
  var map = {};
  (answers || []).forEach(function (a) {
    map[a.id] = a.choice;
  });
  var bySubject = {};
  var byTopic = {};
  var correct = 0;
  var blank = 0;
  var wrong = 0;
  var details = bank.questions.map(function (q) {
    var choice = map[q.id];
    var status = 'blank';
    if (choice === undefined || choice === null || choice === '') {
      blank += 1;
    } else if (Number(choice) === q.answer) {
      status = 'correct';
      correct += 1;
    } else {
      status = 'wrong';
      wrong += 1;
    }
    bySubject[q.subject] = bySubject[q.subject] || { correct: 0, total: 0 };
    bySubject[q.subject].total += 1;
    if (status === 'correct') bySubject[q.subject].correct += 1;
    byTopic[q.topic] = byTopic[q.topic] || { subject: q.subject, kazanım: q.kazanım, correct: 0, total: 0 };
    byTopic[q.topic].total += 1;
    if (status === 'correct') byTopic[q.topic].correct += 1;
    return {
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      kazanım: q.kazanım,
      status: status,
      explain: q.explain,
    };
  });
  var total = bank.questions.length;
  var percent = total ? Math.round((correct / total) * 100) : 0;
  var topics = Object.keys(byTopic).map(function (k) {
    var t = byTopic[k];
    return {
      topic: k,
      subject: t.subject,
      kazanım: t.kazanım,
      percent: Math.round((t.correct / t.total) * 100),
    };
  });
  var strong = topics.filter(function (t) { return t.percent >= 70; });
  var weak = topics.filter(function (t) { return t.percent < 70; });
  return {
    bankKey: bankKey,
    title: bank.title,
    correct: correct,
    wrong: wrong,
    blank: blank,
    total: total,
    percent: percent,
    bySubject: Object.keys(bySubject).map(function (s) {
      var x = bySubject[s];
      return { subject: s, percent: Math.round((x.correct / x.total) * 100), correct: x.correct, total: x.total };
    }),
    topics: topics,
    strongTopics: strong,
    weakTopics: weak,
    recommended: weak.length
      ? weak.map(function (t) { return t.subject + ' / ' + t.topic; })
      : ['Genel tekrar ve deneme analizi'],
    details: details,
  };
}

module.exports = { BANK, pickBank, publicQuestions, gradeAttempt };
