#!/usr/bin/env node
'use strict';

/*
  Add Vehicle, against the story it is built from.

  tools/vehicle-taxonomy.js proves the category list and what a stored value
  reads as. This proves the things the Add Vehicle story asks for that are not
  about the taxonomy: an optional VIN that is still checked when it is typed,
  an odometer reading kept as the first row of a history, a make that is
  created by the save rather than by the click that named it, and a warning
  somebody can deliberately accept.

  Every check drives the real sheet in a real browser. Nothing here reads the
  source: a rule that is written but never reaches the screen is exactly the
  failure this is for.

  Run it:  node tools/add-vehicle.js
  Exits 0 when the story holds, 1 with a report.

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
    /* Every one, not only the visible ones. A hidden control is still a
       place for a stale answer to sit, and the field was removed rather than
       hidden, so the number to assert is zero elements. */
    config: s.querySelectorAll('[data-field="vehicleConfiguration"]').length
      + document.querySelectorAll('#f-config, #f-config-trigger').length
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

  /* Load once before asking anything: the first navigate races the stylesheet
     and the modules, and a sheet that has not been wired yet does not open. */
  await send('Page.navigate', { url: 'file://' + FILE + '?demo&v=0#directory' });
  await sleep(1800);

  /* A distinct query per visit. Navigating to a URL that differs only in its
     hash does not reload, so a second "open the sheet" would measure the
     first one. */
  const openAdd = async (v) => {
    await send('Page.navigate', { url: 'file://' + FILE + '?demo&v=' + v + '#directory' });
    await sleep(1700);
    await run(`document.querySelector('#screen-directory [data-open="vehicle:blank"]').click()`);
    await sleep(900);
    const open = await run(`[].filter.call(document.querySelectorAll('.focus-sheet'),
      function(x){return x.getBoundingClientRect().height>50;}).length`);
    if (!open) throw new Error('the Add vehicle sheet did not open on visit ' + v);
  };

  /* Typed and chosen the way a person does it: text into text fields, selects
     through their own value plus the events the engine listens for. */
  const FILL = `function(vals){
    var s=${SHEET};
    Object.keys(vals).forEach(function(f){
      var w=s.querySelector('[data-field="'+f+'"]');
      var c=w?w.querySelector('input,select,textarea'):null;
      if(!c) return;
      c.value=vals[f];
      c.dispatchEvent(new Event('input',{bubbles:true}));
      c.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }`;

  /* A closed sheet is the answer, not an error. Saving closes it, so a probe
     that assumes it is still there reads a successful save as a crash. */
  const VERDICT = `function(){
    var s=${SHEET};
    if(!s) return JSON.stringify({left:[], fieldErrors:[], open:false});
    var box=s.querySelector('[data-role="summary"]');
    var hidden=box.classList.contains('hidden');
    return JSON.stringify({
      left: hidden ? [] : [].map.call(box.querySelectorAll('li'),function(l){return l.textContent.trim();}),
      fieldErrors: [].map.call(s.querySelectorAll('.form-field .error'),
        function(e){return e.textContent.trim();}).filter(Boolean),
      open: !s.classList.contains('hidden')});
  }`;

  const COUNT = `document.querySelectorAll('#screen-directory tbody tr').length`;

  /* ── VIN is optional, and still checked ──────────────────────────────── */

  await openAdd(1);
  const before = await run(COUNT);
  await run(`(${FILL})({registration:'CA 111 001', make:'Toyota', model:'Hilux 2.4 GD-6',
    year:'2021', vehicleType:'lcv', fuelType:'Diesel', tankCapacity:'80'})`);
  await sleep(600);
  await run(`(function(){var s=${SHEET};s.querySelector('[data-role="submit"]').click();})()`);
  await sleep(700);
  const noVin = JSON.parse(await run(`(${VERDICT})()`));
  const after = await run(COUNT);
  check('vin', 'a vehicle saves with no VIN',
    noVin.left.length === 0 && noVin.fieldErrors.length === 0 && after === before + 1,
    noVin.left.length ? 'blocked by: ' + noVin.left.join('; ')
      : `directory went from ${before} rows to ${after}`);

  await openAdd(2);
  const vinLabel = await run(`(function(){var s=${SHEET};
    var l=s.querySelector('[data-field="vin"] label');
    return l?l.textContent.replace(/\s+/g,' ').trim():null;})()`);
  check('vin', 'the label says so, where somebody decides whether to answer',
    /optional/i.test(vinLabel || ''), `label reads "${vinLabel}"`);

  await run(`(${FILL})({vin:'AHTFR22G3OA123456'})`);
  await sleep(500);
  const badVin = JSON.parse(await run(`(function(){var s=${SHEET};
    var e=s.querySelector('[data-field="vin"] .error');
    return JSON.stringify({msg:e?e.textContent.trim():null});})()`));
  check('vin', 'an optional field is not an unchecked one',
    /I, O or Q/.test(badVin.msg || ''), badVin.msg || 'a VIN with an O in it was accepted');

  /* ── The odometer ────────────────────────────────────────────────────── */

  const odo = JSON.parse(await run(`(function(){var s=${SHEET};
    var w=s.querySelector('[data-field="odometer"]');
    if(!w) return JSON.stringify({exists:false});
    return JSON.stringify({exists:true,
      label:w.querySelector('label').textContent.replace(/\s+/g,' ').trim(),
      unit:(w.querySelector('.suffix')||{}).textContent,
      required:[].some.call(document.querySelectorAll('*'),function(){return false;})});})()`));
  check('odometer', 'it is asked for, in kilometres, and marked optional',
    odo.exists && /optional/i.test(odo.label) && (odo.unit || '').trim() === 'km',
    odo.exists ? `"${odo.label}" with the unit "${(odo.unit||'').trim()}"` : 'no odometer field');

  await openAdd(3);
  await run(`(${FILL})({registration:'CA 111 002', make:'Isuzu', model:'D-Max 250',
    year:'2020', vehicleType:'lcv', fuelType:'Diesel', tankCapacity:'76', odometer:'84500'})`);
  await sleep(600);
  await run(`(function(){var s=${SHEET};s.querySelector('[data-role="submit"]').click();})()`);
  await sleep(700);
  const seeded = JSON.parse(await run(`(function(){
    var VF=window.VehicleFixtures;
    var r=VF.VEHICLES.filter(function(x){return x[0]==='CA 111 002';})[0];
    if(!r) return JSON.stringify({found:false});
    var h=r[VF.F.ODO]||[];
    return JSON.stringify({found:true, rows:h.length, km:h.length?h[0].km:null,
      hasWhen:!!(h.length&&h[0].at), hasWho:!!(h.length&&h[0].by)});})()`));
  check('odometer', 'the first reading is the seed row of a history',
    seeded.found && seeded.rows === 1 && seeded.km === 84500 && seeded.hasWhen && seeded.hasWho,
    seeded.found ? `${seeded.rows} row holding ${seeded.km} km, with a time and a person`
      : 'the vehicle did not save');

  const noReading = JSON.parse(await run(`(function(){
    var VF=window.VehicleFixtures;
    var r=VF.VEHICLES.filter(function(x){return x[0]==='CA 111 001';})[0];
    return JSON.stringify({rows:(r&&r[VF.F.ODO]||[]).length});})()`));
  check('odometer', 'no reading means no history, not a history holding nothing',
    noReading.rows === 0,
    `the vehicle saved without one has ${noReading.rows} readings`);

  /* ── Years, counted rather than typed ─────────────────────────────── */

  const yrs = JSON.parse(await run(`(function(){
    var sel=document.getElementById('f-year');
    var vals=[].map.call(sel.options,function(o){return o.value;});
    return JSON.stringify({first:vals[0], newest:vals[1], oldest:vals[vals.length-1],
      count:vals.length, descending:vals.slice(1).every(function(v,i,a){
        return i===0 || Number(a[i-1])>Number(v);})});})()`));
  const thisYear = String(new Date().getFullYear());
  check('year', 'the list starts at the year it actually is',
    yrs.newest === thisYear,
    `newest selectable year is ${yrs.newest}, and it is ${thisYear}`);
  check('year', 'and counts down to the floor the CSV publishes',
    yrs.oldest === '2000' && yrs.descending && yrs.first === '',
    `${yrs.newest} → ${yrs.oldest}, ${yrs.count - 1} years, descending, behind a placeholder`);

  /* ── The reading has its own date ─────────────────────────────────── */

  await openAdd(4);
  const dated = JSON.parse(await run(`(function(){var s=${SHEET};
    var w=s.querySelector('[data-field="odometerDate"]');
    var i=document.getElementById('f-odo-date');
    return JSON.stringify({exists:!!w, type:i?i.type:null, value:i?i.value:null,
      label:w?w.querySelector('label').textContent.trim():null});})()`));
  const today = new Date().toISOString().slice(0, 10);
  check('odometer', 'the reading carries the day it was taken, defaulted to today',
    dated.exists && dated.type === 'date' && dated.value === today
      /* The sheet says every field is required unless marked otherwise, so a
         field that is not required has to say so. */
      && /optional/i.test(dated.label || ''),
    dated.exists ? `"${dated.label}" holding ${dated.value}` : 'no date field');

  await run(`(${FILL})({odometerDate:'2099-01-01'})`);
  await sleep(500);
  const future = await run(`(function(){var s=${SHEET};
    var e=s.querySelector('[data-field="odometerDate"] .error');
    return e?e.textContent.trim():null;})()`);
  check('odometer', 'a reading cannot have been taken tomorrow',
    /cannot be from the future/i.test(future || ''), future || 'a 2099 reading was accepted');

  /* ── Backwards, not big ───────────────────────────────────────────────
     No ceiling is asserted here on purpose. The first version of this file
     checked that 3 000 000 km was refused and 1 200 000 questioned, and both
     numbers were invented. What every fleet system actually enforces is that
     an odometer does not count down. */

  await openAdd(5);
  await run(`(${FILL})({odometer:'9000000'})`);
  await sleep(500);
  const huge = JSON.parse(await run(`(function(){var s=${SHEET};
    var w=s.querySelector('[data-field="odometer"]');
    return JSON.stringify({error:!!w.querySelector('.error'),
      advice:!!w.querySelector('.advice')});})()`));
  check('odometer', 'a large reading on its own is not an error',
    !huge.error && !huge.advice,
    huge.error ? 'refused for being large' : 'nothing invented about how far a vehicle goes');

  /* Saved and then reopened inside one page load. Navigating would reload the
     prototype, and the fleet lives in memory — a vehicle added on the last
     visit is not there on the next one. */
  await openAdd(6);
  await run(`(${FILL})({registration:'CA 111 004', make:'Ford', model:'Ranger 2.0 SiT',
    year:'2022', vehicleType:'lcv', fuelType:'Diesel', tankCapacity:'80', odometer:'84500'})`);
  await sleep(600);
  await run(`(function(){var s=${SHEET};s.querySelector('[data-role="submit"]').click();})()`);
  await sleep(900);
  await run(`(function(){
    var rows=[].filter.call(document.querySelectorAll('#screen-directory tbody tr'),
      function(r){return /CA 111 004/.test(r.textContent);});
    if(rows[0]) rows[0].click();})()`);
  await sleep(900);
  const restored = await run(`(function(){
    var i=document.getElementById('f-odo');
    return JSON.stringify({km:i.value, on:(document.getElementById('f-odo-date')||{}).value});})()`);
  check('odometer', 'reopening a record shows its latest reading and that reading\'s date',
    /"km":"84500"/.test(restored) && /"on":"\d{4}-\d{2}-\d{2}"/.test(restored),
    restored);

  await run(`(function(){
    var i=document.getElementById('f-odo');
    i.value='40000';
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await sleep(700);
  const lower = JSON.parse(await run(`(function(){
    var s=${SHEET};
    var w=s.querySelector('[data-field="odometer"]');
    var a=w.querySelector('.advice'), b=w.querySelector('.advice-accept');
    return JSON.stringify({advice:a?a.textContent.trim():null,
      button:b?b.textContent.trim():null, error:!!w.querySelector('.error')});})()`));
  check('odometer', 'a reading lower than the last one is questioned',
    !lower.error && /lower than the last reading/i.test(lower.advice || '')
      /* \s, not a literal space: en-ZA groups thousands with a non-breaking
         one, so "84 500" here is not the "84 500" a keyboard types. */
      && /84\s*500/.test(lower.advice || ''),
    lower.advice || 'going backwards passed without comment');

  check('odometer', 'and can still be recorded, because a cluster can be replaced',
    lower.button === 'Record it anyway', lower.button || 'no way to record it');

  /* ── Save as entered, on the capacity warning ─────────────────────────
     Driven from tank capacity now that the odometer has no band of its own.
     An LCV holding 8 litres is below the bottom of its warn range. */

  await openAdd(7);
  await run(`(${FILL})({vehicleType:'lcv', tankCapacity:'8'})`);
  await sleep(600);
  const warned = JSON.parse(await run(`(function(){var s=${SHEET};
    var w=s.querySelector('[data-field="tankCapacity"]');
    var a=w.querySelector('.advice'), b=w.querySelector('.advice-accept');
    return JSON.stringify({advice:a?a.textContent.trim():null,
      button:b?b.textContent.trim():null});})()`));
  check('warnings', 'the way out of a warning is on screen',
    warned.button === 'Save as entered',
    warned.button ? warned.advice.slice(0, 60) + '…' : 'no accept action rendered');

  const accepted = JSON.parse(await run(`(function(){var s=${SHEET};
    var w=s.querySelector('[data-field="tankCapacity"]');
    w.querySelector('.advice-accept').click();
    return JSON.stringify({after:!!w.querySelector('.advice')});})()`));
  check('warnings', 'accepting it puts it away',
    accepted.after === false, accepted.after ? 'the warning stayed' : 'the warning cleared');

  await run(`(${FILL})({tankCapacity:'8'})`);
  await sleep(400);
  const rechecked = await run(`(function(){var s=${SHEET};
    return !!s.querySelector('[data-field="tankCapacity"] .advice');})()`);
  check('warnings', 'and it does not come back for the value it was accepted for',
    rechecked === false, rechecked ? 'it asked again' : 'the same value passes quietly');

  await run(`(${FILL})({tankCapacity:'9'})`);
  await sleep(400);
  const changed = await run(`(function(){var s=${SHEET};
    return !!s.querySelector('[data-field="tankCapacity"] .advice');})()`);
  check('warnings', 'a different value is a different question',
    changed === true, changed ? 'asked again, which is right' : 'a new value passed unquestioned');

  /* ── A make is created by the save ───────────────────────────────────── */

  await openAdd(8);
  const typedMake = JSON.parse(await run(`(function(){
    var i=document.getElementById('f-make');
    i.focus(); i.value='Foton Motors';
    i.dispatchEvent(new Event('input',{bubbles:true}));
    var row=document.querySelector('#make-list .create');
    var offered=row?row.textContent.trim():null;
    if(row) row.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));
    return JSON.stringify({offered:offered, value:i.value});})()`));
  check('make', 'a value with no match is offered as something to create',
    /Create/.test(typedMake.offered || '') && /Foton Motors/.test(typedMake.offered || ''),
    typedMake.offered || 'no create row appeared');

  await sleep(300);
  await run(`(function(){var s=${SHEET};
    var c=s.querySelector('[data-close-form]'); if(c) c.click();})()`);
  await sleep(600);
  await run(`(function(){var d=document.querySelector('#discard-vehicle button[data-discard], #discard-vehicle .btn-danger, #discard-vehicle .btn-primary'); if(d) d.click();})()`);
  await sleep(600);

  await openAdd(9);
  const afterCancel = JSON.parse(await run(`(function(){
    var i=document.getElementById('f-make');
    i.focus(); i.value='Foton';
    i.dispatchEvent(new Event('input',{bubbles:true}));
    var rows=[].map.call(document.querySelectorAll('#make-list [data-make]'),
      function(o){return o.dataset.make;});
    return JSON.stringify({rows:rows});})()`));
  check('make', 'abandoning the form leaves no make behind',
    afterCancel.rows.indexOf('Foton Motors') < 0,
    afterCancel.rows.length ? 'the list offers: ' + afterCancel.rows.join(', ')
      : 'nothing named Foton is on the list');

  await openAdd(10);
  await run(`(function(){
    var i=document.getElementById('f-make');
    i.focus(); i.value='Foton Motors';
    i.dispatchEvent(new Event('input',{bubbles:true}));
    var row=document.querySelector('#make-list .create');
    if(row) row.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));})()`);
  await sleep(300);
  await run(`(${FILL})({registration:'CA 111 003', model:'Tunland G7', year:'2022',
    vehicleType:'lcv', fuelType:'Diesel', tankCapacity:'75'})`);
  await sleep(600);
  await run(`(function(){var s=${SHEET};s.querySelector('[data-role="submit"]').click();})()`);
  await sleep(800);
  const afterSave = JSON.parse(await run(`(function(){
    var VF=window.VehicleFixtures;
    var r=VF.VEHICLES.filter(function(x){return x[0]==='CA 111 003';})[0];
    return JSON.stringify({saved:!!r,
      make:r?r[VF.F.MAKE]:null, model:r?r[VF.F.MODEL]:null});})()`));
  check('make', 'a successful save is what creates it',
    afterSave.saved && afterSave.make === 'Foton Motors',
    afterSave.saved ? `stored make "${afterSave.make}"` : 'the vehicle did not save');

  /* ── Make and model are two fields ───────────────────────────────────── */

  check('record', 'make and model are stored apart',
    afterSave.make === 'Foton Motors' && afterSave.model === 'Tunland G7',
    `make "${afterSave.make}", model "${afterSave.model}"`);

  const split = JSON.parse(await run(`(function(){
    var VF=window.VehicleFixtures;
    var r=VF.VEHICLES.filter(function(x){return x[0]==='MHB 664 GP';})[0];
    return JSON.stringify({make:r[VF.F.MAKE], model:r[VF.F.MODEL],
      name:VF.vehicleName(r)});})()`));
  check('record', 'an existing vehicle reads the same way it always did',
    split.make === 'Volkswagen' && split.model === 'Transporter 2.0 TDI'
      && split.name === 'Volkswagen Transporter 2.0 TDI',
    `"${split.name}" from two fields`);

  const found = JSON.parse(await run(`(function(){
    var box=document.querySelector('#screen-directory .search');
    box.value='Foton'; box.dispatchEvent(new Event('input',{bubbles:true}));
    var rows=[].map.call(document.querySelectorAll('#screen-directory tbody tr'),
      function(t){return t.textContent;});
    box.value=''; box.dispatchEvent(new Event('input',{bubbles:true}));
    return JSON.stringify({hits:rows.filter(function(t){return /Foton/.test(t);}).length,
      total:rows.length});})()`));
  check('record', 'a fleet can find a vehicle by its make',
    found.hits >= 1 && found.total === found.hits,
    `searching "Foton" left ${found.total} rows, ${found.hits} of them Foton`);

  reap();

  const bad = out.filter((r) => !r.ok);
  console.log('\nAdd Vehicle, against the story it is built from\n');
  let last = null;
  for (const r of out) {
    if (r.group !== last) { console.log(`  ${r.group}`); last = r.group; }
    console.log(`    ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(52)} ${r.note}`);
  }
  console.log(`\n${out.length - bad.length} of ${out.length} checks pass.`);
  process.exit(bad.length ? 1 : 0);
})();
