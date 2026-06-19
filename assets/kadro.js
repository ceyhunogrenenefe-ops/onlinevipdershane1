(function (global) {
  var TEAM = [
    {
      slug: 'dogan-akturk',
      name: 'Doğan Aktürk',
      role: 'Matematik Öğretmeni · LGS, YKS, KPSS',
      photo: 'assets/img/kadro/dogan-akturk.jpg',
      short:
        '16 yıllık deneyim. Orta ve lise kademesinde matematik; eğitim koçluğu ile birlikte online ders.',
      bio:
        'Merhaba ben matematik öğretmeni Doğan Aktürk. 16 yıldır birçok öğretim kurumunda orta ve lise kademelerinde matematik derslerine girdim. Özel öğretim kurumlarında LGS, YKS ve KPSS sınavlarına yönelik öğrencilerime matematik dersleri verdim. Şimdi Online VIP Dershane\'de eğitim koçluğuyla birlikte matematik dersleri vermekteyim. Değişen sınav sistemini takip ediyor, farklı yayınların kitaplarını tarayarak çıkmış sorulara en yakın soruları çözüyoruz. Öğrencilerimle kişiye özgü çalışma programıyla derslere başlıyoruz; konu anlatımına boğmadan bol soru çözerek pekiştiriyoruz.',
    },
    {
      slug: 'demet',
      name: 'Demet',
      role: 'İlköğretim Matematik Öğretmeni',
      photo: 'assets/img/kadro/demet.jpg',
      short:
        '2017 mezunu. Matematiği sevdirmeyi, korkuları gidermeyi ve interaktif yöntemlerle anlatmayı hedefliyor.',
      bio:
        'Merhaba ben Demet öğretmen, İlköğretim Matematik Öğretmenliği 2017 mezunuyum. Temel amacım öğrencilerime matematik dersini sevdirmek ve korkularını gidermek. İnteraktif eğitim metodlarını kullanarak web2 araçlarıyla da anlatımı zenginleştirerek, konunun kavranmasını desteklerim. Ayrıca öğrencilerime özgüven kazandırarak keyifli ve verimli bir ders süreci geçiririm. Ezberci yaklaşımdan kaçınarak onlara bilgiye ulaşmaları için alan tanırım.',
    },
    {
      slug: 'tayyibe-ogrenenefe',
      name: 'Tayyibe Öğrenenefe',
      role: 'Biyoloji Öğretmeni',
      photo: 'assets/img/kadro/tayyibe-ogrenenefe.jpg',
      short:
        '2010\'dan beri öğretmen. Fen bilimlerini ve biyolojiyi doğayla birleştirerek, merak uyandırarak anlatıyor.',
      bio:
        '1986 yılında Aydın\'da doğdum. İlkokul, ortaokul ve lise eğitimimi Aydın\'da tamamladım. 2010 yılında Dicle Üniversitesi Biyoloji Öğretmenliğinden mezun oldum. 2010 yılından bu yana öğretmenlik mesleğini sürdürüyorum. Doğayı seven, meraklı, araştırmacı biriyim. Fen bilimleri ve biyoloji dersini doğa ile bütünleştirip çocukların çevrelerinde gelişen olayların farkında olmalarını sağlamak öncelikli hedeflerim arasında.',
    },
    {
      slug: 'nadide-akturk',
      name: 'Nadide Aktürk',
      role: 'Sosyal Bilgiler · Çocuk Gelişimi Uzmanı',
      photo: 'assets/img/kadro/nadide-akturk.jpg',
      short:
        'Sosyal bilgiler öğretmeni ve çocuk gelişim uzmanı. Etüt programlarında rehberlik ve LGS eğitim koçluğu.',
      bio:
        'Merhaba, ben Nadide Aktürk. Dershanemiz sosyal bilgiler öğretmeniyim; aynı zamanda çocuk gelişimi uzmanıyım. 2011 yılı Süleyman Demirel Üniversitesi mezuniyetimden itibaren çeşitli eğitim kurumlarında sosyal bilgiler alanında öğretmenlik yaptım. Ayrıca çocuk gelişimci olarak da eğitim verdim. Şu an Online VIP Dershane bünyesinde etüt programlarında öğrencilerimize rehberlik yapıyor; LGS sürecinde eğitim koçluğu desteği sağlıyorum.',
    },
    {
      slug: 'eda-akturk',
      name: 'Eda Aktürk',
      role: 'Psikoterapist',
      photo: 'assets/img/kadro/eda-akturk.jpg',
      short:
        'Çocuk, ergen, yetişkin, çift ve ailelerle çalışan psikoterapist. Bireysel ihtiyaçlara uygun terapi yaklaşımları.',
      bio:
        'Psikoterapist Eda Aktürk. Çeşitli yaş gruplarından bireylerle çalışarak hayatlarında anlamlı ve pozitif değişiklikler yapmalarına destek oluyorum. Her bireyin kendine has bir hikâyesi olduğuna inanıyorum; danışanlarıma bireysel ihtiyaçlarına uygun, özelleştirilmiş terapi yaklaşımları sunuyorum. Sistemik psikoterapi, çocuk merkezli oyun terapisi, bilişsel davranışçı terapi ve çözüm odaklı terapi ekollerinden yararlanıyorum.',
    },
    {
      slug: 'mustafa-kozan',
      name: 'Mustafa Kozan',
      role: 'Sosyal Bilgiler Öğretmeni',
      photo: 'assets/img/kadro/mustafa-kozan.jpg',
      short: 'Sosyal bilgiler derslerinde konu anlatımı, tekrar ve sınav odaklı çalışma.',
      bio: 'Online VIP Dershane bünyesinde sosyal bilgiler öğretmeni olarak görev yapmaktadır. Öğrencilerin konuları kalıcı öğrenmesi ve sınavlara hazırlanması için düzenli ders ve tekrar programıyla çalışır.',
    },
    {
      slug: 'mustafa-ozturk',
      name: 'Mustafa Öztürk',
      role: 'İngilizce Öğretmeni',
      photo: 'assets/img/kadro/mustafa-ozturk.jpg',
      short: 'İngilizce derslerinde temel dil becerileri, kelime ve okuduğunu anlama çalışmaları.',
      bio: 'Online VIP Dershane\'de İngilizce öğretmeni olarak görev almaktadır. Öğrencilerin dinleme, konuşma, okuma ve yazma becerilerini adım adım geliştirmeye odaklanır.',
    },
    {
      slug: 'turgut-usul',
      name: 'Turgut Usul',
      role: 'Türkçe Öğretmeni',
      photo: 'assets/img/kadro/turgut-usul.jpg',
      short: 'Türkçe derslerinde okuma, yazma, dil bilgisi ve anlama becerileri.',
      bio: 'Online VIP Dershane bünyesinde Türkçe öğretmeni olarak görev yapmaktadır. Öğrencilerin dil becerilerini güçlendirmek ve sınavlara hazırlanmalarına destek olmak için canlı derslerde birlikte çalışır.',
    },
  ];

  function cardHtml(member, expanded) {
    var text = expanded ? member.bio : member.short;
    return (
      '<article class="team-card" id="kadro-' +
      member.slug +
      '">' +
      '<div class="team-photo team-photo--img">' +
      '<img src="' +
      member.photo +
      '" alt="' +
      member.name +
      ' — ' +
      member.role +
      '" loading="lazy" width="120" height="120">' +
      '</div>' +
      '<h3>' +
      member.name +
      '</h3>' +
      '<div class="team-sub">' +
      member.role +
      '</div>' +
      '<p>' +
      text +
      '</p>' +
      '</article>'
    );
  }

  function renderInto(el, expanded) {
    if (!el) return;
    el.innerHTML = TEAM.map(function (m) {
      return cardHtml(m, expanded);
    }).join('');
  }

  global.OVD_KADRO = {
    team: TEAM,
    renderHome: function () {
      renderInto(document.getElementById('teamGridHome'), false);
    },
    renderPage: function () {
      renderInto(document.getElementById('teamGridFull'), true);
    },
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('teamGridHome')) global.OVD_KADRO.renderHome();
    if (document.getElementById('teamGridFull')) global.OVD_KADRO.renderPage();
  });
})(typeof window !== 'undefined' ? window : global);
