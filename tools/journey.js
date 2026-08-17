#!/usr/bin/env node
'use strict';

/*
  Walk the journeys with real events and the real clock.

  sweep.js proves every state renders; this proves the paths BETWEEN them
  hold: the typed code reaching the face-or-fingerprint offer, every
  dismissal resolving to a skip and never to the marketing hero, the till
  reading the QR on its own, litres counting, the notification opening the
  pay-off, the receipt keeping its promise on home, Done filing into
  History, and the pump that stops early paying only for what flowed.

  Run it:  node tools/journey.js
  Needs Chrome (CHROME=/path/to/chrome to override) and about two minutes.
  Exit 0 when every assertion holds, 1 with the list of what did not.

  Both files are staged into one temp directory so the sign-up handover
  crosses into the welcome flow exactly as it does in production.
*/

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const STAGE = fs.mkdtempSync(path.join(os.tmpdir(), 'engenxt-journey-'));
for (const name of ['index.html', 'engenxt-onboarding.html']) {
  let src = fs.readFileSync(path.join(ROOT, name), 'utf8');
  src = src.replace('</head>', `<style id="__j">
  html, body { margin:0 !important; padding:0 !important; overflow:hidden !important; }
  .d-stateNav { display:none !important; }
  .p-signup-demo { padding:0 !important; gap:0 !important; display:block !important; min-height:0 !important; }
  .t-device-frame { position:fixed !important; top:0 !important; left:0 !important; margin:0 !important;
    width:390px !important; height:844px !important; border-radius:0 !important; box-shadow:none !important; }
</style>
</head>`, 1);
  fs.writeFileSync(path.join(STAGE, name), src);
}

function cdp(ws) {
  let id = 0; const p = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); }
  });
  return (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; p.set(i, { resolve: res, reject: rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  ok    ' + label); }
  else { fail++; console.log('  FAIL  ' + label + (detail !== undefined ? '  -- ' + detail : '')); }
}
async function launch(port) {
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars',
    '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'engenxt-jprof-')),
    '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let t = null;
  for (let i = 0; i < 60 && !t; i++) { await sleep(300);
    try { t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch (e) { /* booting */ }
  }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  return { chrome, ws };
}

(async () => {
  console.log('\n══ sign-up journeys ══');
  await signup();
  console.log('\n══ fuelling journeys ══');
  await fuelling();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

const TYPE_CODE = `(function () {
  var cells = document.querySelectorAll('.a-otp-cell');
  '123456'.split('').forEach(function (d, i) {
    cells[i].value = d;
    cells[i].dispatchEvent(new Event('input', { bubbles: true }));
  });
  return 'typed';
})()`;

const STATE = `JSON.stringify({
  stage: Demo.S().stage,
  bio: Demo.S().biometrics,
  href: location.pathname.split('/').pop() + location.hash,
  progressShown: !getComputedStyle(document.getElementById('progress')).display.includes('none')
    && !document.getElementById('progress').hidden,
  closeHidden: document.getElementById('sheetClose').hidden,
  enableDisabled: document.getElementById('bioEnable').disabled,
  skipDisabled: document.getElementById('bioSkip').disabled,
  enableText: document.getElementById('bioEnable').textContent.trim().slice(0, 30),
  title: document.getElementById('bioTitle').textContent,
  focusables: (function () {
    var sheet = document.getElementById('sheet');
    var all = sheet.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    var out = [];
    all.forEach(function (el) { if (el.offsetParent !== null && !el.disabled) out.push(el.id || el.className.split(' ')[0]); });
    return out;
  })()
})`;

async function signup() {
  const { chrome, ws } = await launch(9977);
  const send = cdp(ws);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

  const ev = async (expr) => JSON.parse((await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value);
  const raw = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
  async function fresh(hash) {
    await send('Page.navigate', { url: `file://${STAGE}/index.html?w=${Math.random()}#${hash}` });
    await sleep(900);
  }

  console.log('\n── walk 1: type the code, then Not now ──');
  await fresh('code/idle');
  await raw(TYPE_CODE);
  await sleep(2600);            /* verify beat + 700ms to the offer */
  let s = await ev(STATE);
  check('offer reached organically', s.stage === 'biometrics', s.stage);
  check('progress hidden at the offer', !s.progressShown);
  check('sheet close hidden', s.closeHidden);
  check('only Enable and Not now are focusable', s.focusables.join(',') === 'bioEnable,bioSkip', s.focusables.join(','));
  await raw(`document.getElementById('bioSkip').click()`);
  await sleep(700);
  s = await ev(`JSON.stringify({ href: location.pathname.split('/').pop() + location.hash })`).catch(() => null);
  check('skip lands in the welcome flow', s && s.href.indexOf('engenxt-onboarding.html#route/new-driver') === 0, s && s.href);

  console.log('\n── walk 2: Turn it on ──');
  await fresh('code/idle');
  await raw(TYPE_CODE);
  await sleep(2600);
  await raw(`document.getElementById('bioEnable').click()`);
  await sleep(300);
  s = await ev(STATE);
  check('waiting face: enable is busy', s.enableDisabled && s.enableText.indexOf('Waiting') > -1, s.enableText);
  check('waiting face: skip is quiet', s.skipDisabled);
  await sleep(800);              /* 900ms wait completes */
  s = await ev(STATE);
  check('done face renamed plainly', s.title === 'Your face or fingerprint is set', s.title);
  check('S.biometrics = enabled', s.bio === 'enabled', s.bio);
  await sleep(900);              /* 700ms beat to handover */
  s = await ev(`JSON.stringify({ href: location.pathname.split('/').pop() + location.hash })`);
  check('enable lands in the welcome flow', s.href.indexOf('engenxt-onboarding.html#route/new-driver') === 0, s.href);

  console.log('\n── walk 3: Escape at the offer skips ──');
  await fresh('success/signup');
  await raw(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(700);
  s = await ev(`JSON.stringify({ href: location.pathname.split('/').pop() + location.hash })`);
  check('Escape at offer = skip = handover', s.href.indexOf('engenxt-onboarding.html#route/new-driver') === 0, s.href);

  console.log('\n── walk 4: grab bar at the offer skips, never strands ──');
  await fresh('success/signup');
  await raw(`document.getElementById('sheetGrab').click()`);
  await sleep(700);
  s = await ev(`JSON.stringify({ href: location.pathname.split('/').pop() + location.hash })`);
  check('grab bar at offer = skip = handover', s.href.indexOf('engenxt-onboarding.html#route/new-driver') === 0, s.href);

  console.log('\n── walk 5: Escape mid-wait does nothing ──');
  await fresh('biometrics/waiting');
  await raw(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(400);
  s = await ev(STATE);
  check('still at the wait, not navigated', s.stage === 'biometrics' && s.href.indexOf('index.html') === 0, s.stage + ' ' + s.href);
  check('wait face intact', s.enableDisabled && s.skipDisabled);

  console.log('\n── walk 6: signin mode routes home ──');
  await fresh('success/signin');
  await raw(`document.getElementById('bioSkip').click()`);
  await sleep(700);
  s = await ev(`JSON.stringify({ href: location.pathname.split('/').pop() + location.hash })`);
  check('signin skip lands on the returning route', s.href.indexOf('engenxt-onboarding.html#route/returning') === 0, s.href);

  console.log('\n── walk 7: a colleague types her best guess ──');
  await fresh('code/idle');
  await raw(`(function(){var c=document.querySelectorAll('.a-otp-cell');
    '482017'.split('').forEach(function(d,i){c[i].value=d;c[i].dispatchEvent(new Event('input',{bubbles:true}));});})()`);
  await sleep(2600);
  s = await ev(STATE);
  check('any code reaches the offer', s.stage === 'biometrics', s.stage);

  console.log('\n── walk 8: 999999 still shows the wrong-code face ──');
  await fresh('code/idle');
  await raw(`(function(){var c=document.querySelectorAll('.a-otp-cell');
    '999999'.split('').forEach(function(d,i){c[i].value=d;c[i].dispatchEvent(new Event('input',{bubbles:true}));});})()`);
  await sleep(2200);
  s = await ev(`JSON.stringify({ helper: document.getElementById('otpHelper').textContent.trim().slice(0,40), stage: Demo.S().stage })`);
  check('wrong-code face preserved', s.helper.indexOf("doesn't match") > -1 && s.stage === 'code', s.helper);

  ws.close(); chrome.kill();
}


async function fuelling() {
  const { chrome, ws } = await launch(9978);
  const send = cdp(ws);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
  const st = async () => JSON.parse(await ev(`JSON.stringify({
    step: Demo.S().step, fuel: Demo.S().fuel, litres: Demo.S().fillLitresNow || 0,
    fuelUp: !document.getElementById('fuelScreen').hidden,
    pushUp: !document.getElementById('pushNote').hidden,
    earnedUp: !document.getElementById('earnedScreen').hidden,
    receiptUp: !document.getElementById('receiptScreen').hidden,
    balance: document.getElementById('homePoints').textContent,
    barTitle: (document.querySelector('#homeLive .m-live-bar__title')||{}).textContent || '',
    homeVisible: !document.getElementById('homeScreen').hidden
  })`));

  console.log('\n── the full journey, one driver, real time ──');
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=1#fuel-check` });
  await sleep(2400);                                     /* checks animate in */
  await ev(`document.getElementById('checkGo').click()`);
  await sleep(600);
  let s = await st();
  check('identity step stands before the code', s.step === 'step:account', s.step);
  await ev(`document.getElementById('stepGo').click()`);
  /* The unlock beat (350ms) plus the tap guard's arrival window (320ms):
     a human does not press a screen 250ms after it appears, and since the
     guard exists, neither may the walk. */
  await sleep(950);
  s = await st();
  check('odometer stands between identity and the code', s.step === 'step:odometer', s.step);
  await ev(`document.getElementById('stepGo').click()`);
  await sleep(1400);                                     /* 900ms authorise + arrive */
  s = await st();
  check('QR up, fill live', s.fuelUp && s.fuel === 'live', s.fuel);
  await sleep(6400);                                     /* the till reads it at 6s */
  s = await st();
  check('QR came down on its own once read', !s.fuelUp, JSON.stringify(s));
  /* State was not enough once: an invisible home answers every question
     about itself, and the driver sees a blank phone. Visibility is asserted
     wherever a screen claims to be under the driver's thumb. */
  check('home is standing under it', s.homeVisible);
  check('fuel is flowing', s.fuel === 'filling');
  check('litres are counting', s.litres > 0 && s.litres < 52.4, s.litres);
  check('bar says Filling', s.barTitle === 'Filling', s.barTitle);
  await sleep(8600);                                     /* the fill finishes */
  s = await st();
  check('fill done', s.fuel === 'done', s.fuel);
  check('the notification is up', s.pushUp);
  check('bar says Fill complete', s.barTitle === 'Fill complete', s.barTitle);
  await ev(`document.getElementById('pushNote').click()`);
  await sleep(1600);
  s = await st();
  check('notification opens the points', s.earnedUp && s.step === 'earned', s.step);
  check('notification came down', !s.pushUp);
  check('medal counted to 524', await ev(`document.getElementById('earnedValue').textContent`) === '524');
  await ev(`document.getElementById('earnedCta').click()`);
  await sleep(500);
  s = await st();
  check('receipt after the points', s.receiptUp && s.step === 'receipt', s.step);
  check('receipt balance says 2 974 pts',
    await ev(`document.getElementById('receiptBalance').textContent`) === '2 974 pts');
  check('receipt carries the odometer',
    await ev(`document.getElementById('receiptOdo').textContent`) === '84 230 km');
  await ev(`document.getElementById('receiptDone').click()`);
  await sleep(900);
  s = await st();
  check('home again, fill closed', s.step === 'home' && s.fuel === 'idle' && s.homeVisible, s.step + ' ' + s.fuel + ' visible=' + s.homeVisible);
  check('the balance grew on home', s.balance === '2 974 pts', s.balance);

  console.log('\n── Escape dismisses the news without losing it ──');
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=2#fuel-done` });
  await sleep(1400);
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(300);
  s = await st();
  check('push dismissed', !s.pushUp);
  check('the live bar still holds the door', s.barTitle === 'Fill complete', s.barTitle);
  await ev(`document.getElementById('homeLive').click()`);
  await sleep(1200);
  s = await st();
  check('the bar opens the points', s.earnedUp, s.step);

  console.log('\n── rail states hold their frame ──');
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=3#fuel-filling` });
  await sleep(1200);
  const a = await st(); await sleep(1500); const b = await st();
  check('filling state is frozen mid-pour', a.litres === 31.4 && b.litres === 31.4, a.litres + '→' + b.litres);
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=4#home` });
  await sleep(1200);
  s = await st();
  /* #home is the new-driver home: 50 signup points, and none of the fill's.
     An inflated frame would read 574. */
  check('plain home is not inflated by an old fill', s.balance === '50 pts', s.balance);

  console.log('\n── Done at the QR lands somewhere real ──');
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=7#fuel-check` });
  await sleep(2200);
  await ev(`document.getElementById('checkGo').click()`); await sleep(500);
  await ev(`document.getElementById('stepGo').click()`); await sleep(800);   /* the lock opens */
  await ev(`document.getElementById('stepGo').click()`); await sleep(1400);  /* odometer -> QR */
  await ev(`document.getElementById('fuelDone').click()`); await sleep(500);
  const fw = JSON.parse(await ev(`JSON.stringify({
    up: !document.getElementById('fillingScreen').hidden,
    face: document.getElementById('fillingScreen').getAttribute('data-face'),
    unit: document.getElementById('fillingUnit').textContent })`));
  check('Done walks forward into the watched fill', fw.up, JSON.stringify(fw));
  check('before the till reads, the screen waits honestly', fw.face === 'waiting' && fw.unit === 'waiting for the till', JSON.stringify(fw));
  await ev(`document.getElementById('fillingClose').click()`);
  await sleep(500);
  s = await st();
  check('X still pockets the phone onto a visible home', s.homeVisible && s.barTitle === 'Fuel approved', JSON.stringify(s));

  console.log('\n── the guard, the beat, and the new rooms ──');
  /* The double-tap family: the second tap must die at the guard. */
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=8#fuel-approved` });
  await sleep(1400);
  await ev(`document.getElementById('fuelDone').click()`);
  await sleep(140);
  await ev(`document.getElementById('fillingClose').click()`);
  await sleep(500);
  const dfw = JSON.parse(await ev(`JSON.stringify({ fillingUp: !document.getElementById('fillingScreen').hidden, fuelUp: !document.getElementById('fuelScreen').hidden })`));
  check('double-tapped Done: the guard holds the fill screen', dfw.fillingUp && !dfw.fuelUp, JSON.stringify(dfw));
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=9#fuel-earned` });
  await sleep(1700);
  await ev(`document.getElementById('earnedCta').click()`);
  await sleep(140);
  await ev(`document.getElementById('receiptDone').click()`);
  await sleep(600);
  s = await st();
  check('double-tapped receipt stays seen', s.receiptUp, s.step);
  /* The approval survives an impatient Escape, on a visible home. */
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=10#fuel-check` });
  await sleep(2200);
  await ev(`document.getElementById('checkGo').click()`); await sleep(950);
  await ev(`document.getElementById('stepGo').click()`); await sleep(950);
  await ev(`document.getElementById('stepGo').click()`); await sleep(120);
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await sleep(300);
  s = await st();
  check('the approval beat plays on a visible home', s.homeVisible && s.fuel === 'pending', s.fuel + ' visible=' + s.homeVisible);
  await sleep(1100);
  s = await st();
  check('Escape could not kill the approval', s.fuelUp && s.fuel === 'live', s.fuel);
  /* The new rooms. */
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=11#rewards` });
  await sleep(1000);
  await ev(`document.querySelector('[data-bundle="1"]').click()`);
  await sleep(400);
  let rw = JSON.parse(await ev(`JSON.stringify({
    pts: document.getElementById('rewardsPoints').textContent,
    sent: (document.querySelector('[data-bundle="1"]')||{}).getAttribute && document.querySelector('[data-bundle="1"]').getAttribute('data-state')
  })`));
  check('a bundle spends the points', rw.pts === '1 450 pts' && rw.sent === 'sent', JSON.stringify(rw));
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=12#fuel-filling-open` });
  await sleep(1000);
  let fl = JSON.parse(await ev(`JSON.stringify({
    up: !document.getElementById('fillingScreen').hidden,
    litres: document.getElementById('fillingLitres').textContent
  })`));
  check('the watched fill shows its litres', fl.up && fl.litres === '31.4', JSON.stringify(fl));

  console.log('\n── the drawer and the pump that stopped ──');
  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=5#fuel-receipt` });
  await sleep(1200);
  await ev(`document.getElementById('receiptDone').click()`);
  await sleep(900);
  await ev(`document.querySelector('[data-tab="history"]').click()`);
  await sleep(700);
  let h = JSON.parse(await ev(`JSON.stringify({
    up: !document.getElementById('historyScreen').hidden,
    cards: document.querySelectorAll('.o-history__card').length,
    pts: (document.querySelector('.o-history__card .o-receipt__row[data-tone="points"] .o-receipt__value')||{}).textContent
  })`));
  /* Four cards: today's newly filed slip on top of the three past ones a
     returning driver carries. */
  check('Done filed the receipt into History', h.up && h.cards === 4, JSON.stringify(h));
  check('the filed slip keeps its points', h.pts === '+524 pts', h.pts);

  await send('Page.navigate', { url: `file://${STAGE}/engenxt-onboarding.html?w=6#fuel-stopped` });
  await sleep(1400);
  let ps = JSON.parse(await ev(`JSON.stringify({
    title: document.getElementById('pushTitle').textContent,
    sub: document.getElementById('pushSub').textContent,
    bar: (document.querySelector('#homeLive .m-live-bar__title')||{}).textContent
  })`));
  check('stopped-early headline is honest', ps.title === 'Fill stopped early', ps.title);
  check('partial facts in the news', ps.sub.indexOf('23.1 L') > -1 && ps.sub.indexOf('231 points') > -1, ps.sub);
  check('bar tells the same story', ps.bar === 'Fill stopped early', ps.bar);
  await ev(`document.getElementById('pushNote').click()`);
  await sleep(1600);
  check('partial medal pays for what flowed',
    await ev(`document.getElementById('earnedValue').textContent`) === '231');
  await ev(`document.getElementById('earnedCta').click()`);
  await sleep(500);
  check('partial receipt: litres of approved',
    await ev(`document.getElementById('receiptLitres').textContent`) === '23.1 Lof 60 L approved');
  check('partial receipt balance 2 681',
    await ev(`document.getElementById('receiptBalance').textContent`) === '2 681 pts');

  ws.close(); chrome.kill();
}

