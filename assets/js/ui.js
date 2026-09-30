/* Shared chrome: theme toggle and the currency control. */
(function () {
  'use strict';
  var root = document.documentElement;
  function apply(t) { t ? root.setAttribute('data-theme', t) : root.removeAttribute('data-theme'); }
  try { apply(localStorage.getItem('aws-theme')); } catch (e) {}
  var btn = document.getElementById('theme');
  if (btn) btn.addEventListener('click', function () {
    var cur = root.getAttribute('data-theme');
    var dark = cur === 'dark' || (!cur && window.matchMedia('(prefers-color-scheme:dark)').matches);
    var next = dark ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('aws-theme', next); } catch (e) {}
  });
  if (window.AWSCur) AWSCur.mount(document.getElementById('curbox'));
  var path = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
    if (a.getAttribute('href') === path) a.setAttribute('aria-current', 'page');
  });
})();
