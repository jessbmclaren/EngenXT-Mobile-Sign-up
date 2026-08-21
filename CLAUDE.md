# Working instructions, EngenXT fleet portal

## Read this before acting on section 9

This repository is the **annotated prototype**, not the production build. The
things section 9 describes as contamination are, here, the artefact itself:

| | count |
|---|---|
| Catalogued screen states (`<section id="screen-…">`) | 39 |
| Rail buttons that reach them (`data-screen="…"`) | 39 |
| Design annotations (`.surface-note`) | 86 |
| Annotation blocks (`.figure-notes`) | 11 |

The Screens/Notes rail, the "ADD VEHICLE STATES" and "ONE THEFT, IN ORDER"
groups, and every note explaining why a screen is the way it is. These are
what the file is for. `tfn-fleet-portal.html` is a single document that holds
the product and the argument for it side by side, and the argument is reviewed
by opening it.

So: **section 9 applies to the production build, when there is one.** It is
recorded here so it is not lost, and so the production work starts from a
written rule rather than a memory of one. Do not apply it to this repository, 
doing so would delete the deliverable.

Two consequences worth stating now, while the rule is fresh:

- The separation section 9 asks for does not exist yet. There is no build step
  that strips annotations, and no production route. Creating one is the real
  task behind section 9, and it is larger than the deletions the section lists.
- The production-mode test it asks for cannot be written until something
  produces a production build to test. Writing one against the prototype would
  assert that the prototype is not itself, which is false and would fail
  immediately.

When the production build exists, the checkers in `tools/` are the pattern to
follow: they drive the real DOM in a browser and assert on what renders, which
is exactly what "not in the accessibility tree" needs to be proved by.

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
