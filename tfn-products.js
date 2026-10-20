// TFN product pages: the shared behaviour.

// a QR code for the LCV driver screen: three finder squares and a seeded fill
document.querySelectorAll('.s .qr').forEach(function (q) {
  var n = 21, seed = 7, html = '';
  function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function finder(x, y) {
    var a = [[0, 0], [n - 7, 0], [0, n - 7]];
    for (var i = 0; i < 3; i++) { var dx = x - a[i][0], dy = y - a[i][1]; if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) return (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx > 1 && dx < 5 && dy > 1 && dy < 5)) ? 1 : 0; }
    return -1;
  }
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) { var f = finder(x, y); html += '<i' + ((f === -1 ? r() > .5 : f === 1) ? '' : ' class="o"') + '></i>'; }
  q.innerHTML = html;
});

// the nav turns dark over the dark products, so it never sits as a white bar on black
(function () {
  var nav = document.querySelector('.nav'), dark = document.querySelectorAll('[data-dark]');
  function check() { var on = false; dark.forEach(function (d) { var r = d.getBoundingClientRect(); if (r.top <= 72 && r.bottom > 72) on = true; }); nav.classList.toggle('dark', on); }
  addEventListener('scroll', check, { passive: true }); check();
})();

// tiers: the "what tier would you be?" slider, using TFN's own ladder
(function () {
  var box = document.querySelector('.calc2[data-tiers]'); if (!box) return;
  var T = JSON.parse(box.dataset.tiers), r = document.getElementById('tlit'), sp = function (n) { return n.toLocaleString('en-ZA').replace(/,/g, ' '); };
  function upd() {
    var l = +r.value, i = T.findIndex(function (t) { return t[3] === null || l < t[3]; }), t = T[i], nx = T[i + 1];
    document.getElementById('tout').textContent = sp(l) + ' L';
    document.getElementById('tname').textContent = t[1];
    document.getElementById('tdisc').textContent = t[4] ? t[4] + 'c' : 'Network price';
    document.getElementById('tsave').textContent = 'R ' + sp(Math.round(l * t[4] / 100));
    document.getElementById('tnext').textContent = nx ? sp(nx[2] - l) + ' L to ' + nx[1] : 'Top tier';
    var b = document.querySelector('#tbadge .badge'); b.className = 'badge t-' + t[0]; b.querySelector('b').textContent = t[1];
  }
  r.addEventListener('input', upd); upd();
})();

// ---------- theme: light or dark, for the page and the app screens ----------
(function () {
  var b = document.querySelector('.theme'); if (!b) return;
  function sync() { b.setAttribute('aria-pressed', document.documentElement.dataset.theme === 'dark' ? 'true' : 'false'); }
  b.addEventListener('click', function () {
    var t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t; try { localStorage.setItem('tfn-theme', t); } catch (e) {} sync();
  });
  sync();
})();

var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
var SP = function (n) { return Math.round(n).toLocaleString('en-ZA').replace(/[, ]/g, ' '); };
var ESC = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

// ---------- phones lean a little toward the pointer; the portal settles in as it arrives ----------
document.querySelectorAll('.stage').forEach(function (st) {
  var ph = st.querySelector('.ph'); if (!ph || REDUCE) return;
  st.addEventListener('pointermove', function (e) { var r = st.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    ph.style.transform = 'perspective(1200px) rotateY(' + (x * 10).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg)'; });
  st.addEventListener('pointerleave', function () { ph.style.transform = ''; });
});
var pfs = document.querySelectorAll('.pf');
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); e.target.dispatchEvent(new Event('pfin')); io.unobserve(e.target); } }); }, { threshold: .25 });
  pfs.forEach(function (p) { io.observe(p); });
} else pfs.forEach(function (p) { p.classList.add('in'); });
// ---------- each portal shows itself working once, as it arrives; the first touch hands it over ----------
function demo(pf, play, wait) {
  if (REDUCE) return;
  var off = false; ['pointerdown', 'keydown', 'wheel'].forEach(function (t) { pf.addEventListener(t, function () { off = true; }, { once: true, passive: true }); });
  function go() { setTimeout(function () { if (!off) play(function () { return off; }); }, wait == null ? 450 : wait); }
  if (pf.classList.contains('in')) go(); else pf.addEventListener('pfin', go, { once: true });
}
// a figure counts up to what it says, keeping its words: "R 4 210", "62%", "1 400 km"
function roll(el, from, ms) {
  if (!el || REDUCE) return; var t = el.textContent, m = t.match(/\d[\d\s,\u00a0\u202f]*/); if (!m) return;
  var to = +m[0].replace(/\D/g, ''), a = from || 0, pre = t.slice(0, m.index), post = t.slice(m.index + m[0].length).replace(/^\s*/, function (w) { return /\s$/.test(m[0]) ? ' ' : w; }), t0 = performance.now();
  (function f(now) { var k = Math.min(1, (now - t0) / (ms || 1100)), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + SP(a + (to - a) * e) + post; if (k < 1) requestAnimationFrame(f); })(t0);
}

// a stylised map of the main truck routes (not to scale)
var CITY = { pol: [440, 62, 'Polokwane'], pta: [418, 130, 'Pretoria'], jhb: [402, 152, 'Johannesburg'], mid: [478, 140, 'Middelburg'], mbo: [548, 128, 'Mbombela'],
  kro: [368, 214, 'Kroonstad'], har: [460, 236, 'Harrismith'], blm: [322, 272, 'Bloemfontein'], pmb: [512, 292, 'Pietermaritzburg'], dbn: [548, 312, 'Durban'],
  col: [292, 330, 'Colesberg'], bfw: [178, 372, 'Beaufort West'], cpt: [52, 400, 'Cape Town'] };
var ROADS = { N1: ['pol', 'pta', 'jhb', 'kro', 'blm', 'col', 'bfw', 'cpt'], N3: ['jhb', 'har', 'pmb', 'dbn'], N4: ['pta', 'mid', 'mbo'] };
function pts(r) { return ROADS[r].map(function (c) { return CITY[c][0] + ',' + CITY[c][1]; }).join(' '); }
function baseMap(svgHost, routeKey) {
  var s = '<svg viewBox="30 40 590 380" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of the main truck routes"><g>';
  for (var i = 0; i < 9; i++) s += '<path class="road2" d="M0 ' + (i * 54) + 'H600"/>';
  Object.keys(ROADS).forEach(function (r) { s += '<polyline class="road" points="' + pts(r) + '"/>'; });
  if (routeKey) s += '<polyline class="route" points="' + pts(routeKey) + '"/>';
  Object.keys(CITY).forEach(function (c) { var p = CITY[c]; s += '<circle class="city" cx="' + p[0] + '" cy="' + p[1] + '" r="3.5"/><text x="' + (p[0] + 7) + '" y="' + (p[1] + 3) + '">' + p[2] + '</text>'; });
  s += '</g><g data-pings></g></svg>'; svgHost.innerHTML = s;
  var rt = svgHost.querySelector('.route'); if (rt) { var L = rt.getTotalLength(), pf = svgHost.closest('.pf'); rt.style.setProperty('--len', L);
    var on = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { rt.classList.add('on'); }); }); };
    if (!pf || pf.classList.contains('in')) on(); else pf.addEventListener('pfin', on, { once: true }); }
  return svgHost.querySelector('[data-pings]');
}

var MODS = {
  // On-Road: today's fills appear on the map and in the feed
  live: function (pf) {
    var g = baseMap(pf.querySelector('[data-map]')), feed = pf.querySelector('[data-feed]'), k = function (n) { return pf.querySelector('[data-k="' + n + '"]'); };
    var F = [['TFN 204 GP', 'har', 'N3', 420, 20.19], ['TFN 311 GP', 'kro', 'N1', 380, 20.42], ['TFN 118 GP', 'col', 'N1', 460, 20.31], ['TFN 076 GP', 'mid', 'N4', 300, 20.12], ['TFN 233 GP', 'pmb', 'N3', 410, 20.27], ['TFN 052 GP', 'bfw', 'N1', 440, 20.48], ['TFN 190 GP', 'pol', 'N1', 350, 20.09], ['TFN 147 GP', 'blm', 'N1', 395, 20.36]];
    var n = 0, fills = 0, litres = 0, saved = 0;
    function add() {
      var f = F[n++ % F.length], c = CITY[f[1]], t = new Date(), hh = ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);
      fills++; litres += f[3]; saved += f[3] * .55;
      k('fills').textContent = fills; k('litres').textContent = SP(litres) + ' L'; k('saved').textContent = 'R ' + SP(saved);
      var w = f[0].length * 5.6 + 50;
      g.insertAdjacentHTML('beforeend', '<g><circle class="ping-r" cx="' + c[0] + '" cy="' + c[1] + '" r="6"/><circle class="ping" cx="' + c[0] + '" cy="' + c[1] + '" r="5"/><rect class="lblbg" x="' + (c[0] - w / 2) + '" y="' + (c[1] - 30) + '" width="' + w + '" height="18" rx="9"/><text class="lbl" x="' + c[0] + '" y="' + (c[1] - 18) + '" text-anchor="middle">' + f[0] + ' · ' + f[3] + ' L</text></g>');
      while (g.children.length > 3) g.removeChild(g.firstChild);
      feed.querySelectorAll('li.new').forEach(function (l) { l.classList.remove('new'); });
      feed.insertAdjacentHTML('afterbegin', '<li class="new"><i></i><span><b>' + f[0] + '</b><small>' + c[2] + ', ' + f[2] + ' · ' + hh + '</small></span><span><b>' + f[3] + ' L</b><small>R ' + f[4].toFixed(2) + '/L</small></span></li>');
      while (feed.children.length > 5) feed.removeChild(feed.lastChild);
    }
    for (var i = 0; i < 3; i++) add();
    if (!REDUCE) setInterval(function () { if (!document.hidden) add(); }, 2600);
  },
  // LCV: the rules decide every request; the driver only sees the answer
  rules: function (pf) {
    var v = {}, o = function (n) { return pf.querySelector('[data-o="' + n + '"]'); };
    function run() {
      pf.querySelectorAll('[data-i]').forEach(function (i) { v[i.dataset.i] = +i.value; });
      o('tank').textContent = v.tank + ' L'; o('per').textContent = v.per; o('ask').textContent = v.ask + ' L'; o('done').textContent = v.done;
      var drv = pf.querySelector('[data-out="drv"]'), mgr = pf.querySelector('[data-out="mgr"]'), ok = v.done < v.per, lit = Math.min(v.ask, v.tank);
      drv.className = mgr.className = 'outcome ' + (ok ? 'ok' : 'no');
      drv.querySelector('b').textContent = ok ? 'Approved, up to ' + lit + ' L' : 'Declined';
      drv.querySelector('small').textContent = ok ? 'Show the QR code at the till' : 'Speak to your manager';
      mgr.querySelector('b').textContent = ok ? (v.ask > v.tank ? 'Capped at the tank size, ' + v.tank + ' L' : 'Within the rules') : 'Daily limit reached';
      mgr.querySelector('small').textContent = ok ? ('Asked for ' + v.ask + ' L · fill ' + (v.done + 1) + ' of ' + v.per + ' today') : (v.per + ' fill' + (v.per > 1 ? 's' : '') + ' a day allowed, ' + v.done + ' already today');
    }
    pf.querySelectorAll('[data-i]').forEach(function (i) { i.addEventListener('input', run); });
    if (REDUCE) { run(); return; }
    var drv = pf.querySelector('[data-out="drv"]'), mgr = pf.querySelector('[data-out="mgr"]'), done = false, fin = function () { if (!done) { done = true; run(); } };
    drv.className = mgr.className = 'outcome wait';
    drv.querySelector('b').textContent = 'Asking for ' + o('ask').textContent; drv.querySelector('small').textContent = 'Checking the rules';
    mgr.querySelector('b').textContent = 'New request'; mgr.querySelector('small').textContent = 'CA 482-913 · just now';
    pf.addEventListener('pointerdown', fin, { once: true }); pf.addEventListener('keydown', fin, { once: true });
    demo(pf, function () { setTimeout(fin, 1300); }, 300);
  },
  // Non-Fuel: choose the stop, toggle the services it has
  stop: function (pf) {
    var S = [['Harrismith, N3', ['Overnight parking', 'Shower', 'Canteen', 'AdBlue', 'Truck wash']], ['Kroonstad, N1', ['Overnight parking', 'Shower', 'Laundry', 'AdBlue']], ['Middelburg, N4', ['Overnight parking', 'AdBlue', 'Truck wash', 'Shop']]];
    var ALL = ['Overnight parking', 'Shower', 'Canteen', 'Laundry', 'AdBlue', 'Truck wash', 'Shop'], cur = 0, on = REDUCE ? { 'Overnight parking': 1, 'Shower': 1 } : { 'Overnight parking': 1 }, had = [];
    var sb = pf.querySelector('[data-stops]'), sv = pf.querySelector('[data-svc]'), bk = pf.querySelector('[data-booked]');
    sb.innerHTML = S.map(function (x, i) { return '<button type="button" aria-pressed="' + (i === 0) + '">' + x[0] + '</button>'; }).join('');
    function draw() {
      var has = S[cur][1];
      sv.innerHTML = ALL.map(function (x) { var a = has.indexOf(x) > -1; return '<button type="button" ' + (a ? '' : 'disabled style="opacity:.35;cursor:not-allowed" ') + 'aria-pressed="' + (a && !!on[x]) + '">' + x + '</button>'; }).join('');
      var list = has.filter(function (x) { return on[x]; });
      bk.innerHTML = list.length ? list.map(function (x) { return '<li' + (had.indexOf(x) > -1 ? ' style="animation:none"' : '') + '><span><b>' + x + '</b><small>' + S[cur][0] + ' · tonight</small></span><span class="bk-ok" aria-label="Booked">✓</span></li>'; }).join('') : '<li><span><small>Nothing booked yet</small></span><span></span></li>';
      pf.querySelector('[data-count]').textContent = list.length; had = list;
    }
    sb.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cur = [].indexOf.call(sb.children, b); [].forEach.call(sb.children, function (x, i) { x.setAttribute('aria-pressed', i === cur); }); draw(); });
    sv.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; on[b.textContent] = !on[b.textContent]; draw(); });
    draw();
    demo(pf, function (off) { if (off() || cur) return; on['Shower'] = 1; draw(); }, 900);
  },
  // Network: pick a route, see the stops, the best price and the trip saving
  route: function (pf) {
    var R = [['N3', 'Joburg → Durban', 568, [['Heidelberg', 20.42], ['Harrismith', 19.94], ['Pietermaritzburg', 20.27]]],
             ['N1', 'Joburg → Cape Town', 1400, [['Kroonstad', 20.36], ['Colesberg', 20.08], ['Beaufort West', 20.31]]],
             ['N4', 'Gauteng → Mozambique', 430, [['Middelburg', 20.12], ['Mbombela', 20.38]]]];
    var sb = pf.querySelector('[data-routes]'), map = pf.querySelector('[data-map]'), list = pf.querySelector('[data-stoplist]'), cons = pf.querySelector('[data-i="cons"]'), cur = 0, k = function (n) { return pf.querySelector('[data-k="' + n + '"]'); };
    sb.innerHTML = R.map(function (r, i) { return '<button type="button" aria-pressed="' + (i === 0) + '">' + r[0] + ' ' + r[1] + '</button>'; }).join('');
    function calc() { var r = R[cur], c = +cons.value, l = r[2] * c / 100; pf.querySelector('[data-o="cons"]').textContent = c + ' L/100 km'; k('dist').textContent = SP(r[2]) + ' km'; k('lit').textContent = SP(l) + ' L'; k('save').textContent = 'R ' + SP(l * .55); }
    function draw() {
      var r = R[cur], best = r[3].reduce(function (a, b) { return b[1] < a[1] ? b : a; });
      var g = baseMap(map, r[0]); k('rname').textContent = r[1];
      var STOPXY = { Heidelberg: [414, 169], Harrismith: CITY.har, Pietermaritzburg: CITY.pmb, Kroonstad: CITY.kro, Colesberg: CITY.col, 'Beaufort West': CITY.bfw, Middelburg: CITY.mid, Mbombela: CITY.mbo };
      g.innerHTML = r[3].map(function (st, i) { var c = STOPXY[st[0]], b = st === best, tx = 'R ' + st[1].toFixed(2), w = tx.length * 6.6 + 16;
        return '<g class="stopm' + (b ? ' best' : '') + '" style="--dl:' + (1.25 + i * .18).toFixed(2) + 's"><circle class="ping" cx="' + c[0] + '" cy="' + c[1] + '" r="5"/><rect class="lblbg" x="' + (c[0] - 10 - w) + '" y="' + (c[1] - 9) + '" width="' + w + '" height="18" rx="9"/><text class="lbl" x="' + (c[0] - 10 - w / 2) + '" y="' + (c[1] + 3.5) + '" text-anchor="middle">' + tx + '</text></g>'; }).join('');
      list.innerHTML = r[3].map(function (s) { var b = s === best; return '<li' + (b ? ' class="new"' : '') + '><i></i><span><b>' + s[0] + '</b><small>' + (b ? 'Best price on this route' : 'TFN truck stop') + '</small></span><span><b' + (b ? ' style="color:var(--acc)"' : '') + '>R ' + s[1].toFixed(2) + '</b></span></li>'; }).join('');
      calc();
    }
    sb.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cur = [].indexOf.call(sb.children, b); [].forEach.call(sb.children, function (x, i) { x.setAttribute('aria-pressed', i === cur); }); draw(); });
    cons.addEventListener('input', calc); draw();
    demo(pf, function () { ['dist', 'lit', 'save'].forEach(function (n) { roll(k(n), 0, 1400); }); }, 0);
  },
  // Homebase: the tank goes down with every fill and up with every delivery
  tank: function (pf) {
    var cap = 20000, lvl = 12020, t = pf.querySelector('[data-tank]'), yard = pf.querySelector('[data-yard]'), trucks = ['TFN 311 GP', 'TFN 204 GP', 'TFN 076 GP', 'TFN 233 GP'], n = 0;
    function draw() { t.style.setProperty('--lvl', (lvl / cap * 100).toFixed(1) + '%'); pf.querySelector('[data-k="lvl"]').textContent = SP(lvl) + ' L'; var low = lvl / cap < .25; t.classList.toggle('low', low); pf.querySelector('[data-alert]').classList.toggle('on', low); }
    function log(a, b, c) { yard.querySelectorAll('li.new').forEach(function (l) { l.classList.remove('new'); }); yard.insertAdjacentHTML('afterbegin', '<li class="new"><i></i><span><b>' + a + '</b><small>' + b + '</small></span><span><b>' + c + '</b></span></li>'); while (yard.children.length > 4) yard.removeChild(yard.lastChild); }
    pf.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'fill') { if (lvl < 380) return; lvl -= 380; log(trucks[n++ % trucks.length], 'Driver matched · just now', '−380 L'); }
      else { lvl = Math.min(cap, lvl + 8000); log('Delivery from TFN', 'Into yard tank 1 · just now', '+8 000 L'); }
      draw();
    });
    log('TFN 311 GP', 'Driver: Thabo M. · 07:12', '−380 L'); log('Delivery from TFN', 'Monday', '+8 000 L'); draw();
    demo(pf, function (off) {
      var b = pf.querySelector('[data-act="fill"]'), was = lvl; b.classList.add('press');
      setTimeout(function () { b.classList.remove('press'); if (off()) return; b.click(); roll(pf.querySelector('[data-k="lvl"]'), was, 1200); }, 260);
    }, 800);
  },
  // TFN Africa: follow the truck along a corridor, every fill in rand
  corridor: function (pf) {
    var C = [['Joburg → Lusaka', [['South Africa', 0, 420, 20.19], ['Botswana', 46, 260, 21.05], ['Zambia', 86, 310, 22.40]], [[30, 'Martin’s Drift'], [70, 'Kazungula']]],
             ['Joburg → Windhoek', [['South Africa', 0, 400, 20.19], ['Botswana', 44, 300, 21.05], ['Namibia', 86, 280, 20.95]], [[28, 'Skilpadshek'], [68, 'Mamuno']]],
             ['Joburg → Maputo', [['South Africa', 0, 300, 20.12], ['Mozambique', 80, 220, 21.60]], [[62, 'Lebombo']]],
             ['Joburg → Harare', [['South Africa', 0, 380, 20.09], ['Zimbabwe', 80, 290, 22.10]], [[58, 'Beitbridge']]]];
    var sb = pf.querySelector('[data-corrs]'), box = pf.querySelector('[data-corr]'), feed = pf.querySelector('[data-afeed]'), cur = 0, timers = [];
    sb.innerHTML = C.map(function (c, i) { return '<button type="button" aria-pressed="' + (i === 0) + '">' + c[0] + '</button>'; }).join('');
    function x(p) { return 'calc(3% + ' + (p * .94).toFixed(1) + '%)'; }
    function draw() {
      timers.forEach(clearTimeout); timers = [];
      var c = C[cur], h = '<div class="line"></div>', tot = 0;
      c[2].forEach(function (b) { h += '<div class="bdr" style="left:' + x(b[0]) + '"><span>' + b[1] + '</span></div>'; });
      c[1].forEach(function (s) { h += '<div class="stop" style="left:' + x(s[1] + 5) + '"></div><div class="ctry" style="left:' + x(s[1] + 5) + '">' + s[0] + '</div>'; });
      h += '<div class="truck" style="left:' + x(5) + '">TFN 204 GP</div>'; box.innerHTML = h; feed.innerHTML = '';
      pf.querySelector('[data-k="cname"]').textContent = c[0]; pf.querySelector('[data-k="atot"]').textContent = 'R 0';
      var tr = box.querySelector('.truck');
      c[1].forEach(function (s, i) {
        timers.push(setTimeout(function () {
          tr.style.left = x(s[1] + 5); tot += s[2] * s[3];
          feed.querySelectorAll('li.new').forEach(function (l) { l.classList.remove('new'); });
          feed.insertAdjacentHTML('beforeend', '<li class="new"><i></i><span><b>' + s[0] + '</b><small>' + (i ? 'TFN Africa truck stop' : 'Fill up before the border') + '</small></span><span><b>' + s[2] + ' L</b><small>R ' + SP(s[2] * s[3]) + '</small></span></li>');
          pf.querySelector('[data-k="atot"]').textContent = 'R ' + SP(tot);
        }, REDUCE ? 0 : 400 + i * 2600));
      });
    }
    sb.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cur = [].indexOf.call(sb.children, b); [].forEach.call(sb.children, function (x, i) { x.setAttribute('aria-pressed', i === cur); }); draw(); });
    pf.addEventListener('pfin', draw, { once: true }); if (pf.classList.contains('in')) draw();
  },
  // Credit: share the facility; going over it says so in words
  limits: function (pf) {
    var L = [['TFN 204 GP', 'Truck', 12000], ['TFN 311 GP', 'Truck', 9000], ['Sipho K.', 'Driver', 3000], ['Mokoena Haulage', 'Subcontractor', 15000]], fac = 250000;
    var host = pf.querySelector('[data-limits]');
    host.innerHTML = L.map(function (l, i) { return '<div><label>' + ESC(l[0]) + ' <small>' + l[1] + '</small><b data-o="l' + i + '">R ' + SP(l[2]) + '</b></label><input type="range" data-i="' + i + '" min="0" max="40000" step="500" value="' + l[2] + '" aria-label="Weekly limit for ' + ESC(l[0]) + '"></div>'; }).join('');
    function run() {
      var sum = 0; host.querySelectorAll('[data-i]').forEach(function (i) { sum += +i.value * 4; pf.querySelector('[data-o="l' + i.dataset.i + '"]').textContent = 'R ' + SP(+i.value); });
      pf.querySelector('[data-k="alloc"]').textContent = 'R ' + SP(sum) + ' a month';
      var free = fac - sum, f = pf.querySelector('[data-k="free"]'); f.textContent = (free < 0 ? 'Over by R ' : 'R ') + SP(Math.abs(free)); f.previousElementSibling.textContent = free < 0 ? 'Over your facility' : 'Not allocated';
      var u = Math.min(100, Math.round(sum / fac * 100)); pf.querySelector('[data-k="usedp"]').textContent = u + '%'; pf.querySelector('[data-b="used"]').style.setProperty('--v', u + '%');
    }
    host.addEventListener('input', run);
    if (REDUCE) { run(); return; }
    var ins = [].slice.call(host.querySelectorAll('[data-i]')), want = ins.map(function (i) { return +i.value; });
    ins.forEach(function (i) { i.value = i.min || 0; }); run();
    var settle = function () { ins.forEach(function (i, j) { if (i !== document.activeElement && +i.value < want[j]) i.value = want[j]; }); run(); };
    pf.addEventListener('pointerdown', settle, { once: true }); pf.addEventListener('keydown', settle, { once: true });
    demo(pf, function (off) {
      var t0 = performance.now();
      (function f(now) { if (off()) return; var k = Math.min(1, (now - t0) / 1300);
        ins.forEach(function (i, j) { var q = Math.max(0, Math.min(1, k * 1.3 - j * .1)), e = 1 - Math.pow(1 - q, 3); i.value = Math.round(((+i.min || 0) + (want[j] - (+i.min || 0)) * e) / (+i.step || 1)) * (+i.step || 1); });
        run(); if (k < 1) requestAnimationFrame(f); else settle(); })(t0);
    }, 150);
  }
};
document.querySelectorAll('.pf[data-mod]').forEach(function (pf) { var m = MODS[pf.dataset.mod]; if (m) m(pf); });
