# EngenXT sign up

An interactive design prototype of the EngenXT home screen and sign-up flow,
for a South African fleet-fuel app used by drivers at the pump.

**Live:** https://jessbmclaren.github.io/EngenXT-Mobile-Sign-up/

One self-contained HTML file. No build, no dependencies, no network calls.
Open `index.html` directly if you prefer.

## What it covers

36 states, not just the happy path. Drivers are registered by their company,
so a number the system does not hold is a routine outcome rather than an edge
case, and it has a designed state that tells the driver what to do about it.

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

## Status

A prototype, not production. It talks to nothing and stores nothing. The
support and manager links point at a placeholder number.
