#!/usr/bin/env node
'use strict';

/*
  The page may not scroll sideways, and nothing may be stranded off its edge.

  This product has one rule about width and it is easy to break by accident:
  anything wider than the screen lives in a container that scrolls on its own
, a table in its wrapper, a specimen grid in its panel, and the document
  itself never scrolls horizontally. Break it anywhere and you break it
  everywhere, because the document is a single scroller: one nowrap row of
  four buttons on the drivers list made every other screen in the prototype
  slide sideways too.

  Two failures are checked, at three widths, on every catalogued screen:

    the document scrolls horizontally: the rule above, broken;
    content sits past the right edge with no scroller above it, visible in
      the DOM, unreachable on the screen, which is worse than absent because
      nothing says it is missing.

  Both were real. `.bulk-actions` was a nowrap flex row that ran 150px past a
  390px screen. `.panel-facts--stacked` was declared 2800 lines before the
  rule it modifies, at equal specificity, so it never applied, and the base's
  max-content column stretched a before-and-after comparison to 935px inside a
  600px panel that clipped it, so below 1440px the "after" half of the one
  screen built for comparing two things was simply not there.

  Run it:  node tools/layout.js
  Exits 0 when nothing overflows, 1 with a report.

  Needs Chrome. Set CHROME=/path/to/chrome to override the macOS default.
*/
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'tfn-fleet-portal.html');
const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
const check = (group, name, ok, note) => out.push({ group, name, ok, note });

/* The widths worth holding: a common phone, a tablet, and the laptop the
   before-and-after was broken on. Wide screens hid both of these bugs. */
const WIDTHS = [[390, 844, 'phone'], [768, 1024, 'tablet'], [1280, 900, 'laptop']];

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}
function reapOn(child, dir) {
  const done = () => {
    try { child.kill('SIGKILL'); } catch (e) { /* already gone */ }
    try { require('child_process').execFileSync('pkill', ['-f', dir]); } catch (e) { /* none left */ }
  };
  ['exit', 'SIGINT', 'SIGTERM', 'uncaughtException'].forEach(sig => {
    process.on(sig, (err) => { done(); if (sig === 'uncaughtException') { console.error(err); process.exit(1); } });
  });
  return done;
}
function cdp(ws) {
  let id = 0; const p = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && p.has(m.id)) {
      const { resolve, reject } = p.get(m.id); p.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    }
  });
  return (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; p.set(i, { resolve: res, reject: rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}

/* Stranded: past the right edge, with nothing above it that can scroll to
   reveal it. The walk up stops at the first ancestor that both allows
   horizontal overflow and actually has some, a container with `auto` that
   fits its content is not a way to reach anything. */
const STRANDED = (id) => `(function(){
  var sec = document.getElementById('screen-' + ${JSON.stringify(id)});
  if (!sec) return { missing: true };
  var w = document.documentElement.clientWidth;
  var hits = [];
  [].forEach.call(sec.querySelectorAll('*'), function (e) {
    if (!e.checkVisibility || !e.checkVisibility()) return;
    var r = e.getBoundingClientRect();
    if (r.width === 0 || r.right <= w + 1.5) return;
    var p = e.parentElement, reachable = false;
    while (p && p !== document.body) {
      var cs = getComputedStyle(p);
      if (/auto|scroll/.test(cs.overflowX) && p.scrollWidth > p.clientWidth) { reachable = true; break; }
      p = p.parentElement;
    }
    if (reachable) return;
    /* Report the deepest offender only: a stranded word inside a stranded
       row inside a stranded table is one fault, not three. */
    var childAlso = [].some.call(e.children, function (c) {
      return c.checkVisibility && c.checkVisibility() && c.getBoundingClientRect().right > w + 1.5;
    });
    if (childAlso) return;
    hits.push((e.tagName + '.' + String(e.className || '').split(' ')[0]).slice(0, 26)
      + ' +' + Math.round(r.right - w) + 'px');
  });
  return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
           stranded: [...new Set(hits)] };
})()`;

(async () => {
  const PORT = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
    '--hide-scrollbars', '--user-data-dir=' + profile,
    '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  const reap = reapOn(chrome, profile);

  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    await sleep(300);
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch (e) { /* booting */ }
  }
  if (!targets) { console.error('Chrome did not come up. Set CHROME=/path/to/chrome.'); process.exit(2); }

  const ws = new WebSocket(targets.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  const send = cdp(ws);
  await send('Page.enable'); await send('Runtime.enable');

  const run = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw new Error('page threw: ' +
      ((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text || '').split('\n')[0]);
    return r.result.value;
  };
  const j = async (e) => JSON.parse(await run(`JSON.stringify(${e})`));

  let visit = 0;
  const load = async (hash) => {
    await send('Page.navigate', { url: `file://${FILE}?demo&v=${++visit}#${hash}` });
    await sleep(1500);
  };

  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await load('home');
  /* The catalogue names its own screens; a list typed here would go stale the
     next time one is added. */
  const SCREENS = await j(`[].map.call(document.querySelectorAll('section[id^="screen-"]'),
    function(s){ return s.id.replace('screen-',''); })`);

  for (const [w, h, label] of WIDTHS) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 });
    await load('home');
    const scrolls = [], stranded = [];
    for (const s of SCREENS) {
      await run(`location.hash = ${JSON.stringify(s)}`);
      await sleep(110);
      const r = await j(STRANDED(s));
      if (r.missing) continue;
      if (r.page > 1) scrolls.push(`${s} +${r.page}px`);
      if (r.stranded.length) stranded.push(`${s}: ${r.stranded.slice(0, 2).join(', ')}`);
    }
    check(label, `the page never scrolls sideways at ${w}px`,
      scrolls.length === 0,
      scrolls.length ? scrolls.slice(0, 3).join(' · ') : `${SCREENS.length} screens, none`);
    check(label, `nothing is stranded off the edge at ${w}px`,
      stranded.length === 0,
      stranded.length ? stranded.slice(0, 2).join(' · ') : `${SCREENS.length} screens, none`);
  }

  /* The bulk bar is the one that made the document scroll, and it only exists
     once rows are ticked. Which is why sweeping the screens never saw it. */
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const [screen, noun] of [['drivers-directory', 'drivers'], ['directory', 'vehicles']]) {
    await load(screen);
    await run(`document.querySelector('#screen-${screen} .select-all').click()`);
    await sleep(500);
    const r = await j(`(function(){
      var b = document.querySelector('#screen-${screen} [data-role="bulk"]');
      return { shown: b && !b.classList.contains('hidden'),
        page: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    })()`);
    check('phone', `selecting every row does not push the ${noun} page sideways`,
      r.shown && r.page === 0, r.shown ? `page scroll ${r.page}px` : 'the bulk bar never appeared');
  }

  /* Both halves of a before-and-after, on the width it used to lose one. */
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await load('rules');
  const ba = await j(`(function(){
    var e = document.querySelector('#screen-rules .before-after');
    if (!e || !e.checkVisibility()) return { missing: true };
    var sides = [].map.call(e.querySelectorAll('.ba-side'), function (s) {
      var r = s.getBoundingClientRect();
      return { w: Math.round(r.width), cut: r.right > window.innerWidth + 1 };
    });
    return { sides: sides, anyCut: sides.some(function (s) { return s.cut; }) };
  })()`);
  check('laptop', 'a before-and-after shows both halves at 1280px',
    !ba.missing && ba.sides.length === 2 && !ba.anyCut,
    ba.missing ? 'the comparison did not render'
      : `${ba.sides.map(s => s.w + 'px').join(' + ')}${ba.anyCut ? '. One is CUT OFF' : ''}`);

  /* Two hit areas for one control is how the harder one goes unnoticed. */
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const ticks = [];
  for (const screen of ['drivers-directory', 'directory']) {
    await load(screen);
    const t = await j(`(function(){
      var box = function (sel) {
        var c = document.querySelector('#screen-${screen} ' + sel + ' input[type=checkbox]');
        if (!c) return null;
        var t = c.closest('label') || c;
        var r = t.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), labelled: !!c.closest('label') };
      };
      return { head: box('thead'), row: box('tbody') };
    })()`);
    ticks.push({ screen, ...t });
  }
  const small = ticks.filter(t => !t.head || !t.row
    || !t.head.labelled || !t.row.labelled
    || Math.min(t.head.w, t.head.h) < 24 || Math.min(t.row.w, t.row.h) < 24);
  check('targets', 'row ticks and Select all share one enlarged hit area',
    small.length === 0,
    small.length
      ? small.map(t => `${t.screen}: head ${t.head ? t.head.w + '×' + t.head.h : '?'}, row ${t.row ? t.row.w + '×' + t.row.h : '?'}`).join(' · ')
      : ticks.map(t => `${t.screen} ${t.row.w}×${t.row.h}`).join(' · '));

  ws.close(); reap();

  const bad = out.filter((r) => !r.ok);
  console.log('\nNothing runs off the edge\n');
  let last = null;
  for (const r of out) {
    if (r.group !== last) { console.log(`  ${r.group}`); last = r.group; }
    console.log(`    ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(56)} ${r.note}`);
  }
  console.log(`\n${out.length - bad.length} of ${out.length} checks pass.`);
  process.exit(bad.length ? 1 : 0);
})();
