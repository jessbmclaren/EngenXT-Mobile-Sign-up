/*
  The screens stay reachable. The commentary does not sit on them.

  This file held the product and the argument for it on the same page: a
  Screens and Notes rail down the left, and 87 annotations printed beside the
  things they explained. The rail is the point of the file and it stays, with
  every screen and every drawer state still one press away. The annotations
  moved to DESIGN-NOTES.md, because a note explaining why a control reads the
  way it does is not something to hand a person who is trying to read the
  control.

  So the line this holds is narrow: no annotation renders, and no reviewer's
  vocabulary reaches the screen. Navigation is not the fault; prose printed
  next to a form is.

  It asks the rendered page rather than the source, because the failure to
  guard against is not a deliberate restoration. It is one note written next
  to the thing it is about, which is exactly where it is most tempting to
  write it.

  Run it:  node tools/production.js
  Exits 0 when nothing design-only reaches the screen, 1 with a report.

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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'production-'));
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
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const run = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw new Error('page threw: ' +
      ((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text || '').split('\n')[0]);
    return r.result.value;
  };
  const j = async (e) => JSON.parse(await run(`JSON.stringify(${e})`));

  let visit = 0;
  const load = async (hash) => {
    await send('Page.navigate', { url: `file://${FILE}?demo&v=${++visit}#${hash || 'home'}` });
    await sleep(1500);
  };
  await load('home');

  const SCREENS = await j(`[].map.call(document.querySelectorAll('section[id^="screen-"]'),
    function(s){ return s.id.replace('screen-',''); })`);

  /* ── The review apparatus ─────────────────────────────────────────────── */

  /* The rail stays. It is how the thing is reviewed, and every screen and
     drawer state is meant to be one press from any other. What it must not
     do is lose one. */
  const rail = await j(`({
    rails: document.querySelectorAll('.rail').length,
    screens: document.querySelectorAll('.rail button[data-screen]').length,
    states: document.querySelectorAll('.rail button[data-form]').length,
    sections: document.querySelectorAll('section[id^="screen-"]').length,
    inSheet: document.querySelectorAll('.focus-sheet .states').length
  })`);
  check('navigation', 'the rail reaches every screen in the document',
    rail.rails === 1 && rail.screens === rail.sections,
    `${rail.screens} buttons for ${rail.sections} screens`);
  check('navigation', 'and every drawer state as well',
    rail.states > 0, `${rail.states} drawer states`);
  /* The rail is one way in. A second switcher inside the sheet was another,
     sitting among the fields somebody is filling in. */
  check('navigation', 'no second state switcher inside a sheet',
    rail.inSheet === 0, rail.inSheet ? `${rail.inSheet} in-sheet switcher(s)` : 'none');

  /* ── Annotations, on every screen rather than the first ──────────────── */

  const notes = [], words = [];
  /* The catalogue pages are allowed to name what they catalogue. "Screen
     states to templates" is the title of one of them, and a page whose
     subject is the prototype's own states cannot be written without the
     words. The rule is about a product screen carrying commentary, not
     about the documentation being documentation. */
  const CATALOGUE = ['atoms', 'molecules', 'organisms', 'hierarchy',
    'state-map', 'oneoffs', 'states', 'driver-states', 'driver-open'];
  /* The vocabulary a reviewer writes in. Bounded so an operational note a
     fleet manager typed about a vehicle is not mistaken for one of these. */
  const TELLS = ['design note', 'for review', 'screen state', 'this prototype',
    'this screen', 'the demo', 'TBC', 'TODO', 'ADD VEHICLE STATES',
    'ONE THEFT, IN ORDER', 'BREAK-GLASS'];
  for (const s of SCREENS) {
    await run(`location.hash = ${JSON.stringify(s)}`);
    await sleep(120);
    const r = await j(`(function(){
      var sec = document.getElementById('screen-${s}');
      if (!sec) return { n: 0, hits: [] };
      var t = sec.innerText || '';
      return {
        n: sec.querySelectorAll('.surface-note, .figure-notes, .states-note').length,
        hits: ${JSON.stringify(TELLS)}.filter(function(w){
          return new RegExp(w.replace(/[.*+?^$()|[\\]\\\\]/g, '\\\\$&'), 'i').test(t); })
      };})()`);
    if (r.n) notes.push(`${s}: ${r.n}`);
    if (r.hits.length && !CATALOGUE.includes(s)) words.push(`${s}: ${r.hits.join(', ')}`);
  }
  check('annotations', 'no annotation element on any screen',
    notes.length === 0,
    notes.length ? notes.slice(0, 3).join(' · ') : `${SCREENS.length} screens, none`);
  check('annotations', 'no reviewer vocabulary on a product screen',
    words.length === 0,
    words.length ? words.slice(0, 3).join(' · ')
      : `${SCREENS.length - CATALOGUE.length} product screens, none`);

  /* ── Documentation is not a route ─────────────────────────────────────── */

  /* The documentation screens stay too. They are catalogues of what the
     product is built from, reviewed by opening them, and they are not
     commentary printed over a working form. */
  const DOCS = ['atoms', 'molecules', 'organisms', 'hierarchy', 'state-map',
    'oneoffs', 'states', 'driver-states', 'driver-open'];
  const missing = DOCS.filter(d => !SCREENS.includes(d));
  check('routes', 'the design documentation is still reachable',
    missing.length === 0, missing.length ? `lost: ${missing.join(', ')}` : `${DOCS.length} pages`);

  /* Kept, not deleted: the argument still exists, it is simply not shipped. */
  const kept = fs.existsSync(path.join(ROOT, 'DESIGN-NOTES.md'))
    ? fs.readFileSync(path.join(ROOT, 'DESIGN-NOTES.md'), 'utf8') : '';
  check('routes', 'and it is still written down somewhere',
    kept.length > 2000 && /## /.test(kept),
    kept ? `DESIGN-NOTES.md, ${kept.split(String.fromCharCode(10)).filter(l => l.startsWith('- ')).length} notes kept`
         : 'DESIGN-NOTES.md is missing');

  /* ── Nothing design-only in the accessibility tree ───────────────────── */

  const tree = await j(`(function(){
    var bad = [];
    [].forEach.call(document.querySelectorAll('[aria-label], [aria-describedby], [title]'), function(e){
      if (!e.checkVisibility || !e.checkVisibility()) return;
      var v = (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('title') || '');
      if (/design note|for review|prototype|screen state|TBC|TODO/i.test(v)) bad.push(v.trim().slice(0, 40));
    });
    return bad;})()`);
  check('accessibility tree', 'no accessible name is design-only',
    tree.length === 0, tree.length ? tree.join(' | ') : 'none');

  /* ── And the product still works ─────────────────────────────────────── */

  const worksList = [];
  for (const s of SCREENS) {
    await run(`location.hash = ${JSON.stringify(s)}`);
    await sleep(110);
    const ok = await run(`(function(){ var e = document.getElementById('screen-${s}');
      return !!e && e.checkVisibility() && e.getBoundingClientRect().height > 100; })()`);
    if (!ok) worksList.push(s);
  }
  check('the product', 'every screen still routes and renders',
    worksList.length === 0,
    worksList.length ? worksList.join(', ') : `${SCREENS.length} screens`);

  await load('drivers-directory');
  await run(`document.querySelector('#screen-drivers-directory [data-open="driver:blank"]').click()`);
  await sleep(1000);
  const sheet = await j(`({
    open: [].filter.call(document.querySelectorAll('.focus-sheet'),
      function(x){ return x.getBoundingClientRect().height > 50; }).length > 0,
    invite: !!document.getElementById('d-invite-send')
  })`);
  check('the product', 'Add driver survives, invitation and all',
    sheet.open && sheet.invite, `sheet ${sheet.open}, checkbox ${sheet.invite}`);

  const errs = await run(`JSON.stringify(window.__pageErrors || [])`);
  check('the product', 'and the page runs clean',
    errs === '[]', errs === '[]' ? 'no uncaught errors' : errs);

  ws.close(); reap();

  const bad = out.filter((r) => !r.ok);
  console.log('\nNothing that explains the product is inside it\n');
  let last = null;
  for (const r of out) {
    if (r.group !== last) { console.log(`  ${r.group}`); last = r.group; }
    console.log(`    ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(50)} ${r.note}`);
  }
  console.log(`\n${out.length - bad.length} of ${out.length} checks pass.`);
  process.exit(bad.length ? 1 : 0);
})();
