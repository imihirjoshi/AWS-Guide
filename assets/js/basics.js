/* Before AWS: the fundamentals, read top to bottom. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var KEY = 'aws-basics-read', done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} }

  /* the journey entry is a numbered story, so it is rendered differently */
  function journeySteps(text) {
    var parts = String(text).split(/(?=\b[1-8]\.\s)/).filter(function (p) { return /^[1-8]\./.test(p.trim()); });
    if (parts.length < 5) return '';
    return '<ol class="jsteps">' + parts.map(function (p) {
      var n = p.trim().charAt(0);
      return '<li><span class="jn">' + n + '</span><span>' +
        esc(p.trim().replace(/^[1-8]\.\s*/, '')) + '</span></li>';
    }).join('') + '</ol>';
  }

  var seq = 0;
  function termBlock(it) {
    var isDone = !!done[it.id];
    var steps = it.id === 'journey' ? journeySteps(it.long) : '';
    seq++;
    return '<article class="bterm' + (isDone ? ' done' : '') + (it.id === 'journey' ? ' journey' : '') +
      '" id="' + esc(it.id) + '">' +
      '<div class="bnum">' + String(seq).padStart(2, '0') + '</div>' +
      '<div class="bhead">' +
        '<h3>' + esc(it.term) + '</h3>' +
        '<p class="bone">' + esc(it.one) + '</p>' +
      '</div>' +
      '<button class="bdone' + (isDone ? ' on' : '') + '" data-id="' + esc(it.id) + '" type="button">' +
        (isDone ? '&#10003;&nbsp; Understood' : 'Mark as understood') + '</button>' +
      '<div class="bcols">' +
        '<div class="bleft">' +
          (steps ? steps : (it.long ? '<p class="blong">' + esc(it.long) + '</p>' : '')) +
          (it.why ? '<div class="bwhy"><b>Why this matters</b><p>' + esc(it.why) + '</p></div>' : '') +
        '</div>' +
        (it.like ? '<aside class="blike"><b>Picture it as</b><p>' + esc(it.like) + '</p></aside>' : '<aside></aside>') +
      '</div>' +
      '</article>';
  }

  fetch('data/basics.json').then(function (r) { return r.json(); }).then(function (d) {
    var groups = d.groups || [];
    var all = groups.reduce(function (n, g) { return n + g.items.length; }, 0);
    $('#nCount').textContent = all;

    function tocHTML() {
      return groups.map(function (g, i) {
        var n = g.items.filter(function (x) { return done[x.id]; }).length;
        return '<a href="#' + esc(g.id) + '" data-g="' + esc(g.id) + '">' +
          '<span class="tnum">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="ttext">' + esc(g.title) + '</span>' +
          '<span class="tdone' + (n === g.items.length ? ' full' : '') + '">' + n + '/' + g.items.length + '</span></a>';
      }).join('');
    }
    $('#toc').innerHTML = tocHTML();

    $('#main').innerHTML = groups.map(function (g) {
      return '<section class="bgroup" id="' + esc(g.id) + '">' +
        '<div class="bghd"><h2>' + esc(g.title) + '</h2>' +
        (g.blurb ? '<p>' + esc(g.blurb) + '</p>' : '') + '</div>' +
        g.items.map(termBlock).join('') + '</section>';
    }).join('') +
    '<div class="bprog"><div class="inner">' +
      '<span id="bpc">0 of ' + all + '</span>' +
      '<span class="ptrack" style="flex:1"><span id="bbar" style="width:0%"></span></span>' +
      '<button type="button" id="bReset" class="bdone">Clear</button>' +
    '</div></div>' +
    '<section class="bend">' +
      '<h2>That is the whole foundation</h2>' +
      '<p>Everything in AWS is one of those ideas, rented by the hour. A server you rent is EC2. ' +
      'The phone book is Route 53. The local warehouses are CloudFront. The queue manager is a load ' +
      'balancer. The organised notebook is RDS or DynamoDB. You already understand the hard part.</p>' +
      '<div class="bendlinks">' +
        '<a href="learn.html">Now read Start here</a>' +
        '<a class="ghost" href="services.html">Browse the services</a>' +
        '<a class="ghost" href="architecture.html">See what to build</a>' +
      '</div>' +
    '</section>';

    function progress() {
      var n = Object.keys(done).length;
      var pc = all ? Math.round(n / all * 100) : 0;
      $('#bpc').textContent = n + ' of ' + all;
      $('#bbar').style.width = pc + '%';
      var keep = $('#toc').querySelector('.on');
      var keepId = keep ? keep.dataset.g : null;
      $('#toc').innerHTML = tocHTML();
      if (keepId) {
        var a = $('#toc').querySelector('[data-g="' + keepId + '"]');
        if (a) a.classList.add('on');
      }
      links = {};
      Array.prototype.forEach.call($('#toc').querySelectorAll('a'), function (a) { links[a.dataset.g] = a; });
    }
    var links = {};
    progress();

    $('#main').addEventListener('click', function (e) {
      var b = e.target.closest('.bdone'); if (!b) return;
      if (b.id === 'bReset') {
        if (!confirm('Clear which ones you have read?')) return;
        done = {}; save();
        Array.prototype.forEach.call($('#main').querySelectorAll('.bterm'), function (t) {
          t.classList.remove('done');
          var x = t.querySelector('.bdone'); x.classList.remove('on'); x.textContent = 'Mark as understood';
        });
        progress(); return;
      }
      var id = b.dataset.id; if (!id) return;
      if (done[id]) delete done[id]; else done[id] = 1;
      save();
      var card = document.getElementById(id);
      card.classList.toggle('done', !!done[id]);
      b.classList.toggle('on', !!done[id]);
      b.innerHTML = done[id] ? '&#10003;&nbsp; Understood' : 'Mark as understood';
      progress();
    });

    /* highlight the section you are reading */
    Array.prototype.forEach.call($('#toc').querySelectorAll('a'), function (a) { links[a.dataset.g] = a; });
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          Object.keys(links).forEach(function (k) { links[k].classList.remove('on'); });
          if (links[en.target.id]) links[en.target.id].classList.add('on');
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      groups.forEach(function (g) {
        var el = document.getElementById(g.id); if (el) obs.observe(el);
      });
    }
  }).catch(function (e) {
    $('#main').innerHTML = '<p class="none">Could not load the basics.</p>';
    console.error(e);
  });
})();
