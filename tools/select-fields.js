#!/usr/bin/env node
'use strict';

/*
  The three application-controlled selects, checked.

  Year, Vehicle category and Fuel type are native <select> elements enhanced by
  one shared implementation in select-field.js. The native element keeps the
  value and leaves the tab order; a button and a listbox are drawn over it.
  There are no YearDropdown, VehicleCategoryDropdown or FuelTypeDropdown
  widgets, and this file fails if one appears.

  It exists because the last fault here was invisible to reading: pinPop places
  every popover in the product and does not set a width, and .select-list
  carried `min-width: 100%`. Once placed with position:fixed that percentage
  resolves against the viewport, so all three menus opened 1440px wide at the
  left edge of the window. Nothing about the markup or the module looked wrong.

  Run it:  node tools/select-fields.js
  Exits 0 when every field passes, 1 with a report.

  Chrome only. Firefox and Safari cannot be driven from here, so "same
  appearance across browsers" is checked as far as one engine can: no native
  menu is used on any of the three, which is the property the other engines
  would otherwise each break differently.

  Needs Chrome. Set CHROME=/path/to/chrome to override the macOS default.
*/

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'tfn-fleet-portal.html');
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

const FIELDS = [
  { id: 'f-year',  name: 'Year',             typeahead: '2', grouped: false },
  /* Three options, so no optgroups: a heading over three items is a heading
     over a heading. Type-ahead on "m" reaches Motorcycle. */
  { id: 'f-type',  name: 'Vehicle category', typeahead: 'm', grouped: false },
  { id: 'f-fuel',  name: 'Fuel type',        typeahead: 'p', grouped: false },
];

const out = [];
const check = (field, name, ok, note) => out.push({ field, name, ok, note });

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

(async () => {
  /* One implementation, not three. Read off disk before anything runs. */
  const src = fs.readFileSync(FILE, 'utf8');
  const forbidden = ['YearDropdown', 'VehicleCategoryDropdown', 'FuelTypeDropdown']
    .filter((n) => src.includes(n));
  check('shared', 'one implementation', forbidden.length === 0,
    forbidden.length ? 'separate widgets exist: ' + forbidden.join(', ')
      : 'no per-field dropdown widgets; select-field.js is the only one');
  check('shared', 'no percentage width on a fixed popup',
    !/\.select-list\s*\{[^}]*min-width:\s*100%/.test(src),
    'a percentage width on a fixed popup resolves against the viewport');

  const PORT = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'selfield-'));
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
    if (r.exceptionDetails) {
      const e = r.exceptionDetails;
      throw new Error('page threw: ' +
        ((e.exception && e.exception.description) || e.text || '').split('\n')[0] +
        '  in: ' + expr.replace(/\s+/g, ' ').slice(0, 110));
    }
    return r.result.value;
  };
  /* For probes that have to wait for a microtask before reading. */
  const runAsync = async (expr) => (await send('Runtime.evaluate',
    { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

  const key = async (k, code, keyCode) => {
    for (const type of ['keyDown', 'keyUp']) {
      await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: keyCode,
        nativeVirtualKeyCode: keyCode });
    }
    await sleep(90);
  };

  const openSheet = async (w, h) => {
    await send('Emulation.setDeviceMetricsOverride',
      { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'file://' + FILE + '?demo&n=' + w + '#directory' });
    await sleep(1500);
    await run(`document.querySelector('#screen-directory [data-open="vehicle:blank"]').click()`);
    await sleep(800);
  };

  await openSheet(1440, 900);

  for (const f of FIELDS) {
    const F = f.name;

    /* No operating-system menu: the native element is hidden and untabbable. */
    const shell = JSON.parse(await run(`(function(){
      var s=document.getElementById('${f.id}');
      if(!s) return JSON.stringify({err:'missing'});
      var t=document.getElementById('${f.id}-trigger');
      var l=document.getElementById('${f.id}-list');
      return JSON.stringify({
        enhanced: s.dataset.enhanced==='1', hidden: s.getAttribute('aria-hidden')==='true',
        tab: s.tabIndex, hasTrigger: !!t, hasList: !!l,
        role: t?t.getAttribute('role'):null, haspopup: t?t.getAttribute('aria-haspopup'):null,
        listRole: l?l.getAttribute('role'):null,
        triggerCls: t?t.className:'', listCls: l?l.className:''
      });})()`));
    if (process.env.DBG) console.log('    dbg shell', f.id, JSON.stringify(shell));
    if (shell.err) { check(F, 'present', false, 'the field is missing'); continue; }
    if (!shell.hasTrigger) { check(F, 'enhanced', false, 'no trigger was built'); continue; }
    check(F, 'no operating-system menu',
      shell.enhanced && shell.hidden && shell.tab === -1 && shell.hasTrigger && shell.hasList,
      shell.enhanced ? 'native select kept for its value, aria-hidden, out of the tab order'
        : 'not enhanced, so the browser draws its own menu');
    check(F, 'shares Make’s shell',
      /\bfield\b/.test(shell.triggerCls) && /\bpop\b/.test(shell.listCls),
      `trigger "${shell.triggerCls}", popup "${shell.listCls}"`);
    check(F, 'listbox semantics',
      shell.role === 'combobox' && shell.haspopup === 'listbox' && shell.listRole === 'listbox',
      `role=${shell.role} aria-haspopup=${shell.haspopup} list role=${shell.listRole}`);

    /* Open, and measure the popup against the trigger. */
    const geo = JSON.parse(await run(`(function(){
      var t=document.getElementById('${f.id}-trigger'), l=document.getElementById('${f.id}-list');
      t.click();
      var tr=t.getBoundingClientRect(), lr=l.getBoundingClientRect(), c=getComputedStyle(l);
      var clipped=false, a=l.parentElement;
      while(a && a!==document.documentElement){
        var ac=getComputedStyle(a);
        if(ac.transform!=='none'||ac.filter!=='none'||ac.perspective!=='none') clipped=true;
        a=a.parentElement;
      }
      var opts=[].map.call(l.querySelectorAll('[role="option"]'),function(o){
        return {v:o.dataset.value, t:(o.textContent||'').trim(), sel:o.getAttribute('aria-selected')};});
      var groups=[].map.call(l.querySelectorAll('[role="group"]'),function(g){
        return {label:g.getAttribute('aria-label')||(g.getAttribute('aria-labelledby')?'by id':null),
                selectable:!!g.getAttribute('role') && g.getAttribute('role')==='option'};});
      var heads=[].map.call(l.querySelectorAll('.select-group'),function(g){
        return {role:g.getAttribute('role'), option:g.matches('[role="option"]'), text:(g.textContent||'').trim()};});
      return JSON.stringify({
        open: !l.classList.contains('hidden'),
      sheetOpen: document.body.classList.contains('sheet-open'),
        tw: Math.round(tr.width), lw: Math.round(lr.width),
        lh: Math.round(lr.height), maxH: parseFloat(c.maxHeight),
        top: Math.round(lr.top), bottom: Math.round(lr.bottom),
        triggerBottom: Math.round(tr.bottom), triggerTop: Math.round(tr.top),
        pos: c.position, overflowY: c.overflowY, scrolls: l.scrollHeight > l.clientHeight+1,
        transformedAncestor: clipped,
        inViewport: lr.top >= -1 && lr.bottom <= innerHeight+1,
        opts: opts, groups: groups, heads: heads,
        placeholderInList: opts.some(function(o){return !o.v;}),
        vh: innerHeight
      });})()`));

    check(F, 'popup width matches the trigger', Math.abs(geo.lw - geo.tw) <= 2,
      `trigger ${geo.tw}px, popup ${geo.lw}px`);
    check(F, 'fits the viewport', geo.inViewport,
      `popup ${geo.top}–${geo.bottom} in ${geo.vh}px`);
    check(F, 'max height respects the space available', geo.maxH <= geo.vh,
      `max-height ${Math.round(geo.maxH)}px against ${geo.vh}px of window`);
    check(F, 'not clipped by the sheet', geo.pos === 'fixed' && !geo.transformedAncestor,
      geo.pos === 'fixed' ? 'placed fixed, and no transformed ancestor to trap it'
        : 'position is ' + geo.pos);
    check(F, 'placeholder is not an option', !geo.placeholderInList,
      `${geo.opts.length} options, none of them the empty one`);
    if (f.grouped) {
      const bad = geo.heads.filter((h) => h.option);
      check(F, 'group headings are not selectable', geo.heads.length > 0 && bad.length === 0,
        `${geo.heads.length} headings, ${bad.length} of them selectable`);
      check(F, 'groups are announced', geo.groups.length > 0 && geo.groups.every((g) => g.label),
        `${geo.groups.length} groups, all labelled`);
    } else if (f.id === 'f-type') {
      /* The opposite assertion, and it is the one that matters here: a short
         list must not be grouped, and every option in it is selectable.

         Written against the grouping rather than a fixed count. The list was
         three, is four with Other, and grows by one every time an account
         names a category of its own. A count in here would fail on the
         product working, which is the least useful thing a check can do. */
      check(F, 'a short list carries no group heading',
        geo.heads.length === 0 && geo.groups.length === 0 && geo.opts.length >= 3,
        `${geo.opts.length} options, ${geo.groups.length} groups, none of them headings`);
    }
    if (geo.lh >= geo.maxH - 1) {
      check(F, 'a long list scrolls inside itself', geo.scrolls && geo.overflowY === 'auto',
        `scrollHeight exceeds the box, overflow-y ${geo.overflowY}`);
    }

    /* Keyboard: arrows, Home, End, typeahead, Enter. Closed first, or the
       previous step's open list makes ArrowDown mean "move" instead of
       "open" and every expectation below shifts by one. */
    await run(`(function(){var l=document.getElementById('${f.id}-list');
      if(!l.classList.contains('hidden')) document.getElementById('${f.id}-trigger').click();})()`);
    await sleep(150);
    await run(`document.getElementById('${f.id}-trigger').focus()`);
    await key('ArrowDown', 'ArrowDown', 40);
    const opened = await run(`!document.getElementById('${f.id}-list').classList.contains('hidden')`);
    const ends = JSON.parse(await run(`(function(){
      var rows=document.querySelectorAll('#${f.id}-list [role="option"]');
      return JSON.stringify({first:rows[0].id, last:rows[rows.length-1].id, n:rows.length});})()`));
    await key('End', 'End', 35);
    const atEnd = await run(`document.getElementById('${f.id}-trigger').getAttribute('aria-activedescendant')`);
    await key('Home', 'Home', 36);
    const atHome = await run(`document.getElementById('${f.id}-trigger').getAttribute('aria-activedescendant')`);
    check(F, 'ArrowDown opens, End and Home reach the ends',
      opened === true && atEnd === ends.last && atHome === ends.first,
      `${ends.n} options: End reached ${atEnd === ends.last ? 'the last' : atEnd}, ` +
      `Home reached ${atHome === ends.first ? 'the first' : atHome}`);

    await key(f.typeahead.toUpperCase(), 'Key' + f.typeahead.toUpperCase(),
      f.typeahead.toUpperCase().charCodeAt(0));
    const typed = await run(`(function(){
      var id=document.getElementById('${f.id}-trigger').getAttribute('aria-activedescendant');
      var el=id?document.getElementById(id):null;
      return el?(el.textContent||'').trim():'';})()`);
    check(F, 'typeahead jumps to a matching option',
      typed.toLowerCase().startsWith(f.typeahead.toLowerCase()),
      `typing "${f.typeahead}" landed on "${typed}"`);

    await key('Enter', 'Enter', 13);
    const chosen = JSON.parse(await run(`(function(){
      var s=document.getElementById('${f.id}'), t=document.getElementById('${f.id}-trigger'),
          l=document.getElementById('${f.id}-list');
      return JSON.stringify({value:s.value, shown:(t.textContent||'').trim(),
        closed:l.classList.contains('hidden'), expanded:t.getAttribute('aria-expanded'),
        focused:document.activeElement===t});})()`));
    check(F, 'Enter selects, closes, and returns focus',
      !!chosen.value && chosen.closed && chosen.expanded === 'false' && chosen.focused,
      `value "${chosen.value}", trigger reads "${chosen.shown}"`);
    check(F, 'the selection is announced on the trigger',
      chosen.shown.toLowerCase().includes(String(chosen.value).toLowerCase().slice(0, 4)) ||
      chosen.shown.length > 0,
      `trigger text "${chosen.shown}"`);

    /* Escape closes and hands focus back. */
    await run(`document.getElementById('${f.id}-trigger').click()`);
    await sleep(150);
    await key('Escape', 'Escape', 27);
    const esc = JSON.parse(await run(`(function(){
      var t=document.getElementById('${f.id}-trigger'), l=document.getElementById('${f.id}-list');
      return JSON.stringify({closed:l.classList.contains('hidden'), focused:document.activeElement===t});})()`));
    check(F, 'Escape closes and returns focus', esc.closed && esc.focused,
      esc.closed ? 'closed, focus back on the trigger' : 'still open');

    /* A click outside closes it. */
    await run(`document.getElementById('${f.id}-trigger').click()`);
    await sleep(150);
    await run(`document.querySelector('.focus-sheet__head').click()`);
    await sleep(150);
    const outside = await run(`document.getElementById('${f.id}-list').classList.contains('hidden')`);
    check(F, 'a click outside closes it', outside === true, outside ? 'closed' : 'stayed open');

    /* Scrolling inside the list must not close it. */
    if (geo.scrolls) {
      await run(`document.getElementById('${f.id}-trigger').click()`);
      await sleep(150);
      await run(`(function(){var l=document.getElementById('${f.id}-list');
        l.scrollTop=120; l.dispatchEvent(new Event('scroll',{bubbles:true}));})()`);
      await sleep(200);
      const still = await run(`(function(){var l=document.getElementById('${f.id}-list');
        return JSON.stringify({open:!l.classList.contains('hidden'), at:l.scrollTop});})()`);
      const st = JSON.parse(still);
      check(F, 'scrolling inside it does not close it', st.open, `scrolled to ${st.at}`);
      await key('Escape', 'Escape', 27);
    }
  }

  /* Validation and dependent fields react to a choice made through the listbox. */
  await openSheet(1440, 900);
  const dependent = JSON.parse(await run(`(function(){
    var t=document.getElementById('f-type-trigger');
    t.click();
    var row=[].filter.call(document.querySelectorAll('#f-type-list [role="option"]'),
      function(o){return o.dataset.value==='lcv';})[0];
    if(!row) return JSON.stringify({err:'no lcv option'});
    row.click();
    var sheet=[].filter.call(document.querySelectorAll('.focus-sheet'),function(x){return x.getBoundingClientRect().height>50;})[0];
    var v=document.querySelector('#f-type-trigger .select-value');
    return JSON.stringify({
      value: document.getElementById('f-type').value,
      shown: v?v.textContent.trim():null,
      /* Absent, not hidden: the field was deleted with the motorcycle
         sub-types that were the last thing asking for it. */
      configEls: sheet.querySelectorAll('[data-field="vehicleConfiguration"]').length
        + document.querySelectorAll('#f-config, #f-config-trigger').length
    });})()`));
  check('shared', 'a choice takes, and there is no dependent field to reveal',
    dependent.value === 'lcv' && /LCV/.test(dependent.shown || '') && dependent.configEls === 0,
    dependent.err || `chose "${dependent.value}", trigger reads "${dependent.shown}", ` +
    `${dependent.configEls} configuration elements anywhere in the document`);

  const validation = JSON.parse(await run(`(function(){
    var sheet=[].filter.call(document.querySelectorAll('.focus-sheet'),function(x){return x.getBoundingClientRect().height>50;})[0];
    sheet.querySelector('[data-role="submit"]').click();
    var box=sheet.querySelector('[data-role="summary"]');
    var items=[].map.call(box.querySelectorAll('li'),function(l){return l.textContent.trim();});
    return JSON.stringify({items:items});})()`));
  check('shared', 'validation updates after a selection',
    !validation.items.some((t) => /vehicle category/i.test(t)),
    `${validation.items.length} problems left, none of them the category just chosen`);

  /* A saved value restores into the trigger. */
  await send('Page.navigate', { url: 'file://' + FILE + '?demo#directory' });
  await sleep(1500);
  const restored = JSON.parse(await run(`(function(){
    var row=document.querySelector('#screen-directory tbody tr');
    if(!row) return JSON.stringify({err:'no row'});
    row.click();
    return null;})()`) || 'null') || {};
  await sleep(900);
  const saved = JSON.parse(await run(`(function(){
    var s=document.getElementById('f-year'), t=document.getElementById('f-year-trigger');
    if(!s||!t) return JSON.stringify({err:'edit sheet has no year field'});
    return JSON.stringify({value:s.value, shown:(t.textContent||'').trim(),
      placeholder: t.querySelector('.select-value') ?
        t.querySelector('.select-value').classList.contains('is-placeholder') : null});})()`));
  check('shared', 'a saved value restores into the trigger',
    !saved.err && !!saved.value && saved.shown.includes(saved.value) && saved.placeholder === false,
    saved.err || `year "${saved.value}" reads "${saved.shown}" and is not styled as a placeholder`);

  /* Narrow and zoomed. */
  for (const [w, h, label] of [[390, 844, 'phone'], [1024, 768, 'small laptop']]) {
    await openSheet(w, h);
    const small = JSON.parse(await run(`(function(){
      var t=document.getElementById('f-fuel-trigger');
      if(!t) return JSON.stringify({err:'no trigger'});
      t.click();
      var l=document.getElementById('f-fuel-list');
      var tr=t.getBoundingClientRect(), lr=l.getBoundingClientRect();
      return JSON.stringify({w:Math.round(lr.width), tw:Math.round(tr.width),
        inside: lr.left>=-1 && lr.right<=innerWidth+1 && lr.top>=-1 && lr.bottom<=innerHeight+1});})()`));
    check('shared', `usable at ${label} (${w}×${h})`,
      !small.err && Math.abs(small.w - small.tw) <= 2 && small.inside,
      small.err || `popup ${small.w}px on a ${small.tw}px trigger, inside the viewport`);
  }

  /* ── Lifecycle and state, the ten added on review ───────────────────── */
  await openSheet(1440, 900);

  /* 1. There is no <form> in this file, so form.reset() cannot be the thing
        under test. The equivalent is the sheet's own clear, which is what
        Cancel and a discarded draft go through. */
  const noForm = await run(`document.querySelectorAll('form').length`);
  const reset = JSON.parse(await run(`(function(){
    var s=document.getElementById('f-fuel'), t=document.getElementById('f-fuel-trigger');
    s.value='Petrol'; var chosen=t.querySelector('.select-value').textContent.trim();
    /* the clear the sheet performs on close */
    s.value=''; s.dispatchEvent(new Event('change',{bubbles:true}));
    var v=t.querySelector('.select-value');
    return JSON.stringify({chosen:chosen, after:v.textContent.trim(),
      placeholder:v.classList.contains('is-placeholder'), native:s.value});})()`));
  check('lifecycle', 'a reset clears value and trigger together',
    reset.chosen === 'Petrol' && reset.native === '' && reset.placeholder === true,
    `no <form> in the file (${noForm} found), so the sheet's own clear is the path: ` +
    `"${reset.chosen}" back to "${reset.after}" as a placeholder`);

  /* 2. Options replaced under it. */
  const swapped = JSON.parse(await run(`(function(){
    var s=document.getElementById('f-fuel'), t=document.getElementById('f-fuel-trigger');
    s.innerHTML='<option value="">Select fuel type</option><option>Diesel</option>'+
      '<option>Petrol</option><option>Electric</option>';
    s.value='Electric';
    t.click();
    var n=document.querySelectorAll('#f-fuel-list [role="option"]').length;
    t.click();
    return JSON.stringify({options:n, shown:t.querySelector('.select-value').textContent.trim()});})()`));
  check('lifecycle', 'replacing the options refreshes list and label',
    swapped.options === 3 && swapped.shown === 'Electric',
    `${swapped.options} options drawn, trigger reads "${swapped.shown}"`);

  /* 3. disabled and required, mirrored onto the control a person reaches. */
  const state = JSON.parse(await runAsync(`(function(){
    var s=document.getElementById('f-fuel'), t=document.getElementById('f-fuel-trigger'),
        l=document.getElementById('f-fuel-list');
    var d={};
    s.disabled=true;
    return new Promise(function(step){
      setTimeout(function(){
        d.disabled=t.disabled; d.aria=t.getAttribute('aria-disabled');
        t.click(); d.openedWhileDisabled = !l.classList.contains('hidden');
        if(d.openedWhileDisabled) t.click();
        s.disabled=false;
        s.required=true;
        setTimeout(function(){
          d.reEnabled = !t.disabled;
          step(d);
        }, 60);
      }, 60);
    }).then(function(d){
      d.required = t.getAttribute('aria-required');
      s.required=false;
      return JSON.stringify(d);
    });})()`));
  check('lifecycle', 'disabled and required reach the trigger',
    state.disabled === true && !state.openedWhileDisabled && state.required === 'true' && state.reEnabled,
    `disabled ${state.disabled}, opened while disabled ${state.openedWhileDisabled}, ` +
    `aria-required ${state.required}`);

  /* 4. There is no dependent field left to clear. Vehicle configuration was
        the only one, and it went with the motorcycle sub-types. The probe that
        drove it: set a category, set a configuration, change the category,
        read what the trigger says: sat here disabled behind `if (false)`,
        which is a test that cannot fail and cannot pass. Its replacement is
        the element count in 'a choice takes, and there is no dependent field
        to reveal' above, and the same assertion in tools/vehicle-taxonomy.js. */

  /* 5. Re-initialising must not wrap twice or bind twice. */
  const reinit = JSON.parse(await run(`(function(){
    var s=document.getElementById('f-fuel'), t=document.getElementById('f-fuel-trigger');
    var before = document.querySelectorAll('#f-fuel-trigger').length +
                 document.querySelectorAll('#f-fuel-list').length;
    window.__enhanceSelects();
    var after = document.querySelectorAll('#f-fuel-trigger').length +
                document.querySelectorAll('#f-fuel-list').length;
    /* one wrapper, not a chain of them */
    var d = Object.getOwnPropertyDescriptor(s, 'value');
    var depth = 0, probe = s;
    s.value='Diesel';
    var painted = t.querySelector('.select-value').textContent.trim();
    return JSON.stringify({before:before, after:after, own:!!d, painted:painted,
      enhanced:s.dataset.enhanced});})()`));
  check('lifecycle', 're-initialising leaves no duplicate control or descriptor',
    reinit.before === 2 && reinit.after === 2 && reinit.painted === 'Diesel',
    `one trigger and one list before and after __enhanceSelects(), value still repaints`);

  /* 6. A value written the way autofill and bfcache write it, then pageshow. */
  const restore = JSON.parse(await run(`(function(){
    var s=document.getElementById('f-fuel'), t=document.getElementById('f-fuel-trigger');
    /* the prototype setter, bypassing the instance wrapper: this is what a
       browser restore does */
    var proto=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value');
    proto.set.call(s,'Petrol');
    var before=t.querySelector('.select-value').textContent.trim();
    window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    var after=t.querySelector('.select-value').textContent.trim();
    return JSON.stringify({native:s.value, before:before, after:after});})()`));
  check('lifecycle', 'a browser-restored value is picked up on pageshow',
    restore.native === 'Petrol' && restore.after === 'Petrol',
    `native "${restore.native}", trigger read "${restore.before}" then "${restore.after}"`);

  /* 7. Three ways in, one outcome. */
  await openSheet(1440, 900);
  const paths = JSON.parse(await run(`(function(){
    var s=document.getElementById('f-fuel'), t=document.getElementById('f-fuel-trigger');
    var seen={mouse:0,program:0};
    function snap(){return {value:s.value, shown:t.querySelector('.select-value').textContent.trim()};}
    s.addEventListener('change',function(){seen.mouse++;});
    t.click();
    var row=[].filter.call(document.querySelectorAll('#f-fuel-list [role="option"]'),
      function(o){return o.dataset.value==='Petrol';})[0];
    row.click();
    var byMouse=snap();
    s.value=''; s.dispatchEvent(new Event('change',{bubbles:true}));
    s.value='Petrol';
    var byProgram=snap();
    return JSON.stringify({byMouse:byMouse, byProgram:byProgram, changes:seen.mouse});})()`));
  check('lifecycle', 'mouse and programmatic selection agree',
    paths.byMouse.value === paths.byProgram.value && paths.byMouse.shown === paths.byProgram.shown,
    `both end at "${paths.byMouse.value}" reading "${paths.byMouse.shown}"; ` +
    `a click fires change, an assignment repaints without synthesising one, which is what the DOM does`);

  /* 8 and 9. Zoomed to 200%, which halves the CSS viewport. */
  await openSheet(720, 450);
  /* Year, not category: three options do not overflow a 288px menu, and the
     assertion here is that a long one scrolls inside itself. */
  await run(`(function(){var t=document.getElementById('f-year-trigger'); if(t) t.click();})()`);
  await sleep(250);  /* the popup re-places on the next frame once layout settles */
  const zoom = JSON.parse(await run(`(function(){
    var t=document.getElementById('f-year-trigger');
    if(!t) return JSON.stringify({err:'no trigger'});
    /* Already opened above. Clicking again here would toggle it shut and
       measure a hidden box, which is what this check spent a while reporting
       as a placement fault. */
    var l=document.getElementById('f-year-list');
    var tr=t.getBoundingClientRect(), lr=l.getBoundingClientRect();
    return JSON.stringify({
      tw:Math.round(tr.width), lw:Math.round(lr.width), vw:innerWidth, vh:innerHeight,
      attached: Math.abs(lr.left-tr.left)<=2 || Math.abs(lr.right-tr.right)<=2,
      rects:[Math.round(tr.left),Math.round(tr.width),Math.round(lr.left),Math.round(lr.width)],
      open: !l.classList.contains('hidden'),
      sheetOpen: document.body.classList.contains('sheet-open'),
      inside: lr.left>=-1 && lr.right<=innerWidth+1 && lr.top>=-1 && lr.bottom<=innerHeight+1,
      scrolls: l.scrollHeight > l.clientHeight+1,
      overflowY: getComputedStyle(l).overflowY,
      innerWidth: innerWidth, docClientWidth: document.documentElement.clientWidth,
      vvWidth: window.visualViewport?Math.round(window.visualViewport.width):null,
      vvOffsetLeft: window.visualViewport?Math.round(window.visualViewport.offsetLeft):null,
      bodyClass: document.body.className,
      bodyPadRight: getComputedStyle(document.body).paddingRight,
      bodyInline: document.body.getAttribute('style')||'',
      sheetLeft: (function(){var sh=[].filter.call(document.querySelectorAll('.focus-sheet'),
        function(x){return x.getBoundingClientRect().height>50;})[0];
        return sh?Math.round(sh.getBoundingClientRect().left)+'/'+Math.round(sh.getBoundingClientRect().width):'none';})(),
      url: location.href.split('/').pop(),
      sheetTransform: (function(){var sh=[].filter.call(document.querySelectorAll('.focus-sheet'),
        function(x){return x.getBoundingClientRect().height>50;})[0];
        if(!sh) return 'none';
        var c=getComputedStyle(sh);
        return c.transform+' | anim '+c.animationName+' '+c.animationDuration+
          ' | play '+(sh.getAnimations?sh.getAnimations().map(function(a){return a.animationName+':'+a.playState;}).join(','):'?');})()
      });})()`));
  if (process.env.DBG) console.log('    dbg zoom:', JSON.stringify(zoom, null, 1));
  /* Kept deliberately: this check went red for a while and the cause was a
     transform on the sheet during its 200ms enter animation, which makes the
     sheet the containing block for position:fixed. The sheetTransform and
     sheetLeft fields above are what proved it, so they stay. */
  const zoomWhy = [!zoom.sheetOpen && 'the sheet never opened at this size',
    !zoom.open && 'the list did not open',
    !zoom.attached && ('not attached: trigger left/width ' + (zoom.rects||[]).slice(0,2).join('/') +
      ', list left/width ' + (zoom.rects||[]).slice(2).join('/')), !zoom.inside && 'outside the viewport',
    !zoom.scrolls && 'does not scroll', zoom.overflowY !== 'auto' && ('overflow-y ' + zoom.overflowY)]
    .filter(Boolean).join(', ');
  check('lifecycle', 'at 200% zoom the popup stays attached, inside and scrollable',
    !zoom.err && zoom.attached && zoom.inside && zoom.scrolls && zoom.overflowY === 'auto',
    zoomWhy || `${zoom.vw}×${zoom.vh} CSS px: popup ${zoom.lw}px on a ${zoom.tw}px trigger, scrolls internally`);
  check('lifecycle', 'option text never widens the popup past the viewport',
    !zoom.err && zoom.lw <= zoom.vw && Math.abs(zoom.lw - zoom.tw) <= 2,
    `popup ${zoom.lw}px inside ${zoom.vw}px`);

  /* An edited vehicle must arrive with its model editable. Not a SelectField,
     but the same fault: a value written in script that nothing was told about. */
  await send('Page.navigate', { url: 'file://' + FILE + '?demo#directory' });
  await sleep(1400);
  await run(`document.querySelector('#screen-directory tbody tr').click()`);
  await sleep(900);
  const model = JSON.parse(await run(`(function(){
    var m=document.getElementById('f-model'), mk=document.getElementById('f-make');
    return JSON.stringify({make:mk.value, model:m.value, disabled:m.disabled,
      placeholder:m.placeholder});})()`));
  check('lifecycle', 'an edited vehicle can have its model changed',
    !!model.make && !!model.model && model.disabled === false,
    `make "${model.make}", model "${model.model}", ` +
    (model.disabled ? 'field is DISABLED' : 'field is editable') +
    `, placeholder "${model.placeholder}"`);

  /* 10. The limits of this file, stated in it. */
  const contract = fs.readFileSync(path.join(ROOT, 'UX-CONTRACT.md'), 'utf8');
  const says = /Safari and Firefox[\s\S]{0,200}manual/i.test(contract);
  check('lifecycle', 'Safari and Firefox are recorded as manual QA', says,
    says ? 'UX-CONTRACT.md records it as manual QA and claims no automated coverage'
      : 'the limitation is not written down in UX-CONTRACT.md');

  reap();

  const bad = out.filter((r) => !r.ok);
  console.log('\nApplication-controlled selects\n');
  let last = null;
  for (const r of out) {
    if (r.field !== last) { console.log(`  ${r.field}`); last = r.field; }
    console.log(`    ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(44)} ${r.note}`);
  }
  console.log(`\n${out.length - bad.length} of ${out.length} checks pass.`);
  console.log('Chrome only: Firefox and Safari cannot be driven from here.');
  process.exit(bad.length ? 1 : 0);
})();
