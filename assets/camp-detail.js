(function () {
  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function listItems(items) {
    return items
      .map(function (item) {
        return '<div class="feat-item">' + item + '</div>';
      })
      .join('');
  }

  function renderSections(camp) {
    var root = document.getElementById('camp-sections');
    if (!root) return;

    var sections = [
      {
        title: '📝 Tanıtım',
        html: '<p style="font-size:14px;color:#3a4a6b;line-height:1.8;">' + camp.intro + '</p>',
      },
      {
        title: '👥 Kimler Katılabilir?',
        html:
          '<p style="font-size:14px;color:#3a4a6b;line-height:1.8;">' + camp.whoCanJoin + '</p>',
      },
      {
        title: '📅 Kamp Süresi',
        html:
          '<p style="font-size:14px;color:#3a4a6b;line-height:1.8;">' + camp.duration + '</p>',
      },
      {
        title: '🗓️ Haftalık Ders Programı',
        html:
          '<div class="camp-schedule-grid">' +
          camp.weeklySchedule
            .map(function (s) {
              return '<div class="camp-schedule-item">' + s + '</div>';
            })
            .join('') +
          '</div>',
      },
      {
        title: '📋 Program İçeriği',
        html: '<div class="feat-list">' + listItems(camp.features) + '</div>',
      },
      {
        title: '🎯 Hedefler',
        html: '<div class="feat-list">' + listItems(camp.goals) + '</div>',
      },
      {
        title: '✨ Kazanımlar',
        html: '<div class="feat-list">' + listItems(camp.gains) + '</div>',
      },
      {
        title: '🏫 Eğitim Modeli',
        html:
          '<p style="font-size:14px;color:#3a4a6b;line-height:1.8;">' +
          camp.educationModel +
          '</p>',
      },
      {
        title: '🧭 Koçluk Sistemi',
        html:
          '<p style="font-size:14px;color:#3a4a6b;line-height:1.8;">' + camp.coaching + '</p>',
      },
      {
        title: '📊 Deneme Sistemi',
        html: '<p style="font-size:14px;color:#3a4a6b;line-height:1.8;">' + camp.exams + '</p>',
      },
      {
        title: '💻 Canlı Dersler',
        html:
          '<p style="font-size:14px;color:#3a4a6b;line-height:1.8;">' +
          camp.liveLessons +
          '</p>',
      },
      {
        title: '⏱️ Soru Çözüm & Çalışma Saatleri',
        html:
          '<p style="font-size:14px;color:#3a4a6b;line-height:1.8;">' +
          camp.studyHours +
          '</p>',
      },
      {
        title: '❓ Sık Sorulan Sorular',
        html:
          camp.faq
            .map(function (f) {
              return (
                '<details class="camp-faq-item"><summary>' +
                f.q +
                '</summary><p>' +
                f.a +
                '</p></details>'
              );
            })
            .join(''),
      },
    ];

    sections.forEach(function (sec) {
      var block = el('div', 'content-sec');
      block.appendChild(el('h2', '', sec.title));
      var inner = document.createElement('div');
      inner.innerHTML = sec.html;
      block.appendChild(inner);
      root.appendChild(block);
    });

    var meb = el('div', 'content-sec');
    meb.innerHTML =
      '<h2>📚 Resmi Kaynaklar & MEB Uyumu</h2>' +
      '<p style="font-size:14px;color:#6e6e73;margin-bottom:10px;">Program MEB müfredatına uygun olarak hazırlanmıştır.</p>' +
      '<div class="link-list">' +
      '<a href="https://mufredat.meb.gov.tr/" target="_blank" rel="noopener" class="link-item">🔗 MEB Müfredat</a>' +
      '<a href="https://eba.gov.tr/" target="_blank" rel="noopener" class="link-item">🔗 EBA</a>' +
      '</div>';
    root.appendChild(meb);
  }

  function init() {
    var campId = document.body.getAttribute('data-camp');
    if (!campId || !window.OVD_getCamp) return;
    var camp = window.OVD_getCamp(campId);
    if (!camp) return;
    renderSections(camp);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
