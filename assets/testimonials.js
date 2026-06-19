(function (global) {
  var ITEMS = [
    {
      name: 'Esma Betül Tatlı',
      quote:
        'Kızım sürekli ders aldı çok memnun kaldık. Allah razı olsun hocalarımızdan bursluluk sınavında 5 yanlışımız var. Herkese tavsiye ederim. Çok kaliteli öğretmenleri var.',
    },
    {
      name: 'Nazan Sarıkayakabak',
      quote:
        'Kızımın bu sene 9. sınıfını ev konforunda, dışarıda vakit kaybetmeden Online VIP Dershane ile destek alıyor. Kaliteli eğitim.',
    },
    {
      name: 'İlknur Sancı',
      quote:
        'Hem oğlum hem kızım gidiyor; eksiklerini daha iyi planlayıp yapıyorlar. Memnunum, herkese tavsiye ediyorum.',
    },
    {
      name: 'Özlem Alperen',
      quote:
        'Emeklerinize sağlık. Çok güzel kadro, eğitim, öğretmenlerin ilgisi ve düzenli bir sistemi var.',
    },
    {
      name: 'Sevda A.',
      quote:
        'Kesinlikle şiddetle tavsiye ediyorum. İki çocuğumu da dahil ettiğim güçlü ekiple herkesin tanışması gerektiğini düşünüyorum. Emeğinize teşekkür ederim.',
    },
    {
      name: 'Aysel Kavukcuoğlu',
      quote:
        "Tecrübeli, özenli, gayretli bir ekiple 'başarı'nın tesadüf olmadığını, en önemlisi vazgeçmemeyi kızıma öğrettiğiniz için size minnettarım. Bir öğretmen olarak kesinlikle öneriyorum.",
    },
    {
      name: 'Neslihan Ülker',
      quote:
        'Kesinlikle tavsiye ediyorum; kızlarımın dersleri düzeldi. Sadece ders değil, rehberlik konusunda da çok başarılı buluyorum. Severek işinizi yaptığınız çok aşikar. Teşekkürler her şey için.',
    },
    {
      name: 'Birgül Arslan',
      quote:
        'İki kızım da ders alıyor, çok memnun kaldık. Netlerimizde artış var, çok teşekkür ederim. Her öğrenciye tavsiye ederim. Kızımın deneme yanlışları hayli fazlaydı, şu an beş yanlışlara kadar indi.',
    },
    {
      name: 'Sıla Masalcı',
      quote:
        'Eğitiminizden çok memnunuz. Öğrencimiz LGS sürecinde hem koçluk hem eğitim alıp etütlerle de ders çalışabiliyor. Öğretmenler çok ilgili. Çok teşekkür ederiz.',
    },
    {
      name: 'Elif A.',
      quote:
        'Online VIP Dershane olarak çocuklarım için tereddüt etmeden başlamış olduğum bir dershane. Gerek akademik gerek psikolojik anlamda yanımızda olan, sizi tek başınıza bırakmayan bir ekip. Çok teşekkür ederiz.',
    },
    {
      name: 'Nilay Demirci Bulut',
      quote:
        'Okul derslerine, ödevlerine ve sınavlara yönelik hazırlıkta alanında uzmanlaşmış kadrosuyla tereddüt etmeden, gönül rahatlığıyla tercih edebilirsiniz.',
    },
    {
      name: 'Aynur Ertaş',
      quote: 'Hayallerinizi gerçekleştiren dershane: Online VIP Dershane.',
    },
    {
      name: 'Nevin Karahan Zengin',
      quote:
        'Online eğitime yeni bir soluk getiren bir kadro. VIP olduğumuz için kendimizi özel hissediyoruz. Liseye başlarken korkularımız vardı, hiç pişman olmadık.',
    },
    {
      name: 'Uysal Rahat',
      quote:
        'Eğitim desteği arayan herkese tavsiye ederim. Çok başarılı bir ekip. Öğretmenlerimize çok teşekkür ederim.',
    },
    {
      name: 'Mehtap Odabaş',
      quote:
        'Çok memnunum; sayenizde matematik ve fizik dersleri artık korkulu rüyamız değil. Öğretmenlerimize çok teşekkür ederim. Gönül rahatlığıyla herkese tavsiye ederim.',
    },
    {
      name: 'Eda A.',
      quote: 'Sayısal dersler yeğenim için artık bir korku değil. Emeğiniz için teşekkürler.',
    },
    {
      name: 'İrfan Ertaş',
      quote:
        'Özverili çalışmaları için Online VIP Dershane\'ye teşekkürler. Eğitim desteği arayışında olan bütün velilere tavsiye ederim.',
    },
    {
      name: 'Durak Özgür',
      quote:
        'Online dershane ile LGS ve YKS hazırlanıyoruz. Öğretmenler mesleğini seven, iyi eğitimli ve bilgisini öğrencinin alabileceği tarzda aktarmayı başaran olağanüstü öğretmenler. Adeta bir öğrenci koçu gibi takip ediyorlar. Gönül rahatlığı ile tavsiye ediyorum.',
    },
    {
      name: 'Sema Yıldız',
      quote:
        'Sınavlarda en önemli olan rehberlik ve çocukları adapte etmektir. Daha yeni başladık ama çok memnunuz, ilgili bir ekip. Rehberlik süper. Bu yorumu bir öğretmen olarak yapıyorum. Teşekkürler, emeğinize yüreğinize sağlık.',
    },
    {
      name: 'Yüksel Atik',
      quote: 'Biz iki senedir ders alıyoruz. Çok memnunuz, kesinlikle tavsiye olunur. Teşekkürler.',
    },
    {
      name: 'Sevde Güre',
      quote: '6. sınıf kızıma destek veren bir kurstu. Her şey için teşekkür ederiz.',
    },
    {
      name: 'Zehra M.',
      quote:
        'Gerçekten çok iyiler. Kardeşimin birçok eksiği olmasına rağmen kısa sürede o eksikleri kapatmasında çok yardımları dokundu. Motivasyonu daha yüksek, severek çalışıyor. Çok memnunuz.',
    },
    {
      name: 'Umut Zafer',
      quote:
        'Online bir platformdan beklenilenin çok üzerinde bir performans görüyoruz. 7. sınıfa giden oğlum için aldık, çok memnun kaldık. Hocaların hepsine çok teşekkür ederiz.',
    },
    {
      name: 'Recep Şen',
      quote:
        'Kızım için 8. sınıfta LGS öncesi 2 ay önce tanıştık. Gerçekten çok ilgili ve başarılı bir kurum; kızımın netleri gerçekten çok yükseldi.',
    },
    {
      name: 'Beytullah Demir',
      quote:
        '7. sınıf öğrencime yapılan ders ve rehberlikten çok memnunum. Şiddetle tavsiye edilir.',
    },
    {
      name: 'Miray Akdeniz',
      quote:
        'Artık aile gibi olduk. Harika, özverili öğretmenlerin bir arada bulunduğu harika bir kurum. İyi ki siz.',
    },
    {
      name: 'Hülya Taşkın Başaran',
      quote: 'Eğitimde tek adres.',
    },
    {
      name: 'Rıfat Sami Ziya',
      quote: 'Gayretlerinden dolayı Online VIP Dershane\'yi tebrik ediyorum.',
    },
    {
      name: 'Nadide A.',
      quote:
        'Kaliteli eğitimcilerin ve konforlu online programların buluştuğu en iyi adres Online VIP Dershane.',
    },
    {
      name: 'Murat Halil Yılmazoğulları',
      quote: 'Tavsiye ediyorum, çok ilgililer.',
    },
    {
      name: 'İzzet Akbudak',
      quote: 'Ben memnunum, herkese tavsiye ederim.',
    },
    {
      name: 'Doğan A.',
      quote:
        'Tebrik ediyorum. Çalışmalarınızı ve gayretlerinizi yakinen bilen birisi olarak hayat boyu nice başarılar diliyorum.',
    },
    {
      name: 'Canan Akça',
      quote:
        'Geçen sene online etüt merkezine kayıt konusunda çok tereddütlerim vardı. Ceyhun Hocam ile tanıştıktan sonra kaygılarımı paylaştım, beni sabırla dinleyip yol gösterdi. Şimdi iyi ki başlamışız diyorum. Tüm ekibe sonsuz teşekkür ederim.',
    },
    {
      name: 'Şeyma Erdoğan',
      quote:
        'Online dershane sürecinden çok memnunuz. Öğretmenlerin ilgisi, öğrencilerle birebir iletişimi ve düzenli takibi gerçekten fark yaratıyor. Evde bile okul havasını hissettik. Emeği geçen herkese teşekkürler.',
    },
    {
      name: 'Furkan Durmuş',
      quote:
        'Kardeşim Online VIP Dershane\'ye başladığından beri derslere bakışı tamamen değişti. Öğretmenler birebir ilgileniyor, rehberlik desteğiyle planlı çalışmayı öğrendi. Kısa sürede çok güzel ilerleme kaydetti.',
    },
    {
      name: 'İpek Hanım',
      quote:
        'Kızım VIP online dershaneye katıldığı için çok mutlu; dersleri severek dinliyor ve katılıyor. Tek adresimiz oldunuz diyebilirim rahatlıkla.',
    },
  ];

  function initial(name) {
    var ch = (name || '?').trim().charAt(0);
    return ch ? ch.toLocaleUpperCase('tr-TR') : '?';
  }

  function cardsPerView() {
    if (global.matchMedia('(max-width: 640px)').matches) return 1;
    if (global.matchMedia('(max-width: 960px)').matches) return 2;
    return 3;
  }

  function cardHtml(item) {
    return (
      '<article class="tcard">' +
      '<p class="tcard-quote">' +
      item.quote +
      '</p>' +
      '<div class="tcard-author">' +
      '<div class="tcard-avatar" aria-hidden="true">' +
      initial(item.name) +
      '</div>' +
      '<div><div class="tcard-name">' +
      item.name +
      '</div><div class="tcard-role">Öğrenci Velisi</div></div>' +
      '</div></article>'
    );
  }

  function buildSlides(track) {
    var per = cardsPerView();
    var slides = [];
    for (var i = 0; i < ITEMS.length; i += per) {
      slides.push(
        '<div class="testimonials-slide">' +
          ITEMS.slice(i, i + per)
            .map(cardHtml)
            .join('') +
          '</div>'
      );
    }
    track.innerHTML = slides.join('');
    return slides.length;
  }

  function initCarousel(root) {
    var track = root.querySelector('.testimonials-track');
    var dotsEl = root.querySelector('.testimonials-dots');
    var prev = root.querySelector('.testimonials-prev');
    var next = root.querySelector('.testimonials-next');
    if (!track) return;

    var idx = 0;
    var total = 0;
    var timer;

    function renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = '';
      for (var i = 0; i < total; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'testimonials-dot' + (i === idx ? ' active' : '');
        b.setAttribute('aria-label', 'Yorum grubu ' + (i + 1));
        b.onclick = (function (n) {
          return function () {
            go(n);
            resetTimer();
          };
        })(i);
        dotsEl.appendChild(b);
      }
    }

    function go(n) {
      total = buildSlides(track);
      idx = ((n % total) + total) % total;
      track.style.transform = 'translateX(-' + idx * 100 + '%)';
      renderDots();
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(function () {
        go(idx + 1);
      }, 6000);
    }

    function rebuild() {
      var old = idx;
      total = buildSlides(track);
      go(Math.min(old, total - 1));
    }

    if (prev) {
      prev.onclick = function () {
        go(idx - 1);
        resetTimer();
      };
    }
    if (next) {
      next.onclick = function () {
        go(idx + 1);
        resetTimer();
      };
    }

    global.addEventListener('resize', rebuild);
    go(0);
    resetTimer();
  }

  global.OVD_TESTIMONIALS = { items: ITEMS, initCarousel: initCarousel };

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('testimonialsCarousel');
    if (root) initCarousel(root);
  });
})(typeof window !== 'undefined' ? window : global);
