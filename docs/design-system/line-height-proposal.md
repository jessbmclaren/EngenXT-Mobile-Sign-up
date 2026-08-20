# Line-height proposal

21 of the 37 text styles set no `line-height` and inherit the user agent's
`normal`. That is not a step on the `--leading-*` scale, and it is not even a
constant: measured across the flow it lands anywhere between **1.18 and 1.28** depending
on the size. So the system has a four-value leading scale that most of its text does not
use, and what those styles actually render is decided by the font rather than by the
design.

**Nothing here has been applied.** Every row is a proposal with its measurement, because
several of them move pixels and that is a design decision.

## How this was measured

Every state of the sign-up flow was walked twice - once at `data-text="default"`, once
at `[data-text="large"]` - and for each selector the largest rendering found was
recorded: font size, box height, and how many lines it actually wrapped to. A style that
never wraps is a style whose leading nobody can see; a style that wraps only under large
text is where an explicit leading either prevents a collision or causes one.

*After line* is the font size times the proposed token. *After box* is that times the
line count observed at that size. Columns read *default / large*.

## The three that change shape under large text

These are the priority, because they are the only styles whose line count differs
between the two text sizes:

| Style | Default | Large | What that means |
|---|---|---|---|
| `.m-figure__key` | 1 line, 12px | **2 lines, 30px** | an uppercase key doubling in height beside its value |
| `.o-auth-hero__how` | 1 line, 15px | **2 lines, 34px** | the reassurance under the primary action |
| `.o-status-page__title` | 1 line, 23px | **2 lines, 50px** | a full-screen outcome heading |

At `normal` those two-line boxes are set by the font. With an explicit tight leading
they would be 26.4px, 45px and 44px - tighter in every case, which is the direction that
reduces collision rather than causing it.

## Controls - P1

The label inside a pressable thing. Its box is governed by `--size-control` or `--size-target`, so leading decides where the text sits in that box rather than how tall the box is. Two of these already wrap to two lines at both sizes.

| Style | Proposed | Size | Before box | After line | After box | Note |
|---|---|---|---|---|---|---|
| `.a-btn` | `--leading-tight` (1.1) | 17px / 19px | 56px / 56px | 18.7px / 20.9px | 37.4px / 41.8px | wraps to 2 lines at both sizes, inside a 56px box |
| `.a-btn--sm` | `--leading-tight` (1.1) | 14px / 16px | 48px / 48px | 15.4px / 17.6px | 30.8px / 35.2px | wraps to 2 lines at both sizes, inside a 48px box |
| `.a-link` | `--leading-tight` (1.1) | 14px / 16px | 48px / 48px | 15.4px / 17.6px | 15.4px / 17.6px | single line inside a 48px target |
| `.a-field__input` | `--leading-flush` (1.0) | 17px / 19px | 21px / 24px | 17.0px / 19.0px | 17.0px / 19.0px | a typed value, never wraps |
| `.a-otp-cell` | `--leading-flush` (1.0) | 22px / 24px | 52px / 52px | 22.0px / 24.0px | 22.0px / 24.0px | one digit, centred in a fixed cell |

## Labels - P1

Short uppercase text naming something else. `.m-figure__key` is the one that already breaks: a single line at default, two under large text.

| Style | Proposed | Size | Before box | After line | After box | Note |
|---|---|---|---|---|---|---|
| `.a-label` | `--leading-tight` (1.1) | 13px / 15px | 16px / 18px | 14.3px / 16.5px | 14.3px / 16.5px | field label, single line |
| `.a-progress` | `--leading-tight` (1.1) | 11px / 13px | 13px / 16px | 12.1px / 14.3px | 12.1px / 14.3px | uppercase step counter |
| `.m-figure__key` | `--leading-tight` (1.1) | 10px / 12px | 12px / 30px | 11.0px / 13.2px | 11.0px / 26.4px | WRAPS AT LARGE - 1 line becomes 2 |
| `.m-brand-lockup__tag` | `--leading-tight` (1.1) | 11px / 13px | 13px / 16px | 12.1px / 14.3px | 12.1px / 14.3px | uppercase strapline |

## Supporting text that wraps - P1

Sentences rather than labels. These are where leading is actually read, and where `normal` is tightest relative to what prose needs.

| Style | Proposed | Size | Before box | After line | After box | Note |
|---|---|---|---|---|---|---|
| `.o-auth-hero__how` | `--leading-body` (1.5) | 13px / 15px | 15px / 34px | 19.5px / 22.5px | 19.5px / 45.0px | WRAPS AT LARGE - 1 line becomes 2 |
| `.o-outcome-panel__meta` | `--leading-body` (1.5) | 12px / 14px | 15px / 17px | 18.0px / 21.0px | 18.0px / 21.0px | a supporting offer under the clock |
| `.o-signup-sheet__noteMore` | `--leading-body` (1.5) | 12px / 14px | 15px / 17px | 18.0px / 21.0px | 18.0px / 21.0px | inline disclosure inside the note sentence |

## Headings - P2

Named surfaces. `.o-status-page__title` is the third style that wraps only under large text, and it is the largest jump of the three.

| Style | Proposed | Size | Before box | After line | After box | Note |
|---|---|---|---|---|---|---|
| `.o-status-page__title` | `--leading-tight` (1.1) | 18px / 20px | 23px / 50px | 19.8px / 22.0px | 19.8px / 44.0px | WRAPS AT LARGE - 1 line becomes 2 |
| `.o-outcome-panel__title` | `--leading-tight` (1.1) | 18px / 20px | 46px / 50px | 19.8px / 22.0px | 39.6px / 44.0px | wraps to 2 lines at both sizes |
| `.m-sheet-header__title` | `--leading-tight` (1.1) | 22px / 24px | 27px / 29px | 24.2px / 26.4px | 24.2px / 26.4px | the stage heading |

## Figures - P2

Numbers read at a glance. Tight leading keeps a figure and its key visually paired.

| Style | Proposed | Size | Before box | After line | After box | Note |
|---|---|---|---|---|---|---|
| `.m-figure__val` | `--leading-tight` (1.1) | 20px / 22px | 25px / 27px | 22.0px / 24.2px | 22.0px / 24.2px | the value in a key/value read-out |
| `.m-phone-field__code` | `--leading-flush` (1.0) | 15px / 17px | 18px / 21px | 15.0px / 17.0px | 15.0px / 17.0px | the fixed +27 prefix |

## Deliberately excluded

| Style | Why |
|---|---|
| `.m-status-bar__time` | the drawn handset clock - OS chrome, not app text |
| `.m-status-bar__net` | the No-service label - OS chrome |
| `.m-keyboard__digit` | the drawn Android keypad - OS chrome, and already off the type ramp on purpose |
| `.m-keyboard__sub` | the keypad sub-labels - same reason |

## What this would cost

Every row changes a rendered box, so **this proposal moves pixels** - that is the point
of it, and why it is a proposal. Two consequences to weigh before approving:

- **The supporting-text group loosens.** `--leading-body` (1.5) is larger than
  `normal` at every size, so those three get taller and push the content below them down.
  That is correct for prose, but it is the group that moves other things.
- **Everything else tightens.** `--leading-tight` (1.1) and `--leading-flush`
  (1.0) sit below `normal`, so those boxes shrink. For the controls that is invisible -
  their height comes from `--size-control` or `--size-target`, not from the text -
  but for labels, headings and figures it is a real change.

## Recommended order

1. The three that change shape under large text, since they are the live risk.
2. The rest of the controls, where the box height comes from the target and the change is
   invisible.
3. The labels and figures.
4. The supporting text last, because it is the group that grows and therefore the one that
   moves everything beneath it.

Each step wants the verification the architectural work got: a computed-style fingerprint
before and after, and all four gates. Unlike that work, these will show real differences -
the fingerprint's job here is to prove the differences are *only* the intended ones.
