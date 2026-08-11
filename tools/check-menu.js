#!/usr/bin/env node
'use strict';

/*
  Does the state rail still list every state?

  Both prototype files carry a menu, and most of it looks after itself. Each
  file builds its own sections by counting the states it is about to draw, so
  the part of the rail describing the file you are in cannot drift.

  The part describing the OTHER file can, and does. AWAY_STATES is a
  hand-written mirror of the other file's registry — every id, every label,
  copied across so the rail can offer a link to it. Nothing enforces it. Add a
  state to one file and the other file's rail silently does not have it, which
  is how number/err-server-2 came to be reachable only by typing its hash.

  So this compares:

    - every id in each file's STATES against the other file's AWAY_STATES
    - every label, character for character, because a renamed state whose menu
      row still says the old thing is worse than a missing row
    - index.html's own NAV_GROUPS against its own STATES, since that one is
      hand-written too
    - engenxt-onboarding.html's group tags, so a state filed under a group the
      rail does not draw cannot go missing

  Run it: node tools/check-menu.js
  Exits 0 when the rails agree, 1 with a report when they do not.

  No dependencies, on purpose. This repo has none and is not about to grow a
  toolchain for one script.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SIGNUP = 'index.html';
const ONBOARD = 'engenxt-onboarding.html';

/* Pull one top-level literal out of a file by its declaration.

   Brace matching rather than a regex for the whole thing, because these
   objects are hundreds of lines of nested arrays, comments and apostrophes,
   and every shortcut here would be a second parser to keep correct. */
function literal(src, declaration) {
  const at = src.indexOf(declaration);
  if (at === -1) { throw new Error(`could not find \`${declaration}\``); }
  /* Whichever bracket opens first, so this reads an array as happily as an
     object. Assuming `{` quietly returned the first flow in FLOWS instead of
     the list of them. */
  const brace = src.indexOf('{', at), bracket = src.indexOf('[', at);
  const open = bracket !== -1 && bracket < brace ? bracket : brace;
  const shut = { '{': '}', '[': ']' }[src[open]];
  let depth = 0, inStr = null, inComment = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i], next = src[i + 1];
    if (inComment) {
      if (inComment === '*' && c === '*' && next === '/') { inComment = null; i++; }
      else if (inComment === '/' && c === '\n') { inComment = null; }
      continue;
    }
    if (inStr) {
      if (c === '\\') { i++; }
      else if (c === inStr) { inStr = null; }
      continue;
    }
    if (c === '/' && (next === '*' || next === '/')) { inComment = next; i++; continue; }
    if (c === "'" || c === '"') { inStr = c; continue; }
    if (c === src[open]) { depth++; }
    else if (c === shut) { depth--; if (depth === 0) { return src.slice(open, i + 1); } }
  }
  throw new Error(`\`${declaration}\` is not closed`);
}

/* The literals hold functions that call into the app. That is fine: a function
   body is not resolved until it runs, and nothing here runs one. */
function evaluate(src, declaration) {
  return new Function(`return (${literal(src, declaration)});`)();
}

/* STATES keys in source order, with their labels. Object key order is
   insertion order for string keys, so the rail's order is preserved. */
function statesOf(src) {
  const states = evaluate(src, 'var STATES =');
  return Object.keys(states).map((id) => ({ id, label: states[id].label, group: states[id].group }));
}

const problems = [];
function fail(msg) { problems.push(msg); }

const files = {};
for (const name of [SIGNUP, ONBOARD]) {
  const src = fs.readFileSync(path.join(ROOT, name), 'utf8');
  files[name] = { src, states: statesOf(src), away: evaluate(src, 'var AWAY_STATES =') };
}

/* ── Each file's rail against the other file's registry ─────────────── */
function crossCheck(menuFile, subjectFile) {
  const claimed = files[menuFile].away[subjectFile];
  if (!claimed) { fail(`${menuFile}: AWAY_STATES has no entry for ${subjectFile}`); return; }

  const rows = [];
  for (const section of Object.keys(claimed)) {
    for (const [id, label] of claimed[section]) { rows.push({ id, label, section }); }
  }
  const real = files[subjectFile].states;
  const realById = new Map(real.map((s) => [s.id, s]));
  const rowById = new Map(rows.map((r) => [r.id, r]));

  for (const s of real) {
    if (!rowById.has(s.id)) {
      fail(`${menuFile} is missing ${subjectFile} state '${s.id}' (${s.label}) — unreachable from that rail`);
    }
  }
  for (const r of rows) {
    if (!realById.has(r.id)) {
      fail(`${menuFile} lists '${r.id}' under ${r.section}, which is not a state in ${subjectFile} — dead link`);
    } else if (realById.get(r.id).label !== r.label) {
      fail(`${menuFile} label drift for '${r.id}'\n      state: ${JSON.stringify(realById.get(r.id).label)}` +
           `\n      menu : ${JSON.stringify(r.label)}`);
    }
  }
  const dupes = rows.map((r) => r.id).filter((id, i, all) => all.indexOf(id) !== i);
  for (const id of new Set(dupes)) { fail(`${menuFile} lists '${id}' more than once`); }

  return { rows: rows.length, real: real.length };
}

const a = crossCheck(ONBOARD, SIGNUP);
const b = crossCheck(SIGNUP, ONBOARD);

/* ── index.html's own sections, which are hand-written too ──────────── */
{
  const groups = evaluate(files[SIGNUP].src, 'var NAV_GROUPS =');
  const listed = [].concat(...Object.keys(groups).map((k) => groups[k]));
  const real = files[SIGNUP].states.map((s) => s.id);
  for (const id of real) {
    if (!listed.includes(id)) { fail(`${SIGNUP}: NAV_GROUPS is missing its own state '${id}'`); }
  }
  for (const id of listed) {
    if (!real.includes(id)) { fail(`${SIGNUP}: NAV_GROUPS lists '${id}', which is not a state`); }
  }
  const dupes = listed.filter((id, i, all) => all.indexOf(id) !== i);
  for (const id of new Set(dupes)) { fail(`${SIGNUP}: NAV_GROUPS lists '${id}' more than once`); }
}

/* ── onboarding files every state under a group the rail draws ──────── */
{
  const flows = evaluate(files[ONBOARD].src, 'var FLOWS =');
  const drawn = new Set(
    flows.filter((f) => f.file === ONBOARD)
         .reduce((acc, f) => acc.concat(f.sections.map((s) => s[0])), [])
  );
  for (const s of files[ONBOARD].states) {
    if (!s.group) { fail(`${ONBOARD}: state '${s.id}' has no group, so no section draws it`); }
    else if (!drawn.has(s.group)) {
      fail(`${ONBOARD}: state '${s.id}' is grouped '${s.group}', which is not a section in FLOWS`);
    }
  }
}

/* ── Report ─────────────────────────────────────────────────────────── */
if (problems.length) {
  console.error(`\n  ${problems.length} problem${problems.length === 1 ? '' : 's'} with the state rail:\n`);
  for (const p of problems) { console.error(`    - ${p}`); }
  console.error('');
  process.exit(1);
}

console.log(`\n  State rails agree.`);
console.log(`    ${SIGNUP}: ${a.real} states, all listed by ${ONBOARD}`);
console.log(`    ${ONBOARD}: ${b.real} states, all listed by ${SIGNUP}`);
console.log('');
