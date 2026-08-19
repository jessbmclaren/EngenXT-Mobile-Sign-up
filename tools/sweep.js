#!/usr/bin/env node
'use strict';

/*
  Render every state and measure what a driver would meet.

  check.js proves the files parse and agree with each other. This proves the
  screens hold: every state in the rail is rendered headless at 390x844 and
  checked for the four failures that got past reading the code this year:

    1. A status bar you cannot see. The surfaces here are gradients and
       overlays, so the clock's contrast is sampled off the rendered pixels,
       not reasoned about from tokens. Eleven states shipped white-on-white
       before this check existed.
    2. A tap target under 44px. Hit areas are measured including the
       pseudo-element extensions this codebase uses (the map pins, the
       vehicle chips), because the drawn size and the pressable size are
       allowed to differ and only the pressable one matters.
    3. Content past the frame that no scroller can reach.
    4. Anything thrown or logged as an error while a state renders.

  Run it:  node tools/sweep.js                 both files, default text
           node tools/sweep.js --large        both files, large text
           node tools/sweep.js index.html     one file

  Needs Chrome (set CHROME=/path/to/chrome to override the macOS default)
  and a few minutes. Wired into CI as the behave job; run it locally
  before a merge the way you run a test suite.

  States are enumerated from each page's own rail (window.Demo.states()), so
  a new state is swept the day it exists, with nothing to update here.
*/

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9955;
const LARGE = process.argv.includes('--large');
const named = process.argv.slice(2).filter((a) => a.endsWith('.html'));
const FILES = named.length ? named : ['index.html', 'engenxt-onboarding.html'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* The harness: the real file, pinned to the viewport with the developer rail
   hidden, so geometry is the product's own. Written to a temp dir; the repo
   stays clean. */
function harness(name) {
  let src = fs.readFileSync(path.join(ROOT, name), 'utf8');
  const style = `<style id="__sweep">
  html, body { margin:0 !important; padding:0 !important; overflow:hidden !important; }
  .d-stateNav { display:none !important; }
  .p-signup-demo { padding:0 !important; gap:0 !important; display:block !important; min-height:0 !important; }
  .t-device-frame { position:fixed !important; top:0 !important; left:0 !important; margin:0 !important;
    width:390px !important; height:844px !important; border-radius:0 !important; box-shadow:none !important; }
</style>
</head>`;
  src = src.replace('</head>', style, 1);
  if (LARGE) { src = src.replace('data-text="default"', 'data-text="large"'); }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'engenxt-sweep-'));
  const out = path.join(dir, name);
  fs.writeFileSync(out, src);
  stageAssets(dir);
  return out;
}
/* The pages link their stylesheet now instead of inlining it, and a harness
   written to a temp directory would leave those links pointing at nothing -
   the page would render unstyled and every check would report on a blank
   screen rather than on the product. Copying src/ next to the staged page
   keeps the relative paths true. Recursive, and only what the pages ask for. */
function stageAssets(dir) {
  const from = path.join(ROOT, 'src');
  if (!fs.existsSync(from)) { return; }
  const copy = (a, b) => {
    fs.mkdirSync(b, { recursive: true });
    for (const entry of fs.readdirSync(a, { withFileTypes: true })) {
      const s = path.join(a, entry.name), d = path.join(b, entry.name);
      if (entry.isDirectory()) { copy(s, d); } else { fs.copyFileSync(s, d); }
    }
  };
  copy(from, path.join(dir, 'src'));
}

function cdp(ws, onEvent) {
  let id = 0; const p = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); }
    else if (m.method && onEvent) { onEvent(m); }
  });
  return (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; p.set(i, { resolve: res, reject: rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}

/* Runs inside the page: tap targets (pseudo-elements counted) and content
   stranded past the frame with no scroller able to reach it. */
const AUDIT = `(function () {
  var f = document.querySelector('.t-device-frame');
  if (!f) { return JSON.stringify({ noFrame: true, small: [], stranded: [] }); }
  var fr = f.getBoundingClientRect();
  /* One law, one writer: the floor is the token the spec panel reads,
     not a number this file made up. */
  var min = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--size-target')) || 48;
  var small = [];
  f.querySelectorAll('button, a[href], [role="button"], input, select').forEach(function (el) {
    if (el.closest('.d-stateNav, .d-panel')) { return; }
    var c = getComputedStyle(el);
    if (c.display === 'none' || !el.getClientRects().length) { return; }
    /* An input inside a label is tapped through the label: the label's box
       is the honest target, which is exactly why the field wraps one. */
    var box = el;
    if (el.tagName === 'INPUT' && el.closest('label')) { box = el.closest('label'); }
    var r = box.getBoundingClientRect(); var w = r.width, h = r.height;
    ['::after', '::before'].forEach(function (pe) {
      var p = getComputedStyle(el, pe);
      if (p.content && p.content !== 'none' && p.position === 'absolute') {
        var it = (p.inset || '').match(/-?[\\d.]+/g);
        if (it) {
          var v = it.map(parseFloat);
          var top = v[0], right = v.length > 1 ? v[1] : v[0],
              bot = v.length > 2 ? v[2] : v[0], left = v.length > 3 ? v[3] : right;
          h = Math.max(h, r.height - top - bot); w = Math.max(w, r.width - left - right);
        }
        var ph = parseFloat(p.height), pw = parseFloat(p.width);
        if (!isNaN(ph)) { h = Math.max(h, ph); }
        if (!isNaN(pw)) { w = Math.max(w, pw); }
      }
    });
    if (h < min || w < min) {
      small.push(((el.className || '').toString().split(' ')[0] || el.tagName.toLowerCase()) +
        ' ' + Math.round(w) + 'x' + Math.round(h));
    }
  });
  var stranded = [];
  f.querySelectorAll('*').forEach(function (el) {
    var cl = (el.className || '').toString();
    if (!/(^|\\s)(a-|m-|o-)[a-z]/.test(cl)) { return; }
    var c = getComputedStyle(el);
    if (c.display === 'none' || !el.getClientRects().length) { return; }
    var r = el.getBoundingClientRect();
    if (!r.height || r.bottom <= fr.bottom + 0.5) { return; }
    var sc = el.parentElement;
    while (sc && sc !== f) {
      var s2 = getComputedStyle(sc);
      if (/(auto|scroll)/.test(s2.overflowY) && sc.scrollHeight > sc.clientHeight + 1) { return; }
      sc = sc.parentElement;
    }
    stranded.push(cl.split(' ')[0]);
  });
  return JSON.stringify({
    small: small.filter(function (v, i, a) { return a.indexOf(v) === i; }),
    stranded: stranded.filter(function (v, i, a) { return a.indexOf(v) === i; })
  });
})()`;

/* Contrast helpers for the pixel-sampled status bar check. */
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => {
  const la = lum(a), lb = lum(b), hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
    '--hide-scrollbars', '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'engenxt-prof-')),
    '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    await sleep(300);
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch (e) { /* booting */ }
  }
  if (!targets) { console.error('Chrome did not come up. Set CHROME=/path/to/chrome.'); process.exit(2); }
  const ws = new WebSocket(targets.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let pageProblems = [];
  const send = cdp(ws, (m) => {
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      pageProblems.push('exception: ' + ((d.exception && d.exception.description) || d.text).split('\n')[0]);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      pageProblems.push('console.error: ' +
        m.params.args.map((a) => a.value || a.description || '').join(' ').slice(0, 120));
    }
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  let failures = 0, checked = 0;
  for (const name of FILES) {
    const file = harness(name);
    await send('Page.navigate', { url: 'file://' + file });
    await sleep(1500);
    const states = JSON.parse((await send('Runtime.evaluate', {
      expression: 'JSON.stringify(Object.keys(window.Demo ? Demo.states() : {}))',
      returnByValue: true })).result.value);
    console.log(`\n${name}${LARGE ? ' (large text)' : ''} — ${states.length} states`);
    for (let i = 0; i < states.length; i++) {
      pageProblems = [];
      await send('Page.navigate', { url: 'file://' + file + '?n=' + i + '#' + states[i] });
      await sleep(1000);
      checked++;
      const notes = [];

      /* The clock, sampled from the pixels actually rendered behind it.

         The bar's own contents are hidden for the shot, and the sample is
         taken at the clock's own centre rather than at a fixed x.

         Both corrections are the same bug. The bar lays its three children out
         space-between, so the middle slot - empty on almost every screen - is
         the "No service" label on the two offline ones, and it centres at very
         nearly x=200. The old sample read that label's glyphs and called them
         the background, so it measured the clock against text and reported
         home/offline at 2.30:1 and flow1-scan-offline at 2.47:1. Neither
         screen had a fault: both draw a white clock on the near-black scan
         and page surfaces, which is about 15:1. The check invented them, and
         it only failed in Large text because a bigger clock moves the sample
         row far enough to catch a different part of the same glyphs.

         visibility, not display: the layout does not move, so the clock's box
         is still exactly where it was and what is behind it is all that is
         left to photograph. */
      await send('Runtime.evaluate', { expression: `(() => {
        const s = document.createElement('style'); s.id = '__sweepBar';
        s.textContent = '.m-status-bar > * { visibility: hidden !important; }';
        document.head.appendChild(s);
      })()` });
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const sampled = await send('Runtime.evaluate', {
        awaitPromise: true, returnByValue: true,
        expression: `(async () => {
          const tm = document.querySelector('.m-status-bar__time');
          if (!tm) { return 'none'; }
          const img = new Image(); img.src = 'data:image/png;base64,${shot.data}';
          await img.decode();
          const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
          const g = c.getContext('2d'); g.drawImage(img, 0, 0);
          const r = tm.getBoundingClientRect(); const dpr = img.width / 390;
          const px = g.getImageData(Math.round((r.left + r.width / 2) * dpr),
                                    Math.round((r.top + r.height / 2) * dpr), 1, 1).data;
          return JSON.stringify({ colour: getComputedStyle(tm).color, bg: [px[0], px[1], px[2]] });
        })()` });
      await send('Runtime.evaluate', {
        expression: `(() => { const s = document.getElementById('__sweepBar'); if (s) { s.remove(); } })()` });
      if (sampled.result.value !== 'none') {
        const o = JSON.parse(sampled.result.value);
        const m = o.colour.match(/[\d.]+/g).map(Number);
        const a = m.length > 3 ? m[3] : 1;
        const eff = [m[0], m[1], m[2]].map((v, k) => v * a + o.bg[k] * (1 - a));
        const r = ratio(eff, o.bg);
        if (r < 3) { notes.push('status bar ' + r.toFixed(2) + ':1'); }
      }

      const audit = JSON.parse((await send('Runtime.evaluate', {
        expression: AUDIT, returnByValue: true })).result.value);
      if (audit.small.length) { notes.push('targets: ' + audit.small.join(', ')); }
      if (audit.stranded.length) { notes.push('stranded: ' + audit.stranded.join(', ')); }
      if (pageProblems.length) { notes.push(pageProblems.join(' | ')); }

      if (notes.length) { failures++; console.log('  FAIL ' + states[i] + ' — ' + notes.join(' · ')); }
    }
  }
  console.log(`\n${checked} states swept, ${failures} with failures`);
  ws.close(); chrome.kill();
  process.exit(failures ? 1 : 0);
})();
