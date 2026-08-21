#!/usr/bin/env node
'use strict';

/*
  The engine-capacity contract, enforced.

  Engine capacity was removed from both manual forms on 20 August 2026. The
  reasoning is in UX-CONTRACT.md; this file is what stops it coming back by
  accident, which it nearly did once already: two separate blocks of code were
  showing and hiding the field, they disagreed, and the second ended
  `!!code && !required && false`. That is never true, so whatever the first
  decided, the field stayed on screen for every vehicle type.

  A rule nobody checks is a preference. These are the twelve checks.

  Run it:  node tools/engine-capacity.js
  Exits 0 when the contract holds, 1 with a report of what broke.

  Three checks cannot be exercised, because the machinery they describe does
  not exist in this prototype: the vehicle record is a thirteen-slot array with
  no engine field, the import screens render fixtures rather than parsing a
  file, and there is no export. Those are reported as PENDING with the reason,
  not passed quietly. The day storage is added they become real, and the
  pending text is the instruction for whoever adds it.

  Needs Chrome. Set CHROME=/path/to/chrome to override the macOS default.
*/

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'tfn-fleet-portal.html');
const CONTRACT = path.join(ROOT, 'UX-CONTRACT.md');
const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* A port nobody else is on, and a Chrome that dies with us.

   Two of these tools used to hard-code a port. Run them while another is still
   up and the second Chrome cannot bind, stays alive anyway, and /json/list
   answers from the FIRST one: the probe then reads a page loaded before the
   edit it is meant to be checking. That is what left 66 stray Chromes behind
   and a placement check failing against a stale document for an afternoon.
   A free port each, and a kill on every exit path. */
const net = require('net');
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const pass = (n, note) => results.push({ n, ok: true, note });
const fail = (n, note) => results.push({ n, ok: false, note });
const pending = (n, note) => results.push({ n, pending: true, note });

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

/* The visible sheet, not the first one in the document. There are several
   .focus-sheet elements and only one of them is open. */
const SHEET = `[].filter.call(document.querySelectorAll('.focus-sheet'),` +
  `function(x){return x.getBoundingClientRect().height>50;})[0]`;

/* Every way the field could reappear: by data name, by id, by label text. */
const ABSENT = `(function(){
  var s = ${SHEET};
  if (!s) return JSON.stringify({err:'no sheet open'});
  var byName = s.querySelectorAll('[data-field="engineCc"]').length;
  var byId = s.querySelectorAll('#f-engine').length;
  var byLabel = [].filter.call(s.querySelectorAll('label,.label'), function(l){
    return /engine capacity/i.test(l.textContent||''); }).length;
  var bySuffix = [].filter.call(s.querySelectorAll('.suffix'), function(x){
    return (x.textContent||'').trim() === 'cc'; }).length;
  return JSON.stringify({byName:byName, byId:byId, byLabel:byLabel, bySuffix:bySuffix});
})()`;

(async () => {
  /* ---- 11 and 12 are read off disk, no browser needed ---------------- */
  const src = fs.readFileSync(FILE, 'utf8');

  const ghosts = [
    ['data-field="engineCc"', 'the form field'],
    ['f-engine', 'the element id'],
    ['engineCc:', 'the id-map entry'],
    ["'engineCc'", 'a field reference'],
    ['engineRequired', 'the taxonomy helper the form used to ask'],
  ].filter(([needle]) => src.includes(needle));

  /* The specific shape of the bug that hid the last regression: a visibility
     assignment ending in a constant that makes it unreachable. */
  const neverTrue = (src.match(/\.hidden\s*=[^;\n]*&&\s*(false|0)\s*;/g) || [])
    .concat(src.match(/\.hidden\s*=\s*(true|false)\s*&&/g) || []);

  if (ghosts.length) {
    fail(11, 'the removed field is referenced again: ' +
      ghosts.map(([n, w]) => `${w} (${n})`).join(', '));
  } else if (neverTrue.length) {
    fail(11, 'a visibility assignment can never fire: ' + neverTrue.join(' / '));
  } else {
    pass(11, 'no engineCc, no f-engine, no engineRequired, and no hidden-assignment ' +
      'that a constant makes unreachable');
  }

  const SENTENCE = 'Engine capacity is deferred from the UI until an implemented ' +
    'workflow consumes it, such as motorcycle licence compatibility.';
  if (!fs.existsSync(CONTRACT)) {
    fail(12, 'UX-CONTRACT.md is missing');
  } else {
    const text = fs.readFileSync(CONTRACT, 'utf8').replace(/\s+/g, ' ');
    text.includes(SENTENCE.replace(/\s+/g, ' '))
      ? pass(12, 'UX-CONTRACT.md carries the sentence verbatim')
      : fail(12, 'UX-CONTRACT.md does not carry the sentence verbatim');
  }

  /* ---- the rest need the page running ------------------------------- */
  const PORT = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-'));
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

  const evalIn = async (expr) => (await send('Runtime.evaluate',
    { expression: expr, returnByValue: true })).result.value;

  const openAdd = async () => {
    await send('Page.navigate', { url: 'file://' + FILE + '#directory' });
    await sleep(1500);
    await evalIn(`document.querySelector('#screen-directory [data-open="vehicle:blank"]').click()`);
    await sleep(800);
  };

  /* 1. Add vehicle never displays it. */
  await openAdd();
  let a = JSON.parse(await evalIn(ABSENT));
  (a.byName + a.byId + a.byLabel + a.bySuffix === 0)
    ? pass(1, 'Add vehicle: no field, no id, no label, no cc suffix')
    : fail(1, 'Add vehicle still shows it: ' + JSON.stringify(a));

  /* 3. No category reveals it. Every one, not only the four named, because a
        rule that only holds for the categories somebody thought to list is not
        a rule. */
  const codes = JSON.parse(await evalIn(
    `JSON.stringify(window.VehicleTypes ? VehicleTypes.csvValues() : [])`));
  const revealed = [];
  for (const code of codes) {
    await evalIn(`(function(){var s=${SHEET};var sel=s.querySelector('[data-field="vehicleType"] select');
      if(sel){sel.value='${code}';sel.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
    await sleep(120);
    const r = JSON.parse(await evalIn(ABSENT));
    if (r.byName + r.byId + r.byLabel + r.bySuffix > 0) revealed.push(code);
  }
  if (!codes.length) {
    fail(3, 'could not read the category list');
  } else if (revealed.length) {
    fail(3, 'revealed by: ' + revealed.join(', '));
  } else {
    pass(3, `none of the ${codes.length} categories reveal it, including bakkie, ` +
      'passenger_car, van, rigid_truck and tractor_unit');
  }

  /* 4. Absent from the required count and from the error summary. */
  await openAdd();
  await evalIn(`(function(){var s=${SHEET};s.querySelector('[data-role="submit"]').click();})()`);
  await sleep(800);
  const sum = JSON.parse(await evalIn(`(function(){
    var s=${SHEET}, box=s.querySelector('[data-role="summary"]');
    var items=[].map.call(box.querySelectorAll('li'),function(l){return l.textContent.trim();});
    var count=s.querySelector('[data-role="count"]');
    return JSON.stringify({items:items, count:count?count.textContent.trim():''});
  })()`));
  const mentions = sum.items.filter((t) => /engine/i.test(t));
  mentions.length
    ? fail(4, 'the summary asks for it: ' + mentions.join('; '))
    : pass(4, `${sum.items.length} problems listed, none of them engine capacity` +
        (sum.count ? ` (footer: "${sum.count}")` : ''));

  /* 2. Edit never requires it. Open a vehicle that already exists and save it
        back unchanged: if the field were required and absent, this refuses. */
  await send('Page.navigate', { url: 'file://' + FILE + '#directory' });
  await sleep(1400);
  const edited = await evalIn(`(function(){
    var row=document.querySelector('#screen-directory tbody tr');
    if(!row) return 'no row';
    row.click(); return 'opened';
  })()`);
  await sleep(900);
  if (edited !== 'opened') {
    fail(2, 'could not open a vehicle to edit: ' + edited);
  } else {
    const e = JSON.parse(await evalIn(ABSENT));
    if (e.err) {
      fail(2, e.err);
    } else if (e.byName + e.byId + e.byLabel + e.bySuffix > 0) {
      fail(2, 'Edit vehicle still shows it: ' + JSON.stringify(e));
    } else {
      const blocked = JSON.parse(await evalIn(`(function(){
        var s=${SHEET}; var b=s.querySelector('[data-role="submit"]');
        if(!b) return JSON.stringify({err:'no submit'});
        b.click();
        var box=s.querySelector('[data-role="summary"]');
        var items=box?[].map.call(box.querySelectorAll('li'),function(l){return l.textContent.trim();}):[];
        return JSON.stringify({items:items});
      })()`));
      const engineBlocked = (blocked.items || []).filter((t) => /engine/i.test(t));
      engineBlocked.length
        ? fail(2, 'saving an existing vehicle is blocked on it: ' + engineBlocked.join('; '))
        : pass(2, 'an existing vehicle opens and saves without it being asked for');
    }
  }

  /* 5. An older export still loads.
   *
   * The contract's promise is that a fleet's existing file is not refused for
   * carrying a column the product stopped reading. It used to be kept by
   * listing engine_capacity_cc in the schema, which also put it in the
   * published template, the example row and the column guide, a column nobody
   * fills in, explained on a page whose whole job is to be short.
   *
   * It is off the published contract now and recognised on the way in instead,
   * so the promise holds and the document does not carry it. The test follows:
   * it asks whether an older header is still understood, not whether it is
   * still advertised. */
  const col = JSON.parse(await evalIn(`(function(){
    if(!window.ImportSchema) return JSON.stringify({err:'no ImportSchema'});
    var S=ImportSchema;
    return JSON.stringify({
      published: S.header().split(',').indexOf('engine_capacity_cc') >= 0,
      recognised: typeof S.retired === 'function' ? S.retired('engine_capacity_cc') : null,
      notAColumn: !S.COLUMNS.some(function(x){return x.key==='engine_capacity_cc';})
    });})()`));
  if (col.err) fail(5, col.err);
  else if (col.recognised === true && col.published === false && col.notAColumn)
    pass(5, 'off the published template and still recognised on an older file');
  else fail(5, 'column contract broken: ' + JSON.stringify(col));

  /* 9 and 10. The two capacities are independent, and only one is required. */
  const cap = JSON.parse(await evalIn(`(function(){
    if(!window.Capacity) return JSON.stringify({err:'no Capacity service'});
    var base={tankCapacityLitres:'80', vehicleCategory:'bakkie', make:'Toyota', model:'Hilux'};
    var without=Capacity.tank(base);
    var withEngine=Capacity.tank(Object.assign({}, base, {engineDisplacementCc:'2393'}));
    var absurd=Capacity.tank(Object.assign({}, base, {engineDisplacementCc:'999999'}));
    var empty=Capacity.tank({vehicleCategory:'bakkie'});
    var text=Capacity.tank(Object.assign({}, base, {tankCapacityLitres:'eighty'}));
    return JSON.stringify({
      same: JSON.stringify(without)===JSON.stringify(withEngine),
      sameAbsurd: JSON.stringify(without)===JSON.stringify(absurd),
      emptyLevel: empty.level, emptyField: empty.field,
      textLevel: text.level,
      goodLevel: without.level || 'ok'
    });})()`));
  if (cap.err) { fail(9, cap.err); fail(10, cap.err); }
  else {
    (cap.same && cap.sameAbsurd)
      ? pass(9, 'tank verdict is byte-identical with no engine value, a correct one, and an absurd one')
      : fail(9, 'engine capacity changed the tank verdict: ' + JSON.stringify(cap));
    (cap.emptyLevel === 'error' && cap.emptyField === 'tankCapacity' && cap.textLevel === 'error')
      ? pass(10, 'tank capacity blocks when empty and when not a number, on its own inputs')
      : fail(10, 'tank capacity is not independently required: ' + JSON.stringify(cap));
  }

  /* 6, 7, 8. Nothing to exercise yet, and saying so is the point. */
  const store = JSON.parse(await evalIn(`(function(){
    var v = window.VehicleFixtures && VehicleFixtures.VEHICLES && VehicleFixtures.VEHICLES[0];
    return JSON.stringify({slots: v?v.length:null,
      hasParser: !!(window.ImportSchema && ImportSchema.parse),
      hasExport: !!(window.Records && (Records.toCsv || Records.exportCsv))});
  })()`));
  const why = `the vehicle record is a ${store.slots}-slot array with no engine field, ` +
    `ImportSchema has no parser (${store.hasParser}), and there is no export (${store.hasExport})`;
  pending(6, 'no storage to preserve a value in: ' + why);
  pending(7, 'no import and no export to round-trip through: ' + why);
  pending(8, 'nothing parses a supplied value, so nothing can reject or zero it: ' + why);

  reap();

  /* ---- report -------------------------------------------------------- */
  results.sort((x, y) => x.n - y.n);
  const bad = results.filter((r) => r.ok === false);
  const held = results.filter((r) => r.ok === true);
  const open = results.filter((r) => r.pending);

  console.log('\nEngine capacity contract\n');
  for (const r of results) {
    const tag = r.ok === false ? 'FAIL   ' : r.pending ? 'PENDING' : 'ok     ';
    console.log(`  ${tag} ${String(r.n).padStart(2)}. ${r.note}`);
  }
  console.log(`\n${held.length} held, ${bad.length} broken, ${open.length} pending.`);
  if (open.length) {
    console.log('\nPending checks describe machinery this prototype does not have.');
    console.log('They become real the day a vehicle record can carry an engine value.');
  }
  process.exit(bad.length ? 1 : 0);
})();
