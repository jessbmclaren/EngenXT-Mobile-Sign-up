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
let docsSummary = '';
let docsStructure = '';
let cssBlocks = new Map();

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

/* ── Finding the stylesheet ──────────────────────────────────────────────
   A page's CSS used to be one inline <style>. index.html now links it in
   layers instead, so every gate below would have found an empty stylesheet
   and passed on nothing at all - which is worse than failing.

   This returns exactly what those gates were written against: the page's own
   CSS as one flat string. Inline blocks still count, linked files are read in
   link order, and the @layer wrapper is unwrapped so a rule sits at the same
   brace depth it did when it was inline. Nothing is filtered and nothing is
   relaxed; the assertions are unchanged and simply see the whole sheet again.

   Unwrapping matters more than it looks. Two gates read only depth-zero rules
   to tell a bare element selector from one nested in a media query, and every
   rule in a linked file is one level deeper than it used to be. Left wrapped,
   the base-layer gate would have quietly stopped seeing anything. */
function cssOf(name) {
  const page = src[name];
  let out = [...page.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const base = path.dirname(path.join(ROOT, name));
  for (const m of page.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)) {
    const href = (m[0].match(/href="([^"]+)"/) || [])[1];
    if (!href || /^(https?:)?\/\//.test(href)) { continue; }
    const file = path.join(base, href);
    if (!fs.existsSync(file)) {
      fail(`${name}: links '${href}', which is not a file in the repo`);
      continue;
    }
    out += '\n' + fs.readFileSync(file, 'utf8');
  }
  return unwrapLayers(out);
}

/* Remove `@layer name {` and its matching close, leaving the rules inside at
   the depth they were written at. A layer statement - `@layer a, b;` - has no
   block and simply goes. */
function unwrapLayers(css) {
  let out = '', i = 0;
  while (i < css.length) {
    const m = /^@layer\s+([^;{]*)([;{])/.exec(css.slice(i));
    if (!m) { out += css[i]; i++; continue; }
    if (m[2] === ';') { i += m[0].length; continue; }
    let depth = 0, j = i + m[0].length - 1;
    for (; j < css.length; j++) {
      if (css[j] === '{') { depth++; }
      else if (css[j] === '}') { depth--; if (!depth) { break; } }
    }
    out += css.slice(i + m[0].length, j);
    i = j + 1;
  }
  return out;
}

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
/* The sanctioned token scopes. A future theme block - [data-theme="dark"],
   a second brand - must be added HERE to be gated; an all-token block under
   any other selector fails below rather than silently escaping the gate.
   Known debt, carried on purpose: byte-identical union means each file
   carries tokens only the other uses; the trigger to split the scale into
   shared-plus-local is a third flow joining the pair. */
const TOKEN_SCOPES = [':root', '[data-text="large"]'];

function productTokens(s) {
  const out = new Map();
  const scopes = TOKEN_SCOPES.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, (ch) => '\\' + ch)).join('|');
  for (const m of s.matchAll(new RegExp('(?:^|[^-\\w])(' + scopes + ')\\s*\\{', 'g'))) {
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
  /* The scale is linked now, not inlined, so it is read through cssOf
     like every other gate rather than scraped off the page source. */
  const a = productTokens(cssOf(SIGNUP));
  const b = productTokens(cssOf(ONBOARD));
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

  /* Any OTHER block that is only custom properties is a token block the
     gate cannot see - a theme landing outside the sanctioned scopes. */
  for (const name of FILES) {
    const css = cssOf(name).replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim().replace(/\s+/g, ' ');
      if (TOKEN_SCOPES.includes(sel) || sel.startsWith('@')) { continue; }
      const decls = m[2].split(';').map((d) => d.trim()).filter(Boolean);
      if (decls.length >= 3 && decls.every((d) => d.startsWith('--'))) {
        fail(name + ": '" + sel + "' is a token block outside the sanctioned scopes - add it to TOKEN_SCOPES or it escapes the parity gate");
      }
    }
  }

  /* The large-text ramp must cover the whole type scale: a token missing
     there silently refuses to grow for the driver who asked for large. */
  for (const [k] of a) {
    const t = k.match(/^:root (--text-[\w-]+)$/);
    if (t && !a.has('[data-text="large"] ' + t[1])) {
      fail(SIGNUP + ': ' + t[1] + ' has no [data-text="large"] value - the ramp misses it');
    }
  }

  /* Component CSS may not restate colours the scale already owns. Token
     scopes are cut out first; what remains must speak var(). The named
     exceptions are optics, each with its reason. */
  const COLOUR_ALLOWED = [
    'mask-image',                    /* alpha masks: #000 is a curve, not a colour */
    'rgba(255,255,255,0.55)',        /* the skeleton's sheen, an optic on the sunken grey */
    'background: #FFFFFF',           /* the QR quiet zone must be spec-white, not theme-white */
  ];
  for (const name of FILES) {
    let css = cssOf(name);
    for (const scope of TOKEN_SCOPES) {
      let i;
      while ((i = css.indexOf(scope + ' {')) !== -1) {
        const open = css.indexOf('{', i);
        const close = css.indexOf('}', open);
        css = css.slice(0, i) + css.slice(close + 1);
      }
    }
    css = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
    css.split('\n').forEach((l) => {
      if (!/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/.test(l)) { return; }
      if (COLOUR_ALLOWED.some((ok) => l.includes(ok))) { return; }
      fail(name + ': raw colour outside the scale - ' + l.trim().slice(0, 80));
    });
    /* z-index speaks the layer tokens; a bare integer up to 3 is a sibling
       raise inside one component, which the z comment sanctions. */
    for (const m of css.matchAll(/z-index:\s*([^;]+);/g)) {
      const v = m[1].trim();
      if (v.startsWith('var(--z') || (/^-?[0-3]$/.test(v))) { continue; }
      fail(name + ': z-index ' + v + ' is neither a layer token nor a sanctioned sibling raise (0-3)');
    }
  }

  /* The README's headline numbers are computed here; they may not drift. */
  {
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    const want = (counts[SIGNUP].real + counts[ONBOARD].real) + ' states, not just the happy path: ' +
      counts[SIGNUP].real + ' in sign-up and ' + counts[ONBOARD].real + ' in the app.';
    if (!readme.includes(want)) {
      fail('README.md: the state counts line does not read "' + want + '" - it drifted from the rails');
    }
  }
}

/* ── 5. The words stay plain ─────────────────────────────────────────── */

/* The copy standard is written for a reader working in their second, third
   or fourth language, and it has drifted twice already: "sort it out" and
   the authorise/verify/biometric family all shipped, were caught by a review
   rather than a tool, and were replaced by the flow's own plainer words.
   This gate holds the line the review drew.

   It scans what a person can meet - string literals in the scripts and text
   in the markup, comments stripped - never identifiers, so offerBiometrics
   the function is fine and "biometric" the word is not. Sentence length is
   deliberately not gated: it needs judgement, and a gate that cries wolf
   gets deleted. The rail ids for the biometrics states are allowed by name:
   they are tooling, and renaming them would break every listed link. */

const BANNED = [
  { re: /\bauthori[sz]\w*/i, why: 'use "approve", the flow\u2019s own word' },
  { re: /\bverif\w*/i, why: 'use "check" or "code we send you"' },
  { re: /\bbiometric\w*/i, why: 'name the thing: "face or fingerprint"' },
  { re: /sort (it|this|that) out/i, why: 'idiom; use "fix it"' },
  { re: /\bgo once more\b/i, why: 'idiom; use "scan once more"' },
  { re: /pays? you back/i, why: 'reads as promise or threat; state the fact' },
];
const COPY_ALLOWED = [
  /^[a-z0-9-]+\/[a-z0-9-]+$/,   // rail ids are tooling: code/verifying, biometrics/waiting
  /^biometrics$/,                // the stage's machine name, compared and published as data-stage
  /^close, verify$/,             // the contrast inspector's own vocabulary (d- layer)
];

function stripJsComments(code) {
  /* The m flag matters: without it only the first line's // was stripped, an
     apostrophe in any later comment paired with one in real code, and the
     scanner read fabricated strings that were never strings. */
  return code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/gm, '$1');
}

for (const name of FILES) {
  /* Literals out of the scripts. A simple matcher is enough here: it may
     also catch a regex body or a selector, and that is fine - those should
     not contain banned words either. */
  const texts = [];
  for (const code of scriptsOf(src[name])) {
    let clean = stripJsComments(code);
    /* The spec panel documents the machine, and documentation must name the
       stages and states it documents. Its whole literal comes out of the
       scan rather than each of its lines onto an allowlist. */
    try {
      const spec = literal(clean, 'var RECIPES =');
      clean = clean.replace(spec, ' ');
    } catch (e) { /* file without a panel */ }
    for (const m of clean.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) {
      texts.push(m[1] !== undefined ? m[1] : m[2]);
    }
  }
  /* Text out of the markup: tags and comments dropped, what remains is what
     is read. */
  /* Styles out first: their comments are rationale for maintainers, and a
     driver can no more read a CSS comment than a JS one. */
  const markupNoStyle = markupOf(src[name])
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  /* Attribute text is read aloud or shown too: an aria-label is COPY, and
     for a screen-reader user it is the only copy. It was shipping
     unscanned. */
  for (const m of markupNoStyle.matchAll(/(?:aria-label|placeholder|title|alt)="([^"]*)"/g)) {
    texts.push(m[1]);
  }
  texts.push(...markupNoStyle.replace(/<[^>]+>/g, '\n').split('\n'));

  for (const t of texts) {
    const trimmed = t.trim();
    if (!trimmed) { continue; }
    if (COPY_ALLOWED.some((rx) => rx.test(trimmed))) { continue; }
    for (const b of BANNED) {
      const hit = trimmed.match(b.re);
      if (hit) {
        fail(`${name}: copy uses "${hit[0]}" (${b.why}) \u2014 in: ${JSON.stringify(trimmed.slice(0, 70))}`);
        break;
      }
    }
  }
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



/* ── The shared library gate ─────────────────────────────────────────
   The files share the atom library by copy, on the promise the copy is
   verbatim. Tokens got this gate first and stopped drifting; the atoms
   had only the promise, and it failed at least once - the forced-colors
   law and the status bar's offline affordance reached one file only.
   Every rule that styles a manifest block must now be byte-identical
   across the pair, allowing the divergences that are deliberate and
   written down here. */

const SHARED_BLOCKS = [
  'a-btn', 'a-link', 'a-icon-wrap', 'a-handle', 'a-spinner',
  'a-notch', 'm-notch', 'm-status-bar', 'm-brand-lockup',
  't-device-frame', 'u-visually-hidden',
];
/* THE REGISTER of deliberate one-sidedness. Every entry is a decision
   with its reason; an absence here means "forgot to copy", and the gate
   treats it that way. Comparison is comment-stripped by design: the
   declarations are the shared truth, rationale lives where it was
   written. */
const SHARED_DIVERGENCE = new Set([
]);
/* Selectors a file may EXTEND with extra rules of its own - the shared
   base rule is still compared verbatim. Onboarding raises the device
   chrome above its full-screen overlays; index has no such overlays. */
const SHARED_EXTENSION = new Set(['.m-notch', '.m-status-bar']);

function sharedRules(name) {
  const css = cssOf(name)
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  const rules = new Map();
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = m[2].trim().replace(/\s+/g, ' ');
    /* Grouped selectors compare per selector, so one file grouping what
       the other writes singly is not read as drift. */
    for (let sel of m[1].split(',')) {
      sel = sel.trim().replace(/\s+/g, ' ');
      if (!sel || sel.startsWith('@')) { continue; }
      /* Library rules only. A screen styling a shared atom inside itself
         is the screen's own business (the context-override policy), not
         the library's: every class in the selector must belong to the
         manifest for the rule to be the library's. Tooling overlays are
         not the library either. */
      if (sel.includes('[data-layers') || sel.includes('[class')) { continue; }
      const classes = [...sel.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((c) => c[1]);
      if (!classes.length) { continue; }
      const root = (c) => c.split('__')[0].split('--')[0];
      if (!classes.every((c) => SHARED_BLOCKS.includes(root(c)))) { continue; }
      if (!rules.has(sel)) { rules.set(sel, []); }
      rules.get(sel).push(body);
    }
  }
  return rules;
}
{
  const a = sharedRules(SIGNUP), b = sharedRules(ONBOARD);
  for (const [sel, bodies] of a) {
    if (SHARED_DIVERGENCE.has(sel)) { continue; }
    if (!b.has(sel)) { fail(`shared library: '${sel}' is styled in ${SIGNUP} but not in ${ONBOARD}`); continue; }
    if (bodies.join('|') !== b.get(sel).join('|')) {
      const one = bodies, two = b.get(sel);
      const subset = (x, y) => x.every((v) => y.includes(v));
      if (SHARED_EXTENSION.has(sel) && (subset(one, two) || subset(two, one))) { continue; }
      fail(`shared library: '${sel}' drifted between the files`);
    }
  }
  for (const sel of b.keys()) {
    if (!a.has(sel) && !SHARED_DIVERGENCE.has(sel)) {
      fail(`shared library: '${sel}' is styled in ${ONBOARD} but not in ${SIGNUP}`);
    }
  }
  /* The high-contrast law must exist on both sides, not one. */
  for (const name of FILES) {
    if (!/@media \(forced-colors: active\)/.test(cssOf(name))) {
      fail(`${name}: no @media (forced-colors: active) block - colour-only states have no restatement`);
    }
  }
}

/* ── The base layer ───────────────────────────────────────────────────
   The gate above compares only rules whose every class roots into the
   manifest, and it drops any selector with no class at all before it
   starts. That is most of a stylesheet's foundation: the element reset,
   the focus policy, the box-sizing law, what a button inherits.

   It cost a real bug. `input, button, a { font-family: inherit; }` and
   `button { ... color: inherit; }` lived in one file and not the other, so
   every one of seventy-seven buttons in the app rendered in the UA's Arial
   at the right size and the right weight - and this gate went on certifying
   a-btn byte-identical the whole time, truthfully, because the atom's own
   rule really was identical. The difference was in a rule it could not see.

   So the bare-element rules are compared too. Same shape as the library
   gate: per selector, comment-stripped, declaration bodies compared. A
   selector one file needs and the other genuinely does not goes in
   BASE_DIVERGENCE with its reason, the way SHARED_DIVERGENCE works. */
const BASE_DIVERGENCE = new Set([
]);

function baseRules(name) {
  const css = cssOf(name)
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  const rules = new Map();
  /* Depth-tracked, because the reset layer is top level and nothing else
     here is. A flat regex reads the steps inside @keyframes as bare element
     selectors - `from`, `to`, `50%` - and reads a rule inside @media as
     though it stood beside its unconditioned twin. Only depth 0 is the
     foundation; everything nested belongs to its at-rule. */
  let depth = 0, i = 0, chunk = '';
  while (i < css.length) {
    const ch = css[i];
    if (ch === '{') {
      if (depth === 0) {
        const close = (() => {
          let d = 0;
          for (let j = i; j < css.length; j++) {
            if (css[j] === '{') { d++; }
            else if (css[j] === '}') { d--; if (!d) { return j; } }
          }
          return -1;
        })();
        const sels = chunk.trim();
        const body = close === -1 ? '' : css.slice(i + 1, close);
        /* An at-rule's own block is not a rule; skip past it whole. */
        if (!sels.startsWith('@') && !/[{}]/.test(body)) {
          const flat = body.trim().replace(/\s+/g, ' ');
          for (let sel of sels.split(',')) {
            sel = sel.trim().replace(/\s+/g, ' ');
            /* Bare element selectors only: no class, no id, no attribute.
               `*` and `:focus-visible` count - they are foundation too. */
            if (!sel || /[.#\[]/.test(sel)) { continue; }
            if (!rules.has(sel)) { rules.set(sel, []); }
            rules.get(sel).push(flat);
          }
        }
        i = close === -1 ? css.length : close + 1;
        chunk = '';
        continue;
      }
      depth++;
    } else if (ch === '}') { depth--; }
    chunk += ch;
    i++;
  }
  return rules;
}
{
  const a = baseRules(SIGNUP), b = baseRules(ONBOARD);
  const seen = new Set([...a.keys(), ...b.keys()]);
  for (const sel of seen) {
    if (BASE_DIVERGENCE.has(sel)) { continue; }
    if (!a.has(sel)) { fail(`base layer: '${sel}' is styled in ${ONBOARD} but not in ${SIGNUP}`); continue; }
    if (!b.has(sel)) { fail(`base layer: '${sel}' is styled in ${SIGNUP} but not in ${ONBOARD}`); continue; }
    if (a.get(sel).join('|') !== b.get(sel).join('|')) {
      fail(`base layer: '${sel}' drifted between the files\n        ${SIGNUP} : ${a.get(sel).join(' | ')}\n        ${ONBOARD}: ${b.get(sel).join(' | ')}`);
    }
  }
}



/* ── The recipe census ───────────────────────────────────────────────
   The spec panel documents components by name, and a recipe naming a
   class that no longer exists is documentation lying with confidence. */
{
  try {
    const spec = literal(stripJsComments(scriptsOf(src[SIGNUP]).join('\n')), 'var RECIPES =');
    const css = cssOf(SIGNUP);
    for (const m of spec.matchAll(/name: '\.([\w-]+)'/g)) {
      /* identity class: the a-field shell carries the declarations,
         per the naming gate's register */
      if (m[1] === 'm-phone-field') { continue; }
      if (!new RegExp('\\.' + m[1] + '(?![\\w-])').test(css)) {
        fail(SIGNUP + ": the spec panel documents '." + m[1] + "' but no rule styles it - the recipe is lying");
      }
    }
  } catch (e) { /* a build without the panel */ }
}

/* ── The focus gate ──────────────────────────────────────────────────
   Every function that walks the driver into a new room must take focus
   with it, or carry a written no-focus reason. The filling screen
   shipped without the step once; this is the invariant as a test. */
for (const name of FILES) {
  for (const code of scriptsOf(src[name])) {
    /* Length-preserving masks, so brace-walking cannot be derailed by a
       brace in a string or an apostrophe in a comment, and body offsets
       still line up with the original for the annotation check. */
    const masked = code
      .replace(/\/\*[\s\S]*?\*\//g, (m2) => m2.replace(/[^\n]/g, ' '))
      .replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, (m2) => ' '.repeat(m2.length));
    for (const m of masked.matchAll(/function (\w+)\([^)]*\)\s*\{/g)) {
      let depth = 1; let i = m.index + m[0].length; const start = i;
      while (i < masked.length && depth) {
        if (masked[i] === '{') { depth++; }
        if (masked[i] === '}') { depth--; }
        i++;
      }
      const body = masked.slice(start, i);
      if (!/S\.step\s*=(?!=)/.test(body)) { continue; }
      if (/\.focus\(/.test(body) || /no-focus:/.test(code.slice(start, i))) { continue; }
      fail(`${name}: ${m[1]}() moves S.step but never moves focus - add the focus step or a /* no-focus: reason */`);
    }
  }
}

/* ── The axis gate ───────────────────────────────────────────────────
   The data-* vocabulary is the component API, and it drifted into
   private dialects twice before this manifest existed (tones nobody
   else spoke, booleans saying "on"). Closed axes list every value the
   contract names; a value outside the list fails, and an axis that is
   neither closed nor declared open fails as undeclared. Values built
   from expressions are invisible here - the gate guards the written
   vocabulary, which is where the drift happened. */

const AXES = {
  tone: ['error', 'info', 'locked', 'onDark', 'success', 'warning'],
  face: ['done', 'offline', 'pump', 'refused', 'running', 'waiting'],
  expired: ['true'],
  phase: ['done', 'filling'],
  outcome: ['fail', 'pass', 'skipped'],
  verdict: ['block', 'clear'],
  motion: ['in', 'off', 'pop', 'reduced', 'still', 'system'],
  net: ['offline', 'online'],
  keyboard: ['open'],
  text: ['default', 'large'],
  width: ['320', '360', '375'],
  stage: ['blocked', 'number'],
  step: ['account'],
  state: ['active', 'arriving', 'can', 'closing', 'crossing', 'delivered', 'empty', 'error', 'failed',
          'filled', 'in', 'landed', 'leaving', 'on', 'opening', 'out',
          'pending', 'processing', 'sent', 'short', 'visible'],
  tab: ['account', 'fuel', 'history', 'home'],
  tile: ['rewards'],
  allowed: ['false'],
  lead: ['true'], loading: ['true'], open: ['true'], peek: ['true'],
  pulse: ['true'], shake: ['true'], single: ['true'], snap: ['true'], still: ['true'],
  more: ['true'],
};
/* Axes whose values are data or tooling, not vocabulary. */
const AXES_OPEN = ['act', 'bundle', 'chip', 'copy', 'count', 'fuel', 'grid',
  'heading', 'inspect', 'layers', 'level', 'mode', 'panel', 'pin', 'result',
  'sort', 'spec', 'state-id', 'station', 'unbuilt'];

for (const name of FILES) {
  const found = [];
  for (const m of src[name].matchAll(/data-([a-z][a-z-]*)="([a-z0-9-]+)"/g)) { found.push([m[1], m[2]]); }
  for (const m of src[name].matchAll(/setAttribute\('data-([a-z][a-z-]*)',\s*'([a-z0-9-]+)'\)/g)) { found.push([m[1], m[2]]); }
  const seen = new Set();
  for (const [axis, value] of found) {
    const key = axis + '=' + value;
    if (seen.has(key)) { continue; }
    seen.add(key);
    if (AXES[axis]) {
      if (!AXES[axis].includes(value)) {
        fail(`${name}: data-${axis}="${value}" is not in the axis manifest - a new dialect, or the manifest needs the word`);
      }
    } else if (!AXES_OPEN.includes(axis)) {
      fail(`${name}: data-${axis} is an undeclared axis - add it to AXES (closed) or AXES_OPEN (data/tooling)`);
    }
  }
}

/* ── The naming gate ─────────────────────────────────────────────────
   Brad Frost's layers and BEM as law rather than review. Every class in
   markup, styles and built strings must be shaped like the system: a
   layer prefix, a kebab-case block, at most one element, camelCase for
   multi-word parts, and no state spelled as a class. Dead names fail in
   both directions, because a styled class nobody renders and a rendered
   class nobody styles are the two ways a system stops being one. The d-
   layer is tooling: shape-checked, excused from the rest. */

const CLASS_SHAPE =
  /^(a|m|o|t|p|u)-[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z][a-zA-Z0-9]*)?(?:--[a-z][a-zA-Z0-9]*)?$/;
/* Tooling keeps its own furniture: camelCase blocks are its convention. */
const TOOL_SHAPE =
  /^d-[a-zA-Z][a-zA-Z0-9]*(?:__[a-z][a-zA-Z0-9]*)?(?:--[a-z][a-zA-Z0-9]*)?$/;
/* Words that make a modifier a state. States ride data-*. */
const STATE_MODS =
  /--(active|open|closed|on|off|visible|hidden|selected|current|disabled|loading|waiting|filling|sent|short|done|err|error|ok|success)$/;
/* Names allowed to exist on one side only, each with its reason. */
const STYLED_ONLY = new Set([
  /* The atom library is copied whole between the files, so a variant one
     file has not reached for yet is library, not death. */
  'a-btn--onDark', 'a-btn--outlineOnDark', 'a-link', 'a-link--quiet', 'a-link--flush', 'a-link--onDark',
  'a-icon-wrap--lg', 'a-icon-wrap--mark', 'a-icon-wrap--onDark', 'a-icon-wrap--bare',
  'm-brand-lockup__tag',
  'm-brand-lockup--onDark',
]);
const USED_ONLY = new Set([
  /* the molecule's identity over the a-field shell; the shell carries
     the declarations */
  'm-phone-field',
]);
/* `space` is the semantic spacing layer: names for what a gap is FOR, each
   pointing at a step of the `sp` reference scale. `keyboard` is the one
   runtime-owned property, written by the page and read by three layers.
   Both are listed separately from `sp` because `--space-` and `--keyboard-`
   share no prefix boundary with it. */
const TOKEN_FAMILY = /^--(color|glass|gradient|kb|font|text|weight|leading|tracking|radius|shadow|sp|space|size|press|z|ease|dur|keyboard|d)-/;

for (const name of FILES) {
  const styleBlocks = cssOf(name);
  const styleNoComments = styleBlocks.replace(/\/\*[\s\S]*?\*\//g, ' ');

  /* Classes the stylesheets style. */
  const styled = new Set();
  for (const m of styleNoComments.matchAll(/\.([a-zA-Z][\w-]*)/g)) { styled.add(m[1]); }

  /* Classes the page or its scripts actually put on elements, plus the
     ones scripts look up as selectors. */
  const used = new Set();
  const markup = markupOf(src[name]).replace(/<style[\s\S]*?<\/style>/g, ' ');
  for (const m of markup.matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) { if (c) { used.add(c); } }
  }
  for (const code of scriptsOf(src[name])) {
    const clean = stripJsComments(code);
    for (const m of clean.matchAll(/class=\\?"([^"\\]+)\\?"/g)) {
      for (const c of m[1].split(/\s+/)) { if (c) { used.add(c); } }
    }
    for (const m of clean.matchAll(/['"]\.([a-z]-[\w-]+)/g)) { used.add(m[1]); }
  }

  const every = new Set([...styled, ...used]);
  for (const c of every) {
    if (!/^(a|m|o|t|p|u|d)-/.test(c)) { continue; }   /* layerless names have no contract here */
    if (c.startsWith('d-')) {
      if (!TOOL_SHAPE.test(c)) {
        fail(`${name}: tooling class '${c}' is not shaped like the d- layer`);
      }
      continue;                                        /* tooling: shape only */
    }
    if (!CLASS_SHAPE.test(c)) {
      fail(`${name}: class '${c}' is not shaped like the system (layer-kebab-block__camelElement--camelModifier)`);
      continue;
    }
    if (STATE_MODS.test(c)) {
      fail(`${name}: class '${c}' spells state as a modifier \u2014 state is never a class, it rides data-*`);
    }
    if (styled.has(c) && !used.has(c) && !STYLED_ONLY.has(c)) {
      fail(`${name}: '${c}' is styled but never appears on an element \u2014 a dead name, or a missing use`);
    }
    if (used.has(c) && !styled.has(c) && !USED_ONLY.has(c)) {
      fail(`${name}: '${c}' is on elements but no rule styles it \u2014 a dead name, or a missing rule`);
    }
  }

  /* Token definitions stay inside the sanctioned families. */
  for (const m of styleNoComments.matchAll(/^\s*(--[a-z][\w-]*)\s*:/gm)) {
    if (!TOKEN_FAMILY.test(m[1])) {
      fail(`${name}: token '${m[1]}' belongs to no sanctioned family (--color- --sp- --space- --text- --weight- --leading- --tracking- --press- --radius- --size- --shadow- --z- --dur- --ease- --glass- --gradient- --font- --kb- --keyboard- --d-)`);
    }
  }
}

/* ── Leave when the destination is the task; never at the pump ──────
   The owner's rule in its true shape. A driver stuck in sign-up needs a
   human, and a prepared message nobody can send is theatre - so those doors
   open WhatsApp with the words already written, and reading the code means
   going where the code is. Sign-up is all destination.

   The app is not. Once a driver is holding a fuel code or watching a fill,
   the screen IS the task: an attendant is waiting, a queue is behind them,
   and an app switch on a work phone with no data may not come back. Nothing
   in the app file may navigate out, and the two escalations it does offer
   hand their message over in place.

   The one sanctioned move is the handover between these two files, which is
   the app walking through itself rather than out of itself. */
const AT_THE_PUMP = ONBOARD;
for (const [name, whole] of Object.entries(src)) {
  const body = whole.replace(/<!--[\s\S]*?-->/g, "");
  if (name === AT_THE_PUMP) {
    if (/target\s*=\s*"_blank"/.test(body)) {
      fail(`${name}: a control opens another app - at the pump the driver stays on the screen`);
    }
    if (/window\.open\s*\(/.test(body)) {
      fail(`${name}: window.open leaves the app - at the pump the driver stays on the screen`);
    }
    for (const m of body.matchAll(/href\s*=\s*"(https?:|tel:|mailto:)/g)) {
      fail(`${name}: an href to '${m[1]}' navigates away from a live fill`);
    }
  }
  for (const m of body.matchAll(/location\.href\s*=\s*'([^']*)'/g)) {
    if (!/^engenxt-onboarding\.html|^index\.html/.test(m[1])) {
      fail(`${name}: location.href to '${m[1]}' leaves the prototype`);
    }
  }
}
/* ── Report ───────────────────────────────────────── */

/* ── The composition gate ────────────────────────────────────────────
   "A parent may never RESTYLE a child's insides. A child that needs to
   look different in a context carries a modifier for it."

   That law is written on the Rules tab of the design panel and repeated
   in the comments of both files, and until now it was enforced by
   whoever happened to be reading. It is also the single law this
   codebase has broken most: the verdict pill that owned none of its own
   colour, the brand lockup painted by home, the outline button
   recoloured by the scanner - three components that could not be lifted
   out of the screen they were written in, all the same mistake.

   It is the mistake a person new to design systems makes first and
   notices last, because the screen looks right. So it is checked.

   A parent placing a child is fine and expected - where a thing sits is
   the parent's business. What the thing IS - its colour, its edge, its
   type - belongs to the thing. The split below is that sentence as a
   list. */

const APPEARANCE = new Set([
  'color', 'background', 'background-color', 'background-image',
  'border', 'border-color', 'border-width', 'border-style', 'border-radius',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width',
  'box-shadow', 'font-size', 'font-weight', 'font-family', 'font-style',
  'letter-spacing', 'line-height', 'text-transform', 'text-decoration',
  'fill', 'stroke', 'backdrop-filter', '-webkit-backdrop-filter',
]);

/* Every one of these is a decision, not an oversight. An absence here is
   read as the mistake it usually is, so an entry has to earn its place with
   a reason someone else can check.

   All four are the device frame, and the device frame is the one parent
   whose job genuinely includes changing what its children are. It is not a
   screen dressing a component: it is the hardware, and the hardware decides
   whether this is an iPhone with a notch or an Android with a pill, and how
   much room is left when a keyboard is up. A component cannot carry a
   modifier for that, because it is not the component's fact. */
const COMPOSITION_ALLOWED = new Set([
  /* The Android width has no notch: the same cut-out becomes a pill, and
     that is the device being a different device rather than the frame
     restyling a part. */
  '.t-device-frame[data-width="360"] .a-notch',
  /* The compression order, written down at length beside the sheet: when
     the keyboard takes half the screen something has to give, and the frame
     is the only thing that knows the keyboard is there. The sheet squares
     its corners and the hero's title steps down a size. */
  '.t-device-frame[data-keyboard="open"] .o-signup-sheet',
  '.t-device-frame:has(.o-signup-sheet[data-stage]) .o-auth-hero__title',
]);

const blockOf = (cls) => cls.split('__')[0].split('--')[0];

/* Ink is the one property a component may deliberately not own.

   Several atoms here declare no `color` at all and take it from whatever
   they are placed in - a-icon-wrap does it so the plate's glyph matches the
   row it sits in, and the verdict's mark does it so the ring that leaves it
   is the verdict's hue. Setting the colour those children were designed to
   inherit is composition, not restyling: the child chose to ask.

   So `color` only counts against a parent when the child declares a colour
   of its own somewhere. Everything else on the appearance list counts
   always, because nothing inherits a border or a shadow. */
function declaresOwnColour(target) {
  const esc = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const own = new RegExp('^\\.' + esc + '(\\[[^\\]]*\\])?(:[a-z-]+)?$');
  for (const name of FILES) {
    const css = cssOf(name).replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (let sel of m[1].split(',')) {
        sel = sel.trim().replace(/\s+/g, ' ');
        if (own.test(sel) && /(^|;)\s*color\s*:/.test(m[2])) { return true; }
      }
    }
  }
  return false;
}

{
  for (const name of FILES) {
    const css = cssOf(name).replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const decls = m[2];
      for (let sel of m[1].split(',')) {
        sel = sel.trim().replace(/\s+/g, ' ');
        if (!sel || sel.startsWith('@') || sel.includes('.d-')) { continue; }
        if (COMPOSITION_ALLOWED.has(sel)) { continue; }
        /* Descendant selectors only: one compound is a block styling
           itself, which is its own business. */
        const compounds = sel.split(/\s+|\s*>\s*/).filter(Boolean);
        if (compounds.length < 2) { continue; }
        const first = (compounds[0].match(/\.([a-z]-[\w-]*)/) || [])[1];
        const last = (compounds[compounds.length - 1].match(/\.([a-z]-[\w-]*)/) || [])[1];
        if (!first || !last) { continue; }
        if (blockOf(first) === blockOf(last)) { continue; }
        const bad = [];
        for (const d of decls.split(';')) {
          const prop = d.split(':')[0].trim().toLowerCase();
          if (!APPEARANCE.has(prop)) { continue; }
          if (prop === 'color' && !declaresOwnColour(last)) { continue; }
          bad.push(prop);
        }
        if (bad.length) {
          fail(`${name}: '${sel}' paints ${blockOf(last)} from inside ${blockOf(first)} ` +
               `(${[...new Set(bad)].join(', ')})\n        a parent places a child; what it looks like belongs to the child. ` +
               `Give ${blockOf(last)} a modifier and set it there, or register the selector in COMPOSITION_ALLOWED with its reason.`);
        }
      }
    }
  }
}

/* ── The level gate ──────────────────────────────────────────────────
   Frost's layers, checked rather than asserted.

   Every prefix in these files is a claim - that a- is a basic building
   block, that m- is a small group of them doing one job, that o- is a
   distinct section built from those. Nothing tested any of it, so the
   letter was whatever the author typed, and a component filed at the
   wrong level is not a naming quibble: it is a thing nobody can find
   and everybody rebuilds.

   The rule that can be checked from the markup is containment, and it
   is the one Frost is clearest about. Atoms are the parts. Molecules
   are groups of atoms. Organisms are made of molecules and atoms and
   other organisms. So the arrow only points one way: an atom may not
   contain a molecule or an organism, and a molecule may not contain an
   organism. Organisms inside organisms are allowed, because Frost says
   so in as many words.

   Static markup only, and honestly so: markup built in a script is
   assembled at runtime and this gate cannot see it. It catches the
   nesting a person writes by hand, which is where the mistake is made.

   It fails only on a clear inversion - a smaller thing holding a bigger
   one. Same-level nesting is left alone on purpose, because Frost does
   not forbid it and the calls are genuinely arguable. Three exist here
   and are worth a designer's ruling rather than a build failure:

     a-icon-btn holds a-badge   the bell wearing its dot. Two atoms, so
                                strictly the pair is a molecule.
     m-app-bar holds m-brand-lockup   a bar holding a lockup and two
                                controls; arguably a small organism.
     m-alert holds m-privacy    an alert holding a list of facts.

   None of them costs anything today: each renders correctly, is used in
   one place, and is found where you would look. Raising the rule to
   catch them would fail the build on three judgement calls, which
   teaches whoever meets it to reach for the exception list rather than
   to think - and that is the opposite of what a gate is for. */

const LEVEL = { a: 1, m: 2, o: 3, t: 4, p: 5 };
const LEVEL_NAME = { a: 'atom', m: 'molecule', o: 'organism', t: 'template', p: 'page' };
/* Deliberate inversions, each with its reason. */
const LEVEL_ALLOWED = new Set([
]);

{
  for (const name of FILES) {
    const markup = markupOf(src[name]).replace(/<style[\s\S]*?<\/style>/g, ' ');
    /* A stack of the open elements that carry a layer class, so the
       nearest layered ancestor is the one asked about. */
    const stack = [];
    const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
    for (const m of markup.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g)) {
      const closing = m[1] === '/';
      const tag = m[2];
      const attrs = m[3] || '';
      if (closing) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].tag.toLowerCase() === tag.toLowerCase()) { stack.length = i; break; }
        }
        continue;
      }
      const selfClosing = /\/\s*$/.test(attrs) || VOID.test(tag);
      const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
      const blocks = cls.split(/\s+/).filter(Boolean)
        .filter((c) => /^[amotp]-/.test(c))
        .map((c) => c.split('__')[0].split('--')[0]);
      /* An element's own level is the highest layer it wears. */
      let mine = 0, myName = '';
      for (const b of blocks) {
        const l = LEVEL[b[0]] || 0;
        if (l > mine) { mine = l; myName = b; }
      }
      if (mine) {
        for (let i = stack.length - 1; i >= 0; i--) {
          const up = stack[i];
          if (!up.level) { continue; }
          /* Organisms may hold organisms; everything else may only hold
             what is smaller than itself. */
          if (up.level >= 3) { break; }
          /* A block's own elements are the block, not something inside it. */
          if (up.block === myName) { break; }
          if (mine > up.level) {
            const pair = up.block + ' > ' + myName;
            if (!LEVEL_ALLOWED.has(pair)) {
              fail(`${name}: ${LEVEL_NAME[up.block[0]]} '${up.block}' contains ` +
                   `${LEVEL_NAME[myName[0]]} '${myName}'\n        ` +
                   `the arrow points one way: an atom is a part, a molecule is a group of parts, ` +
                   `an organism is a section built from those. Either '${up.block}' is really the ` +
                   `bigger thing and should say so, or '${myName}' is really the smaller one. ` +
                   `A deliberate inversion goes in LEVEL_ALLOWED with its reason.`);
            }
          }
          break;
        }
      }
      if (!selfClosing) { stack.push({ tag, level: mine, block: myName }); }
    }
  }
}

/* ── 11. The documentation says what the code says ───────────────────────

   Every number on the design-system page that a person typed had drifted:
   the atom count, the spacing scale, the per-screen state counts, and two
   deep links pointing at states that do not exist. The README's numbers had
   not drifted, because this file derives them.

   So the same treatment. Four assertions, and none of them touches an
   existing check:

     1. Every state a doc links to is a real state.
     2. Every block the stylesheets define is mentioned on the page, so a
        component cannot ship undocumented.
     3. Every block the page mentions is real, so it cannot document a
        component that does not exist. (It documented a-icon-btn for a while,
        which lives only in the unmigrated file.)
     4. Every count the page states matches the count this file computes.
        The page carries them in data-count so there is something to compare;
        prose is left alone.

   Numbers a computer can count should never be typed.                      */

const DOCS = 'docs/design-system/index.html';
const docsPath = path.join(ROOT, DOCS);

/* The page may also name a component from the file that has not been migrated
   yet — it documents both, and the app's screens are real even though their
   CSS is still inline. Rather than keep a hand-written allowlist, which would
   be one more thing to forget, that page's own stylesheet is the allowlist.
   A name in neither place is a component that does not exist anywhere. */
function blocksDefinedIn(name) {
  const out = new Set();
  const css = cssOf(name).replace(/\/\*[\s\S]*?\*\//g, ' ');
  for (const m of css.matchAll(/(^|[},])\s*((?:\.[A-Za-z0-9_-]+|[^{},])*)\s*\{/g)) {
    for (const cls of (m[2] || '').matchAll(/\.([amotpu]-[A-Za-z0-9_-]+)/g)) {
      out.add(blockOf(cls[1]));
    }
  }
  return out;
}

if (!fs.existsSync(docsPath)) {
  fail(`${DOCS} is missing — the design system has no documentation to check`);
} else {
  const docs = fs.readFileSync(docsPath, 'utf8');

  /* Every block defined by the stylesheets, by level. A block is the part
     before __element or --modifier, so one entry per component. */
  cssBlocks = new Map();
  const cssDir = path.join(ROOT, 'src', 'css');
  for (const file of fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'))) {
    if (file.startsWith('developer')) { continue; }       /* tooling, never documented */
    const css = unwrapLayers(fs.readFileSync(path.join(cssDir, file), 'utf8'))
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const m of css.matchAll(/(^|[},])\s*((?:\.[A-Za-z0-9_-]+|[^{},])*)\s*\{/g)) {
      for (const cls of (m[2] || '').matchAll(/\.([amotpu]-[A-Za-z0-9_-]+)/g)) {
        const block = blockOf(cls[1]);
        if (!cssBlocks.has(block)) { cssBlocks.set(block, file); }
      }
    }
  }

  /* 11a. Every state the documentation links to is a real state. */
  const realStates = new Set();
  for (const name of FILES) {
    for (const s of parsed[name].states) { realStates.add(s.id); }
  }
  const linked = new Set();
  for (const m of docs.matchAll(/#([a-z0-9]+\/[a-z0-9-]+)/g)) { linked.add(m[1]); }
  for (const id of linked) {
    if (!realStates.has(id)) {
      fail(`${DOCS} links to '#${id}', which is not a state in either file — dead deep link`);
    }
  }

  /* 11b. Every block the stylesheets define is named on the page. */
  for (const [block, file] of cssBlocks) {
    if (!docs.includes(block)) {
      fail(`${DOCS} never mentions '${block}' (defined in src/css/${file}) — ` +
           `a component that ships undocumented`);
    }
  }

  /* 11c. Every block the page names is real.

     Read from the two places a component name can honestly appear: a <code>
     span, which is how the prose refers to one, and a class attribute, which is
     how a specimen renders one. Scanning the whole document instead was too
     blunt. Heading ids are slugs, so `state-is-never-a-class` contains the
     substring `a-class` and was reported as an undefined atom. Narrowing where
     it looks makes it more accurate rather than less strict: a phantom named in
     prose is still caught, which is how `a-icon-btn` was found. */
  const namedInDocs = new Set();
  const nameSources = [
    ...[...docs.matchAll(/<code>([\s\S]*?)<\/code>/g)].map((m) => m[1]),
    ...[...docs.matchAll(/\sclass="([^"]*)"/g)].map((m) => m[1]),
  ].join(' ');
  for (const m of nameSources.matchAll(/\b([amotpu]-[a-z][A-Za-z0-9_-]*)\b/g)) {
    namedInDocs.add(blockOf(m[1]));
  }
  const unmigrated = blocksDefinedIn(ONBOARD);
  for (const block of namedInDocs) {
    if (cssBlocks.has(block) || unmigrated.has(block)) { continue; }
    fail(`${DOCS} documents '${block}', which neither src/css nor ${ONBOARD} defines — ` +
         `a component that exists nowhere`);
  }

  /* 11d. Every count the page states is the count this file computes. */
  const levelCount = (prefix) =>
    [...cssBlocks.keys()].filter((b) => b.startsWith(prefix)).length;

  const computed = {
    atoms: levelCount('a-'),
    molecules: levelCount('m-'),
    organisms: levelCount('o-'),
    templates: levelCount('t-') + levelCount('p-'),
    tokens: counts.tokens,
    'states-signup': parsed[SIGNUP].states.length,
    'states-app': parsed[ONBOARD].states.length,
  };

  let checkedCounts = 0;
  for (const m of docs.matchAll(/data-count="([a-z-]+)"[^>]*>([^<]+)</g)) {
    const [, key, shown] = m;
    if (!(key in computed)) {
      fail(`${DOCS} states a count for '${key}', which this gate does not compute. ` +
           `Add it to the computed map or remove the attribute.`);
      continue;
    }
    checkedCounts++;
    if (String(computed[key]) !== shown.trim()) {
      fail(`${DOCS} says ${key} is ${shown.trim()}; the code says ${computed[key]}`);
    }
  }
  for (const key of Object.keys(computed)) {
    if (!docs.includes(`data-count="${key}"`)) {
      fail(`${DOCS} states no count for '${key}' — every level must carry one so it ` +
           `cannot drift (expected ${computed[key]})`);
    }
  }

  docsSummary = `${cssBlocks.size} blocks all documented, ${linked.size} deep links all real, ` +
                `${checkedCounts} counts match the code`;
}


/* ── 12. The documentation's own structure ───────────────────────────────

   The page is now a reference manual rather than an essay, so its shape is
   part of what it promises. These assert the shape. All additive: nothing
   above is touched.

   Headings inside a preview are skipped throughout. A preview holds real
   product markup, and some of that markup is a heading, so m-sheet-header__title
   is an <h2> in the product. It belongs in the preview rather than in the
   documentation's outline.                                                    */

const DOC_SECTIONS = [
  'introduction', 'principles', 'foundations', 'primitives', 'atoms', 'molecules',
  'organisms', 'templates', 'screens', 'quality', 'contributing', 'limitations',
];

/* Every documented item carries these, in this order. */
const DOC_PARTS = ['preview', 'purpose', 'anatomy', 'variants', 'states', 'behaviour',
                   'content', 'a11y', 'tokens', 'markup', 'responsive', 'related'];
const SCREEN_PARTS = ['purpose', 'template', 'composition', 'hierarchy', 'states',
                      'responsive', 'a11y', 'traceability'];

if (fs.existsSync(docsPath)) {
  const doc = fs.readFileSync(docsPath, 'utf8');

  /* Two different reductions, for two different questions.

     `live` is the document with every code block taken out. A markup contract
     is escaped text, so `id="resendBtn"` inside one is a string a reader copies
     rather than an attribute the browser sees. Counting those as real ids
     reported forty duplicate ids that do not exist.

     `outline` goes further and also drops previews, because a preview holds
     product markup and some of that markup is a heading. */
  const live = doc.replace(/<pre\b[\s\S]*?<\/pre>/g, ' ')
                  .replace(/<code>[\s\S]*?<\/code>/g, ' ');
  const outline = live.replace(/<div class="ds-canvas"[\s\S]*?\n    <\/div>/g, ' ')
                      .replace(/<div class="ds-spec"[\s\S]*?\n  <\/div>/g, ' ');

  /* 12a. Exactly one h1. */
  const h1s = [...outline.matchAll(/<h1\b[^>]*>/g)];
  if (h1s.length !== 1) {
    fail(`${DOCS}: ${h1s.length} <h1> elements. The design system is one thing, so there is exactly one.`);
  }

  /* 12b. The required sections, in the required order. */
  const seen = [...live.matchAll(/<section class="ds-section" id="([a-z-]+)"/g)].map((m) => m[1]);
  if (seen.join(',') !== DOC_SECTIONS.join(',')) {
    fail(`${DOCS}: top-level sections are\n        ${seen.join(', ')}\n      and should be\n        ${DOC_SECTIONS.join(', ')}`);
  }

  /* 12c. No heading level is skipped. */
  const levels = [...outline.matchAll(/<(h[1-6])\b[^>]*>/g)].map((m) => +m[1][1]);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      fail(`${DOCS}: heading jumps from h${levels[i - 1]} to h${levels[i]}. Levels are structure, not sizes.`);
      break;
    }
  }

  /* 12d. Every documentation heading has an id, and no id is used twice. */
  const ids = [...live.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const dup of new Set(ids.filter((v, i) => ids.indexOf(v) !== i))) {
    fail(`${DOCS}: id="${dup}" is used more than once`);
  }
  const bare = [...outline.matchAll(/<(h[2-5])(\s[^>]*)?>/g)].filter((m) => !(m[2] || '').includes('id='));
  if (bare.length) {
    fail(`${DOCS}: ${bare.length} documentation heading(s) have no id, so nothing can link to them`);
  }

  /* 12e. No dead in-page anchor. */
  const idSet = new Set(ids);
  for (const m of live.matchAll(/href="#([^"]+)"/g)) {
    if (!idSet.has(m[1])) { fail(`${DOCS}: href="#${m[1]}" points at nothing`); }
  }

  /* 12f. The navigation is generated from the document.

     The brief asks that navigation order and document order be identical. The
     way to keep that true is to not have a second list at all, so this asserts
     the generator rather than comparing two hand-written orders. */
  const js = fs.readFileSync(path.join(ROOT, 'docs/design-system/docs.js'), 'utf8');
  if (!/function buildNav\b/.test(js) || !/\.ds-main h2\[id\]/.test(js)) {
    fail(`${DOCS}: the navigation is no longer generated from the document's own headings, ` +
         `so its order can drift from the page`);
  }
  /* The other half of the same promise: there must be no second, hand-written
     list of sections in the markup for the generated one to disagree with. */
  const railBody = (doc.match(/<div class="ds-rail__nav[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '';
  if (/<a\s[^>]*href="#/.test(railBody)) {
    fail(`${DOCS}: the rail contains hand-written section links. The tree is generated, ` +
         `so a second list can only ever go stale.`);
  }

  /* 12g. Every documented item carries its metadata and its subsections. */
  const items = [...live.matchAll(/<div class="ds-item" data-doc-level="([a-z]+)" data-doc-component="([^"]+)">([\s\S]*?)\n  <\/div>/g)];
  const named = items.map((m) => m[2]);
  for (const dup of new Set(named.filter((v, i) => named.indexOf(v) !== i))) {
    fail(`${DOCS}: '${dup}' is documented more than once`);
  }
  for (const [, level, name, body] of items) {
    for (const k of ['Level', 'Ownership', 'Source', 'Status']) {
      if (level === 'screen' && k === 'Ownership') { continue; }
      if (!body.includes(`>${k}<`)) { fail(`${DOCS}: '${name}' has no ${k} in its metadata`); }
    }
    /* A utility is one declaration with one job. Requiring twelve subsections of
       it would produce eleven paragraphs of filler, which is the opposite of what
       the rest of this gate is for. It still needs its metadata. */
    if (level === 'utility') { continue; }
    const want = level === 'screen' ? SCREEN_PARTS : DOC_PARTS;
    const got = [...body.matchAll(/<h4 id="([^"]+)"/g)].map((m) => m[1]);
    for (const part of want) {
      if (!got.includes(`${name}-${part}`)) {
        fail(`${DOCS}: '${name}' is missing its ${part} subsection (expected id "${name}-${part}")`);
      }
    }
  }

  /* 12h. Every block in src/css is documented as an item, not merely mentioned. */
  const documented = new Set(named);
  for (const [block, file] of cssBlocks) {
    if (block.startsWith('u-')) { continue; }        /* utilities are listed, not profiled */
    if (!documented.has(block)) {
      fail(`${DOCS}: '${block}' (src/css/${file}) has no documented item of its own`);
    }
  }

  /* 12i. All thirteen app screens, each on its own. */
  const screens = items.filter((m) => m[1] === 'screen').length;
  if (screens !== 13) {
    fail(`${DOCS}: ${screens} screens documented separately. There are 13 in ${ONBOARD}.`);
  }

  docsStructure = `one h1, ${DOC_SECTIONS.length} sections in order, ${items.length} items ` +
                  `each with metadata and subsections, ${screens} screens, no dead anchors`;
}

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
console.log(`    ${counts.tokens} product tokens, identical in both files`);
console.log('    the words stay plain');
console.log('    sign-up may reach a person; nothing at the pump navigates away');
console.log('    every class is shaped like the system, no dead names, tokens in their families');
console.log('    the shared library is verbatim in both files, and both restate colour-only states');
console.log('    the base layer agrees too: what a control inherits is the same on both sides');
console.log('    no parent paints a child it did not make, and the layers nest the right way round');
console.log(`    the documentation agrees with the code: ${docsSummary}`);
console.log(`    and its own structure holds: ${docsStructure}\n`);
