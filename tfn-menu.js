// TFN phone menu: the burger opens the glass sheet; pills switch sections; Escape or the X closes it and focus goes back to the burger.
(function () {
  var sheet = document.getElementById('pmenu'), burger = document.querySelector('.burger');
  if (!sheet || !burger) return;
  var x = sheet.querySelector('.pm-x');

  function open() {
    sheet.hidden = false; document.body.classList.add('pm-lock'); burger.setAttribute('aria-expanded', 'true');
    void sheet.offsetWidth; sheet.classList.add('open'); x.focus();
  }
  function close() {
    sheet.classList.remove('open'); document.body.classList.remove('pm-lock'); burger.setAttribute('aria-expanded', 'false');
    setTimeout(function () { sheet.hidden = true; }, 250); burger.focus();
  }
  burger.addEventListener('click', open);
  x.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
  // following a link to a section on this page closes the sheet first
  sheet.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a && a.hash && a.pathname === location.pathname) close(); });

  sheet.querySelector('.pm-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    sheet.querySelectorAll('.pm-tabs button').forEach(function (t) { t.setAttribute('aria-selected', t === b ? 'true' : 'false'); });
    sheet.querySelectorAll('.pm-p').forEach(function (p) { p.hidden = p.dataset.pm !== b.dataset.pm; });
  });

  // keep Tab inside the sheet while it is open
  sheet.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = [].filter.call(sheet.querySelectorAll('a, button, summary'), function (el) { return el.offsetParent !== null; });
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
