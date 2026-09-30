/* Google Analytics 4, on by default, with a real off switch.
   The choice lives in this browser under aws-analytics. Setting it to "off"
   means gtag is never loaded at all, not merely told to stay quiet. */
(function () {
  'use strict';
  var KEY = 'aws-analytics';
  var ID  = 'G-7SVX1QLTK5';

  window.AWSAnalytics = {
    id: ID,
    isOn: function () {
      try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; }
    },
    set: function (on) {
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
      /* GA's own opt out flag, so anything already loaded stops sending too */
      window['ga-disable-' + ID] = !on;
    }
  };

  if (!window.AWSAnalytics.isOn()) {
    window['ga-disable-' + ID] = true;
    return;
  }

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
})();
