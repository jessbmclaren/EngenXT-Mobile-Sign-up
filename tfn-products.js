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
  if (routeKey) s += '<defs><linearGradient id="pr' + routeKey + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb, var(--acc) 45%, #fff)"/><stop offset=".55" style="stop-color:var(--acc)"/><stop offset="1" style="stop-color:color-mix(in srgb, var(--acc) 72%, #14103a)"/></linearGradient></defs><polyline class="route" style="stroke:url(#pr' + routeKey + ')" points="' + pts(routeKey) + '"/>';
  Object.keys(CITY).forEach(function (c) { var p = CITY[c]; s += '<circle class="city" cx="' + p[0] + '" cy="' + p[1] + '" r="3.5"/><text x="' + (p[0] + 7) + '" y="' + (p[1] + 3) + '">' + p[2] + '</text>'; });
  s += '</g><g data-pings></g></svg>'; svgHost.innerHTML = s;
  var rt = svgHost.querySelector('.route'); if (rt) { var L = rt.getTotalLength(), pf = svgHost.closest('.pf'); rt.style.setProperty('--len', L);
    var on = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { rt.classList.add('on'); }); }); };
    if (!pf || pf.classList.contains('in')) on(); else pf.addEventListener('pfin', on, { once: true }); }
  return svgHost.querySelector('[data-pings]');
}


// ---------- icons: Lucide (ISC licence, lucide.dev), outline, one colour, as the brand guide's iconography asks ----------
var ICONS = {"in your dashboard": "layout-dashboard", "checked before it’s paid": "shield-check", "checked before it's paid": "shield-check", "top 10 prices today": "tag", "below the grid price": "trending-down", "border permits and tolls": "file-check", "overview": "layout-dashboard", "live map": "map", "orders": "receipt", "vehicles": "truck", "drivers": "users", "homebase": "cylinder", "credit": "landmark", "reports": "file-text", "rules": "sliders-horizontal", "wallet": "wallet", "prices below the grid price": "trending-down", "cash or credit": "banknote", "limits you set": "gauge", "alerts": "bell", "reports your accountant will like": "file-spreadsheet", "subcontractors on your account": "users", "nothing to clone or lose": "shield-check", "rules on every purchase": "list-checks", "a wallet you control": "wallet", "drivers see only the answer": "smartphone", "daily reports": "calendar-days", "set up yourself": "user-plus", "secure overnight parking": "bed-double", "adblue": "droplet", "showers and laundry": "shower-head", "canteen and shop": "utensils", "truck wash": "droplets", "on credit too": "landmark", "today’s best prices": "tag", "today's best prices": "tag", "trip savings": "route", "services at each stop": "map-pin", "cross-border stops": "globe", "fuel price outlook": "chart-line", "live depot status": "radio", "know where the diesel went": "fuel", "tank levels and deliveries": "cylinder", "less reconciliation": "check-check", "compare yard and road": "arrow-left-right", "credit across both": "landmark", "a fee that fits": "receipt", "five countries": "globe", "no foreign currency": "coins", "one set of reports": "file-text", "fuel and selected services": "fuel", "coming soon": "clock", "keep cash in the business": "piggy-bank", "limits per driver and truck": "gauge", "credit for subcontractors": "users", "statements that match": "file-check", "fuel and more": "fuel", "across the border": "globe", "rules per driver": "user", "rules per vehicle": "car-front", "prepaid wallet": "wallet", "overnight": "bed-double", "overnight parking": "bed-double", "shower": "shower-head", "canteen": "utensils", "laundry": "shirt", "shop": "shopping-bag", "standard bank": "landmark", "absa": "landmark", "preference capital": "landmark", "diesel": "fuel", "best price on route": "tag", "delivery": "truck", "south africa": "flag", "botswana": "flag", "zambia": "flag", "namibia": "flag", "zimbabwe": "flag", "mozambique": "flag", "sipho k.": "user", "your limits": "gauge", "accountant-ready": "file-spreadsheet", "subcontractors": "users", "nothing to skim": "shield-check", "checked first": "list-checks", "your wallet": "wallet", "drivers only see the answer": "smartphone", "same-day reports": "calendar-days", "set it up yourself": "user-plus", "oil": "droplet", "road assist": "map-pin", "safe overnight parking": "bed-double", "more at the stop": "shopping-bag", "truckwash": "droplets", "know where it went": "fuel", "yard or road": "arrow-left-right", "one credit facility": "landmark", "tolls and parking": "receipt", "forwarding and clearing": "file-check", "cash for the trip": "banknote", "cash": "banknote", "fuel": "fuel", "one report": "file-text", "share with subcontractors": "users", "more than diesel": "fuel", "vehicle insurance": "shield-check", "git insurance": "shield-check", "fines, managed": "receipt", "fines": "receipt", "new fines flagged": "bell", "2 new fines": "bell", "telematics too": "radio", "one account": "wallet", "licensing, handled": "file-check", "licensing": "file-check", "due dates in view": "calendar-days", "flagged early": "bell", "licence due in 12 days": "bell", "fines too": "receipt", "one vehicle list": "truck", "tyres": "gauge", "servicing": "check-check", "telematics": "radio", "less downtime": "clock", "risk": "shield-check", "fleet": "truck", "support": "gauge"};
var ICON = function (txt) { var k = String(txt || '').trim().toLowerCase(); if (ICONS[k]) return ICONS[k]; if (/^(tfn|ca) \d|gp$/i.test(k)) return 'truck'; if (/^[nr]\d+ /i.test(k)) return 'route'; return null; };
function lu(name, cls) { return '<svg class="lu' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#lu-' + name + '"/></svg>'; }
(function () {
  var box = document.createElement('div'); box.setAttribute('aria-hidden', 'true'); box.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  box.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="lu-arrow-left-right" viewBox="0 0 24 24"><path d="M8 3 4 7l4 4"/> <path d="M4 7h16"/> <path d="m16 21 4-4-4-4"/> <path d="M20 17H4"/></symbol><symbol id="lu-banknote" viewBox="0 0 24 24"><rect width="20" height="12" x="2" y="6" rx="2"/> <circle cx="12" cy="12" r="2"/> <path d="M6 12h.01M18 12h.01"/></symbol><symbol id="lu-bed-double" viewBox="0 0 24 24"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/> <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/> <path d="M12 4v6"/> <path d="M2 18h20"/></symbol><symbol id="lu-bell" viewBox="0 0 24 24"><path d="M10.268 21a2 2 0 0 0 3.464 0"/> <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></symbol><symbol id="lu-calendar-days" viewBox="0 0 24 24"><path d="M8 2v4"/> <path d="M16 2v4"/> <rect width="18" height="18" x="3" y="4" rx="2"/> <path d="M3 10h18"/> <path d="M8 14h.01"/> <path d="M12 14h.01"/> <path d="M16 14h.01"/> <path d="M8 18h.01"/> <path d="M12 18h.01"/> <path d="M16 18h.01"/></symbol><symbol id="lu-car-front" viewBox="0 0 24 24"><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/> <path d="M7 14h.01"/> <path d="M17 14h.01"/> <rect width="18" height="8" x="3" y="10" rx="2"/> <path d="M5 18v2"/> <path d="M19 18v2"/></symbol><symbol id="lu-chart-line" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/> <path d="m19 9-5 5-4-4-3 3"/></symbol><symbol id="lu-check-check" viewBox="0 0 24 24"><path d="M18 6 7 17l-5-5"/> <path d="m22 10-7.5 7.5L13 16"/></symbol><symbol id="lu-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/> <polyline points="12 6 12 12 16 14"/></symbol><symbol id="lu-coins" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6"/> <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/> <path d="M7 6h1v4"/> <path d="m16.71 13.88.7.71-2.82 2.82"/></symbol><symbol id="lu-cylinder" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/> <path d="M3 5v14a9 3 0 0 0 18 0V5"/></symbol><symbol id="lu-droplet" viewBox="0 0 24 24"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></symbol><symbol id="lu-droplets" viewBox="0 0 24 24"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/> <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></symbol><symbol id="lu-file-check" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/> <path d="M14 2v4a2 2 0 0 0 2 2h4"/> <path d="m9 15 2 2 4-4"/></symbol><symbol id="lu-file-spreadsheet" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/> <path d="M14 2v4a2 2 0 0 0 2 2h4"/> <path d="M8 13h2"/> <path d="M14 13h2"/> <path d="M8 17h2"/> <path d="M14 17h2"/></symbol><symbol id="lu-file-text" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/> <path d="M14 2v4a2 2 0 0 0 2 2h4"/> <path d="M10 9H8"/> <path d="M16 13H8"/> <path d="M16 17H8"/></symbol><symbol id="lu-flag" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/> <line x1="4" x2="4" y1="22" y2="15"/></symbol><symbol id="lu-fuel" viewBox="0 0 24 24"><line x1="3" x2="15" y1="22" y2="22"/> <line x1="4" x2="14" y1="9" y2="9"/> <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/> <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></symbol><symbol id="lu-gauge" viewBox="0 0 24 24"><path d="m12 14 4-4"/> <path d="M3.34 19a10 10 0 1 1 17.32 0"/></symbol><symbol id="lu-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/> <path d="M2 12h20"/></symbol><symbol id="lu-landmark" viewBox="0 0 24 24"><line x1="3" x2="21" y1="22" y2="22"/> <line x1="6" x2="6" y1="18" y2="11"/> <line x1="10" x2="10" y1="18" y2="11"/> <line x1="14" x2="14" y1="18" y2="11"/> <line x1="18" x2="18" y1="18" y2="11"/> <polygon points="12 2 20 7 4 7"/></symbol><symbol id="lu-layout-dashboard" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/> <rect width="7" height="5" x="14" y="3" rx="1"/> <rect width="7" height="9" x="14" y="12" rx="1"/> <rect width="7" height="5" x="3" y="16" rx="1"/></symbol><symbol id="lu-list-checks" viewBox="0 0 24 24"><path d="m3 17 2 2 4-4"/> <path d="m3 7 2 2 4-4"/> <path d="M13 6h8"/> <path d="M13 12h8"/> <path d="M13 18h8"/></symbol><symbol id="lu-map-pin" viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/> <circle cx="12" cy="10" r="3"/></symbol><symbol id="lu-map" viewBox="0 0 24 24"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/> <path d="M15 5.764v15"/> <path d="M9 3.236v15"/></symbol><symbol id="lu-piggy-bank" viewBox="0 0 24 24"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/> <path d="M2 9v1c0 1.1.9 2 2 2h1"/> <path d="M16 11h.01"/></symbol><symbol id="lu-radio" viewBox="0 0 24 24"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/> <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/> <circle cx="12" cy="12" r="2"/> <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/> <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></symbol><symbol id="lu-receipt" viewBox="0 0 24 24"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/> <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/> <path d="M12 17.5v-11"/></symbol><symbol id="lu-route" viewBox="0 0 24 24"><circle cx="6" cy="19" r="3"/> <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/> <circle cx="18" cy="5" r="3"/></symbol><symbol id="lu-shield-check" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/> <path d="m9 12 2 2 4-4"/></symbol><symbol id="lu-shirt" viewBox="0 0 24 24"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></symbol><symbol id="lu-shopping-bag" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/> <path d="M3 6h18"/> <path d="M16 10a4 4 0 0 1-8 0"/></symbol><symbol id="lu-shower-head" viewBox="0 0 24 24"><path d="m4 4 2.5 2.5"/> <path d="M13.5 6.5a4.95 4.95 0 0 0-7 7"/> <path d="M15 5 5 15"/> <path d="M14 17v.01"/> <path d="M10 16v.01"/> <path d="M13 13v.01"/> <path d="M16 10v.01"/> <path d="M11 20v.01"/> <path d="M17 14v.01"/> <path d="M20 11v.01"/></symbol><symbol id="lu-sliders-horizontal" viewBox="0 0 24 24"><line x1="21" x2="14" y1="4" y2="4"/> <line x1="10" x2="3" y1="4" y2="4"/> <line x1="21" x2="12" y1="12" y2="12"/> <line x1="8" x2="3" y1="12" y2="12"/> <line x1="21" x2="16" y1="20" y2="20"/> <line x1="12" x2="3" y1="20" y2="20"/> <line x1="14" x2="14" y1="2" y2="6"/> <line x1="8" x2="8" y1="10" y2="14"/> <line x1="16" x2="16" y1="18" y2="22"/></symbol><symbol id="lu-smartphone" viewBox="0 0 24 24"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/> <path d="M12 18h.01"/></symbol><symbol id="lu-tag" viewBox="0 0 24 24"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/> <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></symbol><symbol id="lu-trending-down" viewBox="0 0 24 24"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/> <polyline points="16 17 22 17 22 11"/></symbol><symbol id="lu-truck" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/> <path d="M15 18H9"/> <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/> <circle cx="17" cy="18" r="2"/> <circle cx="7" cy="18" r="2"/></symbol><symbol id="lu-user-plus" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/> <circle cx="9" cy="7" r="4"/> <line x1="19" x2="19" y1="8" y2="14"/> <line x1="22" x2="16" y1="11" y2="11"/></symbol><symbol id="lu-user" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/> <circle cx="12" cy="7" r="4"/></symbol><symbol id="lu-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/> <circle cx="9" cy="7" r="4"/> <path d="M22 21v-2a4 4 0 0 0-3-3.87"/> <path d="M16 3.13a4 4 0 0 1 0 7.75"/></symbol><symbol id="lu-utensils" viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/> <path d="M7 2v20"/> <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></symbol><symbol id="lu-wallet" viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/> <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></symbol></svg>'; document.body.insertBefore(box, document.body.firstChild);
  // what you get: an icon tile above each feature
  document.querySelectorAll('.feats > div').forEach(function (d) { var h = d.querySelector('h3'), n = h && ICON(h.textContent); if (n && !d.querySelector('.fi')) d.insertAdjacentHTML('afterbegin', '<span class="fi">' + lu(n) + '</span>'); });
  // the portal's side menu
  document.querySelectorAll('.pf-side span').forEach(function (s) { var n = ICON(s.textContent); if (n && !s.querySelector('.lu')) s.insertAdjacentHTML('afterbegin', lu(n)); });
  // hero chips
  document.querySelectorAll('.chiprow span').forEach(function (s) { var n = ICON(s.textContent); if (n && !s.querySelector('.lu')) s.insertAdjacentHTML('afterbegin', lu(n)); });
  // the hero's glass notes: a white glyph in the colour tile
  document.querySelectorAll('.gl').forEach(function (g) { var i = g.querySelector(':scope > i'), b = g.querySelector('b'), n = i && b && ICON(b.textContent); if (n && !i.querySelector('.lu')) i.innerHTML = lu(n); });
  // feature tiles take the page's product colour
  var pa = document.getElementById('portal'), acc = pa && pa.style.getPropertyValue('--acc');
  if (acc) document.querySelectorAll('.feats').forEach(function (f) { f.style.setProperty('--acc', acc); });
  // inside the phones: a white glyph in each tile
  document.querySelectorAll('.s .row').forEach(function (r) { var i = r.querySelector(':scope > i'), b = r.querySelector('b'), n = i && b && ICON(b.textContent); if (n && !i.querySelector('.lu')) i.innerHTML = lu(n); });
})();

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
      sv.innerHTML = ALL.map(function (x) { var a = has.indexOf(x) > -1; return '<button type="button" ' + (a ? '' : 'disabled style="opacity:.35;cursor:not-allowed" ') + 'aria-pressed="' + (a && !!on[x]) + '" data-s="' + x + '">' + (ICON(x) ? lu(ICON(x)) : '') + x + '</button>'; }).join('');
      var list = has.filter(function (x) { return on[x]; });
      bk.innerHTML = list.length ? list.map(function (x) { return '<li' + (had.indexOf(x) > -1 ? ' style="animation:none"' : '') + '><span><b>' + x + '</b><small>' + S[cur][0] + ' · tonight</small></span><span class="bk-ok" aria-label="Booked">✓</span></li>'; }).join('') : '<li><span><small>Nothing booked yet</small></span><span></span></li>';
      pf.querySelector('[data-count]').textContent = list.length; had = list;
    }
    sb.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cur = [].indexOf.call(sb.children, b); [].forEach.call(sb.children, function (x, i) { x.setAttribute('aria-pressed', i === cur); }); draw(); });
    sv.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; on[b.dataset.s] = !on[b.dataset.s]; draw(); });
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
    ins.forEach(function (i) { i.value = i.min || 0; fillRange(i); }); run();
    var settle = function () { ins.forEach(function (i, j) { if (i !== document.activeElement && +i.value < want[j]) i.value = want[j]; fillRange(i); }); run(); };
    pf.addEventListener('pointerdown', settle, { once: true }); pf.addEventListener('keydown', settle, { once: true });
    demo(pf, function (off) {
      var t0 = performance.now();
      (function f(now) { if (off()) return; var k = Math.min(1, (now - t0) / 1300);
        ins.forEach(function (i, j) { var q = Math.max(0, Math.min(1, k * 1.3 - j * .1)), e = 1 - Math.pow(1 - q, 3); i.value = Math.round(((+i.min || 0) + (want[j] - (+i.min || 0)) * e) / (+i.step || 1)) * (+i.step || 1); });
        ins.forEach(fillRange); run(); if (k < 1) requestAnimationFrame(f); else settle(); })(t0);
    }, 150);
  }
};
document.querySelectorAll('.pf[data-mod]').forEach(function (pf) { var m = MODS[pf.dataset.mod]; if (m) m(pf); });

// ---------- the page arrives (see "the page arrives" in tfn-products.css) ----------
(function () {
  if (REDUCE) return;
  var ph = document.querySelector('.pp .stage .ph');
  if (ph) { var s = ph.querySelector('.s'); if (s) [].forEach.call(s.children, function (c, i) { c.style.setProperty('--k', i); [].forEach.call(c.querySelectorAll('.ok'), function (o, j) { o.style.setProperty('--k', i); o.style.setProperty('--j', j); }); }); ph.classList.add('build'); }
  document.querySelectorAll('.pp .stats b').forEach(function (b, i) { var t = b.textContent; b.textContent = t.replace(/\d[\d\s,]*/, '0'); setTimeout(function () { b.textContent = t; roll(b, 0, 1400); }, 500 + i * 120); });
  var groups = ['.steps3 > div', '.feats > div', '.range > .tile', '.faq details', '.band > .wrap > h2', '.band > .wrap > .sub', '.quote blockquote', '.quote cite', '.close .wrap > *'];
  var els = [];
  groups.forEach(function (sel) { var seen = new Map(); document.querySelectorAll(sel).forEach(function (el) { if (el.closest('.pp') || el.closest('.pf')) return; var p = el.parentNode, k = seen.get(p) || 0; seen.set(p, k + 1); el.style.setProperty('--k', Math.min(k, 6)); el.classList.add('rv'); els.push(el); }); });
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (e) { io.observe(e); });
})();

// ---------- slider tracks fill with the product gradient up to the value ----------
function fillRange(i) { var a = +i.min || 0, b = +i.max || 100; i.style.setProperty('--p', ((+i.value - a) / (b - a) * 100).toFixed(1) + '%'); }
document.querySelectorAll('.ctl input[type=range]').forEach(fillRange);
document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('.ctl input[type=range]')) fillRange(e.target); });
