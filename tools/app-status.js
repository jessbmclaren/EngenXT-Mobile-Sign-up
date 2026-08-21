#!/usr/bin/env node
'use strict';

/*
  The app invitation, and the line it is not allowed to cross.

  A driver's row now carries three statuses where it carried two, and the new
  one is the only status in this product that a manager cannot set. That is
  the whole design and it is the easiest thing in the file to lose: every
  status control here is a picker, the pickers all look alike, and the next
  person to add "one more option" to the App status menu will be adding a way
  to lie about somebody else's phone.

  So this drives the real table and holds these promises:

    the six statuses exist, and the column shows them;
    no route anywhere sets Invite sent or Active by hand;
    each status opens the actions that belong to it and no others;
    the menu is a menu, not a picker: no ticks, no values to choose;
    app status and driver access are two fields, and leaving the company
      writes both while nothing writes app status on its own;
    the reason beside a status is typed rather than picked, survives being
      typed with a bracket in it, and still gates the confirmation;
    no dropdown in a form field opens across the line of text beneath it;
    a record you only looked at closes without being asked to discard it,
      and the confirmation that does appear knows an add from an edit.

  The second one is the point. It is checked by opening every menu on every
  status and reading what is offered, rather than by grepping for a string,
  because a rule that is written down and still reachable through the UI is
  the failure this exists for.

  Run it:  node tools/app-status.js
  Exits 0 when the promises hold, 1 with a report.

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

const STATUSES = ['Not invited', 'Invite sending', 'Invite sent', 'Active',
  'Invite failed', 'Deactivated'];

/* What each status is allowed to offer. Written here rather than read off the
   page, because a checker that asks the page what it should do agrees with
   the page by construction. */
const OFFERS = {
  /* The number is what decides whether the message lands, and this is the
     last moment before it goes, so checking it is offered here rather than
     only after a bounce. */
  'Not invited': ['Send invitation', 'Edit mobile number', 'View driver'],
  'Invite sending': ['View driver'],
  'Invite sent': ['Resend invitation', 'Copy invitation link', 'View driver'],
  'Active': ['View driver'],
  'Invite failed': ['Review mobile number', 'Resend invitation', 'View driver'],
  'Deactivated': ['View driver', 'Reactivate driver'],
};

/* The facts each status has to state before it offers anything. A menu that
   opens on "Invite sent" and does not say which number or when has answered
   the easy half of the question. */
const STATES = {
  'Invite sent': ['Sent to', 'Sent at'],
  'Active': ['Set up'],
  'Invite failed': ['Why', 'Tried', 'Number'],
};

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

/* The row for a given app status, by reading the pill rather than by index:
   the table sorts by name and a fixture edit would silently move every
   index-based probe onto the wrong driver. */
const ROW_WITH = (status) => `(function(){
  var pills = document.querySelectorAll('#screen-drivers-directory tbody [data-pill="app"]');
  for (var i = 0; i < pills.length; i++) {
    if (pills[i].textContent.trim() === ${JSON.stringify(status)}) {
      return pills[i].closest('tr').getAttribute('data-row');
    }
  }
  return null;
})()`;

const READ_MENU = `(function(){
  var pop = document.querySelector('.status-pop:not(.hidden)');
  if (!pop) return JSON.stringify({ open: false });
  return JSON.stringify({
    open: true,
    role: pop.getAttribute('role'),
    head: (pop.querySelector('.pick-head') || {}).textContent || '',
    /* Only the pressable ones. A pick-current row is a statement and carries
       no data-pick, which is exactly the distinction being asserted. */
    actions: [].map.call(pop.querySelectorAll('[data-pick] .pick-label'),
      function(x){ return x.textContent.trim(); }),
    /* A tick means "this is the value you have", which is picker vocabulary.
       There should be none in an action menu. */
    ticks: pop.querySelectorAll('.pick-tick').length,
    current: pop.querySelectorAll('.pick-current').length,
    facts: [].map.call(pop.querySelectorAll('.pick-facts dt'),
      function(x){ return x.textContent.trim(); }),
    values: [].map.call(pop.querySelectorAll('.pick-facts dd'),
      function(x){ return x.textContent.trim(); })
  });
})()`;

(async () => {
  const PORT = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'appstatus-'));
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

  let visit = 0;
  const load = async () => {
    await send('Page.navigate', { url: `file://${FILE}?demo&v=${++visit}#drivers-directory` });
    await sleep(1700);
  };
  await load();

  /* ── The column ───────────────────────────────────────────────────────── */

  const cols = JSON.parse(await run(`JSON.stringify(
    [].filter.call(document.querySelectorAll('#screen-drivers-directory thead th'),
      function(th){ return !th.classList.contains('hidden'); })
     .map(function(th){ return th.textContent.trim().replace(/[↑↓]\\s*$/,'').trim(); }))`));

  const WANT = ['Driver', 'Mobile number', 'Branch or department',
    'Assigned vehicle', 'App status', 'Driver access'];
  const missing = WANT.filter(w => !cols.includes(w));
  check('columns', 'the six asked-for columns are on by default',
    missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : cols.filter(Boolean).join(' | '));

  /* Actions is the unlabelled last column; it is asserted by the presence of
     a row menu rather than by a header nobody should be reading aloud. */
  const acts = await run(`document.querySelectorAll(
    '#screen-drivers-directory tbody tr .row-more').length`);
  const rows = await run(`document.querySelectorAll(
    '#screen-drivers-directory tbody tr[data-row]').length`);
  check('columns', 'every row carries its actions',
    acts === rows && rows > 0, `${acts} menus over ${rows} rows`);

  /* ── The statuses ─────────────────────────────────────────────────────── */

  const vocab = JSON.parse(await run(`JSON.stringify(window.__appStatuses || null)`));
  check('statuses', 'the six statuses are the six named',
    !!vocab && STATUSES.every((s, i) => vocab[i] === s) && vocab.length === 6,
    vocab ? vocab.join(' · ') : 'window.__appStatuses is not exported');

  const onScreen = JSON.parse(await run(`JSON.stringify(
    [].map.call(document.querySelectorAll('#screen-drivers-directory tbody [data-pill="app"]'),
      function(x){ return x.textContent.trim(); }))`));
  const unseen = STATUSES.filter(s => !onScreen.includes(s));
  check('statuses', 'every status is reachable on the list',
    unseen.length === 0,
    unseen.length ? `never drawn: ${unseen.join(', ')}` : `all six in ${onScreen.length} rows`);

  /* A tone per status, and Active plain. Read off what actually *paints*,
     not off the class name.
     
     The class-name version of this check passed while "Invite sending" was
     rendering as bare text with a caret: `.status-pill` restates the tones it
     needs because it sets a ground of its own later in the cascade, and
     `badge-quiet` had been left out of that list. The class was on the
     element and meant nothing. So this compares what the browser computed. */
  const tones = JSON.parse(await run(`JSON.stringify(
    [].map.call(document.querySelectorAll('#screen-drivers-directory tbody [data-pill="app"]'),
      function(x){ var cs = getComputedStyle(x);
        return [x.textContent.trim(), {
          cls: (x.className.match(/badge-[a-z]+/) || ['plain'])[0],
          ink: cs.color, ground: cs.backgroundColor, edge: cs.borderTopColor,
          bordered: parseFloat(cs.borderTopWidth) > 0
        }]; }))`));
  const byStatus = Object.fromEntries(tones);
  check('statuses', 'Active is the plain one',
    byStatus['Active'].cls === 'plain' &&
    byStatus['Invite failed'].cls === 'badge-danger' &&
    byStatus['Invite sent'].cls === 'badge-info',
    STATUSES.map(s => `${s}=${(byStatus[s] || {}).cls || '?'}`).join(' '));

  /* Every toned status has to look different from the plain one. Two pills
     that compute to the same ink on the same ground are one pill wearing two
     names, whatever their classes say. */
  const plain = byStatus['Active'];
  const same = STATUSES.filter(st => st !== 'Active' && byStatus[st]
    && byStatus[st].ink === plain.ink
    && byStatus[st].ground === plain.ground
    && byStatus[st].edge === plain.edge);
  check('statuses', 'every tone paints differently from plain',
    same.length === 0,
    same.length ? `${same.join(', ')} render exactly as Active does`
      : `five tones, five different paints`);

  /* ── Nothing sets Invite sent or Active by hand ───────────────────────── */

  /* Declared, and then proved against every menu below. Both halves matter:
     the flag is what a future reader sees, the sweep is what stops the flag
     from becoming a comment that used to be true. */
  const settable = JSON.parse(await run(`JSON.stringify(window.__appSettable || null)`));
  check('nobody sets it', 'no status is declared settable',
    Array.isArray(settable) && settable.length === 0,
    settable ? (settable.length ? `settable: ${settable.join(', ')}` : 'none of the six') : 'not exported');

  /* ── Every menu, on every status ──────────────────────────────────────── */

  const menus = {};
  for (const status of STATUSES) {
    await load();
    const key = await run(ROW_WITH(status));
    if (!key) { menus[status] = { open: false, why: 'no row in that state' }; continue; }
    await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(key)}) + '"] [data-pill="app"]').click()`);
    await sleep(420);
    menus[status] = JSON.parse(await run(READ_MENU));
  }

  const shut = STATUSES.filter(s => !menus[s].open);
  check('the menu', 'the badge opens a menu on every status',
    shut.length === 0,
    shut.length ? shut.map(s => `${s}: ${menus[s].why || 'did not open'}`).join('; ')
      : 'six statuses, six menus');

  const wrongRole = STATUSES.filter(s => menus[s].open && menus[s].role !== 'menu');
  check('the menu', 'it is a menu, not a listbox',
    wrongRole.length === 0,
    wrongRole.length ? wrongRole.join(', ') : 'role="menu" on all six');

  const ticked = STATUSES.filter(s => menus[s].open && menus[s].ticks > 0);
  check('the menu', 'nothing in it is drawn as a chosen value',
    ticked.length === 0,
    ticked.length ? `ticks on: ${ticked.join(', ')}`
      : 'no tick marks anywhere: it offers actions, not values');

  const offerWrong = [];
  for (const s of STATUSES) {
    if (!menus[s].open) continue;
    const got = menus[s].actions;
    const want = OFFERS[s];
    if (got.length !== want.length || want.some((w, i) => got[i] !== w)) {
      offerWrong.push(`${s}: [${got.join(', ')}]`);
    }
  }
  check('the menu', 'each status offers what belongs to it, in order',
    offerWrong.length === 0,
    offerWrong.length ? offerWrong.join(' | ')
      : STATUSES.map(s => `${s}:${OFFERS[s].length}`).join(' '));

  /* The one that matters most, stated as its own check so a failure names
     itself rather than hiding inside "offers what belongs to it". */
  const BANNED = /^(mark as |set )?(invite sent|active)$/i;
  const lies = [];
  for (const s of STATUSES) {
    (menus[s].actions || []).forEach(a => { if (BANNED.test(a)) lies.push(`${s} → ${a}`); });
  }
  check('nobody sets it', 'no menu offers Invite sent or Active',
    lies.length === 0,
    lies.length ? lies.join(', ')
      : 'none of the six menus offers a way to assert either');

  const factsWrong = [];
  for (const [s, want] of Object.entries(STATES)) {
    if (!menus[s].open) { factsWrong.push(`${s}: no menu`); continue; }
    const got = menus[s].facts;
    if (want.some(w => !got.includes(w))) factsWrong.push(`${s}: [${got.join(', ')}]`);
    /* A term with nothing beside it is a row that reserved space for an
       answer and did not bring one. */
    if (menus[s].values.some(v => !v)) factsWrong.push(`${s}: an empty value`);
  }
  check('the menu', 'it states what it knows before offering what to do',
    factsWrong.length === 0,
    factsWrong.length ? factsWrong.join(' | ')
      : 'sent-to and sent-at, set-up date, and the failure reason');

  /* The number the invitation went to is the number on the record, not a
     number the menu made up. */
  await load();
  const sentKey = await run(ROW_WITH('Invite sent'));
  const agrees = await run(`(function(){
    var tr = document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(sentKey)}) + '"]');
    var cells = tr.querySelectorAll('td');
    return cells[2].textContent.trim();
  })()`);
  const inMenu = (menus['Invite sent'].values || [])[0];
  check('the menu', 'the number it names is the number on the row',
    !!inMenu && inMenu === agrees, `row ${agrees} · menu ${inMenu}`);

  /* ── Two fields, and one drives the other ────────────────────────────── */

  await load();
  const before = JSON.parse(await run(`JSON.stringify((function(){
    var d = window.DriverFixtures.DRIVERS.filter(function(p){ return p.access === 'Left'; })[0];
    return d ? { access: d.access, app: d.app } : null;
  })())`));
  check('two fields', 'leaving the company deactivates the app',
    !!before && before.access === 'Left' && before.app === 'Deactivated',
    before ? `access ${before.access} · app ${before.app}` : 'no departed driver in the fixtures');

  const split = JSON.parse(await run(`JSON.stringify((function(){
    var D = window.DriverFixtures.DRIVERS;
    return {
      /* On the fleet with no working app: the combination the single field
         could not express, and the reason for the split. */
      onFleetNoApp: D.filter(function(d){
        return d.access === 'On the fleet' && d.app !== 'Active'; }).length,
      /* No driver-access value may be a word the app status also uses. */
      collide: D.map(function(d){ return d.access; })
        .filter(function(v, i, a){ return a.indexOf(v) === i; })
        .filter(function(v){ return ${JSON.stringify(STATUSES)}.indexOf(v) >= 0; })
    };
  })())`));
  check('two fields', 'the two vocabularies share no word',
    split.collide.length === 0,
    split.collide.length ? `both fields use: ${split.collide.join(', ')}`
      : 'driver access and app status name different things differently');
  check('two fields', 'a driver can be on the fleet without the app',
    split.onFleetNoApp > 0,
    `${split.onFleetNoApp} such driver(s). The combination one field could not hold`);

  /* Reactivating goes back to what the app was, not to a fresh invitation. */
  await load();
  const leftKey = await run(`(function(){
    var D = window.DriverFixtures.DRIVERS;
    var d = D.filter(function(p){ return p.access === 'Left' && p.appWas === 'Active'; })[0];
    return d ? (d.idNumber || d.passportNumber) : null;
  })()`);
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(leftKey)}) + '"] [data-pill="app"]').click()`);
  await sleep(400);
  await run(`(function(){
    var pop = document.querySelector('.status-pop:not(.hidden)');
    var btns = [].filter.call(pop.querySelectorAll('[data-pick]'), function(b){
      return /Reactivate/.test(b.textContent); });
    btns[0].click();
  })()`);
  await sleep(500);
  const after = JSON.parse(await run(`JSON.stringify((function(){
    var D = window.DriverFixtures.DRIVERS;
    var d = D.filter(function(p){ return (p.idNumber || p.passportNumber) === ${JSON.stringify(leftKey)}; })[0];
    return { access: d.access, app: d.app };
  })())`));
  check('two fields', 'coming back does not re-invite a phone that has the app',
    after.access === 'On the fleet' && after.app === 'Active',
    `access ${after.access} · app ${after.app}`);

  /* ── Sending one, start to finish ─────────────────────────────────────── */

  await load();
  const freshKey = await run(ROW_WITH('Not invited'));
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(freshKey)}) + '"] [data-pill="app"]').click()`);
  await sleep(400);
  await run(`(function(){
    var pop = document.querySelector('.status-pop:not(.hidden)');
    [].filter.call(pop.querySelectorAll('[data-pick]'), function(b){
      return /Send invitation/.test(b.textContent); })[0].click();
  })()`);
  /* A WhatsApp message to a personal phone asks once before it goes. */
  await sleep(600);
  await run(`document.querySelector('[data-role="cf-go"]').click()`);
  await sleep(300);
  const midway = await run(`(function(){
    var tr = document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(freshKey)}) + '"]');
    return tr.querySelector('[data-pill="app"]').textContent.trim();
  })()`);
  await sleep(1600);
  const landed = JSON.parse(await run(`JSON.stringify((function(){
    var tr = document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(freshKey)}) + '"]');
    var d = window.DriverFixtures.DRIVERS.filter(function(p){
      return (p.idNumber || p.passportNumber) === ${JSON.stringify(freshKey)}; })[0];
    return { pill: tr.querySelector('[data-pill="app"]').textContent.trim(),
             at: d.appAt, logged: (d.notes||[]).filter(function(n){
               return n.field === 'App status'; }).length };
  })())`));
  check('sending', 'the row shows the message in flight before it lands',
    midway === 'Invite sending', `showed "${midway}" while sending`);
  check('sending', 'delivery moves it on by itself, and is written down',
    landed.pill === 'Invite sent' && !!landed.at && landed.logged > 0,
    `${landed.pill}, stamped ${landed.at || 'never'}, ${landed.logged} log entry`);

  /* A number that cannot receive it fails rather than silently succeeding. */
  await load();
  const badKey = await run(`(function(){
    var d = window.DriverFixtures.DRIVERS.filter(function(p){
      return /^079 333/.test(p.mobile || ''); })[0];
    return d ? (d.idNumber || d.passportNumber) : null;
  })()`);
  await run(`(function(){
    var d = window.DriverFixtures.DRIVERS.filter(function(p){
      return (p.idNumber || p.passportNumber) === ${JSON.stringify(badKey)}; })[0];
    d.app = 'Not invited';
  })()`);
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(badKey)}) + '"] [data-pill="app"]').click()`);
  await sleep(120);
  await run(`window.__drivers ? window.__drivers.render() : 0`);
  await sleep(200);
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(badKey)}) + '"] [data-pill="app"]').click()`);
  await sleep(400);
  await run(`(function(){
    var pop = document.querySelector('.status-pop:not(.hidden)');
    [].filter.call(pop.querySelectorAll('[data-pick]'), function(b){
      return /Send invitation/.test(b.textContent); })[0].click();
  })()`);
  await sleep(600);
  await run(`document.querySelector('[data-role="cf-go"]').click()`);
  await sleep(1800);
  const bounced = JSON.parse(await run(`JSON.stringify((function(){
    var d = window.DriverFixtures.DRIVERS.filter(function(p){
      return (p.idNumber || p.passportNumber) === ${JSON.stringify(badKey)}; })[0];
    return { app: d.app, why: d.appWhy };
  })())`));
  check('sending', 'a message that cannot arrive says so',
    bounced.app === 'Invite failed' && !!bounced.why,
    `${bounced.app}, ${bounced.why || 'no reason given'}`);

  /* ── The tab that hides its own evidence ─────────────────────────────── */

  await load();
  await run(`document.querySelector('#drivers-tab-attention').click()`);
  await sleep(400);
  const attentionCols = JSON.parse(await run(`JSON.stringify(
    [].filter.call(document.querySelectorAll('#screen-drivers-directory thead th'),
      function(th){ return !th.classList.contains('hidden'); })
     .map(function(th){ return th.textContent.trim().replace(/[↑↓]\\s*$/,'').trim(); }))`));
  await run(`document.querySelector('#drivers-tab-all').click()`);
  await sleep(400);
  const backCols = JSON.parse(await run(`JSON.stringify(
    [].filter.call(document.querySelectorAll('#screen-drivers-directory thead th'),
      function(th){ return !th.classList.contains('hidden'); })
     .map(function(th){ return th.textContent.trim().replace(/[↑↓]\\s*$/,'').trim(); }))`));
  check('columns', 'Needs attention shows the dates it is about',
    attentionCols.includes('Licence expiry') && attentionCols.includes('PrDP expiry')
      && !backCols.includes('Licence expiry'),
    `on the tab: ${attentionCols.includes('Licence expiry') ? 'shown' : 'HIDDEN'}; back on All: ${backCols.includes('Licence expiry') ? 'still shown' : 'hidden again'}`);

  /* ── Nothing left over from the old single field ─────────────────────── */

  const ghost = JSON.parse(await run(`JSON.stringify((function(){
    var body = document.body.innerText;
    return {
      /* The old conflated value, and the manual control that set it. */
      invited: /\\bInvited\\b/.test(body),
      byHand: /They have the app/.test(body),
      stale: window.DriverFixtures.DRIVERS.filter(function(d){
        return d.lifecycle !== undefined; }).length
    };
  })())`));
  check('nobody sets it', 'the field that mixed the two is gone',
    !ghost.invited && !ghost.byHand && ghost.stale === 0,
    [ghost.invited ? '"Invited" still rendered' : null,
     ghost.byHand ? '"They have the app" still offered' : null,
     ghost.stale ? `${ghost.stale} record(s) still carry lifecycle` : null]
      .filter(Boolean).join('; ') || 'no Invited, no manual accept, no lifecycle field');

  /* ── The reason is typed, not picked ─────────────────────────────────── */

  /* Presets were removed because the categories are not agreed yet. The
     failure this guards is somebody adding "just a few common ones" back:
     a preset writes a guess into every record before anybody can correct it,
     and there is no migration from "Something else" to what was meant. */
  await load();
  const whyKey = await run(`(function(){
    var d = window.DriverFixtures.DRIVERS.filter(function(p){
      return p.fuel === 'Cannot fuel'; })[0];
    return d ? (d.idNumber || d.passportNumber) : null;
  })()`);
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(whyKey)}) + '"] .status-why').click()`);
  await sleep(420);
  const box = JSON.parse(await run(`JSON.stringify((function(){
    var p = document.querySelector('.reason-pop:not(.hidden)');
    if (!p) return { open: false };
    var ta = p.querySelector('.reason-text');
    return { open: true, head: p.querySelector('.pick-head').textContent.trim(),
      typed: !!ta, focused: document.activeElement === ta,
      prefilled: ta.value, placeholder: ta.placeholder,
      /* Any of these means a list came back. */
      choices: p.querySelectorAll('input[type=radio], [data-pick], option').length };
  })())`));
  check('the reason', 'it is a box somebody types in, not a list',
    box.open && box.typed && box.choices === 0 && box.focused,
    box.open ? `"${box.head}": ${box.choices} choice(s), focused ${box.focused}`
      : 'the popover did not open');
  check('the reason', 'it opens holding what is already there',
    box.prefilled !== '' && !!box.placeholder,
    `value "${box.prefilled}", prompt "${box.placeholder}"`);

  /* Free text reaches the row through innerHTML. It did not need escaping
     while it came off a fixed list; it does now, and a bracket in a sentence
     somebody wrote is the cheapest possible way to find that out. */
  await run(`(function(){
    var ta = document.querySelector('.reason-pop .reason-text');
    ta.value = 'Off sick <b>until</b> the "24th" & back';
    document.querySelector('.reason-pop [data-role="reason-save"]').click();
  })()`);
  await sleep(450);
  const wrote = JSON.parse(await run(`JSON.stringify((function(){
    var tr = document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(whyKey)}) + '"]');
    var b = tr.querySelector('.status-why');
    var d = window.DriverFixtures.DRIVERS.filter(function(p){
      return (p.idNumber || p.passportNumber) === ${JSON.stringify(whyKey)}; })[0];
    return { onRow: b.textContent.trim(), stored: d.reason,
             injected: tr.querySelectorAll('b').length,
             logged: (d.notes||[]).filter(function(n){ return n.kind === 'reason'; }).length };
  })())`));
  const SAID = 'Off sick <b>until</b> the "24th" & back';
  check('the reason', 'what was typed is what is stored and shown',
    wrote.stored === SAID && wrote.onRow === SAID && wrote.logged > 0,
    `stored and drawn identically, ${wrote.logged} log entry`);
  check('the reason', 'markup in it stays text',
    wrote.injected === 0,
    wrote.injected ? `${wrote.injected} tag(s) injected into the row` : 'no tags reached the DOM');

  /* The confirmation still asks before it acts. It used to gate on a radio;
     it gates on typed text now, and dropping the gate along with the list
     would have been the easy way to make this pass. */
  await load();
  const leaveKey = await run(`(function(){
    var d = window.DriverFixtures.DRIVERS.filter(function(p){
      return p.access === 'On the fleet'; })[0];
    return d ? (d.idNumber || d.passportNumber) : null;
  })()`);
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(leaveKey)}) + '"] .row-more').click()`);
  await sleep(350);
  await run(`(function(){
    [].filter.call(document.querySelectorAll('.pop:not(.hidden) button'), function(b){
      return /Mark as left/.test(b.textContent); })[0].click();
  })()`);
  await sleep(500);
  const gate = JSON.parse(await run(`JSON.stringify((function(){
    var go = document.querySelector('[data-role="cf-go"]');
    var ta = document.querySelector('#cf-left');
    if (!ta) return { field: false };
    var blank = go.disabled;
    ta.value = 'Resigned, last day was Friday';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return { field: true, blocksBlank: blank, allowsTyped: !go.disabled,
             choices: document.querySelectorAll('#status-dialog input[type=radio]').length };
  })())`));
  check('the reason', 'the confirmation still asks, and now asks for words',
    gate.field && gate.blocksBlank && gate.allowsTyped && gate.choices === 0,
    gate.field ? `blank blocks: ${gate.blocksBlank}, typed passes: ${gate.allowsTyped}, ${gate.choices} radio(s)`
      : 'no text field in the dialog');

  /* ── A popup may not slice the text under it ─────────────────────────── */

  /* A select in a form field opened eight pixels below its own button, which
     put its top edge halfway down the help line, the top half of the
     sentence readable and the bottom half behind a panel. Half-covered text
     does not read as a panel over a sentence, it reads as a fault. */
  await load();
  await run(`document.querySelector('#screen-drivers-directory [data-open="driver:blank"]').click()`);
  await sleep(900);
  const sliced = [];
  const fields = JSON.parse(await run(`JSON.stringify([].map.call(
    document.querySelectorAll('.focus-sheet [data-field] .select-trigger'),
    function(t){ return t.closest('[data-field]').getAttribute('data-field'); }))`));
  for (const f of fields) {
    await run(`document.querySelector('[data-field="${f}"] .select-trigger').scrollIntoView({block:'center'})`);
    await sleep(200);
    await run(`document.querySelector('[data-field="${f}"] .select-trigger').click()`);
    await sleep(320);
    const cut = await run(`(function(){
      var fd = document.querySelector('[data-field="${f}"]');
      var pop = fd.querySelector('.select-list');
      if (!pop || pop.classList.contains('hidden')) return 0;
      var p = pop.getBoundingClientRect();
      return [].filter.call(fd.querySelectorAll('label, .help'), function(el){
        var r = el.getBoundingClientRect();
        var over = Math.min(p.bottom, r.bottom) - Math.max(p.top, r.top);
        return over > 0.5 && over < r.height - 0.5;
      }).length;
    })()`);
    if (cut) sliced.push(`${f}: ${cut}`);
    await run(`document.body.click()`);
    await sleep(120);
  }
  check('the popover', 'no dropdown cuts a line of its own field in half',
    sliced.length === 0,
    sliced.length ? sliced.join(', ') : `${fields.length} selects, none slicing a label or help line`);

  /* ── Closing a record you only looked at ─────────────────────────────── */

  /* The sheet's dirty check used to mean "any field has something in it",
     which is only the same as "somebody changed something" on a blank Add
     form. The one form it was written against. Opening an existing driver
     fills every field from the record, so the sheet was dirty the moment it
     appeared, and closing it asked "Discard entered details?" about details
     nobody had entered. That is precisely the confirmation-you-learn-to-
     click-through that the code comment there exists to prevent. */
  await load();
  await run(`document.querySelector('#screen-drivers-directory tbody tr[data-row] .rec').click()`);
  await sleep(1000);
  const opened = await run(`window.__openSheet && window.__openSheet().isDirty()`);
  check('closing a record', 'an untouched record is not dirty',
    opened === false, `isDirty() = ${opened}`);

  await run(`(function(){ var f = document.getElementById('d-first');
    f.value = f.value + 'x'; f.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await sleep(300);
  const touchedIt = await run(`window.__openSheet().isDirty()`);
  await run(`(function(){ var f = document.getElementById('d-first');
    f.value = f.value.slice(0, -1); f.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await sleep(300);
  const reverted = await run(`window.__openSheet().isDirty()`);
  check('closing a record', 'a change makes it dirty, undoing the change clears it',
    touchedIt === true && reverted === false,
    `typed: ${touchedIt}, reverted: ${reverted}`);

  /* And the confirmation, when it does appear, has to describe the thing it
     is about. "The driver will not be added" over an edit is a sentence about
     a driver who has been on the fleet for a year. */
  const copy = {};
  for (const [kind, opener, seed] of [
      ['add', '[data-open="driver:blank"]', 'Zz'],
      ['edit', 'tbody tr[data-row] .rec', 'x']]) {
    await load();
    await run(`document.querySelector('#screen-drivers-directory ${opener}').click()`);
    await sleep(1000);
    await run(`(function(){ var f = document.getElementById('d-first');
      f.value = (f.value || '') + ${JSON.stringify(seed)};
      f.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(300);
    await run(`(function(){ var s = window.__openSheet(); if (s.isDirty()) s.tryClose(); })()`);
    await sleep(500);
    copy[kind] = await run(`(function(){ var d = document.getElementById('discard-driver');
      return d.classList.contains('hidden') ? null : (d.innerText || '').split(String.fromCharCode(10)).join(' ').trim();
    })()`);
  }
  check('closing a record', 'the confirmation knows an add from an edit',
    !!copy.add && !!copy.edit && /will not be added/.test(copy.add)
      && /stays as they were/.test(copy.edit) && copy.add !== copy.edit,
    copy.add && copy.edit
      ? `add: "${copy.add.slice(0, 34)}…" edit: "${copy.edit.slice(0, 34)}…"`
      : `add: ${copy.add} / edit: ${copy.edit}`);

  /* ── Inviting later ──────────────────────────────────────────────────── */

  /* The invitation used to live inside the Add button's label and nowhere
     else, so the only way to learn that saving a driver messages their
     personal phone was to read the button, and a manager entering twelve
     drivers on a Tuesday to invite on Friday could not say so. */
  await load();
  await run(`document.querySelector('#screen-drivers-directory [data-open="driver:blank"]').click()`);
  await sleep(1000);
  const sheet = JSON.parse(await run(`JSON.stringify((function(){
    var w = document.querySelector('#driver-drawer [data-field="invite"]');
    if (!w) return { missing: true };
    var head = [].filter.call(document.querySelectorAll('#driver-drawer .sheet-section__title'),
      function(x){ return /invitation/i.test(x.textContent); })[0];
    return {
      shown: w.checkVisibility(),
      heading: head ? head.textContent.trim() : null,
      options: [].map.call(w.querySelectorAll('label'), function(l){
        return { title: (l.querySelector('.seg-title')||{}).textContent.trim(),
                 says: (l.querySelector('.seg-says')||{}).textContent.trim(),
                 checked: l.querySelector('input').checked }; }),
      button: document.querySelector('#driver-drawer [data-role="submit"]').textContent.trim()
    };})())`));
  check('inviting later', 'the sheet asks when to invite',
    !sheet.missing && sheet.shown && sheet.heading === 'EngenXT app invitation',
    sheet.missing ? 'no invite field on the sheet' : sheet.heading);
  check('inviting later', 'two options, and the words are the agreed words',
    sheet.options && sheet.options.length === 2
      && sheet.options[0].title === 'Send invitation now'
      && sheet.options[1].title === 'Invite later'
      && /WhatsApp message with a link to download and activate the EngenXT app/.test(sheet.options[0].says)
      && /send the invitation from the Drivers table when you/.test(sheet.options[1].says),
    (sheet.options || []).map(o => o.title).join(' | '));
  check('inviting later', 'sending now is what happens unless you say otherwise',
    sheet.options && sheet.options[0].checked && !sheet.options[1].checked
      && sheet.button === 'Add driver and send invite',
    `"${sheet.button}"`);

  /* The label is the last thing read before pressing, so it is the last place
     the promise can still be wrong. */
  await run(`(function(){ var r = [].filter.call(
    document.querySelectorAll('input[name="d-invite-choice"]'),
    function(x){ return x.value === 'later'; })[0];
    r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(400);
  const relabelled = await run(`document.querySelector('#driver-drawer [data-role="submit"]').textContent.trim()`);
  check('inviting later', 'choosing later renames the button',
    relabelled === 'Add driver', `"${relabelled}"`);

  await run(`(function(){
    var set = function(i, v){ var x = document.getElementById(i); if (!x) return;
      x.value = v; x.dispatchEvent(new Event('input', { bubbles: true }));
      x.dispatchEvent(new Event('change', { bubbles: true })); };
    set('d-first','Testy'); set('d-last','McTest'); set('d-mobile','082 555 0000');
    set('d-idtype','South African ID'); set('d-id','9001015800088');
    set('d-code','A1'); set('d-prdp','No PrDP'); })()`);
  await sleep(700);
  await run(`document.querySelector('#driver-drawer [data-role="submit"]').click()`);
  await sleep(1000);
  const added = JSON.parse(await run(`JSON.stringify((function(){
    var d = window.DriverFixtures.DRIVERS.filter(function(p){ return p.first === 'Testy'; })[0];
    var t = document.querySelector('[data-role="toast"]');
    return { found: !!d, app: d && d.app, at: d && d.appAt,
      sheetShut: [].filter.call(document.querySelectorAll('.focus-sheet'),
        function(x){ return x.getBoundingClientRect().height > 50; }).length === 0,
      toast: t ? (t.innerText || '').split(String.fromCharCode(10)).join(' ').trim() : '' };})())`));
  check('inviting later', 'the driver lands as Not invited, and the sheet closes',
    added.found && added.app === 'Not invited' && added.sheetShut,
    added.found ? `${added.app}, sheet ${added.sheetShut ? 'closed' : 'STILL OPEN'}` : 'no driver created');
  check('inviting later', 'and it says where to invite them from',
    /Driver added/.test(added.toast) && /invite this driver from the Drivers table/.test(added.toast),
    added.toast || 'no toast');

  /* The point of the choice: no message went anywhere. */
  await sleep(1700);
  const quiet = JSON.parse(await run(`JSON.stringify((function(){
    var d = window.DriverFixtures.DRIVERS.filter(function(p){ return p.first === 'Testy'; })[0];
    return { app: d && d.app, at: d && d.appAt };})())`));
  check('inviting later', 'nothing was sent',
    quiet.app === 'Not invited' && !quiet.at,
    `${quiet.app}, stamped ${quiet.at || 'never'}`);

  /* There is no Invite later status. Later is a decision somebody made; Not
     invited is the state the driver is in, and only one of those is a fact
     about the driver. */
  const invented = JSON.parse(await run(`JSON.stringify(
    (window.__appStatuses || []).filter(function(s){ return /later/i.test(s); }))`));
  check('inviting later', 'no Invite later status was invented',
    invented.length === 0, invented.length ? invented.join(', ') : 'six statuses, none of them a decision');

  /* ── The question before the message ─────────────────────────────────── */

  await load();
  const freshK = await run(ROW_WITH('Not invited'));
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify('')} + freshK_) + '"] [data-pill="app"]').click()`
    .replace('freshK_', JSON.stringify(freshK)));
  await sleep(450);
  await run(`(function(){ var p = document.querySelector('.status-pop:not(.hidden)');
    [].filter.call(p.querySelectorAll('[data-pick]'), function(b){
      return /Send invitation/.test(b.textContent); })[0].click(); })()`);
  await sleep(700);
  const ask = JSON.parse(await run(`JSON.stringify((function(){
    var d = document.getElementById('status-dialog');
    if (d.classList.contains('hidden')) return { shown: false };
    var t = function(r){ var e = d.querySelector('[data-role="' + r + '"]');
      return e ? e.textContent.trim() : ''; };
    return { shown: true, title: t('cf-title'), body: t('cf-body'),
      cancel: t('cf-back'), go: t('cf-go'),
      danger: /btn-danger/.test(d.querySelector('[data-role="cf-go"]').className) };})())`));
  check('the question', 'a WhatsApp message is confirmed before it is sent',
    ask.shown && ask.title === 'Send WhatsApp invitation?', ask.shown ? ask.title : 'no dialog');
  check('the question', 'it names the number the message will reach',
    /We\u2019ll send a WhatsApp invitation to \+27 /.test(ask.body || ''), ask.body);
  check('the question', 'Cancel, and a Send that is not dressed as a danger',
    ask.cancel === 'Cancel' && ask.go === 'Send invitation' && !ask.danger,
    `${ask.cancel} | ${ask.go}`);

  await run(`document.querySelector('[data-role="cf-back"]').click()`);
  await sleep(500);
  const afterCancel = await run(`(function(){ var d = window.DriverFixtures.DRIVERS.filter(function(p){
    return (p.idNumber || p.passportNumber) === ${JSON.stringify(freshK)}; })[0]; return d.app; })()`);
  check('the question', 'Cancel sends nothing',
    afterCancel === 'Not invited', afterCancel);

  /* One message at a time. The menu shuts on the press, so without a guard a
     second press during the beat queues a second message to a real phone. */
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(freshK)}) + '"] [data-pill="app"]').click()`);
  await sleep(400);
  await run(`(function(){ var p = document.querySelector('.status-pop:not(.hidden)');
    [].filter.call(p.querySelectorAll('[data-pick]'), function(b){
      return /Send invitation/.test(b.textContent); })[0].click(); })()`);
  await sleep(600);
  await run(`document.querySelector('[data-role="cf-go"]').click()`);
  await sleep(350);
  await run(`document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(freshK)}) + '"] [data-pill="app"]').click()`);
  await sleep(400);
  const inFlight = JSON.parse(await run(`JSON.stringify((function(){
    var tr = document.querySelector('tr[data-row="' + CSS.escape(${JSON.stringify(freshK)}) + '"]');
    var p = document.querySelector('.status-pop:not(.hidden)');
    return { pill: tr.querySelector('[data-pill="app"]').textContent.trim(),
      offered: p ? [].map.call(p.querySelectorAll('[data-pick] .pick-label'),
        function(x){ return x.textContent.trim(); }) : [] };})())`));
  check('the question', 'while it sends, no second send is offered',
    inFlight.pill === 'Invite sending'
      && !inFlight.offered.some(a => /invitation/i.test(a)),
    `${inFlight.pill} · offers ${inFlight.offered.join(', ') || 'nothing'}`);

  /* ── One channel, named the same way everywhere ──────────────────────── */

  const channel = JSON.parse(await run(`JSON.stringify((function(){
    var t = document.body.innerText;
    return { sms: /\bSMS\b/i.test(t) || /text message/i.test(t),
      whatsapp: (t.match(/WhatsApp/g) || []).length };})())`));
  check('one channel', 'the product says WhatsApp and never SMS',
    !channel.sms && channel.whatsapp > 0,
    channel.sms ? 'SMS still appears on screen' : `WhatsApp named ${channel.whatsapp} time(s), SMS never`);

  const errs = await run(`JSON.stringify(window.__pageErrors || [])`);
  check('nobody sets it', 'the page ran clean',
    errs === '[]', errs === '[]' ? 'no uncaught errors' : errs);

  ws.close(); reap();

  const bad = out.filter((r) => !r.ok);
  console.log('\nThe app invitation, and the line it does not cross\n');
  let last = null;
  for (const r of out) {
    if (r.group !== last) { console.log(`  ${r.group}`); last = r.group; }
    console.log(`    ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(52)} ${r.note}`);
  }
  console.log(`\n${out.length - bad.length} of ${out.length} checks pass.`);
  process.exit(bad.length ? 1 : 0);
})();
