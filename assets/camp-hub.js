(function () {
  var ICONS = {
    'book-open': '📚',
    trophy: '🏆',
    'graduation-cap': '🎓',
    target: '🎯',
    rocket: '🚀',
    tent: '⛺',
  };

  function formatPrice(n) {
    return n.toLocaleString('tr-TR') + '₺';
  }

  function renderCards() {
    var grid = document.getElementById('camp-cards-grid');
    if (!grid || !window.OVD_listCamps) return;

    grid.innerHTML = '';
    window.OVD_listCamps().forEach(function (camp) {
      var card = document.createElement('a');
      card.href = camp.slug;
      card.className = 'prog-card camp-card camp-card--' + camp.theme;

      var thumb = document.createElement('div');
      thumb.className = 'prog-thumb';
      var img = document.createElement('img');
      img.src = camp.image.replace('../', '../');
      img.alt = camp.title + ' afişi';
      img.loading = 'lazy';
      img.onerror = function () {
        thumb.className = 'prog-thumb prog-thumb--icon';
        thumb.innerHTML =
          '<div class="camp-card-icon">' + (ICONS[camp.icon] || '⛺') + '</div>';
      };
      thumb.appendChild(img);

      var body = document.createElement('div');
      body.className = 'prog-card-body';
      body.innerHTML =
        '<div class="camp-card-badge">' +
        (ICONS[camp.icon] || '⛺') +
        ' ' +
        camp.tag.split('·')[0].trim() +
        '</div>' +
        '<h3>' +
        camp.cardTitle +
        '</h3>' +
        '<p>' +
        camp.shortDesc +
        '</p>' +
        '<div class="prog-price">' +
        formatPrice(camp.price) +
        ' <span>/ kamp</span></div>' +
        '<span class="prog-arrow">→</span>';

      card.appendChild(thumb);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCards);
  } else {
    renderCards();
  }
})();
