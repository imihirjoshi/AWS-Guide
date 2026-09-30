/* Turn the board into a standalone drawing: SVG, PNG, or print to PDF.
   Built from the data model, not a screenshot, so the output is vector clean. */
window.AWSExport = (function () {
  'use strict';
  var iconCache = {};

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* pull an icon's inner markup so it can be nested inside the export */
  function loadIcon(url) {
    if (iconCache[url]) return Promise.resolve(iconCache[url]);
    return fetch(url).then(function (r) { return r.text(); }).then(function (txt) {
      var vb = (/viewBox="([^"]+)"/.exec(txt) || [, '0 0 80 80'])[1];
      var inner = txt.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '');
      inner = inner.replace(/<title>[\s\S]*?<\/title>/gi, '');
      var o = { vb: vb, inner: inner };
      iconCache[url] = o;
      return o;
    }).catch(function () { return { vb: '0 0 80 80', inner: '' }; });
  }

  /* build the whole diagram as one self contained SVG string */
  function buildSVG(model) {
    var nodes = model.nodes, links = model.links, PAD = 40, W = 172, TITLE = 74;
    if (!nodes.length) return Promise.reject(new Error('empty'));

    /* measure from the live DOM so the export matches what is on screen */
    var box = {};
    nodes.forEach(function (n) {
      var el = document.querySelector('.node[data-id="' + n.id + '"]');
      box[n.id] = { x: n.x, y: n.y, w: el ? el.offsetWidth : W, h: el ? el.offsetHeight : 76 };
    });
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function (n) {
      var b = box[n.id];
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
    });
    var ox = PAD - minX, oy = PAD + TITLE - minY;
    var w = (maxX - minX) + PAD * 2;
    var h = (maxY - minY) + PAD * 2 + TITLE + 46;

    return Promise.all(nodes.map(function (n) { return loadIcon(model.icon(n.slug)); }))
      .then(function (icons) {
        var wires = links.map(function (lk) {
          var a = box[lk.a], b = box[lk.b]; if (!a || !b) return '';
          var ax = a.x + a.w + ox, ay = a.y + a.h / 2 + oy;
          var bx = b.x + ox, by = b.y + b.h / 2 + oy, d;
          if (bx >= ax + 20) {
            var mx = Math.round((ax + bx) / 2);
            d = 'M' + ax + ' ' + ay + ' H' + mx + ' V' + by + ' H' + (bx - 7);
          } else {
            var dn = Math.max(ay, by) + 46;
            d = 'M' + ax + ' ' + ay + ' H' + (ax + 16) + ' V' + dn + ' H' + (bx - 16) + ' V' + by + ' H' + (bx - 7);
          }
          return '<path d="' + d + '" fill="none" stroke="#39485A" stroke-width="1.5" marker-end="url(#a)"/>';
        }).join('');

        var blocks = nodes.map(function (n, i) {
          var b = box[n.id], ic = icons[i], m = model.meta(n);
          var x = b.x + ox, y = b.y + oy;
          var lines = String(m.sub).replace(/(.{1,21})(\s|$)/g, '$1\n').trim().split('\n').slice(0, 3);
          return '<g>' +
            '<rect x="' + x + '" y="' + y + '" width="' + b.w + '" height="' + b.h + '" rx="2" fill="#fff" stroke="#6B7C91" stroke-width="1.5"/>' +
            '<rect x="' + x + '" y="' + y + '" width="4" height="' + b.h + '" fill="' + m.colour + '"/>' +
            '<svg x="' + (x + 9) + '" y="' + (y + 9) + '" width="24" height="24" viewBox="' + ic.vb + '">' + ic.inner + '</svg>' +
            '<text x="' + (x + 40) + '" y="' + (y + 20) + '" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#0E1620">' + esc(m.label) + '</text>' +
            lines.map(function (ln, j) {
              return '<text x="' + (x + 40) + '" y="' + (y + 35 + j * 10.5) + '" font-family="ui-monospace, Menlo, monospace" font-size="8.5" fill="#6B7C91">' + esc(ln) + '</text>';
            }).join('') +
            (m.cost ? '<text x="' + (x + 40) + '" y="' + (y + b.h - 9) + '" font-family="ui-monospace, Menlo, monospace" font-size="10.5" font-weight="500" fill="#0E1620">' + esc(m.cost) + '</text>' : '') +
            '</g>';
        }).join('');

        var head = '<text x="' + PAD + '" y="36" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="19" font-weight="600" fill="#0E1620">' + esc(model.title) + '</text>' +
          '<text x="' + PAD + '" y="56" font-family="ui-monospace, Menlo, monospace" font-size="11" fill="#6B7C91">' +
          esc('Rough monthly estimate ' + model.total + '  ยท  ' + nodes.length + ' services') + '</text>';
        head = head.replace('ยท', '|');
        var foot = '<text x="' + PAD + '" y="' + (h - 18) + '" font-family="ui-monospace, Menlo, monospace" font-size="9" fill="#77869A">' +
          esc('Teaching sketch. Not an AWS quote. Icons are official AWS Architecture Icons, used unmodified. Not affiliated with AWS.') + '</text>';

        return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
          'width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
          '<defs><marker id="a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">' +
          '<path d="M0 0 L8 4 L0 8 z" fill="#39485A"/></marker></defs>' +
          '<rect width="100%" height="100%" fill="#FFFFFF"/>' +
          '<line x1="' + PAD + '" y1="' + (TITLE - 10) + '" x2="' + (w - PAD) + '" y2="' + (TITLE - 10) + '" stroke="#D5DAE1" stroke-width="1"/>' +
          head + wires + blocks + foot + '</svg>';
      });
  }

  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  return {
    svg: function (model) {
      return buildSVG(model).then(function (s) {
        download(new Blob([s], { type: 'image/svg+xml' }), 'aws-diagram.svg');
      });
    },
    png: function (model, scale) {
      return buildSVG(model).then(function (s) {
        return new Promise(function (res, rej) {
          var img = new Image();
          img.onload = function () {
            var k = scale || 2;
            var cv = document.createElement('canvas');
            cv.width = img.width * k; cv.height = img.height * k;
            var g = cv.getContext('2d');
            g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
            g.drawImage(img, 0, 0, cv.width, cv.height);
            cv.toBlob(function (b) { download(b, 'aws-diagram.png'); res(); }, 'image/png');
          };
          img.onerror = rej;
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
        });
      });
    },
    pdf: function (model) {
      return buildSVG(model).then(function (s) {
        var rows = model.rows.map(function (r) {
          return '<tr><td>' + esc(r.n) + '</td><td class="r">' + esc(r.c) + '</td></tr>';
        }).join('');
        var w = window.open('', '_blank');
        if (!w) { alert('Your browser blocked the print window. Allow pop ups for this page and try again.'); return; }
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(model.title) + '</title>' +
          '<style>@page{size:A4 landscape;margin:14mm}' +
          'body{font:13px -apple-system,Helvetica,Arial,sans-serif;color:#0E1620;margin:0}' +
          'h1{font-size:19px;margin:0 0 3px}.sub{font:11px ui-monospace,Menlo,monospace;color:#6B7C91;margin-bottom:14px}' +
          'svg{max-width:100%;height:auto;display:block}' +
          'table{border-collapse:collapse;margin-top:18px;min-width:300px;font-size:12px}' +
          'th,td{text-align:left;padding:5px 12px 5px 0;border-bottom:1px solid #D5DAE1}' +
          'th{font:10px ui-monospace,monospace;color:#6B7C91;text-transform:uppercase;letter-spacing:.07em}' +
          'td.r{text-align:right;font-family:ui-monospace,Menlo,monospace}' +
          'tr.tot td{font-weight:700;border-top:2px solid #0E1620;border-bottom:0}' +
          '.note{margin-top:16px;font-size:10px;color:#77869A;line-height:1.6;max-width:120ch}' +
          '</style></head><body>' +
          '<h1>' + esc(model.title) + '</h1>' +
          '<div class="sub">Rough monthly estimate ' + esc(model.total) + ' &nbsp;|&nbsp; ' + model.nodes.length + ' services</div>' +
          s +
          '<table><tr><th>Service</th><th class="r">Per month</th></tr>' + rows +
          '<tr class="tot"><td>Total</td><td class="r">' + esc(model.total) + '</td></tr></table>' +
          '<p class="note"><strong>This is a teaching sketch, not a quote and not advice.</strong> ' +
          'Costs assume roughly US East on demand list pricing and ignore the free tier, data transfer, ' +
          'regional differences, taxes, Reserved Instances, Savings Plans and any discount. Use the AWS Pricing ' +
          'Calculator for real numbers. Icons are the official AWS Architecture Icons, used unmodified. ' +
          'Not affiliated with, endorsed by, or sponsored by Amazon Web Services.</p>' +
          '</body></html>');
        w.document.close();
        setTimeout(function () { w.focus(); w.print(); }, 450);
      });
    }
  };
})();
