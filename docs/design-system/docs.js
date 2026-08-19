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

  /* ── How many tiers the scale has ─────────────────────────────────── */

  /* A name whose tail is a position on a scale - a number, a t-shirt size, a
     light/dark modifier - describes what the value IS. Any other tail
     describes what it is FOR. That distinction is the whole difference
     between a palette and a semantic layer, and it can be read off the name
     alone, which is why this half of the count works even off disk. */
  var SCALE_TAIL = /-(\d+|xs|sm|md|lg|xl|xxl|light|dark|darker|lighter)$/;

  function tierTable(host) {
    if (!host) { return; }
    var n = { roleLit: 0, roleVar: 0, scaleLit: 0, scaleVar: 0 };
    TOKENS.forEach(function (t) {
      var role = !SCALE_TAIL.test(t.name);
      /* Indirection can only be seen in the authored text. A computed value
         has already resolved every var(), so off disk this is unknowable -
         and reporting every token as a literal would be a lie the reader
         could not detect. The table says so instead. */
      var indirect = READABLE && t.authored.indexOf('var(') !== -1;
      n[(role ? 'role' : 'scale') + (indirect ? 'Var' : 'Lit')]++;
    });

    var html = '<div class="ds-tablewrap"><table class="ds-table ds-tier">' +
      '<thead><tr><th>Of ' + TOKENS.length + ' tokens</th>' +
      '<th>Holds a literal<br><span class="ds-th-sub">a value of its own</span></th>' +
      '<th>Points at another token<br><span class="ds-th-sub">an alias or a derived step</span></th>' +
      '</tr></thead><tbody>' +
      row('Named for its <strong>job</strong>', '--color-text-primary', n.roleLit, n.roleVar) +
      row('Named for its <strong>place on a scale</strong>', '--sp-4', n.scaleLit, n.scaleVar) +
      '</tbody></table></div>';

    if (!READABLE) {
      html += '<p class="ds-note">The second column cannot be counted here. ' +
        'Opened off disk a browser will not let this page read the stylesheet ' +
        'text, and a computed value has already resolved its <code>var()</code> ' +
        'references — so every token would appear to hold a literal. Serve the ' +
        'folder over http for the real split.</p>';
    } else {
      var semantic = Math.round((n.roleLit + n.roleVar) / TOKENS.length * 100);
      html += '<p><strong>' + semantic + '% of the scale is named for its job.</strong> ' +
        'The naming is semantic almost throughout; the structure underneath it is ' +
        'flat. Only <strong>' + (n.roleVar + n.scaleVar) + '</strong> tokens are ' +
        'built from another token — the gradients, a handful of hover and focus ' +
        'aliases, and the <code>color-mix()</code> steps that tint the primary and ' +
        'secondary. Everything else stands alone.</p>';
    }
    host.innerHTML = html;
  }

  function row(label, eg, lit, ind) {
    return '<tr><td>' + label + '<br><code class="ds-eg">' + esc(eg) + '</code></td>' +
      '<td class="ds-num ds-big">' + lit + '</td>' +
      '<td class="ds-num ds-big">' + (READABLE ? ind : '<span class="ds-unknown">—</span>') + '</td></tr>';
  }

  /* ── The second type scale ────────────────────────────────────────── */

  /* Every custom property declared by rules matching one selector, wherever in
     the eight sheets it lives. Used for the large-text override, which is the
     only place the scale is declared twice. */
  function declarationsFor(selectorText) {
    var out = {};
    function scan(rules) {
      if (!rules) { return; }
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.cssRules && r.cssRules.length && r.type !== 7) { scan(r.cssRules); }
        if (!r.style || r.selectorText !== selectorText) { continue; }
        for (var k = 0; k < r.style.length; k++) {
          var name = r.style[k];
          if (name.indexOf('--') === 0) { out[name] = r.style.getPropertyValue(name).trim(); }
        }
      }
    }
    for (var s = 0; s < document.styleSheets.length; s++) {
      try { scan(document.styleSheets[s].cssRules); } catch (e) { /* unreadable off disk */ }
    }
    return out;
  }

  function largeTable(host) {
    if (!host) { return; }
    var large = declarationsFor('[data-text="large"]');
    var names = Object.keys(large);
    if (!names.length) {
      host.innerHTML = '<p class="ds-note">The large-text scale cannot be listed ' +
        'here. Opened off disk a browser will not let this page read the rules of ' +
        'a linked stylesheet, and the override only exists as a rule — nothing on ' +
        'this page is in that mode, so there is no computed value to fall back to. ' +
        'Serve the folder over http to see it.</p>';
      return;
    }
    var html = '<div class="ds-tablewrap"><table class="ds-table"><thead><tr>' +
      '<th>Token</th><th>Default</th><th>Large</th><th>Step</th><th>Growth</th>' +
      '<th colspan="2">Side by side</th></tr></thead><tbody>';
    names.forEach(function (n) {
      var base = getComputedStyle(root).getPropertyValue(n).trim();
      var a = parseFloat(base), b = parseFloat(large[n]);
      var step = (!isNaN(a) && !isNaN(b)) ? '+' + (b - a) + 'px' : '';
      var pct = (!isNaN(a) && !isNaN(b) && a) ? '+' + Math.round((b / a - 1) * 100) + '%' : '';
      /* Capped for the specimen only - --text-figure is 64px and would set the
         row height for the whole table. The numbers beside it are the real ones. */
      var cap = function (v) { return Math.min(parseFloat(v), 28) + 'px'; };
      html += '<tr><td><code>' + esc(n) + '</code></td>' +
        '<td class="ds-mono ds-num">' + esc(base) + '</td>' +
        '<td class="ds-mono ds-num">' + esc(large[n]) + '</td>' +
        '<td class="ds-mono ds-num">' + step + '</td>' +
        '<td class="ds-mono ds-num">' + pct + '</td>' +
        '<td style="font-size:' + cap(base) + ';line-height:1.1">Aa</td>' +
        '<td style="font-size:' + cap(large[n]) + ';line-height:1.1">Aa</td></tr>';
    });
    html += '</tbody></table></div>';
    host.innerHTML = html;
  }

  /* ── The movement catalogue ───────────────────────────────────────── */

  /* Every @keyframes in the system, read from the sheet rather than listed,
     so a movement added to the CSS appears here without anyone remembering
     to write it down. */
  function keyframeRules() {
    var out = [], seen = {};
    function scan(rules) {
      if (!rules) { return; }
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        /* A keyframes rule holds rules of its own - the frames - so it has to
           be matched before the recursion, or the frames get walked as though
           they were selectors. */
        if (r.type === 7 || (window.CSSKeyframesRule && r instanceof window.CSSKeyframesRule)) {
          if (!seen[r.name]) { seen[r.name] = 1; out.push(r); }
        } else if (r.cssRules && r.cssRules.length) {
          scan(r.cssRules);
        }
      }
    }
    for (var s = 0; s < document.styleSheets.length; s++) {
      try { scan(document.styleSheets[s].cssRules); } catch (e) { /* unreadable off disk */ }
    }
    return out;
  }

  /* Played at one duration for all of them, so the shapes can be compared.
     The product plays each at its own token, which is why this says so on
     the page rather than implying these are the real timings. */
  var DEMO_MS = 700;

  function motionCatalogue(host) {
    if (!host) { return; }
    var frames = keyframeRules();
    if (!frames.length) {
      host.innerHTML = '<p class="ds-note">The keyframes cannot be listed here. ' +
        'Opened off disk a browser will not let this page read the rules of a ' +
        'linked stylesheet. Serve the folder over http to see them.</p>';
      return;
    }
    var html = '';
    frames.forEach(function (r, i) {
      var body = String(r.cssText).replace(/^@keyframes\s+[\w-]+\s*\{/, '').replace(/\}\s*$/, '');
      body = body.replace(/\)\s*\{/g, ') {').replace(/;\s*\}/g, '; }').trim();
      html += '<div class="ds-motion">' +
        '<div class="ds-motion__head">' +
          '<code class="ds-spec__name">' + esc(r.name) + '</code>' +
          '<button type="button" class="ds-copy ds-play" data-anim="' + esc(r.name) + '">Play</button>' +
        '</div>' +
        '<div class="ds-motion__body">' +
          '<div class="ds-motion__stage"><span class="ds-motion__box" data-slot="' + i + '"></span></div>' +
          '<pre class="ds-code ds-motion__code">' + esc(body) + '</pre>' +
        '</div>' +
      '</div>';
    });
    host.innerHTML = html;

    host.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.ds-play') : null;
      if (!btn) { return; }
      var box = btn.parentNode.parentNode.querySelector('.ds-motion__box');
      var name = btn.getAttribute('data-anim');
      box.style.animation = 'none';
      /* Reading offsetWidth forces the style change to land before the new
         animation is set, so clicking Play twice actually replays it. */
      void box.offsetWidth;
      box.style.animation = name + ' ' + DEMO_MS + 'ms ' +
        (name === 'spin' ? 'linear' : 'var(--ease-out)') + ' both';
    });
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
    tierTable(document.getElementById('dsTiers'));
    largeTable(document.getElementById('dsLarge'));
    motionCatalogue(document.getElementById('dsMotion'));
    stampSource();
    wireSpecimens();
    wireRail();
  });
})();
