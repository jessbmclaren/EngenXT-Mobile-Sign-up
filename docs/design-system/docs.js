/* ══════════════════════════════════════════════════════════════════════════
   THE DOCUMENTATION'S BEHAVIOUR

   Three jobs, and none of them is styling:

     1. Read the real tokens out of the real stylesheet and draw the tables.
        Nothing here holds a copy of a value. A token table that is typed by
        hand is a second source of truth, and the second one is always the one
        that goes stale - so every number on this page is asked for at the
        moment it is shown.

     2. Escape the markup of each specimen and offer it to be copied, so what
        a developer pastes is the thing they are looking at.

     3. Follow the reading position in the rail.

   Two ways to read a token, because both are needed. Over http the browser
   lets a page read the rules of a linked stylesheet, which gives the token's
   AUTHORED text - "color-mix(in srgb, ...)" - and the order it was written
   in. Opened straight off disk it does not, so the computed value is asked
   for instead: the resolved answer, without the workings. The page says which
   of the two it is showing rather than quietly showing less.
   ══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ── Reading the scale ────────────────────────────────────────────── */

  function authoredTokens() {
    var out = [], seen = {};
    function scan(rules) {
      if (!rules) { return; }
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        /* @layer, @media and @supports all hold rules of their own, and the
           scale lives inside @layer tokens. */
        if (r.cssRules && r.cssRules.length) { scan(r.cssRules); }
        if (!r.style || r.selectorText !== ':root') { continue; }
        for (var k = 0; k < r.style.length; k++) {
          var name = r.style[k];
          if (name.indexOf('--') !== 0 || seen[name]) { continue; }
          seen[name] = 1;
          out.push({ name: name, authored: r.style.getPropertyValue(name).trim() });
        }
      }
    }
    for (var s = 0; s < document.styleSheets.length; s++) {
      try { scan(document.styleSheets[s].cssRules); } catch (e) { /* unreadable off disk */ }
    }
    return out;
  }

  function computedTokens() {
    var cs = getComputedStyle(root), out = [];
    for (var i = 0; i < cs.length; i++) {
      var p = cs[i];
      if (p.indexOf('--') === 0) { out.push({ name: p, authored: '' }); }
    }
    return out;
  }

  var AUTHORED = authoredTokens();
  var READABLE = AUTHORED.length > 0;
  var TOKENS = (READABLE ? AUTHORED : computedTokens())
    .filter(function (t) { return t.name.indexOf('--d-') !== 0 && t.name.indexOf('--ds-') !== 0; })
    .map(function (t) {
      t.value = getComputedStyle(root).getPropertyValue(t.name).trim();
      return t;
    });

  /* The families the scale is allowed to have. Same list the build gate
     enforces, so a token that appears here in "other" is a token the gate
     would already have refused. */
  var FAMILIES = [
    ['--color-', 'Colour'], ['--gradient-', 'Gradient'], ['--glass-', 'Glass'],
    ['--text-', 'Type size'], ['--weight-', 'Weight'], ['--leading-', 'Leading'],
    ['--tracking-', 'Tracking'], ['--font-', 'Face'],
    ['--sp-', 'Spacing'], ['--size-', 'Size'], ['--radius-', 'Radius'],
    ['--shadow-', 'Elevation'], ['--press-', 'Press'],
    ['--dur-', 'Duration'], ['--ease-', 'Easing'], ['--z-', 'Layer'],
    ['--kb-', 'Android keyboard (OS chrome, not product)'],
  ];

  function familyOf(name) {
    for (var i = 0; i < FAMILIES.length; i++) {
      if (name.indexOf(FAMILIES[i][0]) === 0) { return FAMILIES[i][1]; }
    }
    return 'Other';
  }

  /* ── Drawing a value ──────────────────────────────────────────────── */

  function sampleFor(t) {
    var v = t.value;
    if (/^--color-|^--glass-/.test(t.name)) {
      return '<span class="ds-chip" style="background:' + v + '"></span>';
    }
    if (/^--gradient-/.test(t.name)) {
      return '<span class="ds-chip" style="width:64px;background-image:' + v + '"></span>';
    }
    if (/^--shadow-/.test(t.name)) {
      return '<span class="ds-elev" style="box-shadow:' + v + '"></span>';
    }
    if (/^--radius-/.test(t.name)) {
      return '<span class="ds-corner" style="border-radius:' + v + '"></span>';
    }
    if (/^--sp-|^--size-/.test(t.name)) {
      var px = parseFloat(v);
      if (!isNaN(px) && px > 0 && px < 400) {
        return '<span class="ds-bar" style="width:' + Math.min(px, 240) + 'px"></span>';
      }
    }
    if (/^--text-/.test(t.name)) {
      return '<span style="font-size:' + v + ';line-height:1">Aa</span>';
    }
    if (/^--weight-/.test(t.name)) {
      return '<span style="font-weight:' + v + '">Aa</span>';
    }
    return '';
  }

  function rem(v) {
    var px = parseFloat(v);
    return (!isNaN(px) && /px$/.test(v)) ? (px / 16).toFixed(px % 16 === 0 ? 0 : 4).replace(/\.?0+$/, '') + 'rem' : '';
  }

  function tokenTable(host) {
    var groups = {};
    TOKENS.forEach(function (t) {
      var f = familyOf(t.name);
      (groups[f] = groups[f] || []).push(t);
    });
    var html = '';
    FAMILIES.map(function (f) { return f[1]; }).concat(['Other']).forEach(function (fam) {
      var rows = groups[fam];
      if (!rows || !rows.length) { return; }
      html += '<h3>' + esc(fam) + ' <span class="ds-pill">' + rows.length + '</span></h3>';
      html += '<div class="ds-tablewrap"><table class="ds-table"><thead><tr>' +
        '<th>Custom property</th><th>Resolved value</th>' +
        (READABLE ? '<th>As written</th>' : '') +
        '<th>rem</th><th></th></tr></thead><tbody>';
      rows.forEach(function (t) {
        html += '<tr><td><code>' + esc(t.name) + '</code></td>' +
          '<td class="ds-mono ds-num">' + esc(t.value) + '</td>' +
          (READABLE ? '<td class="ds-mono">' + esc(t.authored) + '</td>' : '') +
          '<td class="ds-mono ds-num">' + esc(rem(t.value)) + '</td>' +
          '<td>' + sampleFor(t) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    });
    host.innerHTML = html;
  }

  /* ── Specimens ────────────────────────────────────────────────────── */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Takes the markup already rendered in the stage and prints it back, so the
     example and the code cannot disagree: there is only one copy of it. */
  function tidy(html) {
    var lines = html.replace(/></g, '>\n<').split('\n');
    var depth = 0;
    return lines.map(function (l) {
      l = l.trim();
      if (!l) { return null; }
      if (/^<\//.test(l)) { depth = Math.max(0, depth - 1); }
      var out = new Array(depth + 1).join('  ') + l;
      if (/^<[^/!]/.test(l) && !/\/>$/.test(l) && !/<\/[a-z-]+>$/.test(l) &&
          !/^<(input|img|br|hr|meta|link|path|circle|rect|use)\b/i.test(l)) { depth++; }
      return out;
    }).filter(Boolean).join('\n');
  }

  function wireSpecimens() {
    var specs = document.querySelectorAll('.ds-spec');
    Array.prototype.forEach.call(specs, function (spec) {
      var stage = spec.querySelector('.ds-spec__stage');
      var foot = spec.querySelector('.ds-spec__foot');
      if (!stage || !foot || foot.dataset.wired) { return; }
      var code = tidy(stage.innerHTML);
      var pre = document.createElement('pre');
      pre.className = 'ds-code';
      pre.textContent = code;
      foot.appendChild(pre);

      var head = spec.querySelector('.ds-spec__head');
      if (head) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ds-copy';
        btn.textContent = 'Copy markup';
        btn.addEventListener('click', function () {
          var done = function () {
            btn.textContent = 'Copied';
            setTimeout(function () { btn.textContent = 'Copy markup'; }, 1400);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(done, function () { select(pre); });
          } else { select(pre); }
        });
        head.appendChild(btn);
      }
      foot.dataset.wired = '1';
    });
  }

  /* Where the clipboard is refused - and off disk it often is - the text is
     selected instead, so the reader can still take it with one keystroke. */
  function select(node) {
    var r = document.createRange();
    r.selectNodeContents(node);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  /* ── The rail follows the reading position ────────────────────────── */

  function wireRail() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.ds-rail a[href^="#"]'));
    var sections = links.map(function (a) { return document.getElementById(a.hash.slice(1)); });
    if (!('IntersectionObserver' in window)) { return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var i = sections.indexOf(e.target);
        if (i === -1) { return; }
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        links[i].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-8% 0px -80% 0px' });
    sections.forEach(function (s) { if (s) { io.observe(s); } });
  }

  /* ── How the page was read ────────────────────────────────────────── */

  function stampSource() {
    var el = document.getElementById('dsSource');
    if (!el) { return; }
    el.innerHTML = READABLE
      ? 'Reading <strong>' + TOKENS.length + ' tokens</strong> from the linked stylesheet, ' +
        'including how each one is written. This is what you get over http, which is how ' +
        'GitHub Pages serves it.'
      : 'Reading <strong>' + TOKENS.length + ' tokens</strong> as resolved values. Opened ' +
        'straight off disk, a browser will not let a page read the rules of a linked ' +
        'stylesheet, so the authored form is not available here. Serve the folder over ' +
        'http to see it.';
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function () {
    var host = document.getElementById('dsTokens');
    if (host) { tokenTable(host); }
    stampSource();
    wireSpecimens();
    wireRail();
  });
})();
