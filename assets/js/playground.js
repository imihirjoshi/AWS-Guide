/* AWS Playground. Teaching sandbox. Nothing here touches a real AWS account. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function money(usd) { return window.AWSCur ? AWSCur.fmt(usd) : '$' + usd.toFixed(2); }


  /* ---- the models. Rough public on-demand style rates, for teaching only. ---- */
  var EC2 = {
    't3.micro':  { v: 2, m: 1,  h: 0.0104 },
    't3.small':  { v: 2, m: 2,  h: 0.0208 },
    't3.medium': { v: 2, m: 4,  h: 0.0416 },
    't3.large':  { v: 2, m: 8,  h: 0.0832 },
    'm5.large':  { v: 2, m: 8,  h: 0.096 },
    'm5.xlarge': { v: 4, m: 16, h: 0.192 },
    'c5.xlarge': { v: 4, m: 8,  h: 0.17 },
    'r5.xlarge': { v: 4, m: 32, h: 0.252 }
  };
  var DB = {
    'db.t3.micro':  { v: 2, m: 1,  h: 0.017 },
    'db.t3.small':  { v: 2, m: 2,  h: 0.034 },
    'db.t3.medium': { v: 2, m: 4,  h: 0.068 },
    'db.m5.large':  { v: 2, m: 8,  h: 0.171 },
    'db.r5.large':  { v: 2, m: 16, h: 0.24 }
  };
  var HRS = 730;

  /* Each placeable kind: how it is configured and how it is charged. */
  var KINDS = {
    'amazon-ec2': {
      label: 'EC2', fields: [
        { k: 'size', t: 'select', label: 'Instance size', opts: Object.keys(EC2), def: 't3.small' },
        { k: 'disk', t: 'number', label: 'Disk, GB (gp3)', def: 30, min: 8, max: 16000 },
        { k: 'count', t: 'number', label: 'How many', def: 1, min: 1, max: 50 },
        { k: 'hours', t: 'number', label: 'Hours on per month', def: 730, min: 1, max: 730 }
      ],
      sub: function (c) { var s = EC2[c.size]; return c.count + ' x ' + c.size + ', ' + s.v + ' vCPU, ' + s.m + ' GB, ' + c.disk + ' GB disk'; },
      cost: function (c) { return c.count * (EC2[c.size].h * c.hours + c.disk * 0.08); }
    },
    'amazon-rds': {
      label: 'RDS', fields: [
        { k: 'size', t: 'select', label: 'Database size', opts: Object.keys(DB), def: 'db.t3.small' },
        { k: 'disk', t: 'number', label: 'Storage, GB', def: 50, min: 20, max: 8000 },
        { k: 'multiaz', t: 'select', label: 'Standby copy (Multi AZ)', opts: ['no', 'yes'], def: 'no' }
      ],
      sub: function (c) { var s = DB[c.size]; return c.size + ', ' + s.m + ' GB RAM, ' + c.disk + ' GB' + (c.multiaz === 'yes' ? ', standby on' : ''); },
      cost: function (c) { var m = c.multiaz === 'yes' ? 2 : 1; return m * (DB[c.size].h * HRS + c.disk * 0.115); }
    },
    'amazon-aurora': {
      label: 'Aurora', fields: [
        { k: 'size', t: 'select', label: 'Instance size', opts: ['db.t3.medium', 'db.r5.large'], def: 'db.t3.medium' },
        { k: 'replicas', t: 'number', label: 'Read copies', def: 0, min: 0, max: 15 },
        { k: 'disk', t: 'number', label: 'Storage, GB', def: 50, min: 10, max: 128000 }
      ],
      sub: function (c) { return c.size + ', ' + (1 + c.replicas) + ' node(s), ' + c.disk + ' GB'; },
      cost: function (c) { var h = c.size === 'db.r5.large' ? 0.29 : 0.082; return (1 + c.replicas) * h * HRS + c.disk * 0.10; }
    },
    'amazon-simple-storage-service': {
      label: 'S3', fields: [
        { k: 'gb', t: 'number', label: 'Stored, GB', def: 100, min: 1, max: 5000000 },
        { k: 'out', t: 'number', label: 'Downloaded, GB / month', def: 50, min: 0, max: 5000000 }
      ],
      sub: function (c) { return c.gb + ' GB stored, ' + c.out + ' GB out'; },
      cost: function (c) { return c.gb * 0.023 + c.out * 0.09; }
    },
    'amazon-cloudfront': {
      label: 'CloudFront', fields: [{ k: 'out', t: 'number', label: 'Delivered, GB / month', def: 200, min: 0, max: 5000000 }],
      sub: function (c) { return c.out + ' GB delivered'; },
      cost: function (c) { return Math.max(0, c.out - 1024) * 0.085; }
    },
    'aws-lambda': {
      label: 'Lambda', fields: [
        { k: 'req', t: 'number', label: 'Requests / month', def: 1000000, min: 0, max: 1000000000 },
        { k: 'ms', t: 'number', label: 'Average run, ms', def: 200, min: 1, max: 900000 },
        { k: 'mem', t: 'select', label: 'Memory, MB', opts: ['128', '256', '512', '1024', '2048'], def: '512' }
      ],
      sub: function (c) { return (c.req / 1e6).toFixed(1) + 'M requests, ' + c.ms + ' ms, ' + c.mem + ' MB'; },
      cost: function (c) {
        var gbs = c.req * (c.ms / 1000) * (parseInt(c.mem, 10) / 1024);
        return Math.max(0, c.req - 1e6) / 1e6 * 0.20 + Math.max(0, gbs - 400000) * 0.0000166667;
      }
    },
    'elastic-load-balancing': {
      label: 'Load balancer', fields: [{ k: 'lcu', t: 'number', label: 'Traffic units (LCU)', def: 5, min: 1, max: 1000 }],
      sub: function (c) { return 'Application LB, ' + c.lcu + ' LCU'; },
      cost: function (c) { return 0.0225 * HRS + c.lcu * 0.008 * HRS; }
    },
    'amazon-route-53': {
      label: 'Route 53', fields: [{ k: 'zones', t: 'number', label: 'Domains', def: 1, min: 1, max: 100 }],
      sub: function (c) { return c.zones + ' hosted zone(s)'; },
      cost: function (c) { return c.zones * 0.50 + 0.40; }
    },
    'amazon-dynamodb': {
      label: 'DynamoDB', fields: [
        { k: 'gb', t: 'number', label: 'Stored, GB', def: 25, min: 1, max: 100000 },
        { k: 'wr', t: 'number', label: 'Writes / month (millions)', def: 5, min: 0, max: 100000 },
        { k: 'rd', t: 'number', label: 'Reads / month (millions)', def: 20, min: 0, max: 100000 }
      ],
      sub: function (c) { return c.gb + ' GB, ' + c.wr + 'M writes, ' + c.rd + 'M reads'; },
      cost: function (c) { return c.gb * 0.25 + c.wr * 1.25 + c.rd * 0.25; }
    },
    'amazon-api-gateway': {
      label: 'API Gateway', fields: [{ k: 'req', t: 'number', label: 'Requests / month (millions)', def: 1, min: 0, max: 100000 }],
      sub: function (c) { return c.req + 'M requests'; },
      cost: function (c) { return c.req * 1.00; }
    },
    'amazon-elasticache': {
      label: 'ElastiCache', fields: [
        { k: 'size', t: 'select', label: 'Node size', opts: ['cache.t3.micro', 'cache.t3.small', 'cache.m5.large'], def: 'cache.t3.small' },
        { k: 'nodes', t: 'number', label: 'Nodes', def: 1, min: 1, max: 20 }
      ],
      sub: function (c) { return c.nodes + ' x ' + c.size; },
      cost: function (c) { var h = { 'cache.t3.micro': 0.017, 'cache.t3.small': 0.034, 'cache.m5.large': 0.156 }[c.size]; return c.nodes * h * HRS; }
    },
    'aws-fargate': {
      label: 'Fargate', fields: [
        { k: 'tasks', t: 'number', label: 'Containers running', def: 2, min: 1, max: 200 },
        { k: 'vcpu', t: 'select', label: 'vCPU each', opts: ['0.25', '0.5', '1', '2', '4'], def: '0.5' },
        { k: 'mem', t: 'number', label: 'GB memory each', def: 1, min: 1, max: 30 },
        { k: 'hours', t: 'number', label: 'Hours per month', def: 730, min: 1, max: 730 }
      ],
      sub: function (c) { return c.tasks + ' task(s), ' + c.vcpu + ' vCPU, ' + c.mem + ' GB'; },
      cost: function (c) { return c.tasks * c.hours * (parseFloat(c.vcpu) * 0.04048 + c.mem * 0.004445); }
    },
    'amazon-simple-queue-service': {
      label: 'SQS', fields: [{ k: 'req', t: 'number', label: 'Requests / month (millions)', def: 5, min: 0, max: 1000000 }],
      sub: function (c) { return c.req + 'M requests'; },
      cost: function (c) { return Math.max(0, c.req - 1) * 0.40; }
    },
    'amazon-simple-email-service': {
      label: 'SES', fields: [{ k: 'mails', t: 'number', label: 'Emails / month (thousands)', def: 50, min: 0, max: 1000000 }],
      sub: function (c) { return c.mails + 'k emails'; },
      cost: function (c) { return c.mails * 0.10; }
    },
    'amazon-cloudwatch': {
      label: 'CloudWatch', fields: [
        { k: 'logs', t: 'number', label: 'Logs stored, GB / month', def: 10, min: 0, max: 100000 },
        { k: 'alarms', t: 'number', label: 'Alarms', def: 5, min: 0, max: 5000 }
      ],
      sub: function (c) { return c.logs + ' GB logs, ' + c.alarms + ' alarms'; },
      cost: function (c) { return c.logs * 0.50 + c.alarms * 0.10; }
    },
    'aws-waf': {
      label: 'WAF', fields: [
        { k: 'rules', t: 'number', label: 'Rules', def: 5, min: 1, max: 500 },
        { k: 'req', t: 'number', label: 'Requests / month (millions)', def: 5, min: 0, max: 1000000 }
      ],
      sub: function (c) { return c.rules + ' rules, ' + c.req + 'M requests'; },
      cost: function (c) { return 5 + c.rules * 1 + c.req * 0.60; }
    },
    'amazon-bedrock': {
      label: 'Bedrock', fields: [
        { k: 'inTok', t: 'number', label: 'Input tokens / month (millions)', def: 10, min: 0, max: 1000000 },
        { k: 'outTok', t: 'number', label: 'Output tokens / month (millions)', def: 2, min: 0, max: 1000000 }
      ],
      sub: function (c) { return c.inTok + 'M in, ' + c.outTok + 'M out'; },
      cost: function (c) { return c.inTok * 3 + c.outTok * 15; }
    },
    'amazon-virtual-private-cloud': {
      label: 'VPC', fields: [{ k: 'nat', t: 'number', label: 'NAT gateways', def: 0, min: 0, max: 10 }],
      sub: function (c) { return c.nat ? c.nat + ' NAT gateway(s)' : 'No NAT gateway'; },
      cost: function (c) { return c.nat * 0.045 * HRS; }
    }
  };
  var DEFAULTKIND = {
    fields: [], sub: function () { return 'No cost model yet'; }, cost: function () { return 0; }
  };
  function kindOf(slug) { return KINDS[slug] || DEFAULTKIND; }

  var DOTMAP = {
    'Compute': '--c-compute', 'Containers': '--c-compute', 'Storage': '--c-storage',
    'Databases': '--c-database', 'Networking and Content Delivery': '--c-network',
    'Analytics': '--c-analytics', 'Security and Identity': '--c-security',
    'AI and Machine Learning': '--c-ai', 'Developer Tools': '--c-dev',
    'Application Integration': '--c-integration', 'Management and Governance': '--c-mgmt',
    'Business Applications': '--c-integration', 'Cost and Billing': '--c-cost',
    'Media': '--c-integration', 'Migration and Transfer': '--c-ai'
  };
  function dotFor(cat) { return 'var(' + (DOTMAP[cat] || '--c-other') + ')'; }

  var S = [], byslug = {}, nodes = [], links = [], nid = 1, sel = null, linkMode = false, linkFrom = null;

  function defaults(slug) {
    var o = {};
    kindOf(slug).fields.forEach(function (f) { o[f.k] = f.def; });
    return o;
  }
  function addNode(slug, x, y) {
    var s = byslug[slug]; if (!s) return;
    nodes.push({ id: nid++, slug: slug, x: x, y: y, cfg: defaults(slug) });
    draw();
  }

  /* ---- rendering ---- */
  function draw() {
    var cv = $('#canvas');
    Array.prototype.forEach.call(cv.querySelectorAll('.node'), function (n) { n.remove(); });
    nodes.forEach(function (n) {
      var s = byslug[n.slug], k = kindOf(n.slug);
      var c = k.cost(n.cfg);
      var el = document.createElement('div');
      el.className = 'node' + (sel === n.id ? ' sel' : '') + (linkFrom === n.id ? ' linking' : '');
      el.style.left = n.x + 'px'; el.style.top = n.y + 'px';
      el.style.setProperty('--dot', dotFor(s.category));
      el.dataset.id = n.id;
      el.innerHTML = '<div class="gut"><img src="' + esc(s.icon) + '" alt=""></div>' +
        '<div class="bod"><div class="nm">' + esc(k.label || s.name) + '</div>' +
        '<div class="sub">' + esc(k.sub(n.cfg)) + '</div>' +
        (c > 0 ? '<div class="cost">' + esc(money(c)) + ' / mo</div>' : '') + '</div>' +
        '<div class="port" data-port="' + n.id + '"></div>';
      cv.appendChild(el);
    });
    wires(); costs(); review(); config();
  }

  function centreOf(id) {
    var el = $('.node[data-id="' + id + '"]');
    if (!el) return null;
    return { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2,
             r: el.offsetLeft + el.offsetWidth, l: el.offsetLeft };
  }
  function wires() {
    var svg = $('#wires'), p = '';
    links.forEach(function (lk) {
      var a = centreOf(lk.a), b = centreOf(lk.b); if (!a || !b) return;
      var d;
      if (b.l >= a.r + 20) {
        var mx = Math.round((a.r + b.l) / 2);
        d = 'M' + a.r + ' ' + a.y + ' H' + mx + ' V' + b.y + ' H' + (b.l - 6);
      } else {
        var down = Math.max(a.y, b.y) + 46;
        d = 'M' + a.r + ' ' + a.y + ' H' + (a.r + 16) + ' V' + down +
            ' H' + (b.l - 16) + ' V' + b.y + ' H' + (b.l - 6);
      }
      p += '<path d="' + d + '" fill="none" stroke="var(--ink-2)" stroke-width="1.5" ' +
           'marker-end="url(#ar)" shape-rendering="crispEdges"/>';
    });
    svg.innerHTML = '<defs><marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="var(--ink-2)"/></marker></defs>' + p;
  }

  function costs() {
    var rows = [], total = 0;
    nodes.forEach(function (n) {
      var c = kindOf(n.slug).cost(n.cfg);
      total += c;
      if (c > 0) rows.push({ n: kindOf(n.slug).label || byslug[n.slug].name, c: c });
    });
    rows.sort(function (a, b) { return b.c - a.c; });
    $('#total').textContent = money(total);
    $('#totalUsd').textContent = window.AWSCur && !AWSCur.isUSD()
      ? 'AWS bills you in US dollars. This is $' + total.toFixed(2) + ' converted.'
      : 'AWS bills you in US dollars.';
    rateUI();
    $('#breakdown').innerHTML = rows.length
      ? rows.map(function (r) { return '<div class="costrow"><span>' + esc(r.n) + '</span><span>' + esc(money(r.c)) + '</span></div>'; }).join('')
      : '<p class="hint">Nothing with a cost model on the board yet.</p>';
  }

  function rateUI() {
    var el = $('#rateline'); if (!el || !window.AWSCur) return;
    if (AWSCur.isUSD()) { el.innerHTML = ''; return; }
    el.innerHTML = '<label for="rateIn">1 USD =</label>' +
      '<input id="rateIn" type="number" step="0.0001" min="0.0001" value="' + AWSCur.rate + '">' +
      '<span>' + esc(AWSCur.code) + '</span>' +
      '<button id="rateReset" title="Back to the built in rate">reset</button>';
    el.querySelector('#rateIn').addEventListener('change', function (e) { AWSCur.setRate(e.target.value); });
    el.querySelector('#rateReset').addEventListener('click', function () { AWSCur.setRate(AWSCur.defaultRate(AWSCur.code)); });
  }
  if (window.AWSCur) AWSCur.onChange(function () { draw(); });

  /* ---- the teaching rules ---- */
  function review() {
    var has = {}, out = [];
    nodes.forEach(function (n) { has[n.slug] = (has[n.slug] || 0) + 1; });
    function h(s) { return !!has[s]; }
    var linked = function (a, b) {
      return links.some(function (l) {
        var x = nodes.find(function (n) { return n.id === l.a; }), y = nodes.find(function (n) { return n.id === l.b; });
        return x && y && ((x.slug === a && y.slug === b) || (x.slug === b && y.slug === a));
      });
    };
    if (!nodes.length) { $('#issues').innerHTML = '<p class="hint">The board is empty. Try a template from the menu at the top.</p>'; return; }

    if (h('amazon-ec2') && has['amazon-ec2'] === 1 && !h('elastic-load-balancing'))
      out.push(['err', 'One server and no load balancer. If that server reboots, your site is down. Add a load balancer and a second server.']);
    if (h('elastic-load-balancing') && (has['amazon-ec2'] || 0) < 2 && !h('aws-fargate'))
      out.push(['tip', 'A load balancer in front of one server still means one point of failure. Two is the smallest number that survives a reboot.']);
    if (h('amazon-simple-storage-service') && !h('amazon-cloudfront'))
      out.push(['tip', 'S3 without CloudFront works, but users far away will wait. CloudFront also cuts your S3 download bill.']);
    if (h('amazon-rds') && !h('amazon-virtual-private-cloud'))
      out.push(['err', 'A database with no VPC drawn. In real life it must sit in a private subnet, never reachable from the internet.']);
    if (h('amazon-rds')) {
      var db = nodes.find(function (n) { return n.slug === 'amazon-rds'; });
      if (db && db.cfg.multiaz === 'no')
        out.push(['tip', 'The database has no standby copy. If that one machine fails you are down until a backup is restored. Turning on Multi AZ doubles the cost and removes that risk.']);
    }
    if ((h('amazon-ec2') || h('aws-fargate') || h('aws-lambda')) && !h('amazon-cloudwatch'))
      out.push(['err', 'Nothing is watching this. Without CloudWatch you find out from your customer, not from an alert.']);
    if (h('amazon-cloudfront') && !h('aws-waf'))
      out.push(['tip', 'A public site with no WAF. Add one if you have a login page or accept payments.']);
    if (h('aws-lambda') && !h('amazon-api-gateway') && !linked('aws-lambda', 'amazon-simple-queue-service'))
      out.push(['tip', 'Lambda needs something to trigger it. Usually API Gateway for web requests, or SQS or EventBridge for background work.']);
    if (h('amazon-virtual-private-cloud')) {
      var v = nodes.find(function (n) { return n.slug === 'amazon-virtual-private-cloud'; });
      if (v && v.cfg.nat > 0)
        out.push(['tip', 'NAT gateways are one of the most common surprise charges on an AWS bill. Each one is roughly 33 dollars a month before any traffic.']);
    }
    if (h('amazon-dynamodb') && h('amazon-rds'))
      out.push(['tip', 'Two different databases. That is sometimes right, and often accidental. Be sure you know which is the source of truth.']);
    if (nodes.length > 2 && !links.length)
      out.push(['tip', 'Nothing is connected. Turn on Connect mode, then drag from the orange dot on one box to another.']);
    if (!out.length) out.push(['ok', 'No obvious problems. Remember this is a teaching check, not a real architecture review.']);

    $('#issues').innerHTML = out.map(function (o) { return '<div class="issue ' + o[0] + '">' + esc(o[1]) + '</div>'; }).join('');
  }

  /* ---- config panel ---- */
  function config() {
    var n = nodes.find(function (x) { return x.id === sel; });
    if (!n) { $('#cfg').innerHTML = '<p class="hint">Click a service on the board to change its size.</p>'; return; }
    var k = kindOf(n.slug), s = byslug[n.slug];
    var h = '<div style="display:flex;align-items:center;gap:9px;margin-bottom:11px">' +
      '<img src="' + esc(s.icon) + '" width="26" height="26" alt=""><strong style="font-size:13px">' + esc(s.name) + '</strong></div>';
    if (!k.fields.length) {
      h += '<p class="hint">No cost model for this one yet. It still shows on the diagram and in the review.</p>';
    } else {
      k.fields.forEach(function (f) {
        h += '<div class="field"><label>' + esc(f.label) + '</label>';
        if (f.t === 'select') {
          h += '<select data-k="' + f.k + '">' + f.opts.map(function (o) {
            return '<option' + (String(n.cfg[f.k]) === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>';
          }).join('') + '</select>';
        } else {
          h += '<input type="number" data-k="' + f.k + '" value="' + esc(n.cfg[f.k]) + '" min="' + f.min + '" max="' + f.max + '">';
        }
        h += '</div>';
      });
    }
    h += '<button class="rmv" id="del">Remove from board</button>';
    $('#cfg').innerHTML = h;
    Array.prototype.forEach.call($('#cfg').querySelectorAll('[data-k]'), function (inp) {
      inp.addEventListener('change', function () {
        var v = inp.tagName === 'SELECT' ? inp.value : Math.max(0, parseFloat(inp.value) || 0);
        n.cfg[inp.dataset.k] = v; draw();
      });
    });
    $('#del').addEventListener('click', function () {
      nodes = nodes.filter(function (x) { return x.id !== n.id; });
      links = links.filter(function (l) { return l.a !== n.id && l.b !== n.id; });
      sel = null; draw();
    });
  }

  /* ---- interaction ---- */
  var drag = null;
  $('#canvas').addEventListener('mousedown', function (e) {
    var port = e.target.closest('.port');
    if (port) {
      linkFrom = parseInt(port.dataset.port, 10); linkMode = true; setLinkBtn(); draw();
      e.preventDefault(); return;
    }
    var el = e.target.closest('.node'); if (!el) return;
    var id = parseInt(el.dataset.id, 10);
    if (linkMode && linkFrom && linkFrom !== id) {
      if (!links.some(function (l) { return (l.a === linkFrom && l.b === id) || (l.a === id && l.b === linkFrom); }))
        links.push({ a: linkFrom, b: id });
      linkFrom = null; draw(); return;
    }
    sel = id;
    var n = nodes.find(function (x) { return x.id === id; });
    drag = { id: id, dx: e.clientX - el.offsetLeft + $('#stage').scrollLeft, dy: e.clientY - el.offsetTop + $('#stage').scrollTop };
    draw(); e.preventDefault();
  });
  document.addEventListener('mousemove', function (e) {
    if (!drag) return;
    var n = nodes.find(function (x) { return x.id === drag.id; }); if (!n) return;
    n.x = Math.max(0, e.clientX - drag.dx + $('#stage').scrollLeft);
    n.y = Math.max(0, e.clientY - drag.dy + $('#stage').scrollTop);
    var el = $('.node[data-id="' + n.id + '"]');
    if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
    wires();
  });
  document.addEventListener('mouseup', function () { if (drag) { drag = null; } });

  function setLinkBtn() {
    var b = $('#linkbtn');
    b.textContent = linkMode ? 'Connecting' : 'Connect';
    b.setAttribute('aria-pressed', linkMode ? 'true' : 'false');
  }
  $('#linkbtn').addEventListener('click', function () { linkMode = !linkMode; linkFrom = null; setLinkBtn(); draw(); });

  /* palette */
  function palette(filter) {
    var f = (filter || '').toLowerCase();
    var known = Object.keys(KINDS);
    var main = S.filter(function (s) { return known.indexOf(s.slug) !== -1; });
    var rest = S.filter(function (s) { return known.indexOf(s.slug) === -1 && s.written; });
    function row(s) {
      return '<div class="palitem" draggable="true" data-slug="' + esc(s.slug) + '">' +
        '<img src="' + esc(s.icon) + '" alt="">' + esc(kindOf(s.slug).label || s.name) + '</div>';
    }
    function keep(s) { return !f || (s.name + ' ' + (s.one || '')).toLowerCase().indexOf(f) !== -1; }
    var a = main.filter(keep), b = rest.filter(keep);
    $('#pallist').innerHTML =
      (a.length ? '<div class="palgrp">With cost model</div>' + a.map(row).join('') : '') +
      (b.length ? '<div class="palgrp">Diagram only</div>' + b.map(row).join('') : '') +
      (!a.length && !b.length ? '<p class="pgnote">Nothing matched.</p>' : '');
  }
  $('#palq').addEventListener('input', function (e) { palette(e.target.value); });
  $('#pallist').addEventListener('dragstart', function (e) {
    var it = e.target.closest('.palitem'); if (!it) return;
    e.dataTransfer.setData('text/plain', it.dataset.slug);
  });
  $('#pallist').addEventListener('click', function (e) {
    var it = e.target.closest('.palitem'); if (!it) return;
    addNode(it.dataset.slug, 340 + (nodes.length % 4) * 190, 150 + Math.floor(nodes.length / 4) * 130);
  });
  $('#stage').addEventListener('dragover', function (e) { e.preventDefault(); });
  $('#stage').addEventListener('drop', function (e) {
    e.preventDefault();
    var slug = e.dataTransfer.getData('text/plain'); if (!slug) return;
    var r = $('#canvas').getBoundingClientRect();
    addNode(slug, Math.max(0, e.clientX - r.left - 79), Math.max(0, e.clientY - r.top - 34));
  });

  /* templates */
  var TPL = {
    static: { n: [['amazon-route-53', 90, 250], ['amazon-cloudfront', 330, 250], ['amazon-simple-storage-service', 580, 250], ['aws-certificate-manager', 330, 410]], l: [[0, 1], [1, 2]] },
    web: { n: [['amazon-route-53', 60, 260], ['amazon-cloudfront', 260, 260], ['elastic-load-balancing', 470, 260], ['amazon-ec2', 690, 180], ['amazon-ec2', 690, 340], ['amazon-rds', 920, 260], ['amazon-virtual-private-cloud', 470, 430], ['amazon-cloudwatch', 690, 500]], l: [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5]] },
    serverless: { n: [['amazon-cloudfront', 80, 260], ['amazon-api-gateway', 300, 260], ['aws-lambda', 520, 260], ['amazon-dynamodb', 740, 190], ['amazon-simple-storage-service', 740, 340], ['amazon-cloudwatch', 520, 430], ['amazon-cognito', 300, 430]], l: [[0, 1], [1, 2], [2, 3], [2, 4]] },
    data: { n: [['amazon-simple-storage-service', 90, 250], ['aws-glue', 320, 250], ['amazon-athena', 550, 250], ['amazon-cloudwatch', 320, 400]], l: [[0, 1], [1, 2]] }
  };
  function loadTpl(key) {
    var t = TPL[key]; if (!t) return false;
    nodes = []; links = []; nid = 1; sel = null;
    var ids = t.n.map(function (a) {
      var id = nid++;
      nodes.push({ id: id, slug: a[0], x: a[1], y: a[2], cfg: defaults(a[0]) });
      return id;
    });
    t.l.forEach(function (p) { links.push({ a: ids[p[0]], b: ids[p[1]] }); });
    draw(); return true;
  }
  $('#tpl').addEventListener('change', function (e) { loadTpl(e.target.value); e.target.value = ''; });

  /* toolbar */
  $('#clear').addEventListener('click', function () {
    if (nodes.length && !confirm('Clear the whole board?')) return;
    nodes = []; links = []; sel = null; nid = 1; draw();
  });
  $('#save').addEventListener('click', function () {
    try { localStorage.setItem('aws-pg', JSON.stringify({ nodes: nodes, links: links, nid: nid })); alert('Saved in this browser.'); }
    catch (e) { alert('Could not save. Private browsing blocks storage.'); }
  });
  $('#load').addEventListener('click', function () {
    try {
      var d = JSON.parse(localStorage.getItem('aws-pg') || 'null');
      if (!d) return alert('Nothing saved yet.');
      nodes = d.nodes; links = d.links; nid = d.nid || 1; sel = null; draw();
    } catch (e) { alert('Could not load the saved board.'); }
  });
  $('#exp').addEventListener('click', function () {
    var out = {
      note: 'Teaching diagram from AWS Explained Simply. Not a real AWS template. Costs are rough estimates.',
      monthlyEstimateUSD: +nodes.reduce(function (t, n) { return t + kindOf(n.slug).cost(n.cfg); }, 0).toFixed(2),
      shownIn: window.AWSCur ? { currency: AWSCur.code, ratePerUSD: AWSCur.rate } : { currency: 'USD', ratePerUSD: 1 },
      services: nodes.map(function (n) { return { service: byslug[n.slug].name, slug: n.slug, settings: n.cfg }; }),
      connections: links.map(function (l) {
        var a = nodes.find(function (n) { return n.id === l.a; }), b = nodes.find(function (n) { return n.id === l.b; });
        return a && b ? byslug[a.slug].name + ' -> ' + byslug[b.slug].name : null;
      }).filter(Boolean)
    };
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'aws-playground.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  /* exports, built from the model so the output is vector clean */
  function exportModel() {
    var rows = [], total = 0;
    nodes.forEach(function (n) {
      var c = kindOf(n.slug).cost(n.cfg); total += c;
      if (c > 0) rows.push({ n: kindOf(n.slug).label || byslug[n.slug].name, c: money(c) });
    });
    rows.sort(function (a, b) { return 0; });
    return {
      title: 'AWS architecture sketch',
      nodes: nodes, links: links,
      total: money(total),
      rows: rows,
      icon: function (slug) { return byslug[slug].icon; },
      meta: function (n) {
        var k = kindOf(n.slug), c = k.cost(n.cfg);
        return {
          label: k.label || byslug[n.slug].name,
          sub: k.sub(n.cfg),
          cost: c > 0 ? money(c) + ' / mo' : '',
          colour: getComputedStyle(document.documentElement)
            .getPropertyValue((DOTMAP[byslug[n.slug].category] || '--c-other')).trim() || '#6B7C91'
        };
      }
    };
  }
  function guard(fn) {
    return function () {
      if (!nodes.length) { alert('Put something on the board first.'); return; }
      Promise.resolve(fn(exportModel())).catch(function (e) {
        alert('Could not build the export. ' + (e && e.message ? e.message : ''));
      });
    };
  }
  $('#expPng').addEventListener('click', guard(function (m) { return AWSExport.png(m, 2); }));
  $('#expSvg').addEventListener('click', guard(function (m) { return AWSExport.svg(m); }));
  $('#expPdf').addEventListener('click', guard(function (m) { return AWSExport.pdf(m); }));

  $('#fit').addEventListener('click', function () {
    $('#stage').scrollTo({ left: 200, top: 120, behavior: 'smooth' });
  });

  /* load data */
  fetch('data/services.json').then(function (r) { return r.json(); }).then(function (d) {
    S = d; d.forEach(function (s) { byslug[s.slug] = s; });
    palette(''); setLinkBtn();
    var m = /[?#]tpl=([a-z]+)/.exec(location.search + location.hash);
    if (!m || !loadTpl(m[1])) draw();
    $('#stage').scrollTo({ left: 40, top: 40 });
  }).catch(function () {
    $('#pallist').innerHTML = '<p class="pgnote">Could not load services. Run a local server: <code>python3 -m http.server</code></p>';
  });
})();
