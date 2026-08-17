#!/usr/bin/env node
'use strict';

/*
  The checks worth running on a prototype with no build step.

  There is no compiler here and no test runner, so the first person to find out
  a file is broken is whoever opens the deployed page. These are the three ways
  that has actually happened in this repo, cheapest first:

    1. A syntax error in the inline script. The whole page is one <script>, so
       one stray brace is not a degraded feature, it is a blank phone.

    2. An id looked up by $() that no longer exists in the markup. The element
       registry runs at load and dereferences everything it finds, so a missing
       id is a TypeError on line one and, again, a blank phone. Renaming an
       element in the markup and missing one of its lookups is a two-second
       mistake with a total outcome.

    3. The state rail falling behind. Each file lists the OTHER file's states
       from a hand-written copy, nothing enforces it, and when it drifts the
       page still works perfectly — the state is just quietly unreachable
       unless you know to type its hash. That is how number/err-server-2 hid.

  Run it: node tools/check.js
  Exits 0 when everything agrees, 1 with a report of what does not.

  No dependencies, on purpose. This repo has none and is not growing a
  toolchain for one file.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SIGNUP = 'index.html';
const ONBOARD = 'engenxt-onboarding.html';
const FILES = [SIGNUP, ONBOARD];

const problems = [];
const fail = (msg) => problems.push(msg);

/* ── Reading the files ───────────────────────────────────────────────── */

const src = {};
for (const name of FILES) { src[name] = fs.readFileSync(path.join(ROOT, name), 'utf8'); }

const scriptsOf = (s) =>
  [...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

/* Markup with the script blocks taken out.

   Ids are pulled from what is left rather than from the whole file, because
   plenty of ids appear inside JS strings that build markup later. Those exist
   eventually; they do not exist when the registry runs, which is the moment
   this check is about. */
const markupOf = (s) => s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');

/* Pull one top-level literal out by its declaration.

   Brace matching, and it tracks strings and comments as it goes, because these
   objects run to hundreds of lines of nested arrays, apostrophes in prose and
   braces inside comments. Every shortcut here is a second parser to keep
   correct. */
function literal(s, declaration) {
  const at = s.indexOf(declaration);
  if (at === -1) { throw new Error(`could not find \`${declaration}\``); }
  /* Whichever bracket opens first, so this reads an array as happily as an
     object: assuming `{` returns the first flow in FLOWS, not the list. */
  const brace = s.indexOf('{', at);
  const bracket = s.indexOf('[', at);
  const open = bracket !== -1 && (brace === -1 || bracket < brace) ? bracket : brace;
  const shut = { '{': '}', '[': ']' }[s[open]];
  let depth = 0, inStr = null, inComment = null;
  for (let i = open; i < s.length; i++) {
    const c = s[i], next = s[i + 1];
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
    if (c === s[open]) { depth++; }
    else if (c === shut) { depth--; if (depth === 0) { return s.slice(open, i + 1); } }
  }
  throw new Error(`\`${declaration}\` is not closed`);
}

/* The literals hold functions that call into the app. That is fine: a function
   body is not resolved until it runs, and nothing here runs one. */
const evaluate = (s, declaration) => new Function(`return (${literal(s, declaration)});`)();

/* ── 1. The inline script parses ─────────────────────────────────────── */

for (const name of FILES) {
  scriptsOf(src[name]).forEach((code, i) => {
    try {
      /* Compiles without running, which is the whole point: running it needs a
         DOM and would tell us nothing about the syntax. */
      new Function(code);
    } catch (e) {
      fail(`${name}: script block ${i + 1} does not parse — ${e.message}`);
    }
  });
}

/* ── 2. Every id the script looks up exists in the markup ────────────── */

for (const name of FILES) {
  const markup = markupOf(src[name]);
  const declared = new Map();
  for (const m of markup.matchAll(/\sid="([^"]+)"/g)) {
    declared.set(m[1], (declared.get(m[1]) || 0) + 1);
  }
  for (const [id, n] of declared) {
    if (n > 1) { fail(`${name}: id="${id}" is declared ${n} times — getElementById returns the first`); }
  }

  const looked = new Set();
  const script = scriptsOf(src[name]).join('\n');
  for (const m of script.matchAll(/(?:\$|document\.getElementById)\(\s*'([^']+)'\s*\)/g)) {
    looked.add(m[1]);
  }
  for (const id of looked) {
    if (!declared.has(id)) { fail(`${name}: looks up '${id}', which is in no element in the markup`); }
  }
}

/* ── 3. The state rails agree ────────────────────────────────────────── */

const parsed = {};
for (const name of FILES) {
  parsed[name] = {
    states: (() => {
      const s = evaluate(src[name], 'var STATES =');
      /* Source order, which is rail order: string keys keep insertion order. */
      return Object.keys(s).map((id) => ({ id, label: s[id].label, group: s[id].group }));
    })(),
    away: evaluate(src[name], 'var AWAY_STATES =')
  };
}

function crossCheck(menuFile, subjectFile) {
  const claimed = parsed[menuFile].away[subjectFile];
  if (!claimed) { fail(`${menuFile}: AWAY_STATES has no entry for ${subjectFile}`); return { real: 0 }; }

  const rows = [];
  for (const section of Object.keys(claimed)) {
    for (const [id, label] of claimed[section]) { rows.push({ id, label, section }); }
  }
  const real = parsed[subjectFile].states;
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
      fail(`${menuFile} label drift for '${r.id}'\n        state: ${JSON.stringify(realById.get(r.id).label)}` +
           `\n        menu : ${JSON.stringify(r.label)}`);
    }
  }
  for (const id of new Set(rows.map((r) => r.id).filter((v, i, all) => all.indexOf(v) !== i))) {
    fail(`${menuFile} lists '${id}' more than once`);
  }
  return { real: real.length };
}

const counts = {
  [SIGNUP]: crossCheck(ONBOARD, SIGNUP),
  [ONBOARD]: crossCheck(SIGNUP, ONBOARD)
};

/* index.html builds its own sections from a hand-written id list too. */
{
  const groups = evaluate(src[SIGNUP], 'var NAV_GROUPS =');
  const listed = Object.keys(groups).flatMap((k) => groups[k]);
  const real = parsed[SIGNUP].states.map((s) => s.id);
  for (const id of real) {
    if (!listed.includes(id)) { fail(`${SIGNUP}: NAV_GROUPS is missing its own state '${id}'`); }
  }
  for (const id of listed) {
    if (!real.includes(id)) { fail(`${SIGNUP}: NAV_GROUPS lists '${id}', which is not a state`); }
  }
  for (const id of new Set(listed.filter((v, i, all) => all.indexOf(v) !== i))) {
    fail(`${SIGNUP}: NAV_GROUPS lists '${id}' more than once`);
  }
}

/* The onboarding rail derives its sections from each state's group, so a state
   filed under a group no section draws is invisible without being missing. */
{
  const flows = evaluate(src[ONBOARD], 'var FLOWS =');
  const drawn = new Set(
    flows.filter((f) => f.file === ONBOARD).flatMap((f) => f.sections.map((s) => s[0]))
  );
  for (const s of parsed[ONBOARD].states) {
    if (!s.group) { fail(`${ONBOARD}: state '${s.id}' has no group, so no section draws it`); }
    else if (!drawn.has(s.group)) {
      fail(`${ONBOARD}: state '${s.id}' is grouped '${s.group}', which is not a section in FLOWS`);
    }
  }
}

/* ── 4. The two files agree about the tokens ─────────────────────────── */

/* The scale in engenxt-onboarding.html is a copy of the one in index.html,
   taken verbatim so the two flows cannot disagree about a colour or a step of
   the spacing scale. Nothing enforced that, and it drifted twice:

     - Three contrast annotations were corrected on one side only. Harmless in
       itself, comments, but the block exists precisely so that reading it in
       one file tells you the truth about the other.

     - The whole large-text ramp was in index.html and missing here. Both files
       carry the Large text switch in the sidebar, so the attribute went on and
       forty-nine screens ignored it: a control that looked like it worked and
       tested nothing, on the accessibility mode a driver reading a pump screen
       in the sun is most likely to reach for.

   Comments are stripped before comparing, so a note about one file's own
   surfaces is allowed to differ; names and values are not. Only the product
   scale: each file's --d- layer is its own tooling and is expected to differ. */
function productTokens(s) {
  const out = new Map();
  for (const m of s.matchAll(/(?:^|[^-\w])(:root|\[data-text="large"\])\s*\{/g)) {
    const open = s.indexOf('{', m.index);
    /* No nested braces inside a token block, so the first close is the end. */
    const body = s.slice(open + 1, s.indexOf('}', open)).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const d of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+)/g)) {
      if (d[1].startsWith('--d-')) { continue; }
      out.set(`${m[1]} ${d[1]}`, d[2].trim().replace(/\s+/g, ' '));
    }
  }
  return out;
}

{
  const a = productTokens(src[SIGNUP]);
  const b = productTokens(src[ONBOARD]);
  for (const [k, v] of a) {
    if (!b.has(k)) { fail(`${ONBOARD} is missing \`${k}\`, which ${SIGNUP} declares — the scale is meant to be a verbatim copy`); }
    else if (b.get(k) !== v) {
      fail(`token drift for \`${k}\`\n        ${SIGNUP} : ${v}\n        ${ONBOARD}: ${b.get(k)}`);
    }
  }
  for (const k of b.keys()) {
    if (!a.has(k)) { fail(`${ONBOARD} declares \`${k}\`, which ${SIGNUP} does not — the scale is meant to be a verbatim copy`); }
  }
  counts.tokens = a.size;
}

/* Away links are written straight into an href, so a flow naming a file that
   is not in the repo is a rail full of 404s. This has happened once already. */
for (const name of FILES) {
  for (const flow of evaluate(src[name], 'var FLOWS =')) {
    if (!fs.existsSync(path.join(ROOT, flow.file))) {
      fail(`${name}: FLOWS points at '${flow.file}', which is not a file in the repo`);
    }
  }
}

/* ── Report ──────────────────────────────────────────────────────────── */

if (problems.length) {
  console.error(`\n  ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);
  for (const p of problems) { console.error(`    - ${p}`); }
  console.error('');
  process.exit(1);
}

console.log('\n  All checks pass.');
console.log(`    ${SIGNUP}: ${counts[SIGNUP].real} states, all listed by ${ONBOARD}`);
console.log(`    ${ONBOARD}: ${counts[ONBOARD].real} states, all listed by ${SIGNUP}`);
console.log('    scripts parse, every looked-up id exists, no duplicate ids');
console.log(`    ${counts.tokens} product tokens, identical in both files\n`);
