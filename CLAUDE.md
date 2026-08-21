# Working instructions, EngenXT fleet portal

## Section 9 has been applied. This file is now the product.

It used to hold the product and the argument for it side by side, and the
note here said so, at length, and said section 9 must never be run against
it. That was true until it was not. The owner was asked directly, with the
counts and the consequence in front of them, and chose to apply it.

What was taken out of the rendered page:

| | count |
|---|---|
| Screens and Notes rail | 1 |
| Design annotations (`.surface-note`) | 87 |
| Annotation blocks (`.figure-notes`) | 11 |
| Documentation screens | 9 |
| Developer state switchers | 2 |

What was kept, and where:

- **`DESIGN-NOTES.md`** holds all 98 notes, keyed by the screen each was
  written against. No route renders it. Nothing was deleted, only moved.
- **30 product screens** remain and all of them still route.
- The five `.surfaces` wrappers that held working figures were kept. They
  looked like annotation containers and were not: the import review's whole
  interactive figure lived inside one, and removing them wholesale deleted
  it. That was caught by opening the page, not by reading the source.

`tools/production.js` now holds the line: it walks every screen, asks the
rendered page rather than the file, and fails on a rail, an annotation, a
reviewer's vocabulary, a documentation route, a design-only accessible
name, or a state switcher. It also checks the product still works, because
the cheapest way to pass a removal test is to remove too much.

Two things worth knowing before the next change:

- Routing no longer goes through the rail. `go()` falls back to showing the
  section a key names, because every route used to be a rail button and with
  the rail gone the address bar stopped meaning anything.
- The counts above are what the checker asserts. If a screen is added, the
  checker walks it too; nothing needs updating by hand.

---

## 9. REMOVE ALL DESIGN AND PROTOTYPE NOTES FROM THE PRODUCT

No design notes, annotations, review controls or prototype navigation may
appear in the production UI.

Remove from all production screens:

- "Screens" and "Notes" navigation.
- The screen-state catalogue and links such as "Directory: loading",
  "Reported: the receipt" and "Blank form".
- Sticky notes, reviewer comments, stars, stickers, labels and annotations.
- Designer names or initials such as "Jess".
- "TBC", "TODO", placeholder instructions and unresolved design questions.
- Copy that refers to "this screen", "this prototype", "the demo" or
  implementation details.
- Developer-only state switchers and test controls.
- Visible technical debugging information.
- Design rationale presented as user-facing help.
- Duplicate explanatory notes that were only intended for developer handoff.

Do not necessarily delete useful design documentation. Move or retain it in a
clearly separated development/documentation location that is never rendered by
production routes.

Production navigation must contain only real user destinations. Prototype state
examples must not be discoverable through the product sidebar, top navigation,
search, keyboard focus order or accessibility tree.

Audit all:

- HTML and templates
- JavaScript-rendered content
- CSS pseudo-elements
- Dialogs, sheets and popovers
- Empty, loading, error and success states
- Mobile and desktop layouts
- Accessible names and hidden screen-reader text
- URLs, headings and browser titles
- Print and screenshot styles

Search the repository for likely prototype strings, including: "Screens",
"Notes", "TBC", "TODO", "Jess", "screen state", "prototype", "demo",
"for review", "design note", "ADD VEHICLE STATES", "ONE THEFT, IN ORDER" and
"BREAK-GLASS".

Do not blindly delete legitimate product language such as operational notes
entered by a fleet manager. Distinguish user-created vehicle/incident notes
from designer annotations.

Add a production-mode test that fails if:

- The Screens/Notes catalogue is rendered.
- Any design annotation is visible or focusable.
- Prototype routes are included in production navigation.
- Developer state controls are exposed.
- Documentation content is included in the production accessibility tree.

In the final report, list:

1. Every production-facing design note or prototype control found.
2. What was removed from production.
3. What documentation was retained and where.
4. Evidence that production navigation and accessibility trees contain no
   design-only content.
