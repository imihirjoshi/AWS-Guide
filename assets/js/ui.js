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

  /* mobile menu. The links and the controls do not fit under about 860px,
     so below that they move into a panel that drops out of the top bar. */
  (function () {
    var bar = document.querySelector('header.top .wrap');
    var nav = document.querySelector('header.top .nav');
    var ctl = document.querySelector('header.top .ctl');
    if (!bar || !nav) return;

    var btn = document.createElement('button');
    btn.className = 'menubtn';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'mobilemenu');
    btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    bar.appendChild(btn);

    var panel = document.createElement('div');
    panel.className = 'mobilemenu';
    panel.id = 'mobilemenu';
    panel.hidden = true;
    var links = Array.prototype.map.call(nav.querySelectorAll('a'), function (a) {
      return '<a href="' + a.getAttribute('href') + '"' +
        (a.hasAttribute('aria-current') ? ' aria-current="page"' : '') + '>' + a.textContent + '</a>';
    }).join('');
    panel.innerHTML = '<div class="wrap"><nav>' + links + '</nav><div class="mmctl"></div></div>';
    document.querySelector('header.top').appendChild(panel);

    function open(on) {
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      btn.classList.toggle('on', on);
      if (on) {
        if (ctl) panel.querySelector('.mmctl').appendChild(ctl);
        panel.hidden = false;
        panel.setAttribute('data-on', '');
        document.documentElement.classList.add('menu-open');
      } else {
        panel.removeAttribute('data-on');
        panel.hidden = true;
        document.documentElement.classList.remove('menu-open');
        if (ctl) bar.appendChild(ctl);
      }
    }
    btn.addEventListener('click', function () {
      open(btn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { open(false); btn.focus(); }
    });
    panel.addEventListener('click', function (e) { if (e.target.tagName === 'A') open(false); });
    /* if the window grows back, put everything where it belongs */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && btn.getAttribute('aria-expanded') === 'true') open(false);
    });
  })();
  var path = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
    if (a.getAttribute('href') === path) a.setAttribute('aria-current', 'page');
  });
})();
