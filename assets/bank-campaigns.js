(function () {
  var root = document.getElementById('bank-campaigns');
  if (!root) return;

  var listEl = document.getElementById('bank-campaigns-list');
  var toggle = root.querySelector('.bank-campaigns-toggle');
  var data = { title: 'Bankaların Eğitime Taksit Avantajları', banks: [] };

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function selectedProvider() {
    var checked = document.querySelector('input[name="payProvider"]:checked');
    return checked ? checked.value : '';
  }

  function flattenStatic(json) {
    var banks = (json.banks || []).map(function (b) {
      var fb = b.fallback || {};
      return {
        id: b.id,
        name: b.name,
        providerIds: b.providerIds || [b.id],
        color: b.color,
        url: b.url,
        listUrl: b.listUrl || b.url,
        title: fb.title || b.name,
        summary: fb.summary || '',
        installments: fb.installments || [],
        period: fb.period || '',
        source: 'fallback',
      };
    });
    return { title: json.title, disclaimer: json.disclaimer, banks: banks };
  }

  function render() {
    var provider = selectedProvider();
    var banks = data.banks || [];
    if (!banks.length) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    var titleEl = root.querySelector('[data-campaigns-title]');
    if (titleEl && data.title) titleEl.textContent = data.title;

    listEl.innerHTML = banks
      .map(function (bank) {
        var active =
          !provider ||
          (bank.providerIds || []).indexOf(provider) !== -1;
        var badges = (bank.installments || [])
          .slice(0, 3)
          .map(function (n) {
            return '<span class="bank-campaign-badge">' + escapeHtml(n) + '</span>';
          })
          .join('');
        return (
          '<article class="bank-campaign-card' +
          (active ? ' is-active' : '') +
          '" style="--bank-color:' +
          escapeHtml(bank.color || '#1a3fad') +
          '" data-bank="' +
          escapeHtml(bank.id) +
          '" title="' +
          escapeHtml(bank.summary || bank.title) +
          '">' +
          '<div class="bank-campaign-main">' +
          '<div class="bank-campaign-name">' +
          escapeHtml(bank.name) +
          '</div>' +
          '<p class="bank-campaign-title">' +
          escapeHtml(bank.title) +
          '</p></div>' +
          '<div class="bank-campaign-meta">' +
          badges +
          '<a class="detail" href="' +
          escapeHtml(bank.url) +
          '" target="_blank" rel="noopener noreferrer">Detay</a>' +
          '</div></article>'
        );
      })
      .join('');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = root.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'payProvider') render();
  });

  setTimeout(render, 500);

  fetch('/api/bank-campaigns')
    .then(function (r) {
      return r.json();
    })
    .then(function (json) {
      if (json && json.banks && json.banks.length) data = json;
      else throw new Error('empty');
      render();
    })
    .catch(function () {
      fetch('/assets/bank-campaigns.json')
        .then(function (r) {
          return r.json();
        })
        .then(function (json) {
          data = flattenStatic(json);
          render();
        })
        .catch(function () {
          root.hidden = true;
        });
    });
})();
