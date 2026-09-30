/* Shared currency picker. Rate is per 1 USD. Saved in this browser only. */
window.AWSCur = (function () {
  'use strict';
  var KEY = 'aws-cur';
  /* Rough defaults, roughly late 2026. The user can override the rate. */
  var LIST = [
    ['USD', 'US Dollar', '$', 1],
    ['INR', 'Indian Rupee', '₹', 88],
    ['EUR', 'Euro', '€', 0.92],
    ['GBP', 'British Pound', '£', 0.78],
    ['AED', 'UAE Dirham', 'AED ', 3.67],
    ['SAR', 'Saudi Riyal', 'SAR ', 3.75],
    ['SGD', 'Singapore Dollar', 'S$', 1.34],
    ['AUD', 'Australian Dollar', 'A$', 1.52],
    ['CAD', 'Canadian Dollar', 'C$', 1.38],
    ['JPY', 'Japanese Yen', '¥', 155],
    ['CNY', 'Chinese Yuan', 'CN¥', 7.2],
    ['ZAR', 'South African Rand', 'R', 18.5],
    ['NGN', 'Nigerian Naira', '₦', 1550],
    ['KES', 'Kenyan Shilling', 'KSh', 129],
    ['BRL', 'Brazilian Real', 'R$', 5.4],
    ['MXN', 'Mexican Peso', 'MX$', 18.5],
    ['IDR', 'Indonesian Rupiah', 'Rp', 15800],
    ['MYR', 'Malaysian Ringgit', 'RM', 4.45],
    ['PHP', 'Philippine Peso', '₱', 58],
    ['THB', 'Thai Baht', '฿', 34],
    ['VND', 'Vietnamese Dong', '₫', 25000],
    ['BDT', 'Bangladeshi Taka', '৳', 120],
    ['PKR', 'Pakistani Rupee', 'Rs ', 278],
    ['LKR', 'Sri Lankan Rupee', 'Rs ', 300],
    ['NPR', 'Nepalese Rupee', 'Rs ', 141],
    ['TRY', 'Turkish Lira', '₺', 34],
    ['PLN', 'Polish Zloty', 'zł', 4.0],
    ['CHF', 'Swiss Franc', 'CHF ', 0.88]
  ];
  var byCode = {};
  LIST.forEach(function (r) { byCode[r[0]] = { code: r[0], name: r[1], sym: r[2], rate: r[3] }; });

  var cur = { code: 'USD', rate: 1 };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && byCode[saved.code]) cur = { code: saved.code, rate: +saved.rate || byCode[saved.code].rate };
  } catch (e) {}

  var subs = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {} }
  function fire() { subs.forEach(function (f) { try { f(api); } catch (e) {} }); }

  function fmt(usd) {
    var v = usd * cur.rate, m = byCode[cur.code];
    var dec = (cur.code === 'JPY' || cur.code === 'VND' || cur.code === 'IDR' || v >= 1000) ? 0 : 2;
    var loc = cur.code === 'INR' ? 'en-IN' : 'en-US';
    return m.sym + v.toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  var api = {
    list: LIST,
    get code() { return cur.code; },
    get rate() { return cur.rate; },
    get sym() { return byCode[cur.code].sym; },
    get name() { return byCode[cur.code].name; },
    defaultRate: function (c) { return byCode[c] ? byCode[c].rate : 1; },
    fmt: fmt,
    isUSD: function () { return cur.code === 'USD'; },
    set: function (code, rate) {
      if (!byCode[code]) return;
      cur = { code: code, rate: +rate > 0 ? +rate : byCode[code].rate };
      save(); fire();
    },
    setRate: function (rate) { if (+rate > 0) { cur.rate = +rate; save(); fire(); } },
    onChange: function (f) { subs.push(f); },
    /* builds the header control */
    mount: function (el) {
      if (!el) return;
      el.innerHTML = '<select id="curSel" title="Currency" aria-label="Currency">' +
        LIST.map(function (r) {
          return '<option value="' + r[0] + '"' + (r[0] === cur.code ? ' selected' : '') + '>' + r[0] + '</option>';
        }).join('') + '</select>';
      el.querySelector('#curSel').addEventListener('change', function (e) {
        api.set(e.target.value, byCode[e.target.value].rate);
      });
      api.onChange(function () {
        var s = el.querySelector('#curSel'); if (s) s.value = cur.code;
      });
    }
  };
  return api;
})();
