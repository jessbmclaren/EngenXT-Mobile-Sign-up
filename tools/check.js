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

  /* Any OTHER block that is only custom properties is a token block the
     gate cannot see - a theme landing outside the sanctioned scopes. */
  for (const name of FILES) {
    const css = [...src[name].matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
      .map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, ' ');
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
    let css = [...src[name].matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
      .map((m) => m[1]).join('\n');
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
  const css = [...src[name].matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
    .map((m) => m[1]).join('\n')
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
    if (!/@media \(forced-colors: active\)/.test(src[name])) {
      fail(`${name}: no @media (forced-colors: active) block - colour-only states have no restatement`);
    }
  }
}



/* ── The recipe census ───────────────────────────────────────────────
   The spec panel documents components by name, and a recipe naming a
   class that no longer exists is documentation lying with confidence. */
{
  try {
    const spec = literal(stripJsComments(scriptsOf(src[SIGNUP]).join('\n')), 'var RECIPES =');
    const css = [...src[SIGNUP].matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
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
  'a-btn--onDark', 'a-link', 'a-link--quiet', 'a-link--flush', 'a-link--onDark',
  'a-icon-wrap--lg', 'a-icon-wrap--mark', 'a-icon-wrap--onDark', 'm-brand-lockup__tag',
]);
const USED_ONLY = new Set([
  /* the molecule's identity over the a-field shell; the shell carries
     the declarations */
  'm-phone-field',
]);
const TOKEN_FAMILY = /^--(color|glass|gradient|kb|font|text|radius|shadow|sp|size|z|ease|dur|d)-/;

for (const name of FILES) {
  const styleBlocks = [...src[name].matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
    .map((m) => m[1]).join('\n');
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
      fail(`${name}: token '${m[1]}' belongs to no sanctioned family (--color- --sp- --text- --radius- --size- --shadow- --z- --dur- --ease- --glass- --gradient- --font- --kb- --d-)`);
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
console.log('    the shared library is verbatim in both files, and both restate colour-only states\n');
