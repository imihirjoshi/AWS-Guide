/* The index: search and browse 303 services as a reference sheet. */
(function () {
  'use strict';
  var S = [], CATS = [], st = { q: '', cat: '', lv: 'all' };
  var COLLAPSED_KEY = 'aws-collapsed';
  var collapsed = {};
  try { collapsed = JSON.parse(localStorage.getItem(COLLAPSED_KEY) || '{}') || {}; } catch (e) {}
  function saveCollapsed() {
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed)); } catch (e) {}
  }
  var $ = function (s) { return document.querySelector(s); };
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* category to the colour AWS already uses for it in the icon set */
  var DOT = {
    'Compute': '--c-compute', 'Containers': '--c-compute',
    'Storage': '--c-storage',
    'Databases': '--c-database',
    'Networking and Content Delivery': '--c-network', 'Analytics': '--c-analytics',
    'Security and Identity': '--c-security',
    'AI and Machine Learning': '--c-ai', 'Developer Tools': '--c-dev',
    'Application Integration': '--c-integration', 'Management and Governance': '--c-mgmt',
    'Business Applications': '--c-integration', 'Cost and Billing': '--c-cost',
    'Front End Web and Mobile': '--c-security', 'Media': '--c-integration',
    'Internet of Things': '--c-storage', 'Migration and Transfer': '--c-ai',
    'Customer Enablement': '--c-integration', 'End User Computing': '--c-network',
    'Games': '--c-security', 'Blockchain': '--c-ai', 'Quantum': '--c-network',
    'Satellite': '--c-network', 'General': '--c-other'
  };
  function dot(cat) { return 'var(' + (DOT[cat] || '--c-other') + ')'; }

  /* plain words people actually type, mapped to services */
  var SAYS = {
    'amazon-simple-storage-service': 'files bucket upload images videos photos pdf store save keep backup',
    'amazon-ec2': 'server virtual machine computer rent host instance vps',
    'aws-lambda': 'serverless function run code no server event trigger',
    'amazon-rds': 'sql database mysql postgres relational tables',
    'amazon-aurora': 'fast mysql postgres scale database',
    'amazon-dynamodb': 'nosql key value fast database',
    'amazon-cloudfront': 'cdn fast speed cache edge website slow global',
    'amazon-route-53': 'dns domain name website address',
    'elastic-load-balancing': 'load balancer alb distribute traffic https',
    'amazon-virtual-private-cloud': 'network subnet firewall private',
    'aws-identity-and-access-management': 'permission access user role policy who can login',
    'amazon-cognito': 'login signup user auth password customers',
    'amazon-simple-email-service': 'email send mail smtp newsletter invoice',
    'amazon-cloudwatch': 'monitor logs alarm metrics alert watch',
    'aws-cloudtrail': 'audit who did what history',
    'amazon-bedrock': 'ai llm claude chatgpt genai model generative',
    'amazon-textract': 'ocr scan read document invoice form extract',
    'amazon-transcribe': 'speech to text subtitle caption audio',
    'amazon-polly': 'text to speech voice read aloud',
    'amazon-translate': 'translate language hindi gujarati',
    'aws-secrets-manager': 'password key secret credential safe',
    'amazon-elasticache': 'redis cache fast memory speed up',
    'aws-certificate-manager': 'ssl tls https certificate padlock secure',
    'amazon-simple-queue-service': 'queue message background job async',
    'amazon-lightsail': 'cheap simple small wordpress fixed price beginner',
    'amazon-elastic-block-store': 'disk hard drive volume storage attach',
    'aws-backup': 'backup restore snapshot',
    'amazon-athena': 'sql query files analyse reports',
    'aws-fargate': 'containers no servers docker'
  };
  function hay(s) {
    return (s.name + ' ' + s.category + ' ' + (s.one || '') + ' ' + (s.like || '') + ' ' +
      (s.what || '') + ' ' + (SAYS[s.slug] || '')).toLowerCase();
  }
  function shortcode(s) {
    return s.slug.replace(/^(amazon|aws)-/, '').replace(/-/g, ' ');
  }
  function keep(s) {
    if (st.cat && s.category !== st.cat) return false;
    if (st.lv === '1' && s.tier !== 1) return false;
    if (st.lv === 'written' && !s.written) return false;
    if (st.q) {
      var h = hay(s), t = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < t.length; i++) if (h.indexOf(t[i]) === -1) return false;
    }
    return true;
  }

  function render() {
    var list = S.filter(keep);
    $('#count').textContent = list.length + (list.length === 1 ? ' service' : ' services') +
      (st.q ? ' matching "' + st.q + '"' : '');
    if (!list.length) {
      $('#list').innerHTML = '<p class="none">Nothing matched. Try a plain word: <strong>files</strong>, <strong>database</strong>, <strong>email</strong>, <strong>login</strong>.</p>';
      return;
    }
    var groups = {};
    list.forEach(function (s) { (groups[s.category] = groups[s.category] || []).push(s); });
    var order = Object.keys(groups).sort(function (a, b) {
      return groups[b].length - groups[a].length || a.localeCompare(b);
    });
    $('#list').innerHTML = order.map(function (cat) {
      var rows = groups[cat].sort(function (a, b) {
        return (a.tier - b.tier) || a.name.localeCompare(b.name);
      });
      var shut = !st.q && collapsed[cat];
      return '<details class="grp" style="--dot:' + dot(cat) + '" data-cat="' + esc(cat) + '"' +
        (shut ? '' : ' open') + '>' +
        '<summary class="grphd"><span class="bar"></span><h2>' + esc(cat) + '</h2>' +
        '<span class="n">' + rows.length + '</span>' +
        '<span class="chev" aria-hidden="true"></span></summary><div class="rows">' +
        rows.map(function (s) {
          var tag = s.written ? (s.tier === 1 ? 'learn first' : s.tier === 2 ? 'common' : 'advanced') : 'not written';
          return '<button class="row' + (s.written ? '' : ' todo') + '" data-slug="' + esc(s.slug) + '">' +
            '<span class="tile"><img src="' + esc(s.icon) + '" alt="" loading="lazy" width="26" height="26"></span>' +
            '<span class="body"><span class="head">' +
              '<span class="nm">' + esc(s.name) + '</span>' +
              '<span class="tag" data-t="' + (s.written ? s.tier : '') + '">' + tag + '</span>' +
            '</span>' +
            '<span class="de">' + esc(s.one || 'Plain English write up still to come.') + '</span></span>' +
            '</button>';
        }).join('') + '</div></details>';
    }).join('');
  }

  /* ---- spec sheet ---- */
  function open(slug) {
    var s = S.find(function (x) { return x.slug === slug; }); if (!s) return;
    var h = '<div class="shd" style="--dot:' + dot(s.category) + '">' +
      '<img src="' + esc(s.icon) + '" alt="" width="46" height="46">' +
      '<div><h2>' + esc(s.name) + '</h2><div class="meta"><i></i>' + esc(s.category) + '</div></div>' +
      '<button class="shut" id="shut" aria-label="Close">&times;</button></div>' +
      '<div class="sbody" style="--dot:' + dot(s.category) + '">';

    if (!s.written) {
      h += '<div class="todo-note"><strong>Not written up yet.</strong><p style="margin-top:8px">' +
        'This is a real AWS service, shown with its official icon and category. The plain English ' +
        'explanation has not been written yet. Services that are done carry a tag in the index.</p></div>';
    } else {
      h += '<p class="lede">' + esc(s.one) + '</p>';
      h += '<div class="aslike"><p>' + esc(s.like) + '</p></div>';
      h += '<div class="blk"><h3>What it actually does</h3><p>' + esc(s.what) + '</p></div>';
      if (s.when && s.when.length)
        h += '<div class="blk"><h3>Reach for it when</h3><ul>' +
          s.when.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      if (s.nope && s.nope.length)
        h += '<div class="blk no"><h3>Do not reach for it when</h3><ul>' +
          s.nope.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      h += '<div class="blk"><h3>One small example</h3><p>' + esc(s.eg) + '</p></div>';
      h += '<div class="blk"><h3>Specification</h3><dl class="spec">' +
        '<dt>category</dt><dd>' + esc(s.category) + '</dd>' +
        '<dt>billed by</dt><dd>' + esc(s.pay) + '</dd>' +
        '<dt>depth</dt><dd>' + (s.tier === 1 ? 'Learn this early' : s.tier === 2 ? 'Common, learn when needed' : 'Advanced, most people never need it') + '</dd>' +
        '</dl></div>';
      if (s.rel && s.rel.length) {
        var rel = s.rel.map(function (r) { return S.find(function (x) { return x.slug === r; }); }).filter(Boolean);
        if (rel.length) h += '<div class="blk"><h3>Usually sits next to</h3><div class="rel">' +
          rel.map(function (r) {
            return '<button data-go="' + esc(r.slug) + '"><img src="' + esc(r.icon) + '" alt="">' + esc(r.name) + '</button>';
          }).join('') + '</div></div>';
      }
    }
    h += '<div class="blk"><h3>The real source</h3><p>This is a simplified summary. The ' +
      '<a href="https://docs.aws.amazon.com/" target="_blank" rel="nofollow noopener" style="text-decoration:underline">AWS documentation</a>' +
      ' is the official word, and it wins wherever this page disagrees with it.</p></div></div>';

    $('#sheet').innerHTML = h;
    $('#sheet').setAttribute('data-on', ''); $('#sheet').setAttribute('aria-hidden', 'false');
    $('#scrim').setAttribute('data-on', ''); $('#sheet').scrollTop = 0;
    try { history.replaceState(null, '', '#' + slug); } catch (e) {}
    $('#shut').addEventListener('click', close);
    $('#shut').focus();
    Array.prototype.forEach.call($('#sheet').querySelectorAll('[data-go]'), function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-go')); });
    });
  }
  function close() {
    $('#sheet').removeAttribute('data-on'); $('#sheet').setAttribute('aria-hidden', 'true');
    $('#scrim').removeAttribute('data-on');
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }
  $('#scrim').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  $('#list').addEventListener('click', function (e) {
    var r = e.target.closest('.row'); if (r) { open(r.dataset.slug); return; }
  });
  $('#list').addEventListener('toggle', function (e) {
    var d = e.target; if (!d.classList || !d.classList.contains('grp')) return;
    var cat = d.getAttribute('data-cat');
    if (d.open) delete collapsed[cat]; else collapsed[cat] = 1;
    saveCollapsed();
  }, true);

  function setAll(openThem) {
    Array.prototype.forEach.call($('#list').querySelectorAll('details.grp'), function (d) {
      d.open = openThem;
      var cat = d.getAttribute('data-cat');
      if (openThem) delete collapsed[cat]; else collapsed[cat] = 1;
    });
    saveCollapsed();
  }
  $('#expandAll').addEventListener('click', function () { setAll(true); });
  $('#collapseAll').addEventListener('click', function () { setAll(false); });

  var t;
  $('#q').addEventListener('input', function (e) {
    var v = e.target.value; clearTimeout(t);
    t = setTimeout(function () { st.q = v; render(); }, 110);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== $('#q')) { e.preventDefault(); $('#q').focus(); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('.seg button'), function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true'); st.lv = b.dataset.lv; render();
    });
  });

  /* the hero schematic, drawn once */
  function schematic() {
    var g = document.getElementById('schemaG'); if (!g) return;
    var N = [
      { x: 18, y: 128, w: 92, h: 44, t: 'Route 53', s: 'the domain' },
      { x: 146, y: 128, w: 92, h: 44, t: 'CloudFront', s: 'the cache' },
      { x: 274, y: 128, w: 92, h: 44, t: 'Load balancer', s: 'shares traffic' },
      { x: 402, y: 68, w: 92, h: 44, t: 'EC2', s: 'a server' },
      { x: 402, y: 188, w: 92, h: 44, t: 'EC2', s: 'a server' },
      { x: 402, y: 246, w: 92, h: 44, t: 'RDS', s: 'the database' }
    ];
    var box = N.map(function (n, i) {
      return '<g opacity="0" class="sn" style="animation-delay:' + (i * 90 + 150) + 'ms">' +
        '<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="2" ' +
        'fill="var(--surface)" stroke="currentColor" stroke-width="1.25"/>' +
        '<text x="' + (n.x + 10) + '" y="' + (n.y + 19) + '" font-family="Archivo,sans-serif" font-size="11.5" ' +
        'font-weight="500" fill="var(--ink)">' + n.t + '</text>' +
        '<text x="' + (n.x + 10) + '" y="' + (n.y + 33) + '" font-family="JetBrains Mono,monospace" font-size="9" ' +
        'fill="var(--ink-3)">' + n.s + '</text></g>';
    }).join('');
    /* right angle connectors, the way real architecture diagrams draw them */
    var P = [
      'M110 150 H146',
      'M238 150 H274',
      'M366 150 H384 V90 H402',
      'M366 150 H384 V210 H402',
      'M448 232 V246'
    ].map(function (d, i) {
      return '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.25" ' +
        'marker-end="url(#tip)" class="sl" style="animation-delay:' + (i * 90 + 420) + 'ms"/>';
    }).join('');
    g.innerHTML = box + P;
  }

  Promise.all([
    fetch('data/services.json').then(function (r) { return r.json(); }),
    fetch('data/categories.json').then(function (r) { return r.json(); })
  ]).then(function (res) {
    S = res[0]; CATS = res[1];
    $('#tSvc').textContent = S.length;
    $('#tWr').textContent = S.filter(function (x) { return x.written; }).length;
    $('#tCat').textContent = CATS.length;
    var counts = {};
    S.forEach(function (s) { counts[s.category] = (counts[s.category] || 0) + 1; });
    $('#cats').innerHTML = '<button data-cat="" aria-pressed="true">All<b>' + S.length + '</b></button>' +
      CATS.map(function (c) {
        return '<button data-cat="' + esc(c) + '" aria-pressed="false" style="--dot:' + dot(c) + '">' +
          '<i></i>' + esc(c) + '<b>' + (counts[c] || 0) + '</b></button>';
      }).join('');
    $('#cats').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $('#cats').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true'); st.cat = b.dataset.cat; render();
    });
    render(); schematic();
    if (location.hash) open(location.hash.slice(1));
  }).catch(function (err) {
    $('#list').innerHTML = '<p class="none">Could not load the service data. If you opened the file directly, ' +
      'serve it instead: <code class="mono">python3 -m http.server</code></p>';
    console.error(err);
  });
})();
