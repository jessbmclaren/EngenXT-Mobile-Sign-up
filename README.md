# EngenXT sign up

An interactive design prototype of the EngenXT home screen and sign-up flow,
for a South African fleet-fuel app used by drivers at the pump.

**Live:** https://jessbmclaren.github.io/EngenXT-Mobile-Sign-up/

Two self-contained HTML files. No build, no dependencies, no network calls.
Open either directly if you prefer.

- `index.html` — the home screen and sign-up.
- `engenxt-onboarding.html` — what a driver arrives in afterwards: linking
  today's vehicle by scanning it, and getting a fuel authorisation at a pump.

The rail in each one links to the states of the other, so you can start
anywhere.

## What it covers

103 states, not just the happy path: 42 in sign-up and 61 in the app. Drivers
are registered by their company, so a number the system does not hold is a
routine outcome rather than an edge case, and it has a designed state that
tells the driver what to do about it.

The same holds for the camera. A bleached licence disc, a dark bay, glare off
a plate, a lens wiped with a diesel glove and a refused permission are all
ordinary, and none of them is allowed to be the thing that stops somebody
fuelling.

The 6-digit code arrives on WhatsApp, with SMS as the fallback. The home
screen offers one entry action rather than asking a driver to know whether an
account already exists, and when the block is technical that action is
replaced by a single recovery.

## Using it

Pick any state from the rail on the left, or drive the flow by hand with the
numbers in the key at the foot of the rail. In this demo the code is `123456`.

Under **Developer** the rail has four switches:

- **Design specs** opens the token reference, component recipes, naming rules
  and a contrast audit measured from the live stylesheet.
- **Inspect elements** shows, for anything you hover, which token each computed
  value resolves to. Anything reporting *no token* is drift.
- **Composition outlines** colours the atomic level of every element.
- **4px grid** overlays the spacing grid.

There are also toggles for reduced motion, large text, offline and a 320px
screen, so the states can be checked under the conditions drivers actually use.

## Checks

```
node tools/check.js
```

Runs on every push and pull request, and it is the only script in the repo. No
dependencies and no build — there is nothing to install.

It covers the three ways these files have actually broken:

- **The script does not parse.** Each page is one inline `<script>`, so a stray
  brace is not a degraded feature, it is a blank phone.
- **An id is looked up that the markup no longer has.** The element registry
  dereferences everything at load, so a rename that misses one lookup is a
  TypeError on line one — blank phone again.
- **The state rail falls behind.** Each file lists the other file's states from
  a hand-written copy. When it drifts nothing looks wrong; the state is just
  unreachable unless you know to type its hash. It also catches a rail pointing
  at a file that is not in the repo, which shipped once and made every away
  link a 404.

## Status

A prototype, not production. It talks to nothing and stores nothing. The
support and manager links point at a placeholder number.

## Checking it

Three tools, no dependencies beyond Node and Chrome:

- `node tools/check.js` — the fast gates, run by CI on every push: scripts
  parse, every looked-up id exists, the two files' state rails and product
  tokens agree, and the driver-facing words stay plain (no idiom, no
  authorise/verify/biometric — the copy standard for second-language
  readers, held by a tool instead of a reviewer's memory).
- `node tools/sweep.js [--large]` — renders every state headless and
  measures what a driver would meet: status-bar contrast sampled off real
  pixels, tap targets at 44px counting pseudo-element hit areas, nothing
  stranded past a scroller, nothing thrown. A few minutes; run before a
  merge.
- `node tools/journey.js` — walks the flows with real events and the real
  clock: the typed code into the face-or-fingerprint offer, the till reading
  the QR, litres counting, the notification, the receipt keeping its promise
  on home, History, and the pump that stops early. About two minutes.

Set `CHROME=/path/to/chrome` if Chrome is not at the macOS default.
