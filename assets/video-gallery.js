(function (global) {
  'use strict';

  var CAT_LABELS = {
    dijital: 'Dijital Denge & Odak',
    sosyal: 'Sosyal Çevre & İlişkiler',
    zihin: 'Zihin & Performans',
  };

  function thumbUrl(id) {
    return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function mountCultureGallery(root) {
    if (!root || !global.OVD_VIDEOS || !OVD_VIDEOS.culture) return;

    var videos = OVD_VIDEOS.culture.slice();
    var grid = root.querySelector('[data-culture-grid]');
    var filters = root.querySelector('[data-culture-filters]');
    var empty = root.querySelector('[data-culture-empty]');
    var modal = document.querySelector('[data-culture-modal]');
    var modalFrame = modal && modal.querySelector('[data-culture-modal-frame]');
    var modalTitle = modal && modal.querySelector('[data-culture-modal-title]');
    var modalDesc = modal && modal.querySelector('[data-culture-modal-desc]');
    var modalClose = modal && modal.querySelector('[data-culture-modal-close]');
    var activeFilter = 'all';
    var animating = false;

    if (!grid || !filters) return;

    function visibleList() {
      if (activeFilter === 'all') return videos.slice();
      return videos.filter(function (v) {
        return v.category === activeFilter;
      });
    }

    function cardHtml(v, index) {
      var tag = CAT_LABELS[v.category] || v.category;
      return (
        '<button type="button" class="ovd-culture-card" data-youtube="' +
        escapeHtml(v.id) +
        '" data-title="' +
        escapeHtml(v.title) +
        '" data-desc="' +
        escapeHtml(v.desc) +
        '" style="animation-delay:' +
        index * 45 +
        'ms">' +
        '<div class="ovd-culture-card__thumb">' +
        '<img src="' +
        thumbUrl(v.id) +
        '" alt="" loading="lazy" decoding="async" width="480" height="300">' +
        '<div class="ovd-culture-card__play" aria-hidden="true"><span>▶</span></div>' +
        (v.duration
          ? '<span class="ovd-culture-card__duration">' + escapeHtml(v.duration) + '</span>'
          : '') +
        '</div>' +
        '<div class="ovd-culture-card__body">' +
        '<span class="ovd-culture-card__tag" data-cat="' +
        escapeHtml(v.category) +
        '">' +
        escapeHtml(tag) +
        '</span>' +
        '<h3 class="ovd-culture-card__title">' +
        escapeHtml(v.title) +
        '</h3>' +
        '<p class="ovd-culture-card__desc">' +
        escapeHtml(v.desc) +
        '</p>' +
        '</div>' +
        '</button>'
      );
    }

    function renderGrid(animate) {
      var list = visibleList();
      if (empty) {
        empty.classList.toggle('is-visible', list.length === 0);
      }
      if (!animate) {
        grid.innerHTML = list.map(cardHtml).join('');
        return;
      }
      animating = true;
      var cards = grid.querySelectorAll('.ovd-culture-card');
      cards.forEach(function (card) {
        card.classList.add('is-leaving');
      });
      window.setTimeout(function () {
        grid.innerHTML = list.map(cardHtml).join('');
        grid.querySelectorAll('.ovd-culture-card').forEach(function (card) {
          card.classList.add('is-entering');
        });
        animating = false;
      }, 280);
    }

    function setFilter(next) {
      if (animating || next === activeFilter) return;
      activeFilter = next;
      filters.querySelectorAll('.ovd-culture-gallery__filter').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.filter === activeFilter);
      });
      renderGrid(true);
    }

    function openModal(id, title, desc) {
      if (!modal || !modalFrame) return;
      modalFrame.src =
        'https://www.youtube.com/embed/' +
        id +
        '?autoplay=1&rel=0&modestbranding=1';
      if (modalTitle) modalTitle.textContent = title || '';
      if (modalDesc) modalDesc.textContent = desc || '';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      if (!modal || !modalFrame) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      modalFrame.src = '';
      document.body.style.overflow = '';
    }

    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.ovd-culture-gallery__filter');
      if (!btn) return;
      setFilter(btn.dataset.filter || 'all');
      filters.querySelectorAll('.ovd-culture-gallery__filter').forEach(function (b) {
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
    });

    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.ovd-culture-card');
      if (!card) return;
      openModal(card.dataset.youtube, card.dataset.title, card.dataset.desc);
    });

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    renderGrid(false);
  }

  function boot() {
    document.querySelectorAll('[data-culture-gallery]').forEach(mountCultureGallery);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.OVD_CultureGallery = { mount: mountCultureGallery };
})(typeof window !== 'undefined' ? window : global);
