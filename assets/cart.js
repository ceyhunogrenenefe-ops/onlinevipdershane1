(function () {
  var STORAGE_KEY = 'ovd_cart_v1';

  function assetBase() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('assets/cart.js') !== -1) {
        return src.replace(/assets\/cart\.js.*$/, '');
      }
    }
    return '/';
  }

  function pageBase() {
    var base = assetBase();
    if (base.indexOf('../') === 0 || /programlar\//.test(location.pathname)) {
      return '../';
    }
    return base === '/' ? '' : base;
  }

  function readCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateBadge();
    window.dispatchEvent(new CustomEvent('ovd-cart-updated', { detail: items }));
  }

  function cartCount(items) {
    items = items || readCart();
    return items.reduce(function (sum, item) {
      return sum + (item.qty || 1);
    }, 0);
  }

  function cartTotal(items) {
    items = items || readCart();
    return items.reduce(function (sum, item) {
      var product = window.VIP_getProduct(item.id);
      if (!product) return sum;
      return sum + product.price * (item.qty || 1);
    }, 0);
  }

  function addToCart(productId, qty) {
    var product = window.VIP_getProduct(productId);
    if (!product) return false;
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var items = readCart();
    var found = false;
    items = items.map(function (item) {
      if (item.id === productId) {
        found = true;
        return { id: productId, qty: (item.qty || 1) + qty };
      }
      return item;
    });
    if (!found) items.push({ id: productId, qty: qty });
    writeCart(items);
    showToast(product.name + ' sepete eklendi');
    return true;
  }

  function setQty(productId, qty) {
    qty = parseInt(qty, 10);
    var items = readCart().filter(function (item) {
      if (item.id !== productId) return true;
      return qty > 0;
    }).map(function (item) {
      if (item.id === productId) return { id: productId, qty: qty };
      return item;
    });
    writeCart(items);
  }

  function removeFromCart(productId) {
    writeCart(readCart().filter(function (item) {
      return item.id !== productId;
    }));
  }

  function clearCart() {
    writeCart([]);
  }

  function showToast(message) {
    var toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
  }

  function updateBadge() {
    var badge = document.getElementById('cart-nav-badge');
    if (!badge) return;
    var count = cartCount();
    badge.textContent = String(count);
    badge.classList.toggle('show', count > 0);
  }

  function injectNavCart() {
    if (document.getElementById('cart-nav-btn')) return;
    var host =
      document.querySelector('.nav-right') ||
      document.querySelector('nav .nav-in > div:last-child') ||
      document.querySelector('nav > div > div:last-child');
    if (!host) return;

    var link = document.createElement('a');
    link.id = 'cart-nav-btn';
    link.className = 'cart-nav-btn';
    link.href = pageBase() + 'sepet.html';
    link.setAttribute('aria-label', 'Sepet');
    link.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
      '<span class="cart-nav-badge" id="cart-nav-badge">0</span>';

    var login = host.querySelector('a[href*="login"], a.btn-login');
    if (login) host.insertBefore(link, login);
    else host.insertBefore(link, host.firstChild);
    updateBadge();
  }

  function makeAddButton(productId, className) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-add-cart' + (className ? ' ' + className : '');
    btn.textContent = '🛒 Sepete Ekle';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      addToCart(productId, 1);
    });
    return btn;
  }

  function makeEducationLink(productId, className) {
    var link = document.createElement('a');
    link.className = 'btn-education-al' + (className ? ' ' + className : '');
    link.href = pageBase() + 'sepet.html?program=' + productId;
    link.innerHTML = '🛒 Eğitim Al';
    link.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    return link;
  }

  function enhanceProgramPage() {
    var product = window.VIP_getProductByPath(location.pathname);
    if (!product) return;
    var priceBox = document.querySelector('.price-box');
    if (!priceBox || priceBox.querySelector('.btn-add-cart')) return;
    var kayitBtn = priceBox.querySelector('.btn-kayit');
    var addBtn = makeEducationLink(product.id);
    if (kayitBtn) priceBox.insertBefore(addBtn, kayitBtn);
    else priceBox.appendChild(addBtn);
  }

  function productIdFromHref(href) {
    if (!href) return null;
    var file = href.split('?')[0].split('/').pop() || '';
    var names = {
      'lgs.html': 'lgs',
      'yks.html': 'yks',
      'ortaokul.html': 'ortaokul',
      'lise.html': 'lise',
      'ilkokul.html': 'ilkokul',
      'kamplar.html': 'kamplar',
      'yazili.html': 'yazili',
      'kitap.html': 'kitap',
      'start.html': 'start',
    };
    return names[file] || null;
  }

  function enhanceHomeCards() {
    document.querySelectorAll('a.prog-card').forEach(function (card) {
      if (card.dataset.cartEnhanced === '1') return;
      var href = card.getAttribute('href') || '';
      var productId = productIdFromHref(href);
      if (!productId) return;

      card.dataset.cartEnhanced = '1';
      card.removeAttribute('href');
      card.style.cursor = 'default';

      var wrap = document.createElement('div');
      wrap.className = 'prog-card-wrap card ' + card.className.replace('prog-card', '').trim();
      wrap.innerHTML = card.innerHTML;

      var actions = document.createElement('div');
      actions.className = 'prog-card-actions';
      var detail = document.createElement('a');
      detail.className = 'btn-detail';
      if (href.indexOf('/') === 0 && href.indexOf('/programlar/') === 0) {
        detail.href = href;
      } else if (href.indexOf('/') === 0) {
        detail.href = 'programlar/' + href.replace(/^\//, '');
      } else {
        detail.href = href;
      }
      detail.textContent = 'Detaylar →';
      actions.appendChild(detail);
      actions.appendChild(makeEducationLink(productId));
      wrap.appendChild(actions);

      card.replaceWith(wrap);
    });
  }

  function handleQueryAdd() {
    var params = new URLSearchParams(location.search);
    var id = params.get('program') || params.get('sepete') || params.get('add');
    if (!id || !window.VIP_getProduct(id)) return;
    addToCart(id, 1);
    params.delete('program');
    params.delete('sepete');
    params.delete('add');
    var next = location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.replaceState({}, '', next);
  }

  window.OVD_CART = {
    read: readCart,
    write: writeCart,
    add: addToCart,
    setQty: setQty,
    remove: removeFromCart,
    clear: clearCart,
    count: cartCount,
    total: cartTotal,
    pageBase: pageBase,
    assetBase: assetBase,
    showToast: showToast,
  };

  document.addEventListener('DOMContentLoaded', function () {
    injectNavCart();
    enhanceProgramPage();
    enhanceHomeCards();
    handleQueryAdd();
    if (window.OVD_ICONS && window.OVD_ICONS.hydrate) {
      window.OVD_ICONS.hydrate();
    }
  });
})();
