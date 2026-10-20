# TFN brand rules

The full, visual brand guide is the **Brand guide** tab on `tfn-page-examples.html` (or `#brand`).
Look and feel: premium fintech, built for transport. Upmarket and exact, never glossy, never cheap.

What makes a brand easy to recognise is a small set of rules applied without
exception. These are tfn's. They are written for the marketing page
(`tfn-page-examples.html`) and apply to anything else that carries the tfn
name. Sections 4 to 10 still describe the older `fintech-site.html` where the
two differ.

## 1. The logo

- The logo is the **wordmark** `TFN`, uppercase, set in a heavy, soft,
  high-contrast serif (Fraunces Black stands in for the licensed display
  serif it is modelled on). Master artwork: `logo-wordmark.svg`, and the
  `#logo` symbol in the site, which is live text so it follows the font.
- It appears in **black on light** or **white on dark**. Nothing else.
- Never colour it, put a gradient or shadow on it, rotate it, outline it,
  stretch it, crop it or set it on a busy or low-contrast background.
- The **orb** (`logo-mark.svg`) is the brand's icon: a grainy glass sphere in
  light and dark shades of one hue. Its default is **blue**. On the site it
  **takes the hue of the product you are in** (blue for Fuel, pink for
  Insurance, violet for Tracking, teal for Upkeep, the dusk for Complete) and
  blends between them as you move. It is the tab icon (always blue), the
  assistant button ("Ask tfn") and the announcement bar mark. It is never
  placed beside the wordmark. The wordmark never changes colour.
- Minimum width 48px on screen. Clear space on every side is the height of
  the letter `t`.

## 2. Colour

- **Sections are white or black, nothing else.** White `#ffffff` and black
  `#000000` alternate down the page; the footer is charcoal. No cream, no
  navy, no tinted bands. Text on white is `#1f1f1f`, secondary text `#717173`;
  on black, text is white and secondary text `#a8a8a8`.
- **Colour lives in things, never in the structure.** It appears only in
  photographs, product UI (the app, portal and POS screens), the orb and the
  maps. Buttons, headlines, links and section backgrounds stay black and white.
- **One hue per gradient.** Each gradient is one colour in light and dark
  shades. Each service owns one hue, used the same way everywhere (dots on
  tabs and photo badges, device screens, the orb):
  - Fuel: **blue**
  - Insurance: **pink**
  - Network: **violet**
  - Homebase: **teal**
  The one exception is the orb's **All** state, a soft pastel mix of blue,
  green and purple taken from the old swirl logo. Never orange, never gold.
- **Colour says which product, the finish says your tier.** Product pages are
  white, told apart by a faint gradient wash and one muted accent: On-Road blue
  `#2a6fd0`, LCV cyan `#0e8fb3`, Non-Fuel slate `#4f6b8a`, Network indigo `#3346a8`,
  Homebase teal `#138a85`, TFN Africa violet `#6b62c9` (accent only), Credit plum
  `#a2468e` (accent only). No pastel toys, neon, coins or glows: it must never look
  childish. **Black is for premium** (the tiers page). Tiers are materials, never
  hues: brushed bronze, silver, pale gold, clear prismatic glass (Diamond) and
  brushed platinum on black, shown as a squircle badge, not a card. TFN's own volume
  ladder (tfn.co.za/price-list).
- **One app.** Every product shows the same neutral phone; only the accent changes.
  The TFN wordmark sits top-left of every screen and the portal sidebar.
- **TFN orange, a tiny flash.** `#f2761d` is only a small live or new dot on light screens.
  On dark screens live uses the product colour; warnings (low tank, over limit) use red.
  Never a fill, never a big number, never on black.
- **Orange is never a call to action.** No orange buttons, links, selected tabs, pills,
  toggles or route lines. Orange means status (live, new, saving, warning), so an
  orange button would read as an alert, not an action. Calls to action stay ink on
  light grounds and white on dark; inside app screens the accent is TFN blue.
- **Every product page shows its portal.** A fleet manager portal view below the
  hero does that product's one job, interactively: live fills on a map (On-Road),
  rules deciding a request (LCV), booking a stop (Non-Fuel), route and saving
  (Network), a glass tank (Homebase, the one 3D object), a cross-border corridor
  (TFN Africa) and credit limits (Credit). 3D stays restrained: the portal tilts in
  as it arrives, phones lean toward the pointer.
- **Dark mode.** Product pages and app screens follow the visitor's setting, with a
  toggle in the nav.
- **Photos: real, coloured by real light.** Real photography first. AI only if no one could tell
  (no uncanny eyes, odd hands, waxy skin or melted text); almost real reads as fake. Colour comes from the light in the scene: deep navy, teal, graphite, white
  and grey, low saturation, soft contrast. Pink or violet only when really in the scene (a dusk
  sky, a screen's glow), never painted on. Never a cut-out person on a flat colour: people stay in
  a real place; studio backdrops are for products only. Light is cool, never orange.
- **Maps are dark by default.**
- **Coins are silver.**
- **State:** green means fine, red means it needs you, grey means coming up.
  Small dots only, never fills.
- Glass (frosted translucent white) is only used over colour or photography.

## 3. Type

- **One sans for everything.** Aeonik Pro is the intended face; Satoshi
  (Fontshare) stands in until it is licensed. The `--sans` token lists
  `"Aeonik Pro", "Satoshi"` so the licensed font takes over as soon as it is
  loaded.
- **Headlines:** weight 500, line-height 1, sentence case, short. h1 85px,
  h2 50px at 1280px wide, slightly negative tracking.
- **Body:** 18px, line-height 1.5, in a 1000px column.
- **Buttons:** 42 to 44px tall full pills, `#1f1f1f` on white, white on black,
  weight 500.
- **Small print** goes in footnotes marked ¹ ² ³, not in the body copy.
- Fraunces is kept only for the wordmark. No serif anywhere else, no italics,
  no all-caps except the wordmark and small labels.

## 4. The page template

Every section is one of three shapes, so the page reads the same from any
distance:

1. **Centred:** headline, one line of copy, one pill button, then the product.
2. **Split:** text on one side, a picture on the other, one pill button.
3. **Grid:** a headline block above tiles on light grey.

Bands alternate between light and black. Tiles use a 20 to 28px radius.
Buttons are always full pills, black on light and white on black.

## 5. The signature objects

- The **tilted device**: the app on a phone, the portal in a browser window and
  the POS terminal, each turned -14° and skewed 8°, with a real thickness
  (a stacked edge) and a bevelled screen. tfn does not issue cards.
- The **phone on a ribbed black block**.

## 6. Photography

- **The main people are the buyers:** logistics, operations and tech-minded
  managers at work, at a laptop or on a warehouse floor. Candid, not posed, and
  never another person-on-a-phone shot.
- **Supporting scenes:** trucks at night or at blue hour, a hand on the
  nozzle, trucks from above, open southern African roads. Cinematic, no
  fuel-brand forecourts. No farming.
- **Cool light, not orange.** Blue hour, night, overcast or clear daylight.
  No orange sunsets or golden hour: orange photos on black sections read as
  Halloween.
- **South African context:** left-hand traffic and European cab-over trucks,
  no American conventionals. A right-hand-traffic road photo can be mirrored
  if no text shows.
- **No visible brands** on lanyards, trailers, pumps or laptops where it can be
  avoided; crop them out.
- **Keep the subject off-centre** where copy or a glass card sits in the
  middle; the hero subject sits right of the phone (`tools/photo-extend.swift`
  widens a backdrop to get there).
- Current photos are Unsplash placeholders in `img/`; a real TFN shoot
  replaces them.

## 7. Voice

Short, warm, confident and plain, with a little playfulness. It says what you get and then stops.

- "The simplest way to run every vehicle."
- "Three tools. One quiet system."
- "Pick one. Add more when you are ready."
- A **TLDR** block near the end that says the whole offer in three short lines.
- No jargon, no superlatives we cannot prove, no invented numbers in headlines.

## 8. Motion

Things arrive, they do not bounce: content rises and fades in once, devices
fan out, numbers count up, colour drifts slowly. Everything stops when the
viewer has reduced motion switched on.

- **Orbs breathe like clouds.** The colour inside an orb gathers, thins and rolls
  on like cloud, slowly and never repeating, never in step with its neighbours;
  the circle and its grain stay still.
  Small orbs (24 px and under) and map pins do not move.
- **Product screens show themselves working, once.** Each portal plays one short
  moment as it scrolls into view (a request approved, a service booked, a route
  drawn with its stops, a fill from the yard tank, limits filling up), then
  hands over at the first touch. No loops.

## Tokens (as implemented in `tfn-page-examples.html`)

| token | value |
|---|---|
| text | `#1f1f1f` |
| muted | `#717173` |
| muted on black | `#a8a8a8` |
| sections | `#ffffff` / `#000000` |
| font | `"Aeonik Pro", "Satoshi", …` |
| headline | 500, line-height 1 |
| h1 / h2 / body | 85px / 50px / 18px |
| column | 1000px |
| nav | 72px |
| button | 42 to 44px pill, `#1f1f1f` |
| radius | 20 to 28px, pills 999px |
| ease | `cubic-bezier(.2,.7,.2,1)` |

## 9. Maps

Where we show a map (the Tracking panel and the live map section) it is
**black and white and glass**: a dark monochrome map with a faint dot grid,
dark roads with fine edges, hatched parks, uppercase spaced street labels, a
glowing white highway and a glowing white route, a white navigation puck with
a dark label chip, grey parked pins and a single red pin for anything that
needs attention. Everything that floats over it is frosted dark glass: the
vehicle sheet with its grabber, the map controls, the vehicle labels and a
small monospace live readout. It is always dark, in Driver mode and Business
mode alike. It is our own drawing and uses no third-party map data or marks.

## 10. Page rhythm and motion

The home page is a run of **full-screen scenes**, one screen tall each, with
the colour ground changing from scene to scene: blue hero, white, photo
(Fuel), navy (the three tools), pink (Insurance), black (the map), teal
(Upkeep), then white and cream for the grid, the products, the bundles and
the TLDR, and navy for the referral and the footer.

- **Hero:** a flat colour ground first, the outline of the phone draws itself,
  then the photograph fades in behind it, the number counts up inside the
  frame and two badges rise. The nav is clear with white text over the hero and
  turns solid once you scroll past it.
- **Scenes:** the title, the copy and the product rise in one after another as
  the scene arrives. Pills inside a scene swap its photograph and its number.
- **Colour grounds** are the product's own single-hue gradient with grain.

## 11. Page transitions

- **Scenes overlap** with rounded tops, and the scene underneath recedes and
  dims as the next one rises.
- **Photographs and devices** open from a clipped frame. Numbers roll up.
- There is no intro curtain, no colour wipe between sections and no
  word-by-word headline reveal: they were tried and removed.
- Everything above is switched off for viewers who ask for reduced motion.
- **Nav mega menu:** hovering or focusing a nav item drops a frosted glass
  panel under the bar. It opens slightly smaller and settles, the links
  stagger in, and moving along the nav swaps the panel's content. Escape or
  scrolling closes it.
