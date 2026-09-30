/* AWS certification catalogue */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var D = null;

  /* only the FIRST clause states the status. Later clauses talk about other exams. */
  function head(status) {
    return String(status || '').split(/[.;]|\s-\s/)[0].toLowerCase().trim();
  }
  function stateClass(status) {
    var s = head(status);
    if (/^retired|^superseded/.test(s)) return 'bad';
    if (/retiring|being replaced|being updated|outgoing/.test(s)) return 'warn';
    if (/beta|announced|not yet|conflict/.test(s)) return 'warn';
    return 'ok';
  }
  function lvlClass(l) { return 'lvl-' + String(l || 'other').toLowerCase().replace(/[^a-z]/g, ''); }
  function firstSentence(t, n) {
    var s = String(t || '');
    var m = s.match(/^[^.]{0,220}\./);
    var out = m ? m[0] : s.slice(0, n || 150);
    return out + (out.length < s.length ? '' : '');
  }

  /* squeeze a long status sentence down to a short label */
  function shortState(s) {
    var t = head(s);
    if (/^retired/.test(t)) return 'Retired';
    if (/retiring/.test(t)) return 'Retiring';
    if (/being replaced/.test(t)) return 'Being replaced';
    if (/being updated/.test(t)) return 'Being updated';
    if (/^announced|not yet available/.test(t)) return 'Announced';
    if (/beta/.test(t)) return 'Beta';
    if (/^active/.test(t)) return 'Active';
    return t.slice(0, 24) || 'See detail';
  }
  /* pull the actual figure out, never a truncated sentence */
  function money(t) {
    var m = String(t || '').match(/\$\s?[\d,]+/);
    return m ? m[0].replace(/\s/, '') : '?';
  }
  function mins(t) {
    var m = String(t || '').match(/(\d{2,3})\s*(?:min|minutes)/i) || String(t || '').match(/^\s*(\d{2,3})\b/);
    return m ? m[1] + ' min' : '?';
  }
  function qs(t) {
    var m = String(t || '').match(/(\d{2,3})\s*(?:total|questions|scored)/i) || String(t || '').match(/(\d{2,3})/);
    return m ? m[1] : '?';
  }
  function pass(t) {
    var m = String(t || '').match(/\b(\d{3})\b/);
    return m ? m[1] : '?';
  }
  /* a value we shortened is flagged so the reader knows to open the row */
  function moreMark(shown, full) {
    return String(full || '').length > String(shown).length + 6 ? '<sup class="more" title="More detail inside">*</sup>' : '';
  }
  function certRow(c, i) {
    return '<tr class="' + lvlClass(c.level) + '" data-i="' + i + '">' +
      '<td>' + esc(c.code) + '</td>' +
      '<td><span class="nm">' + esc(c.name) + '</span></td>' +
      '<td><span class="lvl">' + esc(c.level) + '</span></td>' +
      '<td class="r num">' + esc(money(c.priceUSD)) + moreMark(money(c.priceUSD), c.priceUSD) + '</td>' +
      '<td class="r num">' + esc(mins(c.durationMin)) + moreMark(mins(c.durationMin), c.durationMin) + '</td>' +
      '<td class="r num">' + esc(qs(c.questionCount)) + moreMark(qs(c.questionCount), c.questionCount) + '</td>' +
      '<td class="r num">' + esc(pass(c.passingScore)) + moreMark(pass(c.passingScore), c.passingScore) + '</td>' +
      '<td><span class="stpill ' + stateClass(c.status) + '">' + esc(shortState(c.status)) + '</span></td>' +
      '</tr>';
  }

  function openCert(i) {
    var c = D.certifications[i]; if (!c) return;
    var doms = (c.domains || []);
    var h = '<div class="shd ' + lvlClass(c.level) + '">' +
      '<div style="width:46px;height:46px;border-radius:11px;display:grid;place-items:center;' +
      'background:color-mix(in srgb,var(--dot) 15%,transparent);font:500 12px var(--mono)">' +
      esc(String(c.code).split('-')[0]) + '</div>' +
      '<div><h2>' + esc(c.name) + '</h2><div class="meta"><i></i>' + esc(c.code) + ' &nbsp;' + esc(c.level) + '</div></div>' +
      '<button class="shut" id="shut" aria-label="Close">&times;</button></div>' +
      '<div class="sbody ' + lvlClass(c.level) + '">';

    h += '<div class="state ' + stateClass(c.status) + '" style="font-size:13px">' + esc(c.status) + '</div>';

    h += '<div class="blk"><h3>The facts</h3><dl class="spec">' +
      '<dt>exam code</dt><dd>' + esc(c.code) + '</dd>' +
      '<dt>price</dt><dd>' + esc(c.priceUSD) + '</dd>' +
      '<dt>duration</dt><dd>' + esc(c.durationMin) + '</dd>' +
      '<dt>questions</dt><dd>' + esc(c.questionCount) + '</dd>' +
      '<dt>pass mark</dt><dd>' + esc(c.passingScore) + '</dd>' +
      '<dt>assumes</dt><dd>' + esc(c.recommendedExperience) + '</dd>' +
      '</dl></div>';

    if (doms.length) {
      h += '<div class="blk"><h3>What it tests, by weight</h3><div class="dom">' +
        doms.map(function (d) {
          var pc = parseFloat(String(d.weight).replace(/[^0-9.]/g, '')) || 0;
          return '<div class="dombar">' +
            '<span class="lab">' + esc(d.name) + '</span><span class="pc">' + esc(d.weight) + '</span>' +
            '<span class="track"><span class="fill" style="width:' + Math.min(100, pc) + '%"></span></span>' +
            (d.covers ? '<span class="domcov" style="grid-column:1/-1">' + esc(d.covers) + '</span>' : '') +
            '</div>';
        }).join('') + '</div></div>';
    }
    if (c.keyServices && c.keyServices.length) {
      h += '<div class="blk"><h3>Services it leans on</h3><div class="relgrid">' +
        c.keyServices.map(function (s) { return '<button type="button" disabled style="cursor:default">' + esc(s) + '</button>'; }).join('') +
        '</div></div>';
    }
    if (c.source) {
      h += '<div class="blk"><h3>Source</h3><p><a href="' + esc(c.source) + '" target="_blank" rel="nofollow noopener" style="text-decoration:underline;overflow-wrap:anywhere">' + esc(c.source) + '</a></p></div>';
    }
    h += '</div>';
    $('#sheet').innerHTML = h;
    $('#sheet').setAttribute('data-on', ''); $('#sheet').setAttribute('aria-hidden', 'false');
    $('#scrim').setAttribute('data-on', ''); $('#sheet').scrollTop = 0;
    $('#shut').addEventListener('click', close); $('#shut').focus();
  }
  function close() {
    $('#sheet').removeAttribute('data-on'); $('#sheet').setAttribute('aria-hidden', 'true');
    $('#scrim').removeAttribute('data-on');
  }
  $('#scrim').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  fetch('data/certifications.json').then(function (r) { return r.json(); }).then(function (d) {
    D = d;
    var certs = d.certifications || [];
    var live = certs.filter(function (c) { return !/^retired/i.test(c.status || ''); });
    $('#tActive').textContent = live.length;
    $('#tRetired').textContent = (d.retired || []).length;
    $('#tPaths').textContent = (d.rolePaths || []).length;
    $('#disclaimer').textContent = d.disclaimer || '';
    $('#certCount').textContent = certs.length;
    $('#pathCount').textContent = (d.rolePaths || []).length;

    $('#certs').innerHTML = certs.map(certRow).join('');
    $('#certs').addEventListener('click', function (e) {
      var r = e.target.closest('tr'); if (r) openCert(+r.dataset.i);
    });

    /* our order */
    var o = d.ourRecommendedOrder || {};
    $('#orderNote').textContent = o.note || '';
    $('#order').innerHTML = (o.steps || []).map(function (s) {
      var code = String(s.code || '');
      var isSkip = /^skip/i.test(code);
      var isGap = /gap|prerequisite/i.test(code);
      var label = isSkip ? code.replace(/^skip:?\s*/i, '') : code;
      return '<li class="' + (isSkip ? 'skip' : isGap ? 'gap' : '') + '">' +
        '<span class="step">' + (isSkip ? 'x' : esc(String(s.order))) + '</span>' +
        '<div><b>' + esc(isSkip ? 'Skip ' + label : label) + '</b>' +
        '<p>' + esc(s.why || '') + '</p>' +
        (s.skipIf ? '<div class="skipif">' + esc(s.skipIf) + '</div>' : '') +
        '</div></li>';
    }).join('');

    /* role paths */
    $('#paths').innerHTML = (d.rolePaths || []).map(function (p) {
      var steps = (p.steps || []).map(function (s) {
        return '<span class="pill" style="padding:4px 10px;font-size:11.5px;font-family:var(--mono)">' + esc(s.code) + '</span>';
      }).join(' ');
      return '<div class="card"><h3 style="font-size:14.5px;font-weight:600;margin-bottom:5px">' + esc(p.role) + '</h3>' +
        '<p style="font-size:13px;color:var(--ink-2);line-height:1.55;margin-bottom:10px">' + esc(p.responsibilities || '') + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap">' + steps + '</div></div>';
    }).join('');

    /* retired */
    $('#retired').innerHTML = (d.retired || []).map(function (r) {
      return '<div class="card" style="border-style:dashed;background:transparent">' +
        '<h3 style="font-size:14px;font-weight:500;color:var(--ink-2)">' + esc(r.name) + '</h3>' +
        '<p style="font-family:var(--mono);font-size:11.5px;color:var(--ink-3);margin-top:6px">retired ' + esc(r.retiredOn || 'date unconfirmed') + '</p>' +
        (r.replacedBy ? '<p style="font-size:12.5px;color:var(--ink-2);margin-top:7px">Now: ' + esc(r.replacedBy) + '</p>' : '') +
        '</div>';
    }).join('');

    var rc = d.recertification || {};
    $('#recert').innerHTML = '<dl class="spec">' +
      '<dt>valid for</dt><dd>' + esc(rc.validYears || '') + '</dd>' +
      '<dt>how to renew</dt><dd>' + esc(rc.howToRenew || '') + '</dd>' +
      '<dt>free route</dt><dd>' + esc(rc.freePath || '') + '</dd>' +
      '</dl>';

    var mc = d.microcredentials || {};
    $('#micro').innerHTML = '<p style="font-size:14px;line-height:1.6;color:var(--ink-2)">' + esc(mc.what || '') + '</p>' +
      (mc.topics && mc.topics.length ? '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px">' +
        mc.topics.map(function (t) { return '<span class="pill">' + esc(t) + '</span>'; }).join('') + '</div>' : '');

    $('#gaps').innerHTML = (d.unverified || []).map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('');
  }).catch(function (e) {
    $('#certs').innerHTML = '<p class="none">Could not load the certification data.</p>';
    console.error(e);
  });
})();
