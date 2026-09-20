(function () {
  function run() {
    if (typeof VIP_hydrateEducationPrices === 'function') {
      VIP_hydrateEducationPrices();
      return;
    }
    setTimeout(run, 30);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
