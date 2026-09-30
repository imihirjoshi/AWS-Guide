/* What should I actually build: find your situation, get the setup. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var D = null, BP = [], st = { q: '', track: '' };

  var TRACKS = [
    { k: 'tier-starter', label: 'Just starting' },
    { k: 'tier-growing', label: 'Growing, it hurts' },
    { k: 'tier-high', label: 'Big and serious' },
    { k: 'tier-global', label: 'Worldwide scale' },
    { k: 'video', label: 'Video' },
    { k: 'realtime', label: 'Chat and live' },
    { k: 'data-path', label: 'The database keeps growing' },
    { k: 'migrations', label: 'Moving without breaking it' },
    { k: 'premature', label: 'Do not build this yet' }
  ];
  function tlabel(k) {
    var t = TRACKS.find(function (x) { return x.k === k; });
    return t ? t.label : k;
  }

  function hay(b) {
    var p = b.plain || {};
    return (p.pitch + ' ' + p.problem + ' ' + p.answer + ' ' + p.plainName + ' ' +
      b.name + ' ' + (b.components || []).map(function (c) { return c.service; }).join(' ')).toLowerCase();
  }
  function keep(b) {
    if (st.track && b.track !== st.track) return false;
    if (st.q) {
      var h = hay(b), t = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < t.length; i++) if (h.indexOf(t[i]) === -1) return false;
    }
    return true;
  }
  /* money is written as prose, so pull the first figure for the list */
  function shortMoney(m) {
    var s = String(m || '');
    var r = s.match(/\$[\d,]+(?:\.\d+)?\s*(?:to|-|and)\s*\$?[\d,]+(?:\.\d+)?/i);
    if (r) return r[0].replace(/\s+/g, ' ');
    var one = s.match(/\$[\d,]+(?:\.\d+)?/);
    return one ? one[0] : '';
  }

  function render() {
    var list = BP.filter(keep);
    $('#count').textContent = list.length + (list.length === 1 ? ' setup' : ' setups') +
      (st.q ? ' matching "' + st.q + '"' : '');
    if (!list.length) {
      $('#list').innerHTML = '<p class="none">Nothing matched. Try plain words: <strong>slow</strong>, ' +
        '<strong>down</strong>, <strong>expensive</strong>, <strong>video</strong>, <strong>chat</strong>.</p>';
      return;
    }
    var g = {};
    list.forEach(function (b) { (g[b.track] = g[b.track] || []).push(b); });
    var order = TRACKS.map(function (t) { return t.k; }).filter(function (k) { return g[k]; });
    $('#list').innerHTML = order.map(function (k) {
      var warn = k === 'premature';
      return '<section class="grp tk-' + esc(k) + '">' +
        '<div class="sechead"><span class="bar"></span><h2>' + esc(tlabel(k)) + '</h2>' +
        '<span class="n">' + g[k].length + '</span></div>' +
        '<div class="picks">' + g[k].map(function (b) {
          var p = b.plain || {};
          var cost = shortMoney(p.money);
          return '<button class="pick' + (warn ? ' warn' : '') + '" data-id="' + esc(b.id) + '">' +
            '<span class="qm">&ldquo;</span>' +
            '<span><span class="said">' + esc(p.pitch || p.plainName || b.name) + '</span>' +
            '<span class="ans">' + esc(p.answer || '') + '</span></span>' +
            '<span class="rhs">' + (cost ? '<span class="cost">' + esc(cost) + '</span>' : '') +
            '<span class="what">' + esc(p.plainName || '') + '</span></span>' +
            '</button>';
        }).join('') + '</div></section>';
    }).join('');
  }

  function open(id) {
    var b = BP.find(function (x) { return x.id === id; }); if (!b) return;
    var p = b.plain || {};
    var h = '<div class="shd tk-' + esc(b.track) + '">' +
      '<div style="width:46px;height:46px;border-radius:11px;display:grid;place-items:center;' +
      'background:color-mix(in srgb,var(--dot) 15%,transparent);font:600 17px var(--wide)">' +
      esc((p.plainName || b.name).trim().charAt(0).toUpperCase()) + '</div>' +
      '<div><h2>' + esc(p.plainName || b.name) + '</h2>' +
      '<div class="meta"><i></i>' + esc(tlabel(b.track)) + '</div></div>' +
      '<button class="shut" id="shut" aria-label="Close">&times;</button></div>' +
      '<div class="sbody tk-' + esc(b.track) + '">';

    if (p.problem) h += '<p class="bplede">' + esc(p.problem) + '</p>';
    if (p.answer) h += '<div class="bpanswer">' + esc(p.answer) + '</div>';

    h += '<div class="facts">' +
      (p.money ? '<div><dt>what it costs</dt><dd>' + esc(p.money) + '</dd></div>' : '') +
      (p.holdsUpTo ? '<div><dt>how far it gets you</dt><dd>' + esc(p.holdsUpTo) + '</dd></div>' : '') +
      '</div>';

    if (p.whatBreaks) h += '<div class="blk"><h3>What goes wrong first</h3><p>' + esc(p.whatBreaks) + '</p></div>';
    if (p.timeToMove) h += '<div class="blk"><h3>Time to move on when</h3><p>' + esc(p.timeToMove) + '</p></div>';
    if (p.dontYet) h += '<div class="warnblk"><h4>Do not add this yet</h4><p>' + esc(p.dontYet) + '</p></div>';

    if (b.components && b.components.length) {
      h += '<div class="blk"><h3>What you actually build</h3><div class="parts">' +
        b.components.map(function (c) {
          return '<div class="part"><div class="pn">' + esc(c.service) + '</div>' +
            '<div class="pr">' + esc(c.role) + '</div>' +
            (c.why ? '<details><summary></summary><div class="pw">' + esc(c.why) + '</div>' +
              (c.config ? '<div class="pc">' + esc(c.config) + '</div>' : '') + '</details>' : '') +
            '</div>';
        }).join('') + '</div></div>';
    }

    h += '<div class="blk"><h3>The expert version</h3>' +
      '<details><summary style="cursor:pointer;font-family:var(--mono);font-size:11px;color:var(--ink-3)">' +
      'Show the original research</summary>' +
      '<div style="margin-top:10px">' +
      '<p style="font-size:13px;line-height:1.6;color:var(--ink-2)"><b>' + esc(b.name) + '</b></p>' +
      (b.forWho ? '<p style="font-size:12.8px;line-height:1.6;color:var(--ink-3);margin-top:9px">' + esc(b.forWho) + '</p>' : '') +
      (b.scale ? '<p style="font-size:12.8px;line-height:1.6;color:var(--ink-3);margin-top:9px"><b>Scale:</b> ' + esc(b.scale) + '</p>' : '') +
      (b.ceiling ? '<p style="font-size:12.8px;line-height:1.6;color:var(--ink-3);margin-top:9px"><b>Ceiling:</b> ' + esc(b.ceiling) + '</p>' : '') +
      (b.breaksFirst ? '<p style="font-size:12.8px;line-height:1.6;color:var(--ink-3);margin-top:9px"><b>Breaks first:</b> ' + esc(b.breaksFirst) + '</p>' : '') +
      (b.moveOnWhen ? '<p style="font-size:12.8px;line-height:1.6;color:var(--ink-3);margin-top:9px"><b>Move on when:</b> ' + esc(b.moveOnWhen) + '</p>' : '') +
      '</div></details></div>';

    if (b.correction) {
      h += '<div class="corrbox"><b>A fact checker corrected this.</b> ' + esc(b.correction) +
        (b.checkSource ? ' <a href="' + esc(b.checkSource) + '" target="_blank" rel="nofollow noopener" style="text-decoration:underline">source</a>' : '') +
        '</div>';
    }
    if (b.source) {
      h += '<div class="blk"><h3>Source</h3><p><a href="' + esc(b.source) + '" target="_blank" rel="nofollow noopener" style="text-decoration:underline;overflow-wrap:anywhere;font-size:12.5px">' + esc(b.source) + '</a></p></div>';
    }
    h += '</div>';
    $('#sheet').innerHTML = h;
    $('#sheet').setAttribute('data-on', ''); $('#sheet').setAttribute('aria-hidden', 'false');
    $('#scrim').setAttribute('data-on', ''); $('#sheet').scrollTop = 0;
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    $('#shut').addEventListener('click', close); $('#shut').focus();
  }
  function close() {
    $('#sheet').removeAttribute('data-on'); $('#sheet').setAttribute('aria-hidden', 'true');
    $('#scrim').removeAttribute('data-on');
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }
  $('#scrim').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  $('#list').addEventListener('click', function (e) {
    var b = e.target.closest('.pick'); if (b) open(b.dataset.id);
  });
  var t;
  $('#q').addEventListener('input', function (e) {
    var v = e.target.value; clearTimeout(t);
    t = setTimeout(function () { st.q = v; render(); }, 110);
  });

  fetch('data/blueprints.json').then(function (r) { return r.json(); }).then(function (d) {
    D = d; BP = d.blueprints || [];
    $('#tBp').textContent = BP.length;
    $('#tTracks').textContent = new Set(BP.map(function (b) { return b.track; })).size;
    $('#tDont').textContent = BP.filter(function (b) { return b.track === 'premature'; }).length;

    var counts = {};
    BP.forEach(function (b) { counts[b.track] = (counts[b.track] || 0) + 1; });
    $('#tracks').innerHTML = '<button data-t="" aria-pressed="true">All<b>' + BP.length + '</b></button>' +
      TRACKS.filter(function (x) { return counts[x.k]; }).map(function (x) {
        return '<button class="tk-' + x.k + '" data-t="' + esc(x.k) + '" aria-pressed="false">' +
          '<i></i>' + esc(x.label) + '<b>' + counts[x.k] + '</b></button>';
      }).join('');
    $('#tracks').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $('#tracks').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true'); st.track = b.dataset.t; render();
    });

    var qs = d.procedure || [];
    $('#qCount').textContent = qs.length;
    $('#questions-list').innerHTML = qs.map(function (s, i) {
      return '<li><span class="qn">' + esc(String(s.order || i + 1)) + '</span><div>' +
        '<div class="qq">' + esc(s.question) + '</div>' +
        (s.whyItMatters ? '<div class="qy">' + esc(s.whyItMatters) + '</div>' : '') +
        (s.answerChangesWhat ? '<div class="qd"><b>Decides:</b> ' + esc(s.answerChangesWhat) + '</div>' : '') +
        (s.badAnswers ? '<div class="qbad"><b>Worrying answers:</b> ' + esc(s.badAnswers) + '</div>' : '') +
        '</div></li>';
    }).join('');

    render();
    if (location.hash) open(location.hash.slice(1));
  }).catch(function (e) {
    $('#list').innerHTML = '<p class="none">Could not load the architecture data.</p>';
    console.error(e);
  });
})();
