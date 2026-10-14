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

// the nav turns dark over the dark products, as Revolut's does on Business and Ultra
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
