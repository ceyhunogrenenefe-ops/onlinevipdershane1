(function () {
  var s = document.createElement('script');
  s.src = 'analytics-config.js';
  s.defer = true;
  document.head.appendChild(s);
  s.onload = function () {
    var p = document.createElement('script');
    p.src = 'perf-analytics.js';
    p.defer = true;
    document.head.appendChild(p);
  };
})();
