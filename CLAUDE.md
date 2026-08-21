# Working instructions, EngenXT fleet portal

## The rail stays. The annotations moved.

Section 9 was applied and then half taken back, on the owner's call both
times, and the result is the useful middle: every screen is still one press
away, and no commentary is printed on any of them.

| | where it is now |
|---|---|
| Screens and Notes rail | in the product, all 39 screens and 51 drawer states |
| Documentation screens | in the product, all 9 |
| Design annotations (87) | `DESIGN-NOTES.md`, keyed by screen |
| Annotation blocks (11) | `DESIGN-NOTES.md` |
| In-sheet state switchers | removed, the rail already reached those states |

The reasoning, so the next change does not undo it: the rail is how this
file is reviewed and losing it costs the reviewer everything. A paragraph
explaining why a control reads the way it does is a different thing, and
printing it beside the control means whoever is trying to read the control
reads that instead.

`tools/production.js` holds the line, eleven checks, asked of the rendered
page rather than the source:

- the rail reaches every screen in the document, and every drawer state
- no annotation renders on any screen
- no reviewer's vocabulary on a product screen. The nine catalogue pages
  are exempt: a page titled "Screen states to templates" cannot be written
  without the words, and naming what you catalogue is not commentary
- the documentation screens are still reachable
- the notes are still written down
- and the product still works, because the cheapest way to pass a removal
  test is to remove too much

Two things learned the expensive way, both worth not repeating:

- `.surfaces` looks like an annotation wrapper and five of the seven are
  not. The import review's whole interactive figure lives inside one. Strip
  the prose first, then remove a wrapper only if that left it empty.
- Routing runs through the rail. `go()` finds a rail button and clicks it,
  so removing the rail silently breaks every address in the file. There is
  a fallback now, but the rail is the primary path.

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
