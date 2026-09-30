/* A small, versioned acknowledgement of the educational notice.
   Bump NOTICE_VERSION whenever legal.html changes in a way readers should see again.
   Nothing is sent anywhere. The acknowledgement lives in this browser only. */
(function () {
  'use strict';
  var NOTICE_VERSION = '2026-09-30';
  var KEY = 'aws-notice-ack';

  var seen = null;
  try { seen = localStorage.getItem(KEY); } catch (e) { seen = null; }
  if (seen === NOTICE_VERSION) return;
  var isUpdate = seen && seen !== NOTICE_VERSION;

  function build() {
    var el = document.createElement('div');
    el.className = 'noticebar';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Notice');
    el.innerHTML =
      '<div class="wrap">' +
        '<span class="tagword" id="noticeTitle">' +
          (isUpdate ? 'notice updated' : 'notice') + '</span>' +
        '<p>Independent educational project, <b>not affiliated with AWS</b>. ' +
          'Prices here are teaching estimates, <b>never quotes</b>. ' +
          'Explanations are simplified and can fall behind AWS changes.</p>' +
        '<a href="legal.html">Read it in full</a>' +
        '<button type="button" id="noticeOk">I understand</button>' +
        '<span class="ver">v' + NOTICE_VERSION + '</span>' +
      '</div>';
    return el;
  }

  function show() {
    var el = build();
    var top = document.querySelector('header.top');
    if (top && top.parentNode) top.parentNode.insertBefore(el, top.nextSibling);
    else document.body.appendChild(el);
    requestAnimationFrame(function () { el.setAttribute('data-on', ''); });
    var btn = el.querySelector('#noticeOk');
    btn.addEventListener('click', function () {
      try { localStorage.setItem(KEY, NOTICE_VERSION); } catch (e) {}
      el.removeAttribute('data-on');
      setTimeout(function () { el.remove(); }, 220);
    });

  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();
