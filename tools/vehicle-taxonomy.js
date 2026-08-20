#!/usr/bin/env node
'use strict';

/*
  Three categories, no tank count, and one place that decides what an older
  value means.

  Vehicle category was thirteen values, then eight, and is now lcv, hcv and
  motorcycle. Fuel-tank count is gone: the product needs the total a vehicle
  holds, not how many tanks add up to it. Vehicle configuration went with the
  granular categories that gave it its lists.

  Nothing rewrites a stored value. A record saved as `bakkie` stays `bakkie`
  and reads as LCV through VehicleTypes.normalise(), which is the only function
  allowed to turn a written-down category into a current one. A value that
  could be more than one of the three is not guessed at: it keeps what it says
  and is marked for review.

  Run it:  node tools/vehicle-taxonomy.js
  Exits 0 when the taxonomy holds, 1 with a report.

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

/* A port nobody else is on, and a Chrome that dies with us. Two tools sharing
   a hard-coded port is how a probe ends up reading a page loaded before the
   edit it is meant to be checking. */
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

const SHEET = `[].filter.call(document.querySelectorAll('.focus-sheet'),` +
  `function(x){return x.getBoundingClientRect().height>50;})[0]`;

/* Every way a tank count could still be on screen or in the way. */
const NO_TANK_COUNT = `(function(){
  var s = ${SHEET};
  if (!s) return JSON.stringify({err:'no sheet open'});
  var text = (s.textContent||'').toLowerCase();
  return JSON.stringify({
    radios: s.querySelectorAll('[name="tankMode"]').length,
    group: s.querySelectorAll('[data-field="tankMode"]').length,
    editor: s.querySelectorAll('[data-field="tanks"], .tank-list, [data-role="tank-total"]').length,
    mirror: document.querySelectorAll('#f-tank-mode').length,
    /* Not "fuel tanks": the required helper says "all the vehicle's fuel
       tanks", which is the total, not a count. These are the count. */
    words: ['one tank','two tanks','how many tanks','tank 1 capacity','fuel tanks<']
      .filter(function(w){ return text.indexOf(w) >= 0; }),
    capacity: s.querySelectorAll('[data-field="tankCapacity"]').length,
    capacityHidden: (function(){ var f=s.querySelector('[data-field="tankCapacity"]');
      return f ? (f.hidden || f.classList.contains('hidden')) : null; })(),
    capacityLabel: (function(){ var f=s.querySelector('[data-field="tankCapacity"] label');
      return f ? f.textContent.trim() : null; })(),
    capacityHelp: (function(){ var f=s.querySelector('[data-field="tankCapacity"] .help');
      return f ? f.textContent.trim() : null; })(),
    config: s.querySelectorAll('[data-field="vehicleConfiguration"]:not([hidden])').length
  });
})()`;

(async () => {
  const PORT = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'taxonomy-'));
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
    { width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false });

  const run = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.exceptionDetails) {
      const e = r.exceptionDetails;
      throw new Error('page threw: ' +
        ((e.exception && e.exception.description) || e.text || '').split('\n')[0]);
    }
    return r.result.value;
  };
  const runAsync = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('page threw in an async probe');
    return r.result.value;
  };
  /* A distinct query per visit. Navigating to a URL that differs only in its
     hash does not reload, so an "open the edit sheet" step that reuses the
     "open the add sheet" URL measures the add sheet. */
  let visit = 0;
  const openAdd = async () => {
    await send('Page.navigate', { url: 'file://' + FILE + '?demo&v=' + (++visit) + '#directory' });
    await sleep(1500);
    await run(`document.querySelector('#screen-directory [data-open="vehicle:blank"]').click()`);
    await sleep(800);
  };
  const openEdit = async (match) => {
    await send('Page.navigate', { url: 'file://' + FILE + '?demo&v=' + (++visit) + '#directory' });
    await sleep(1500);
    await run(`(function(){
      var rows=[].filter.call(document.querySelectorAll('#screen-directory tbody tr'),
        function(r){ return /${match}/.test(r.textContent); });
      (rows[0]||document.querySelector('#screen-directory tbody tr')).click();})()`);
    await sleep(900);
  };

  /* Load the page before asking it anything. */
  await send('Page.navigate', { url: 'file://' + FILE + '?demo&v=0#directory' });
  await sleep(1600);

  /* ── The three ────────────────────────────────────────────────────────── */
  const three = JSON.parse(await run(`(function(){
    var T = window.VehicleTypes;
    if (!T) return JSON.stringify({err:'no VehicleTypes'});
    var list = T.list();
    return JSON.stringify({
      codes: list.map(function(t){return t.code;}),
      labels: list.map(function(t){return t.label;}),
      longs: list.map(function(t){return t.long;}),
      csv: T.csvValues()
    });})()`));
  check('taxonomy', 'exactly three selectable categories',
    JSON.stringify(three.codes) === JSON.stringify(['lcv', 'hcv', 'motorcycle']),
    three.err || `stored values ${three.codes.join(', ')}`);
  check('taxonomy', 'the menu shows the expanded reading',
    JSON.stringify(three.longs) === JSON.stringify(
      ['LCV — Light commercial vehicle', 'HCV — Heavy commercial vehicle', 'Motorcycle']),
    (three.longs || []).join(' / '));
  check('taxonomy', 'compact places get the short label',
    JSON.stringify(three.labels) === JSON.stringify(['LCV', 'HCV', 'Motorcycle']),
    (three.labels || []).join(' / '));
  check('taxonomy', 'the CSV publishes the same three',
    JSON.stringify(three.csv) === JSON.stringify(['lcv', 'hcv', 'motorcycle']),
    (three.csv || []).join(', '));

  /* ── Legacy mapping, and what is refused ─────────────────────────────── */
  const mapped = JSON.parse(await run(`(function(){
    var T = window.VehicleTypes, o = {};
    ['bakkie','van','panel van','pickup','ute','LCV','light commercial vehicle',
     'rigid_truck','rigid truck','tractor unit','horse','truck','HCV','heavy commercial vehicle',
     'motorcycle','motorbike','scooter','courier_motorcycle','bike'
    ].forEach(function(v){ o[v] = T.normalise(v).code; });
    return JSON.stringify(o);})()`));
  const wantLcv = ['bakkie', 'van', 'panel van', 'pickup', 'ute', 'LCV', 'light commercial vehicle'];
  const wantHcv = ['rigid_truck', 'rigid truck', 'tractor unit', 'horse', 'truck', 'HCV', 'heavy commercial vehicle'];
  const wantBike = ['motorcycle', 'motorbike', 'scooter', 'courier_motorcycle', 'bike'];
  const wrong = (list, to) => list.filter((v) => mapped[v] !== to);
  check('legacy', 'recognised values map to LCV',
    wrong(wantLcv, 'lcv').length === 0, wrong(wantLcv, 'lcv').join(', ') || wantLcv.join(', '));
  check('legacy', 'recognised values map to HCV',
    wrong(wantHcv, 'hcv').length === 0, wrong(wantHcv, 'hcv').join(', ') || wantHcv.join(', '));
  check('legacy', 'recognised values map to Motorcycle',
    wrong(wantBike, 'motorcycle').length === 0,
    wrong(wantBike, 'motorcycle').join(', ') || wantBike.join(', '));

  const ambiguous = JSON.parse(await run(`(function(){
    var T = window.VehicleTypes, o = {};
    ['passenger car','minibus','bus','three_wheeler','special_purpose','other','taxi','coach','suv']
      .forEach(function(v){ var r = T.normalise(v); o[v] = { code:r.code, review:r.review, stored:r.stored }; });
    return JSON.stringify(o);})()`));
  const guessed = Object.entries(ambiguous).filter(([, r]) => r.code !== null);
  const unmarked = Object.entries(ambiguous).filter(([, r]) => r.review !== true);
  check('legacy', 'ambiguous values are never guessed',
    guessed.length === 0, guessed.length ? guessed.map(([v, r]) => `${v}→${r.code}`).join(', ')
      : `${Object.keys(ambiguous).length} values, none mapped`);
  check('legacy', 'ambiguous values are marked for review',
    unmarked.length === 0, unmarked.length ? unmarked.map(([v]) => v).join(', ')
      : 'every one carries review:true');
  check('legacy', 'the value written down is preserved',
    Object.entries(ambiguous).every(([v, r]) => r.stored === v),
    'stored strings come back exactly as given');

  /* ── The form ─────────────────────────────────────────────────────────── */
  await openAdd();
  const add = JSON.parse(await run(NO_TANK_COUNT));
  check('add vehicle', 'no tank-count control remains',
    add.radios === 0 && add.group === 0 && add.editor === 0 && add.mirror === 0,
    add.err || `radios ${add.radios}, group ${add.group}, editor ${add.editor}, hidden mirror ${add.mirror}`);
  check('add vehicle', 'no tank-count wording remains',
    (add.words || []).length === 0, (add.words || []).join(', ') || 'none of the five phrases');
  check('add vehicle', 'total capacity is present and visible',
    add.capacity === 1 && add.capacityHidden === false,
    `label "${add.capacityLabel}"`);
  check('add vehicle', 'it is labelled and helped as specified',
    add.capacityLabel === 'Total fuel-tank capacity' &&
    add.capacityHelp === 'Enter the combined capacity of all the vehicle’s fuel tanks.',
    `"${add.capacityLabel}" / "${add.capacityHelp}"`);
  check('add vehicle', 'vehicle configuration is not shown',
    add.config === 0, `${add.config} visible configuration fields`);

  const options = JSON.parse(await run(`(function(){
    var s=document.getElementById('f-type');
    return JSON.stringify({
      values: [].map.call(s.options, function(o){return o.value;}),
      texts: [].map.call(s.options, function(o){return o.textContent;}),
      groups: s.querySelectorAll('optgroup').length});})()`));
  check('add vehicle', 'the select offers the three and a placeholder',
    JSON.stringify(options.values) === JSON.stringify(['', 'lcv', 'hcv', 'motorcycle']),
    options.values.join(', '));

  /* Submitting empty: what is required, and what is not. */
  await run(`(function(){var s=${SHEET};s.querySelector('[data-role="submit"]').click();})()`);
  await sleep(700);
  const summary = JSON.parse(await run(`(function(){
    var s=${SHEET}, box=s.querySelector('[data-role="summary"]');
    var items=[].map.call(box.querySelectorAll('li'),function(l){return l.textContent.trim();});
    var count=s.querySelector('[data-role="count"]');
    return JSON.stringify({items:items, count:count?count.textContent.trim():''});})()`));
  const tankTalk = summary.items.filter((t) => /tanks?\b/i.test(t) && !/total fuel-tank/i.test(t));
  check('validation', 'the summary never asks how many tanks',
    tankTalk.length === 0, tankTalk.join('; ') || `${summary.items.length} problems, none about a count`);
  check('validation', 'total capacity is still required',
    summary.items.some((t) => /total fuel-tank capacity/i.test(t)),
    summary.items.find((t) => /capacity/i.test(t)) || 'not asked for');
  check('validation', 'the counter does not mention a tank count',
    !/tanks\b/i.test(summary.count), `footer reads "${summary.count}"`);
  check('validation', 'configuration is not required',
    !summary.items.some((t) => /configuration/i.test(t)),
    'not in the summary');

  /* Filling only what is asked must clear the form. */
  /* Filled the way a person fills it: the two selects through their own
     listbox, the text fields by typing. Setting .value and dispatching an
     input event is not the same journey, and on the two fields below it did
     not register while the other six did. */
  for (const [f, v] of [['vin', 'AHTFR22G30A123456'], ['registration', 'CA 123 456'],
    ['make', 'Toyota'], ['model', 'Hilux'], ['tankCapacity', '80']]) {
    await run(`(function(){var s=${SHEET};
      var c=s.querySelector('[data-field="${f}"] input');
      if(c){ c.focus(); c.value=''; }})()`);
    await send('Input.insertText', { text: v });
    await run(`(function(){var s=${SHEET};
      var c=s.querySelector('[data-field="${f}"] input');
      if(c){ c.dispatchEvent(new Event('input',{bubbles:true}));
             c.dispatchEvent(new Event('change',{bubbles:true})); }})()`);
    await sleep(140);
  }
  for (const [f, v] of [['f-year', '2021'], ['f-type', 'lcv'], ['f-fuel', 'Diesel']]) {
    await run(`document.getElementById('${f}-trigger').click()`);
    await sleep(180);
    const picked = await run(`(function(){
      var rows=[].map.call(document.querySelectorAll('#${f}-list [role="option"]'),
        function(o){return o.dataset.value;});
      var row=[].filter.call(document.querySelectorAll('#${f}-list [role="option"]'),
        function(o){return o.dataset.value===${JSON.stringify(v)};})[0];
      if(row) row.click();
      return JSON.stringify({found:!!row, options:rows, value:document.getElementById('${f}').value});})()`);
    if (process.env.DBG) console.log('    pick', f, picked);
    await sleep(180);
  }
  /* The engine reads and repaints on a debounce, and headless throttles
     timers, so the last thing done before pressing is the thing most likely
     not to have been read yet. */
  await sleep(1200);
  const submits = JSON.parse(await run(`(function(){
    var s=${SHEET};
    s.querySelector('[data-role="submit"]').click();
    var box=s.querySelector('[data-role="summary"]');
    /* A hidden summary keeps whatever it last rendered. Counting its list
       items without checking that is how a passing form reads as blocked. */
    var hidden=box.classList.contains('hidden');
    return JSON.stringify({
      left: hidden ? [] : [].map.call(box.querySelectorAll('li'),function(l){return l.textContent.trim();}),
      hidden: hidden,
      fieldErrors: [].map.call(s.querySelectorAll('.form-field .error, .form-field [data-role="error"]'),
        function(e){return e.textContent.trim();}).filter(Boolean)});})()`));
  check('validation', 'no hidden tank rule blocks a complete form',
    submits.left.length === 0 && submits.fieldErrors.length === 0,
    submits.left.length ? 'still blocked by: ' + submits.left.join('; ')
      : (submits.fieldErrors.length ? 'fields still flagged: ' + submits.fieldErrors.join('; ')
        : 'eight answers, summary hidden, no field flagged'));

  /* ── A legacy record ──────────────────────────────────────────────────── */
  await openEdit('HRV\\\\s*482');
  const edit = JSON.parse(await run(NO_TANK_COUNT));
  const legacy = JSON.parse(await run(`(function(){
    var t=document.getElementById('f-type-trigger'), sel=document.getElementById('f-type');
    var v=t?t.querySelector('.select-value'):null;
    return JSON.stringify({stored:sel.value, shown:v?v.textContent.trim():null,
      placeholder:v?v.classList.contains('is-placeholder'):null,
      capacity:(document.getElementById('f-tank')||{}).value});})()`));
  check('edit vehicle', 'a legacy record opens with no tank-count control',
    edit.radios === 0 && edit.editor === 0 && (edit.words || []).length === 0,
    edit.err || 'none present');
  const fixture = JSON.parse(await run(`(function(){
    var v=(window.VehicleFixtures?VehicleFixtures.VEHICLES:[]).filter(function(r){return /HRV/.test(r[0]);})[0];
    return JSON.stringify({stored: v ? v[4] : null});})()`));
  check('edit vehicle', 'the record keeps the word it was written with',
    fixture.stored === 'bakkie',
    `the row still holds "${fixture.stored}" while the form offers ${legacy.stored}`);
  check('edit vehicle', 'and reads as its current category',
    /LCV/.test(legacy.shown || '') && legacy.placeholder === false,
    `the trigger reads "${legacy.shown}"`);
  check('edit vehicle', 'its capacity is restored',
    !!legacy.capacity, `${legacy.capacity} litres`);

  const saved = JSON.parse(await run(`(function(){
    var s=${SHEET}, b=s.querySelector('[data-role="submit"]');
    b.click();
    var box=s.querySelector('[data-role="summary"]');
    var items=box?[].map.call(box.querySelectorAll('li'),function(l){return l.textContent.trim();}):[];
    return JSON.stringify({blocked:items});})()`));
  check('edit vehicle', 'and it still saves',
    saved.blocked.length === 0,
    saved.blocked.length ? 'blocked by: ' + saved.blocked.join('; ') : 'nothing refused the save');

  /* ── One taxonomy everywhere ──────────────────────────────────────────── */
  const shared = JSON.parse(await run(`(function(){
    var T=window.VehicleTypes;
    var facet = document.querySelector('#screen-directory');
    var heads=[].map.call(document.querySelectorAll('#screen-directory thead th'),
      function(h){return h.textContent.trim().toLowerCase();});
    var col=heads.indexOf('vehicle category');
    var cells = col<0 ? [] : [].map.call(document.querySelectorAll('#screen-directory tbody tr'),
      function(r){ return (r.children[col]||{}).textContent ? r.children[col].textContent.trim() : ''; });
    return JSON.stringify({
      cells: cells.filter(function(v,i,a){return v && a.indexOf(v)===i;}),
      csv: window.ImportSchema
        ? ImportSchema.COLUMNS.filter(function(c){return c.key==='vehicle_category';})[0].example : null,
      header: window.ImportSchema ? ImportSchema.header().indexOf('vehicle_category')>=0 : null
    });})()`));
  const strays = shared.cells.filter((c) => !['LCV', 'HCV', 'Motorcycle'].includes(c));
  check('one taxonomy', 'the directory shows only the three',
    strays.length === 0, strays.length ? 'also showing: ' + strays.join(', ')
      : shared.cells.join(', '));
  check('one taxonomy', 'the CSV example is a current value',
    ['lcv', 'hcv', 'motorcycle'].includes(shared.csv) && shared.header === true,
    `example "${shared.csv}", column present in the template header`);

  reap();

  const bad = out.filter((r) => !r.ok);
  console.log('\nVehicle taxonomy and fuel-tank capacity\n');
  let last = null;
  for (const r of out) {
    if (r.group !== last) { console.log(`  ${r.group}`); last = r.group; }
    console.log(`    ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(46)} ${r.note}`);
  }
  console.log(`\n${out.length - bad.length} of ${out.length} checks pass.`);
  process.exit(bad.length ? 1 : 0);
})();
