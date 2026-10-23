// For now the website reads as gibberish: every word becomes a nonsense word of about the same length,
// so the layout, rhythm and line breaks stay true. Numbers, prices, units, road names (N3) and short acronyms (TFN, LCV) stay real.
// The real copy is untouched in the files. Add ?copy=real to any address to read it.
// The brand guide is left in plain English.
(function () {
  if (/[?&]copy=real\b/.test(location.search)) return;
  var LOREM = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis ' +
    'nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur ' +
    'excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum vitae turpis massa porta lacus felis donec ' +
    'varius morbi tristique senectus netus fames ac habitant aenean pharetra quam nunc mattis vulputate praesent semper feugiat nibh pellentesque').split(' ');
  var BY = {}; LOREM.forEach(function (w) { (BY[w.length] = BY[w.length] || []).push(w); });
  var KEEP = /^(R|L|km|h|min|[A-Z]{2,3})$/;   // units and short acronyms (TFN, LCV, GP, EFT) stay; so does anything with a digit
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function word(w) {
    if (KEEP.test(w) || /\d/.test(w)) return w;
    var n = w.length, pool = BY[n] || BY[Math.min(13, Math.max(2, n))] || LOREM, g = pool[hash(w.toLowerCase()) % pool.length];
    while (g.length < n) g += LOREM[hash(g + n) % LOREM.length].slice(0, n - g.length);
    g = g.slice(0, n);
    if (w === w.toUpperCase() && n > 1) return g.toUpperCase();
    return /^[A-Z]/.test(w) ? g[0].toUpperCase() + g.slice(1) : g;
  }
  function babble(t) { return t.replace(/[A-Za-z0-9\u00C0-\u024F’']+/g, function (w) { var m = w.match(/^(.*?)([’']s?)?$/); return word(m[1] || w) + (m[2] || ''); }); }
  var SKIP = 'script,style,svg,code,pre,textarea,#bmGuide,.bm-tab,.bm-tabs,[data-real]';
  var mine = new WeakMap();   // the value this script last wrote into a text node, so its own writes are never scrambled twice
  function text(t) {
    var p = t.parentElement, v = t.nodeValue;
    if (!p || mine.get(t) === v || !/[A-Za-z]/.test(v) || p.closest(SKIP)) return;
    var g = babble(v); mine.set(t, g); if (g !== v) t.nodeValue = g;
  }
  function ph(el) { if (el.placeholder && !el.dataset.realPh) { el.dataset.realPh = el.placeholder; el.placeholder = babble(el.placeholder); } }
  function fix(root) {
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    ph(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: function (n) { return n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    for (var n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 1) ph(n); else text(n); }
  }
  function run() {
    fix(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { if (m.type === 'characterData') text(m.target); else m.addedNodes.forEach(fix); });
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
