#!/usr/bin/env node
'use strict';

/*
  Nothing hard-coded, and a way to keep it that way.

  The other checkers drive a browser and ask what the product does. This one
  reads the stylesheet and asks where its decisions are kept, which is a
  different question with a different failure: a colour typed into a rule
  still looks right today and is simply unfindable tomorrow.

  What it holds:

    every colour comes from the palette, never from a literal in a rule;
    every token a rule reaches for is actually declared;
    no rule carries a second answer in a var() fallback;
    a decision made more than once has a name;
    markup carries values, never styling.

  The last one is the line this file draws. `style="flex:7"` on a meter is a
  quantity — that meter is seven parts wide and no stylesheet can know it.
  `style="margin-top: 24px"` is a design decision hiding in the markup, where
  nothing can override it, reuse it or find it. The first is allowed by name
  below; the second is what this refuses.

  Run it:  node tools/tokens.js
  Exits 0 when nothing is hard-coded, 1 with a report. No browser needed.
*/

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'tfn-fleet-portal.html');
const src = fs.readFileSync(FILE, 'utf8');

const out = [];
const check = (group, name, ok, note) => out.push({ group, name, ok, note });

/* Style blocks only. The markup and the scripts are asked different things. */
const css = (src.match(/<style>([\s\S]*?)<\/style>/g) || [])
  .map((b) => b.replace(/^<style>|<\/style>$/g, '')).join('\n');

/* Prose is not code: a comment naming a colour is documentation. */
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
const isDecl = (line) => /^\s*--[a-z0-9-]+\s*:/.test(line);
const rules = bare.split('\n').filter((l) => !isDecl(l));
const declared = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

/* ── Colour ─────────────────────────────────────────────────────────────── */

const literals = rules.flatMap((l) => [
  ...(l.match(/#[0-9a-fA-F]{3,8}\b/g) || []),
  ...(l.match(/\brgba?\([^)]*\)/g) || []),
  ...(l.match(/\bhsla?\([^)]*\)/g) || []),
]);
check('colour', 'every colour comes from the palette',
  literals.length === 0,
  literals.length ? `${literals.length} literal(s): ${[...new Set(literals)].slice(0, 4).join(', ')}`
    : `${declared.size} tokens declared, 0 colours typed into a rule`);

/* ── Tokens declared twice ──────────────────────────────────────────────── */

/* The failure this catches is quiet and expensive. A second declaration of a
   name that already exists wins if it comes later, so a component reaching for
   what it thinks is a 3px accent rail gets the 232px navigation rail instead,
   and nothing anywhere says so. It happened here: --size-rail-width was the
   sidebar, and a second one was added for the little coloured stripe beside an
   error. Three components drew a 232px border for a version.

   This file has no theme or media blocks that legitimately restate a token, so
   any repeat is a collision. If one is ever added, exclude it here rather than
   loosening the rule. */
const decls = {};
for (const m of css.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm)) {
  (decls[m[1]] = decls[m[1]] || []).push(m[2].trim());
}
const twice = Object.entries(decls).filter(([, v]) => v.length > 1);
check('tokens', 'no token is declared twice',
  twice.length === 0,
  twice.length ? twice.map(([k, v]) => `${k} = ${[...new Set(v)].join(' then ')}`).join('; ')
    : `${Object.keys(decls).length} names, each declared once`);

/* There was a check here for two names sharing one value inside a family. It
   was wrong and is not coming back. A semantic token that aliases a base one —
   --color-primary and --color-brand-ink resolving to the same blue, or
   --color-on-danger being white — is how a palette is supposed to work: the
   name says what the colour is for, and two purposes may honestly agree today
   and diverge tomorrow. Nothing automated can tell that apart from a slip, so
   it flagged thirty families and meant none of them.

   Three real ones live in the report instead, where a person can judge them:
   --radius-tooltip against --radius-xs, --duration-sheet against
   --duration-base, and --size-input-border-width against
   --size-border-hairline. Each is a second name for a decision already made. */

/* ── Tokens that are not there ──────────────────────────────────────────── */

const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
const missing = [...used].filter((t) => !declared.has(t)).sort();
check('tokens', 'every token a rule reaches for is declared',
  missing.length === 0,
  missing.length ? `undeclared: ${missing.join(', ')}`
    : `${used.size} tokens referenced, all of them real`);

/* A fallback is a second answer. Where the token exists it is unreachable and
   misleading; where it does not, the fallback is the real value and the token
   is decoration. Either way the decision is in two places. */
const fallbacks = [...css.matchAll(/var\((--[a-z0-9-]+)\s*,\s*([^)]+)\)/g)]
  .map((m) => `${m[1]} → ${m[2].trim()}`);
check('tokens', 'no rule carries a second answer',
  fallbacks.length === 0,
  fallbacks.length ? `${fallbacks.length}: ${fallbacks.slice(0, 3).join('; ')}`
    : 'every var() resolves one way');

/* ── Type and stacking ──────────────────────────────────────────────────── */

const sizes = rules.flatMap((l) => l.match(/font-size:\s*[0-9.]+(px|rem|em)/g) || []);
check('type', 'no type size is typed into a rule',
  sizes.length === 0, sizes.length ? sizes.slice(0, 3).join(', ') : 'all from the type scale');

const zs = rules.flatMap((l) => l.match(/z-index:\s*-?\d+/g) || []);
check('type', 'no stacking order is typed into a rule',
  zs.length === 0, zs.length ? zs.slice(0, 3).join(', ') : 'all from the ladder');

/* ── Lengths ────────────────────────────────────────────────────────────── */

/* Two exceptions, both real. A media query cannot resolve var(), so its
   numbers have nowhere else to live. And the visually-hidden idiom is a
   1px box that is not a size anybody chose. */
const HIDDEN = /width:\s*1px;\s*height:\s*1px/;
const lengths = new Map();
for (const line of rules) {
  if (/@media/.test(line) || HIDDEN.test(line)) continue;
  for (const m of line.matchAll(/(?<![\w-])(\d+(?:\.\d+)?)px/g)) {
    const v = `${m[1]}px`;
    if (!lengths.has(v)) lengths.set(v, []);
    lengths.get(v).push(line.trim().slice(0, 70));
  }
}
/* A value used once, in one rule, is already where it belongs — naming it
   would add a level of indirection without naming a decision. A value used
   twice is a decision being made twice. */
const repeated = [...lengths.entries()].filter(([, at]) => at.length > 1);
check('length', 'no length is decided in two places at once',
  repeated.length === 0,
  repeated.length ? repeated.map(([v, at]) => `${v} x${at.length}`).join(', ')
    : `${lengths.size} one-off length(s), each local to its own rule`);

/* ── Markup ─────────────────────────────────────────────────────────────── */

/* Quantities a stylesheet cannot know: how many parts of a meter are active,
   how far a progress bar has run. Anything else in a style attribute is a
   design decision in the one place nothing can reach it. */
const VALUE = /^(flex:\s*(\d+|\$\{[a-z]+\})|width:\s*\d+%)$/i;
const inline = [...src.matchAll(/style="([^"]*)"/g)].map((m) => m[1].trim());
const styling = inline.filter((v) => !VALUE.test(v));
check('markup', 'markup carries values, never styling',
  styling.length === 0,
  styling.length ? `${styling.length}: ${styling.slice(0, 3).join(' | ')}`
    : `${inline.length} style attribute(s), every one a quantity`);

/* ── Content that is really a calculation ───────────────────────────────── */

const yearOptions = (src.match(/<option>(19|20)\d\d<\/option>/g) || []).length;
check('markup', 'no list of years is typed out by hand',
  yearOptions === 0,
  yearOptions ? `${yearOptions} <option> years in the markup`
    : 'the year list is counted from the year it is now');

/* ── Report ─────────────────────────────────────────────────────────────── */

const bad = out.filter((r) => !r.ok);
console.log('\nNothing hard-coded\n');
let last = null;
for (const r of out) {
  if (r.group !== last) { console.log(`  ${r.group}`); last = r.group; }
  console.log(`    ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(46)} ${r.note}`);
}
console.log(`\n${out.length - bad.length} of ${out.length} checks pass.`);
process.exit(bad.length ? 1 : 0);
