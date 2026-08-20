# Documentation review

An independent audit of `docs/design-system/` against the production HTML and CSS.

Six reviewers worked from the source with no knowledge of how the documentation was
written or why. Their findings were then checked against the running product before
being recorded here: every claim below has either a file and line behind it or a
measurement taken from a browser. Nothing in this report is an impression.

Reviewed at commit `68bd278`, 19 August 2026.

**Headline:** the generated half of the documentation is sound and the written half has
drifted. Everything `docs.js` reads out of the live stylesheet — the token tables, the
tier count, the large-text scale, the keyframe catalogue — is correct, because it cannot
be anything else. Almost every hand-typed number on the page is wrong: the atom count,
the spacing scale, the per-screen state counts, two deep links that go nowhere. The root
cause is structural and is stated as finding **P0-1**: no gate reads `docs/design-system/`.

---

## Scorecard

| Area | Result |
|---|---|
| Architecture | PARTIAL |
| Tokens | PARTIAL |
| Spacing | **FAIL** |
| Typography | **FAIL** |
| Colours | PARTIAL |
| Radii and borders | **FAIL** |
| Shadows / elevation | PARTIAL |
| Motion | PARTIAL |
| Primitives | PARTIAL |
| Atoms | PARTIAL |
| Molecules | PARTIAL |
| Organisms | PARTIAL |
| Templates | PARTIAL |
| Screens | **FAIL** |
| Responsiveness | PARTIAL |
| Accessibility | **FAIL** |
| Traceability | **FAIL** |
| Documentation integrity | PARTIAL |
| Repository verification | PASS |

**Documentation integrity** is clean as a document and compromised as a specimen host.
Clean: no duplicate ids, no dead in-page anchors, no heading-level skips, all 61 focusable
controls carry a visible focus ring, zero console errors, zero failed requests, and no
horizontal overflow at 1280, 900, 600 or 390px. Off disk the page degrades honestly — the
generated sections that cannot read a linked stylesheet say so instead of rendering empty.
Compromised: the shell leaks into the specimens, so they do not render as production does.
See **P0-10**, which is the finding that most undermines the page's own thesis.

**Repository verification** passes: `check.js` clean, `journey.js` 71/71, `sweep.js`
104 states / 0 failures, `sweep.js --large` 104 states / 0 failures. No gate was weakened
or bypassed to reach that result.

---

## The finding behind most of the other findings

### P0-1 · No gate reads the documentation

- **Section:** all
- **Source:** `tools/check.js` — `grep -n "docs\|design-system" tools/check.js` matches only the README assertions
- **Evidence:** `check.js` computes the README's headline state counts and fails the build
  if the prose disagrees. Nothing in `check.js`, `sweep.js` or `journey.js` opens
  `docs/design-system/`.
- **Why it matters:** This is the mechanism behind the numeric failures below. The
  README's counts cannot drift because a gate derives them. The design system's counts,
  state links, atom totals and screens table are typed by hand and ungated — which is
  precisely why they say `5/32/4/2`, "three screens", "Twelve", "three half-steps" and
  `#code/valid`. The parts `docs.js` generates from the live CSS are all correct. The
  parts a person typed are, with few exceptions, wrong.
- **Correction:** Extend `check.js` on the same principle it already applies to the
  README. Assert that every `#state/id` in the docs is a key of `STATES`; that the
  screens table's counts sum to the real total; that prose counts of atoms and molecules
  match the class counts in `src/css`; and that every `a-` / `m-` / `o-` / `t-` class
  defined in `src/css` appears at least once in the docs. Prose that cannot be computed
  stays prose — but a number that can be computed should never be typed.

---

## P0 findings

### P0-2 · The documented accessibility mechanism for an invalid field does not exist

- **Section:** `#atoms`, `#accessibility`
- **Source:** `src/css/atoms.css:143` and `:155-157`
- **Evidence:** The docs say twice that error is not carried by colour alone because
  "the border thickens as well" (lines 500 and 692). Production:
  `.a-field` sets `border: var(--size-border) solid …` (1.5px) and
  `.a-field[data-state="error"]` changes only `border-color` and `background`.
  No width changes. The one width change is under `@media (forced-colors: active)`.
  A 2.5px error border exists only on `.a-otp-cell` (`atoms.css:374`).
- **Why wrong:** A WCAG 1.4.1 mitigation is documented for the flow's primary input and
  is not implemented. The specimen renders directly beside the claim, so a reader would
  have to measure pixels to catch it.
- **Correction:** The non-colour carriers that *do* exist are the helper glyph and the
  shake (`foundations.css:47`). Either correct both sentences to name those, or add
  `border-width` to the error state to match the OTP cell. **This is a production change
  and needs a designer's ruling — it is not a documentation-only fix.**

### P0-3 · Two deep links point at states that do not exist

- **Section:** `#states`
- **Source:** `index.html:2251` (`var STATES`)
- **Evidence:** The states table links `#code/valid` and `#blocked/not-registered`.
  Neither is a key of `STATES`. Measured against the running page, the 43 real ids
  include `code/success` and `number/err-unregistered`; the `blocked/` group is only
  `suspended`, `fleet`, `locked`.
- **Why wrong:** Two of twelve rows are dead links. A reader following the Success or
  Empty row lands on nothing.
- **Correction:** Point them at `#code/success` and `#number/err-unregistered`, then gate
  it per P0-1.

### P0-4 · The per-screen state counts describe no grouping that exists

- **Section:** `#screens`
- **Source:** `index.html:2212` `home()`, `:2224` `showStatusPage()`, `:266`, `:291`
- **Evidence:** The table claims `o-auth-hero` 5, `o-signup-sheet` 32, `o-status-page` 4,
  `o-outcome-panel` 2. Measured by walking all 43 states in a browser and recording which
  organisms are actually visible:

  | Organisms visible | States |
  |---|---|
  | `o-auth-hero` alone | 2 |
  | `o-auth-hero` + `o-status-page` | 3 |
  | `o-auth-hero` + `o-signup-sheet` | 27 |
  | `o-auth-hero` + `o-signup-sheet` + `o-outcome-panel` | 11 |

  So `o-auth-hero` appears in all 43, `o-signup-sheet` in 38, `o-outcome-panel` in 11,
  `o-status-page` in 3. The documented numbers sum to 43 but match no grouping of the
  real state ids.
- **Why wrong:** Arithmetic fitted to a total is the one thing a traceability artefact
  must never contain.
- **Correction:** Use the measured figures and state explicitly that the columns overlap
  because these surfaces stack — they are not a partition.

### P0-5 · `o-outcome-panel` is documented as a screen; it is a stage inside the sheet

- **Section:** `#screens`, `#organisms`
- **Source:** `src/css/organisms.css` has no `.o-outcome-panel {` base rule;
  `index.html:266` — `class="o-signup-sheet__stage o-outcome-panel"`
- **Evidence:** The screens table gives it the template `t-device-frame`, and the
  organisms section says an organism "positions itself absolutely inside the device
  frame". `.o-outcome-panel` has no base rule and never sets `position`. Compare
  `.o-status-page` (`organisms.css:149`), which really does. The browser walk corroborates
  it independently: across all 43 states `o-outcome-panel` never once appears without
  `o-signup-sheet`.
- **Why wrong:** It states a containment relationship that does not exist, and it is why
  the invented `32 / 2` split was needed.
- **Correction:** Remove the row from the screens table and record it in traceability as a
  section of `o-signup-sheet`. Amend the organisms sentence to "three position themselves
  in the frame; `o-outcome-panel` is a stage within the sheet."

### P0-6 · The landmark and heading claims are false, and the product ships with no `<main>`

- **Section:** `#accessibility`
- **Source:** `index.html:74`, `:130`, `:143`, `:266`
- **Evidence:** The docs say "Each screen is a `<section>` labelled by its own heading;
  the device chrome is `aria-hidden`." In production the hero is a `<section>` labelled by
  `aria-label`, not by its `<h1>`; the status page is a `<div role="alertdialog">`; the
  sheet is `role="dialog" aria-modal="true"`, which replaces the section role; and
  `o-outcome-panel` is a `<div>` stage. `grep -c '<main'` returns **0** for both
  `index.html` and `engenxt-onboarding.html`. The only `<nav>` in `index.html` is
  `d-stateNav` — developer tooling.
- **Why wrong:** Three of four claims in one sentence are wrong, and the shipping surface
  has no landmark structure at all.
- **Correction:** Describe what is actually there. Separately raise a production task to
  wrap the frame's product content in `<main>` in both files — **a production change
  needing approval.**

### P0-7 · The spacing scale is misdescribed in its opening sentence

- **Section:** `#spacing`
- **Source:** `src/css/tokens.css:305-311`
- **Evidence:** The docs say "A 4px base with three half-steps, because 6, 10 and 18 are
  structural here". Production declares **two** half-steps — `--sp-1h: 6px` and
  `--sp-2h: 10px`. There is no 18px spacing token and no 18px spacing value.
  `organisms.css:254` says the opposite of the doc: gaps composed to "18 and 20: values
  close enough to the group step to read as noise rather than meaning" were removed.
- **Why wrong:** The first thing a reader learns about spacing is wrong, and it cites as
  structural a value the system deliberately eliminated. A developer will hunt for a
  token that was never there.
- **Correction:** "A 4px base with two half-steps — `--sp-1h` (6px) and `--sp-2h` (10px)."

### P0-8 · There is no typography section

- **Section:** absent
- **Source:** 37 rules declare `font-size` across `atoms`, `molecules`, `organisms`,
  `templates`
- **Evidence:** `grep -c 'typography'` on the docs page returns 0. The only type content
  is the generated size ramp and a weight table. Not one real text style is identified by
  role, family, size, weight, line height, tracking, colour token or default element.
- **Why wrong:** A ramp of sizes is not a type system. The product has 37 text styles and
  the documentation specifies none of them.
- **Correction:** Add a typography section rendering each real style with its role,
  tokens and usage, generated from the same selectors so it cannot drift.

### P0-9 · Two required sections do not exist

- **Section:** absent — UI principles, Contribution and governance
- **Evidence:** `grep -in 'principle'` returns zero matches. `grep -in
  'contribut\|governance\|merge'` returns one match, and it is prose about CSS defaults.
  The word "gate" appears seven times but never with a command, an owner or a merge
  condition.
- **Why wrong:** The page asserts throughout that rules are machine-enforced but never
  tells a contributor how to run that enforcement or what blocks a merge — so the
  enforcement claim is unverifiable from the documentation itself. And there is no
  statement of the design intent that governs the system, only its mechanism: a reader
  can learn which file a rule lives in but not what makes a layout right.
- **Correction:** Add both, in the required positions.

### P0-10 · The documentation shell leaks into the specimens

- **Section:** all specimens; the claim is made at the top of the page
- **Source:** `docs/design-system/docs.css:42-50` (`body.ds-body`), `:74`
  (`.ds-main a:focus-visible`), `:87` (`.ds-section p`)
- **Evidence:** measured by rendering the same classes in the docs page and in
  `index.html` and diffing 17 computed properties. **Seventeen properties drift.** The
  unambiguous one is inheritance:

  | Property | In the docs | In the product |
  |---|---|---|
  | `font-family` (every specimen) | SF Pro **Text** … | SF Pro **Display** … |
  | `line-height` on `.a-label` | 20.8px | `normal` |

  `docs.css` is unlayered by design, so `body.ds-body` beats `@layer foundations`'s `body`
  rule. Only two rules in the entire component library name a font family, so every
  specimen inherits the *shell's* face and leading instead of the product's. By the same
  cascade rule `.ds-main a:focus-visible` (unlayered, 2px `--ds-accent`) outranks the
  layered production ring (3px `--color-focus` plus halo) for every link inside a
  specimen — directly under a caption reading "the ring is the real one, from the
  production CSS". `.ds-section p` likewise reaches into `.m-alert__title` and
  `.a-progress` and caps them at 68ch, a shape they never take in a 390px frame.
- **Why wrong:** The page's thesis is that a specimen cannot drift because there is only
  one copy of the CSS. That is true of the *stylesheet* and false of *inheritance*.
  Typeface, leading and inherited ink are exactly the properties a reviewer judges by eye,
  and all three come from the shell.
- **Correction:** Move the shell's type off `body` and onto `.ds-main` / `.ds-rail`, and
  re-assert the product's inherited context inside the frame:
  `.ds-spec__stage { font-family: var(--font-sans); line-height: normal; color: var(--color-text-primary); }`.
  Scope the link ring to documentation chrome only, and change `.ds-section p` to a child
  selector so it cannot reach into a specimen.
- **Note:** the earlier claim in this report's own scorecard that specimens are faithful
  was based on checking that `docs.css` defines no product-class *selectors*. That check
  was necessary and not sufficient; it missed inheritance entirely.

### P0-11 · The field specimen shipped the wrong element

- **Section:** `#atoms`
- **Source:** `index.html:173` — `<label class="a-field m-phone-field">`;
  `src/css/atoms.css:173` — "The field is a label, so the whole 56px focuses the input"
- **Evidence:** The specimen used `<span class="a-field">`. The `<label>` is what forwards
  a tap anywhere in the 56px box to the input; the CSS comment records that geometry was
  tried first and was the wrong tool. Because the page attaches a Copy markup button that
  serialises the stage verbatim, it was handing developers a component with its tap
  behaviour silently removed.
- **Correction:** Changed to `<label class="a-field">`, and the prose now states that the
  field is a label and that in the sign-up flow it shares one element with
  `m-phone-field`.

### P0-12 · The alert specimen contradicted its own caption

- **Section:** `#molecules`
- **Source:** `index.html:1016-1023`
- **Evidence:** The caption reads "Every tone carries a glyph as well as a colour, so the
  meaning survives for a reader who cannot separate the hues." The specimen rendered no
  glyph at all — `.m-alert__icon` was absent. Two further divergences: `__body` sat
  outside `__top`, making it a flex child of the alert's 12px gap where production renders
  it 3px under the title; and `data-tone="info"`, the default and the one the flow
  actually uses, was not shown.
- **Correction:** Rebuilt to the production structure with the glyph, `__body` nested
  inside `__top`, and the `info` tone added.

### Coverage, measured

| Level | Blocks in CSS | Rendered on the docs page | Not rendered |
|---|---|---|---|
| Atoms | 13 | 9 | `a-spinner`\*, `a-scrim`, `a-notch`, `a-toast` |
| Molecules | 11 | 4 | `m-brand-lockup`, `m-phone-field`, `m-resend-row`, `m-figure`, `m-status-bar`, `m-notch`, `m-keyboard` |
| Organisms | 4 | 0 | all four — described, not rendered |
| Templates | 2 | 1 | `p-signup-demo` |

\* `a-spinner` has since been added, so atoms now render 10 of 13. The gaps are now named
on the page itself rather than hidden behind a count.

---

## P1 findings

### P1-1 · The section order does not match the required structure

- **Measured order:** `overview, architecture, naming, tokens, primitives, spacing,
  atoms, molecules, organisms, templates, states, accessibility, responsive, screens,
  traceability, decisions`
- **Missing:** UI principles (2), Contribution and governance (14).
  **Extra:** `architecture`, `naming`.
  **Misplaced:** `spacing` sits as a peer between primitives and atoms instead of inside
  Foundations and tokens — it is a token family, not a level of the UI hierarchy, and
  standing there it breaks the composition chain at exactly the point it starts.
  **Misordered:** screens is at 14 (required 9); responsive at 13 (required 10);
  accessibility at 12 (required 11); states at 11 (required 12).
  **Misnamed:** "Tokens" → Foundations and tokens; "Primitives" → Code primitives;
  "Screens" → Pages/screens; "Decisions and open questions" → Known limitations and
  unresolved decisions.
- **Correction:** Reorder to the required sequence and fold `architecture` and `naming`
  into Overview and Foundations respectively.

### P1-2 · The dark specimen demonstrates a failing contrast pairing

- **Section:** `#primitives`
- **Source:** `docs/design-system/index.html` focus-ring specimen; `src/css/atoms.css:100`
- **Evidence:** The only dark-surface specimen renders `.a-link--quiet` on `#0a1628`.
  `--color-text-secondary` is `#4C5973`, a light-surface ink. Measured on that ground it
  is **2.58:1** — below AA for body text. The correct variant, `.a-link--onDark`
  (`atoms.css:110`), measures **18.13:1** and is rendered nowhere on the page.
- **Why wrong:** The documentation demonstrates a failing pairing as an exemplar, in the
  section about how the ring reads on both grounds. A reader copying the markup ships
  2.6:1 text.
- **Correction:** Use `.a-link--onDark` in the dark stage and add `.a-btn--outlineOnDark`
  beside it so the on-dark set is shown as a set.
- **Note:** this specimen was added in the same session as this review. It is a defect
  introduced by the documentation work, not pre-existing.

### P1-3 · "Never remove the focus ring" is contradicted four times in `src/css`

- **Section:** `#primitives`, `#accessibility`
- **Source:** `atoms.css:170`, `atoms.css:209`, `organisms.css:359`, `organisms.css:365`
- **Evidence:** The docs state an absolute prohibition. Production removes the ring in
  four places in `src/css` alone (and twelve more in the unmigrated page). Every one is
  defensible: the field and the OTP cell *substitute* a ring on their own edge, and the
  two titles are `tabindex="-1"` headings focused by script that no keyboard user can
  reach.
- **Why wrong:** An absolute rule with no exception clause makes the codebase read as
  violating its own system in sixteen places, and "one ring for the entire system" is
  simply not true — there are three treatments.
- **Correction:** Change to "never remove it without replacing it": a component may drop
  the global ring only if it draws an equivalent indicator on its own edge. Cite the two
  sanctioned substitutions.

### P1-4 · The contrast ratios measured in the CSS never reach the page

- **Section:** `#tokens`, `#accessibility`
- **Source:** `src/css/tokens.css:86, 93, 96, 99, 103, 104, 147, 177, 391`
- **Evidence:** Nine tokens carry measured ratios as comments, including the most
  safety-relevant fact in the scale — `--color-text-tertiary` is "3.72:1 on the sheet, so
  it is for inert controls only, never for a line being read". `docs.js` reads values via
  `getPropertyValue`, which discards comments, so none of it appears. The page says only
  "Contrast. Sampled from rendered pixels on all 43 states" and names not one pair.
- **Why wrong:** The restrictions are the half of each token's definition that prevents
  harm, and they are written down in production and lost in the documentation.
- **Correction:** Add a contrast table — text token × surface token × measured ratio ×
  verdict — and mark the restricted tokens. Verified starting values:

  | Pair | Ratio | Verdict |
  |---|---|---|
  | `--color-text-primary` on `--color-surface` | 16.99 | AAA |
  | `--color-text-secondary` on `--color-surface` | 7.04 | AAA |
  | `--color-text-tertiary` on `--color-surface` | 5.23 | AA |
  | `--color-error-text` on `--color-secondary-bg` | 5.91 | AA |
  | `--color-success` on `--color-success-bg` | 6.12 | AA |
  | `--color-warning` on `--color-warning-bg` | 5.69 | AA |
  | `--color-text-on-dark` on the hero ground | 18.13 | AAA |

### P1-5 · The token table omits half the required per-token fields

- **Section:** `#tokens`
- **Source:** `docs.js` `tokenTable()`
- **Evidence:** The table emits property, resolved value, authored value (http only), rem
  and a sample. Missing for all 191 tokens: **token level**, **source CSS file**,
  **intended usage**, **inappropriate usage**, **resolved alias target**.
- **Correction:** Add Level and Source columns (source from `styleSheet.href`), render the
  `var()` target as a link to its own row, and harvest the usage restrictions from the CSS
  comments per P1-4 rather than retyping them.

### P1-6 · Transitions are undocumented, and they carry nine-tenths of the motion

- **Section:** `#primitives`
- **Source:** `atoms.css:27-29, 146-147, 190`; `organisms.css:108-109, 197-199`;
  `templates.css:36, 111`
- **Evidence:** The motion subsection is built from `CSSKeyframesRule` only. The word
  "transition" appears twice on the page, both inside the reduced-motion paragraph. Ten
  transition declarations carry every state change a driver actually sees — press, focus,
  error, sheet resize.
- **Correction:** Generate a transition inventory the way the keyframes are generated:
  selector, properties, duration token, easing token, triggering state.

### P1-7 · Two headline motion claims are false

- **Section:** `#primitives`
- **Source:** `atoms.css:331` `spin .7s linear infinite`; `atoms.css:386` `pop .5s`;
  `atoms.css:32` `transition-duration: .1s`
- **Evidence:** The page says "in the product each one plays at its own duration token"
  and "Durations and easings are tokens, not numbers". Six declarations use raw numbers or
  bare CSS keywords, including three of the eight keyframes the catalogue renders.
- **Correction:** Either tokenise them or amend both sentences to name the exceptions.

### P1-8 · The radius samples render five of eight tokens identically

- **Section:** `#tokens`
- **Source:** `docs.js` `sampleFor()`; `docs.css` `.ds-corner` at 40×26px
- **Evidence:** CSS scales corner radii when the two radii on a side exceed the side
  length. On a 26px side, `--radius-card` (16), `--radius-notch` (22), `--radius-sheet`
  (28), `--radius-phone` (47) and `--radius-pill` (999) all clamp to the same 13px
  stadium. `--radius-circle: 50%` draws an ellipse.
- **Why wrong:** The sample actively misinforms about the largest and most structural
  radii — the sheet corner, the phone corner and the pill are drawn identically.
- **Correction:** Size the sample to the value, or draw one corner at true scale.

### P1-9 · No borders documentation

- **Section:** absent
- **Source:** `atoms.css:48, 74, 143, 186, 374, 391, 392`; `molecules.css:100, 196, 249`
- **Evidence:** Five distinct border widths ship: `1px` (four outline controls),
  `--size-border` 1.5px (fields, OTP), `2.5px` (OTP error), `2px`/`3px` (forced colours),
  `--size-hairline` 0.5px. The page never uses the phrase "border width", and the two
  width tokens sit inside the generic Size family drawn as sub-2px slivers.
- **Correction:** Add a Borders subsection with the two tokens, the `1px` outline-control
  convention as a named exception, the border colours with their ratios, and the
  forced-colors re-expression.

### P1-10 · Elevation is listed without hierarchy

- **Section:** `#tokens`
- **Source:** `tokens.css:281-301`
- **Evidence:** All 13 shadows render with complete composite values — that part is
  correct. What is missing is any ordering. `tokens.css:281-283` carries the governing
  rules ("One light source, from above"; "Focus rings and glows are optics … not
  elevations") and neither reaches the page.
- **Correction:** Order the tokens by the surface they belong to, cross-reference the
  `--z-*` scale, and pair each with its consumer.

### P1-11 · Whole categories of production behaviour are undocumented

- **Section:** `#accessibility`, `#responsive`, `#spacing`
- **Evidence, each verified:**
  - **Forced colours.** `@media (forced-colors: active)` exists in both files and is
    *enforced by `check.js`*, which fails the build without it. The design-system page
    mentions it nowhere — so a developer adding a coloured state learns the rule only when
    the gate rejects them.
  - **Zoom and text resizing.** All 14 type steps are authored in `px` in both scales, so
    text-only resize does nothing; `[data-text="large"]` is the only resize path and it is
    a product setting, not a browser capability. Undocumented.
  - **Responsive spacing.** Seven real responsive spacing changes exist
    (`templates.css:70, 88-90, 159, 168, 170, 173`) and two viewport breakpoints (900px,
    440px). `#responsive` states that what varies is device width and the keyboard, and
    omits both breakpoints. No values are given anywhere.
  - **Heading hierarchy.** On 11 of 43 states the sheet's `<h2>` is hidden
    (`index.html:1214`) and the visible heading is an `<h3>`, giving h1 → h3. There is no
    heading-hierarchy bullet at all.
- **Correction:** Add each as a documented dimension with its production evidence.

### P1-12 · The app's 61 states and 13 screens are one table row

- **Section:** `#screens`, `#traceability`
- **Source:** thirteen `<section class="t-screen …">` in `engenxt-onboarding.html`
- **Evidence:** Twelve organisms plus the persistent `o-tab-bar` return zero matches in
  the docs. 59% of the product's states and 76% of its screens have no name, no template
  mapping and no component list anywhere in the design system.
- **Correction:** Add the 13 screens with their real ids and state counts. "Not migrated"
  is a valid status; it is not a reason to leave a screen unnamed, since the ids are
  readable from the file as it stands.

### P1-13 · The stated one-way dependency law is broken in the templates layer

- **Section:** `#architecture`
- **Source:** `src/css/templates.css:181, 183, 185`
- **Evidence:** `tokens.css:456` states "no product component may read a `--d-` token".
  `templates.css` — a product layer — reads three of them for the layer-inspect overlay.
- **Correction:** Move those rules into `developer.css`, or state the exception and gate
  it. **Moving them is a production change; the documentation fix is to stop asserting a
  law with unstated exceptions.**

### P1-14 · Three reusable components impose their own external margins

- **Section:** `#spacing`
- **Source:** `atoms.css:360` `.a-progress`; `molecules.css:138` `.m-sheet-header`;
  `molecules.css:270` `.m-privacy`
- **Evidence:** The docs state "A component does not impose its own external margins".
  Three components set a margin on their own root, and `.m-sheet-header` already needs a
  cancel rule (`molecules.css:143`) to undo itself — the cost of the violation, in the
  file.
- **Correction:** Move them to the parent and delete the cancel rule, or record them as
  named exceptions with reasons.

### P1-15 · "Gap, not margin" is contradicted seven times by the flagship organism

- **Section:** `#spacing`
- **Source:** `organisms.css:14, 264, 267, 286, 295`; `templates.css:70, 86`
- **Evidence:** `.o-signup-sheet__stage[data-state="active"]` is a flex container and five
  of its children are spaced by `margin-top`, deliberately, because `gap` cannot express
  "one step looser than the base": 8+8=16, 8+16=24.
- **Correction:** Restate as "gap owns the base rhythm; a child that must sit one or two
  steps looser adds `margin-top` on top of it — the only sanctioned use of margin between
  flex children", and list the seven.

### P1-16 · The only semantic spacing the system has is documented nowhere

- **Section:** `#spacing`
- **Source:** `organisms.css:245-267`
- **Evidence:** The organism carries a complete named rhythm — "every rendered gap is 8,
  16 or 24 and each number means one thing: 8 parts of one thing / 16 one group to the
  next / 24 a decision, or a different route". The docs' entire treatment is one bullet.
- **Why wrong:** The semantic spacing layer is documented as specified-but-unbuilt, which
  is honest and correct — but a *rendered* semantic rhythm already exists and lives only
  in a CSS comment. Anyone building a new stage will invent a fourth value.
- **Correction:** Add a "The three rendered gaps" subsection with the 8/16/24 table and
  the `gap + margin-top` composition rule.

### P1-17 · `--keyboard-inset` is public API and is never declared

- **Section:** `#tokens`
- **Source:** consumed at `molecules.css` ×1, `organisms.css` ×3, `templates.css` ×2;
  set at runtime by `index.html:3063`
- **Evidence:** Six consumers across three layers size themselves against it. It is
  declared in no stylesheet and appears in no table, because `docs.js` harvests only
  `:root`. It resolves solely because every consumer wrote a `0px` fallback.
- **Correction:** Declare `--keyboard-inset: 0px` in `tokens.css` so the fallbacks become
  belt-and-braces rather than load-bearing, and document it as a runtime-set token naming
  its writer.

### P1-18 · Undocumented shipping components

- **Section:** `#atoms`, `#molecules`
- **Source:** `.a-scrim`, `.a-toast`, `.m-keyboard` — all in `index.html`, the file the
  docs claim to cover completely
- **Evidence:** Zero matches in the docs page. `.a-toast` carries `role="status"` and is
  the system's only live region; `.a-scrim` is the modal backdrop; `.m-keyboard` is the
  mechanism the whole documented compression order depends on.
- **Correction:** Add entries, noting the toast's live-region role.

### P1-19 · The copied markup misstates the nesting of any specimen containing SVG

- **Section:** `#molecules`
- **Source:** `docs.js` `tidy()` — the void-element list includes `path|circle|rect|use`
- **Evidence:** The HTML serialiser emits SVG children *with* end tags —
  `<rect …></rect>`, never `<rect …/>`. `tidy` treats the opening tag as void so it never
  indents, but the closing tag still dedents. Every SVG child therefore removes a level it
  never added. In the `.m-privacy` specimen the second `m-privacy__row` prints at column 0
  as though it were a sibling of `.m-privacy`, and `</svg>`, `</span>` and `</div>` all
  close at the root. `.m-sheet-header` degrades the same way.
- **Why wrong:** Two of the five wired specimens print and copy markup whose indentation
  misstates the nesting — under a comment promising the example and the code cannot
  disagree. The tags are intact, so this is whitespace damage, but it is the exact text a
  developer pastes.
- **Correction:** Drop `path|circle|rect|use` from the void list and make the indent
  symmetric per line — net opens minus closes, dedent before printing when negative.

### P1-20 · Two generated sections fail silently when nothing can be read

- **Section:** `#tokens`
- **Source:** `docs.js` `tokenTable()` and `tierTable()`
- **Evidence:** `tokenTable` builds an empty string when `TOKENS` is empty and then assigns
  it, *erasing* the standing placeholder — leaving a section headed "Every token"
  containing nothing, with no message. `tierTable` in the same state renders "Of **0**
  tokens" with a large `0` in each cell and a note that explains only why the *second
  column* is uncountable. Both occur when `authoredTokens()` is blocked and
  `computedTokens()` returns nothing, which is any engine that does not enumerate custom
  properties on computed style.
- **Why wrong:** Every other reader on the page states its degraded mode out loud. These
  two are the exceptions, and one of them renders a table of zeros that looks like a
  measurement.
- **Correction:** Guard both on `TOKENS.length` and print the same kind of honest note the
  large-text and motion sections already use.

---

## P2 findings

- **The tier percentage is measurably wrong.** `docs.js` classifies a token by the tail of
  its name, so it misfiles `--color-text-on-dark`, `--color-border-light` and three others
  as scale names, and counts `--sp-1h` / `--sp-2h` as role names. The rendered "77% of the
  scale is named for its job" should be 80%. The page presents this as measured, which
  makes an error in the classifier worse than an error in prose. *(Introduced by this
  session's work.)*
- **Forty of 191 tokens render no visual sample**, including the nine `--kb-*` colours,
  because the swatch test matches only `--color-` and `--glass-`. Also unsampled: every
  `--z-`, `--tracking-`, `--dur-`, `--leading-`, `--ease-`, `--font-` and `--press-` token.
- **Roughly a fifth of colour swatches are invisible** — white and white-alpha tokens drawn
  on a white panel. Every on-dark token is in that group.
- **Two glass tokens draw a broken swatch**: `--glass-sheet-bd` and `--glass-panel-bd` hold
  `blur(…) saturate(…)` filters, which `sampleFor` emits as a `background` value.
- **Elevation swatches clip.** `--shadow-phone` is `0 60px 200px` on a 30px chip inside an
  `overflow-x: auto` wrapper, so the largest elevations are the ones the sample cannot show.
- **The atom count is wrong.** `atoms.css` defines 13 blocks; the page says "Twelve".
  `a-spinner` is named in a heading whose stage does not contain it.
- **The molecule count is delivered against by a third.** Eleven blocks exist — correct —
  but only four have specimens.
- **Opacity has no scale and six competing raw values** (`.85 .55 .5 .45 .35 0.20`), three
  of which are different answers to "this control is inert". Undocumented entirely.
- **Traceability is missing two links of its own chain.** The stated chain is screen →
  template → organism → molecule → atom → tokens, but the table has no template column and
  no source-file column, and the Privacy row's atom cell is `—`.
- **A phantom dependency.** `m-sheet-header`'s specimen cites "depends on: a-icon-btn
  shape". `a-icon-btn` has zero rules in `src/css` and zero occurrences in `index.html`; it
  exists only in the unmigrated page. The same phantom is used in `#decisions` as evidence
  for an open ruling.
- **A second, hand-typed component spec exists.** `index.html` carries a `RECIPES` array of
  33 entries covering the same components this page documents, and it has already drifted —
  it records the OTP cell's font as `22px` where the CSS uses `var(--text-title)`, which is
  24px under large text.
- **Twenty one-off spacing values** sit in the component layers with no approved-exceptions
  list, mixing considered optical nudges (`margin-top: -1px /* optical, against cap
  height */`) with unexplained values (`.a-toast { bottom: 96px }`).
- **`#privacyCard:not([hidden])` is an ID-scoped layout rule in the foundations layer** —
  the only ID selector in the product CSS, and outside the documented ownership model.
- **Contrast coverage is understated.** The docs say "all 43 states"; `sweep.js` defaults to
  both files and measures 104.
- **The templates section makes three wrong claims in one sentence**: the sheet does not
  square its corners when the keyboard opens (the rule restates the same value), the
  Android notch is a 14px hole-punch rather than a pill, and the title step-down is
  triggered by sheet presence, not by the keyboard.
- **Three type steps have no consumer** on the documented page (`--text-display`,
  `--text-figure`, `--text-callout`) yet are rendered as live specimens; 41 tokens overall
  are used only by the unmigrated page and are presented identically to the rest.
- **21 of 37 text styles set no `line-height`**, so they inherit the UA's `normal` and sit
  outside the four-value `--leading-*` scale the docs present as the leading system.

- **Nothing links to the documentation.** `grep -c "design-system"` returns 0 for both
  `README.md` and `index.html`. The page is committed and deployed, and a reviewer
  following the README reaches the prototype and never learns it exists.
- **The generated family headings are styled by the browser, not the stylesheet.**
  `.ds-section > h3` is a child combinator, and the generated headings are grandchildren of
  the section, so "Colour", "Spacing", "Duration" fall back to UA `<h3>` styling and
  visibly differ from every hand-written `h3` above them.
- **`docs.css` hand-copies four production colour values** — `#0a1628` (`--color-hero-1`),
  `#e8f5ee`, `#166832`, `#1650b8` — while its own header comment says the shell's scale is
  "deliberately not the product's". The indirection was dropped without the stated benefit:
  rebrand the hero and the dark specimen silently stops demonstrating the hero.
- **Two movements leave the specimen invisible.** `sheetDown` and `scrimOut` end at
  `opacity: 0` and play with `fill-mode: both`, so pressing Play empties the stage
  permanently with no reset.
- **The motion catalogue is dead under OS reduced-motion** and says nothing about why. The
  page explains that the *product* honours reduced motion twice so the flow stays
  reviewable; the documentation offers no such escape for itself.
- **The 18 `--d-*` tokens are filtered out of "Every token" silently.** They are declared in
  `tokens.css`, not `developer.css`, so the page loads them and drops them — while the
  architecture table implies they are not present at all.
- **The tier section's live count carries a hand-written enumeration** naming the gradients,
  hover aliases and `color-mix()` steps. Six `--shadow-*` tokens are also built from other
  tokens and are not in the list — a second source of truth inside the one mechanism built
  to prevent them.
- **Copy failure is invisible.** When the clipboard is refused the text is selected instead,
  but the button label never changes and the keystroke is never named.

## P3 findings

- **The documentation page has no `<h1>`.** Its name is carried by a `<p>`. It does have
  `<main>` and a labelled `<nav>`, which makes this the one structural defect in an
  otherwise well-formed document.
- **The README understates the tap-target floor** — it says 44px; `--size-target` is 48px
  and `sweep.js` reads the token.
- **`rem` values are truncated** at four decimals, so `0.5px` renders `0.0313rem`, and the
  rem column fires on `--tracking-*` where it is meaningless.
- **`--ease-in-out` has no documented role** despite being the easing on the most-used
  transition in the system.
- **`--font-mono` is developer-only** but is listed beside the product face with no
  distinction, unlike `--kb-*` which is correctly annotated.
- **The large-text specimen caps its glyphs at 28px**, so `--text-figure`'s 64→68 step is
  drawn as two identical characters, with the explanation only in the source.
- **Two tracking values sit off-scale deliberately** (`organisms.css:82`,
  `molecules.css:89`) and the closed Tracking table does not say so.
- **"The scale is copied verbatim into both pages" is out of date** — `index.html` now
  links `tokens.css` and holds no declarations of its own.
- **`sampleFor` interpolates a token value into an HTML attribute without `esc()`** — the
  one path in the file that skips the escaper it uses everywhere else. Nothing breaks today
  because no sampled token contains a quote, but `--font-sans` already does.
- **`rem()` strips trailing zeros from the integer branch too**, so a future `160px` token
  would print `1rem`. No current token triggers it.
- **Three cross-references land at the top of `#tokens`** rather than the sub-heading they
  name, because the hand-written sub-headings and the generated family headings have no ids.
- **The rail highlight has no fallback** without IntersectionObserver, marks nothing on
  first paint, and is scrolled off-screen entirely under the stacked layout below 900px.

---

## What is genuinely right

Recorded because a review that lists only faults misrepresents the object.

- **The generated sections cannot drift.** Token tables, tier counts, the large-text scale
  and the keyframe catalogue are read from the live stylesheet at load. Every one was
  checked against the CSS and every one is correct.
- **The single-tier analysis is the strongest writing on the page.** It neither overclaims
  a reference tier nor understates the semantic naming, and its warning against a half-done
  palette is the right warning. Verified: 208 declarations, all in `tokens.css`, none
  component-scoped.
- **No `transition: all` anywhere** in the repository.
- **No literal colours in the component layers.** The single hex outside `tokens.css` is
  `#000` inside a `mask-image`, where it means "opaque" — tokenising it would be wrong.
- **Zero dead tokens.** Every one of the 191 is referenced somewhere.
- **Zero accidental duplicate declarations.** The 15 redeclarations are the deliberate
  large-text scale.
- **The reduced-motion account is unusually good** — it explains why `0.001ms` rather than
  `0`, so `transitionend` still fires.
- **Off-disk degradation is honest.** Where a browser refuses to read a linked stylesheet,
  the page says so rather than rendering an empty table that looks like a pass.
- **The `--size-target` floor is real and honoured** — 48px, read from the token by the
  sweep tool, with the sheet's close control extending a 36px circle to 48 via a
  pseudo-element.

---

## Final verdict

**1. Can a developer understand the complete design system from this document?**
No. They can understand the token scale, the layer architecture and the naming rules
completely and correctly. They cannot learn the type system (absent), the borders (absent),
the transitions (absent), the design principles (absent), or how to contribute (absent);
and 76% of the product's screens are not described at all.

**2. Can they trace every screen back to components and tokens?**
No. The matrix omits the template and source-file columns of its own stated chain, one row
terminates before reaching the atom level, the app's 13 screens are compressed into a
single row, and the sign-up screens table contains counts that match no real grouping.

**3. Are the rendered examples using the real production system?**
Mostly, but not faithfully. The markup is real and the component rules come from the
production stylesheets — `docs.css` defines no product-class selectors and overrides no
component rule. But it leaks by inheritance: every specimen renders in the shell's
typeface and leading rather than the product's, and links inside a specimen get the
shell's focus ring instead of the system's (P0-10, 17 measured drifting properties). Two
further defects are in the specimens themselves: one chooses the wrong variant for its
ground (P1-2) and one caption names a variant the stage does not contain. The
architecture is right; the isolation is incomplete.

**4. Is the spacing system explicit and consistently documented?**
No — this is the weakest area. The scale is misdescribed in its first sentence, the two
stated ownership laws are contradicted ten times between them, the semantic rhythm that
actually renders is documented only in a CSS comment, and no responsive spacing value
appears anywhere.

**5. Does the documentation accurately apply Brad Frost's hierarchy?**
Partly. Tokens are correctly kept out of the atomic levels and are never called atoms —
the critical conflation test passes. Pages and screens are correctly treated as one level.
But `spacing` stands as a peer between primitives and atoms, `o-outcome-panel` is
documented at the wrong level, the `p-` page level exists in the naming table with no
layer to live in, and the required section order is not followed.

**6. What must be corrected before the documentation can be approved?**

*Documentation-only, no design change, safe to do now:*
all nine P0s except P0-2 and P0-6; P1-1 through P1-12 and P1-14 through P1-18.

*Requires a production change and therefore a ruling first:*
- **P0-2** — whether the error field should thicken its border, or the docs should
  describe the glyph and shake instead.
- **P0-6** — adding a `<main>` landmark to both product files.
- **P1-13** — moving the layer-inspect rules out of `templates.css`.
- **P1-17** — declaring `--keyboard-inset`.
- **P1-14** — moving three component margins to their parents.

*Structural, and the highest-value change of all:*
- **P0-1** — gate the documentation. Until a tool derives these numbers, they will drift
  again, and the next review will find the same class of error in different places.

Two defects in this report were introduced by the documentation work itself and are marked
as such (P1-2 and the tier-percentage classifier). They are recorded at the same severity
as everything else.

---

## Corrections applied in this pass

Documentation-only. No production design changed, no component API changed. All four gates
were re-run afterwards: `check.js` clean, `journey.js` 71/71, `sweep.js` 104/0,
`sweep.js --large` 104/0.

**Specimen fidelity restored (P0-10).** The shell's type moved off `body` onto `.ds-rail`
and `.ds-main`, and `.ds-spec__stage` now re-asserts the product's inherited context. The
link focus ring is scoped to documentation chrome so it can no longer repaint a specimen.
`.ds-section p` became a child selector so it stops reaching into component markup. The
redundant reduced-motion rule was deleted — it was unlayered `!important`, so it outranked
the production rule it duplicated. The dark stage now reads `--color-hero-1` rather than a
copy of its value.

Verified by re-measuring: comparing like with like, `.a-btn--primary` and `.m-alert__title`
are now **computed-identical** to the same classes in `index.html`. Drift fell from 17
properties to 2, and both survivors are `min-height: auto` versus `0px`, which is a
flex-versus-block context difference rather than a leak.

**Markup corrected.** The field specimen is a `<label>` (P0-11). The alert specimen has its
glyph, its real nesting and its default tone (P0-12). `a-spinner` is rendered, inside the
primary button where it actually appears.

**False statements removed.** The error field no longer claims a thickening border; the
real non-colour cues — the helper glyph, the shake, and the forced-colours dashed outline —
are named instead, and forced colours is now a documented accessibility dimension (P0-2
documentation half, P1-11). The two dead deep links point at real states (P0-3). The
spacing scale says two half-steps and no 18, corrected in the docs and in the CSS comment
in both files it was copied from (P0-7). The atom and molecule counts are accurate and the
gaps are named rather than concealed (P1). The `developer` layer row no longer claims never
to ship, and the five tooling rules in `templates.css` are disclosed (P1-13
documentation half). Two specimen captions no longer advertise variants their stages do not
contain.

**The resend entry was itself wrong and is rewritten (P2).** It claimed two rules on the
atom and two on the organism, and that layers would have flipped them. Measured: three of
the four are in `atoms.css`, and both competing weight rules sit inside `@layer atoms`, so
layer order cannot separate them — source order alone decides. The entry now describes the
real problem, which is that pinning to preserve the pixels left three organism rules filed
under atoms, and that fixing the filing would change the rendering. That is a design
decision, not a refactor.

**README.** Now links the design system, and states the tap-target floor as 48px from
`--size-target` rather than 44px.

### Still open, and why

Everything requiring a production change is untouched and still needs a ruling: whether the
error field should thicken its border (P0-2), the missing `<main>` landmark (P0-6), moving
the tooling rules out of `templates.css` (P1-13), declaring `--keyboard-inset` (P1-17), and
moving three component margins to their parents (P1-14).

The structural work is also still open: the required section order (P1-1), the absent UI
principles and Contribution sections (P0-9), the typography section (P0-8), the borders
subsection (P1-9), the screens table's fabricated counts (P0-4) and the `o-outcome-panel`
misclassification (P0-5), the app's 13 undocumented screens (P1-12), and the transition
inventory (P1-6).

And P0-1 stands: until a gate reads this directory, these numbers will drift again.

---

## Second pass — the approved corrections

The design owner ruled on the three production questions and approved the documentation
work. What follows was done after the report above was written.

### Production changes, each against its ruling

**The error field** — *ruling: keep the border thickness so validation causes no layout
shift; carry the state with colour plus a visible icon and descriptive text; add
`aria-invalid` and associate the message with `aria-describedby`.*

The border is unchanged. `aria-describedby` and the helper glyph already existed;
`aria-invalid` did not, on two of the five paths that turn the field red — the
wrong-length number and the landline. A field went red and a screen reader was told
nothing was wrong.

Fixed at the cause rather than the two sites: the look and the announcement are now one
call, `setFieldState()`, used by all twelve places that change the field's state. Error is
the only state that sets `aria-invalid`; pending is not invalid, the number is fine and is
being sent.

**The `<main>` landmark** — *ruling: yes, one top-level `<main>` around the unique primary
content of each page, with no visual or layout change.*

Both pages had none, and the only `<nav>` was the developer state rail. The stage element
that holds the phone is now `<main>` rather than `<div>` — a tag swap, not a new element,
and both are block-level, so nothing moves. Its selector was already class-based. Verified
by the full sweep: 104 states, no change.

**The resend button** — *ruling: weight 500 while it is a non-interactive countdown, 600
when Resend becomes an available action; document them as two states of one component.*

That is already what renders — 600 from `.a-link`, 500 from `.a-link:disabled`. The defect
was a third rule *trying* to set 600 on the countdown, kept inert only because a later rule
of equal specificity happened to be typed after it. Removing it changes no pixels and
removes the contradiction, so the ruling is now what the stylesheet says rather than what
it accidentally does.

### The gate now reads the documentation (P0-1)

`check.js` gained a section, additive — no existing assertion was touched or weakened. Four
new checks:

1. Every state the docs deep-link to is a real key of `STATES`.
2. Every block defined in `src/css` is mentioned on the page, so a component cannot ship
   undocumented.
3. Every block the page names exists — in `src/css`, or in the unmigrated page, whose own
   stylesheet is the allowlist rather than a hand-written list that would go stale.
4. Every count the page states matches the count the gate computes. The page carries them
   in `data-count` so there is something to compare.

It earned its place immediately: it caught a component name the documentation had invented
(`a-filter-chips`, where production has `a-filter-chip`), and it rejects a fabricated class
in a negative test.

### Structure

The fifteen required sections, in order. Architecture folded into Overview, which is what it
was explaining; Naming folded into Contribution, which is when you need it; Spacing demoted
into Foundations and tokens, because spacing is a token family and not a level of the UI
hierarchy. Verified word-for-word that nothing was lost in the move: the only text that
changed was section titles.

Written: **UI principles** (twelve rules, each with the file and line that enforces it and
the exception the code actually takes), **Typography** (all 37 text styles), **Contribution
and governance**, and the **thirteen app screens**, whose state counts sum to 61.

The page also gained an `<h1>`; its name had been carried by a `<p>`.

### Typography, and what was deliberately not done

All 37 styles are documented with role, size, weight, leading, tracking, colour, element and
when not to use them. Two findings are recorded rather than fixed:

- **21 of the 37 set no `line-height`** and inherit the UA's `normal`, which is not a step on
  the `--leading-*` scale. That is the largest gap in the type system and it is where
  two-line labels collide under large text.
- **Nine consolidation candidates** are listed as proposals with their risks. None is
  applied. Production typography does not change without a ruling, and several would move
  pixels.

### Two instruments were wrong, and are corrected

Recorded because a review that trusts its own tools is worth less than one that checks them.

- **The focus-ring count.** The integrity probe focused each control with `el.focus()` and
  asked whether it had a ring. Programmatic focus does not reliably match `:focus-visible`,
  which is a keyboard affordance — so the check was measuring nothing, and its earlier
  "0 without a ring" was luck rather than evidence. Rebuilt to press real Tab keys: 130
  controls, 0 without a ring. Prose links take the documentation's 2px ring, and scroll
  containers fall through to the product's 3px `--color-focus`, which is correct.
- **Journey failures that were not real.** Six, then nine, then eight failures appeared, each
  run naming different tests. The cause was ~60 leaked Chrome processes from this review's
  own instruments starving the machine, plus a runaway system extension; `journey.js` walks
  the flows on the real clock and is load-sensitive. On a quiet machine, a worktree at HEAD
  and the working tree both return 71/71. The lesson is in the repo's own notes already:
  measure before diagnosing, and check whether the failing check is itself wrong.

One failure in that noise **was** real and is fixed: the `setFieldState` helper had been
written recursive by the same script that introduced it — the pass that rewrote every
`removeAttribute('data-state')` into a call to the helper also rewrote the helper's own. Every
clear was a stack overflow.

### Gate results after this pass

| Gate | Result |
|---|---|
| `node tools/check.js` | pass, including the new documentation section |
| `node tools/journey.js` | 71 passed, 0 failed |
| `node tools/sweep.js` | 104 states, 0 with failures |
| `node tools/sweep.js --large` | 104 states, 0 with failures |
| Documentation page | 15 sections, no duplicate ids, no dead anchors, no heading skips, 0 console errors, no sideways scroll at 1280/900/600/390 |

### Still open

Unchanged from the list above, minus what this pass closed. Still needing a ruling or still
unbuilt: the semantic spacing layer; the `line-height` gap; the nine typography
consolidations; moving the tooling rules out of `templates.css`; declaring
`--keyboard-inset`; moving three component margins to their parents; and the three
`.o-signup-sheet__resend` rules filed under atoms, where preserving the pixels and obeying
the filing law genuinely conflict.
