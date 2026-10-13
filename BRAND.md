# TFN brand rules

What makes a brand easy to recognise is a small set of rules applied without
exception. These are tfn's. They are written for the marketing site
(`fintech-site.html`) and apply to anything else that carries the tfn name.

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

- **White and cream carry the page, as on Wealthsimple.** Sections alternate
  white `#ffffff` and cream `#f5f3ef`; tiles are white on cream and cream on
  white; text `#0a0a0a`, secondary text `#6b6b6b`. Dark bands are a deep
  navy-black `#080f16`, not pure black. Business mode switches the whole page
  to black.
- **The structure stays plain, as on Revolut.** Colour is the exception
  and lives in imagery. Its look is ElevenLabs': deep, blurred, photographic
  colour fields that run from bright to dark in one shape, a fine tiled grain
  over everything (50% overlay), no gloss.
- **One hue per gradient.** Every gradient is a single colour in light and
  dark shades, like Revolut's and Wealthsimple's: blue here, pink there, never
  every colour in one field. Nothing else is mixed in, not orange, not gold.
  Each product owns one hue, used the same way everywhere:
  - Fuel: **blue** (pale sky, blue, deep navy)
  - Insurance: **pink** (pale pink, magenta-pink, deep wine)
  - Tracking: **violet** (pale lilac, violet, deep indigo)
  - Upkeep: **teal** (pale mint, teal, deep teal)
  - Complete: **a dusk**, blue into violet into pink, the one gradient that
    uses neighbouring hues, because it stands for all of them
  Hues are never used in text or icons.
- **Where colour goes, as on Revolut:** on black, in big product objects.
  The gradient fields live inside device screens, the bundle header and the
  photo tints, and the products and bundles sit on black bands so the colour
  pops. White sections and grey tiles stay plain. Gradients are never behind
  text on white and never a page background.
- **Cream is the warm light inside the gradients.** There is **no gold in any
  background or gradient**: Wealthsimple only uses gold on objects, and we have
  no gold object, so gold is not part of the palette. Never on surfaces, text,
  buttons or the logo.
- **Borrowed from Wealthsimple:** the lilac-pink dusk across Complete, and a
  text serif (Newsreader, standing in for Tiempos) for the small kicker and
  persona lines above headlines.
- **Texture:** every gradient, the orb and every photograph carry fine film
  grain, so the imagery shares one surface.
- Glass (frosted translucent white) is only used over colour or photography.
- **Colour has to mean something.** It is used in four ways and no others:
  1. **Which product:** the hue says Fuel, Insurance or Upkeep, in the same
     place every time (dots on tiles, photo tints, device screens, the line
     under the nav while you are in that product's section).
  2. **Which surface:** the app, the portal and the POS each get their own
     device, never a card.
  3. **State:** green means fine, red means it needs you, grey means coming
     up. Small dots only, never fills.
  4. **Touch:** a tile stays grey (or black) until you touch it, then the
     product's own gradient, with grain, spreads in from the point you touched.
     The same happens on the referral steps and the device buttons; nav links
     and footer links take a line or colour in the product's hue.
- Black bands exist to make colour pop. Put colour on black, not black on
  colour.

## 3. Type

- **Headlines:** Fraunces ExtraBold, large (up to 5.4rem on the hero), tight,
  sentence case. It is the same family as the wordmark, so the logo and the
  headlines read as one voice. Fraunces stands in for a licensed display serif.
- **Everything else:** Hanken Grotesk (body, buttons, tiles, nav), standing in
  for a licensed grotesque. Swap the single `--display` token to change it.
- **Kickers and persona lines:** Newsreader, a quieter text serif.
- No italics. No all-caps except the wordmark and small labels.

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

Real people doing the work: drivers, mechanics, people at the pump. Product
UI is laid over the photo in glass. Photos get a dark tint in the product hue
so text stays readable. Current photos are Unsplash stock placeholders.

## 7. Voice

Borrowed from how Wealthsimple writes: short, warm, confident and plain, with
a little playfulness. It says what you get and then stops.

- "The simplest way to run every vehicle."
- "Three tools. One quiet system."
- "Pick one. Add more when you are ready."
- A **TLDR** block near the end that says the whole offer in three short lines.
- No jargon, no superlatives we cannot prove, no invented numbers in headlines.

## 8. Motion

Things arrive, they do not bounce: content rises and fades in once, devices
fan out, numbers count up, colour drifts slowly. Everything stops when the
viewer has reduced motion switched on.

## Tokens (as implemented)

| token | value |
|---|---|
| text | `#0a0a0a` |
| muted | `#6b6b6b` |
| cream | `#f5f3ef` |
| dark band | `#080f16` |
| radius | 20 to 28px, pills 999px |
| headline | 500, `-0.03em` |
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

## 10. Page rhythm and motion, as Revolut's home page

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

- **Intro curtain:** the orb and wordmark on navy, then the curtain lifts and
  the hero begins.
- **Colour wipe:** clicking a link to another section sweeps a sheet in that
  product's hue up the screen, jumps the page behind it, and the sheet leaves
  upward. Reduced motion gets a plain scroll.
- **Scenes overlap** with rounded tops, and the scene underneath recedes and
  dims as the next one rises.
- **Headlines** reveal word by word. **Photographs and devices** open from a
  clipped frame.
- **Drivers / Business** is a circular reveal that grows out of the switch.
  Switching product is a cross-fade.
- Everything above is switched off for viewers who ask for reduced motion.
- **Nav mega menu:** hovering or focusing a nav item drops a frosted glass
  panel under the bar. It opens slightly smaller and settles, the links
  stagger in, and moving along the nav swaps the panel's content. Escape or
  scrolling closes it.
