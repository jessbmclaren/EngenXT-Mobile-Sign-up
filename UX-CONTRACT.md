# UX contract

Decisions that a later change could quietly undo, written down so it cannot
happen by accident. Each one says what was decided, why, and what would have to
be true to revisit it.

Enforced by `node tools/engine-capacity.js`. A rule here without a check is a
preference; a rule with one is a contract.

## Engine capacity

Engine capacity is deferred from the UI until an implemented workflow consumes
it, such as motorcycle licence compatibility.

**Decided** 20 August 2026.

**Why.** The field was in the Add vehicle form, inside Fuel specification,
directly above tank capacity. Engine displacement is not a fuel quantity, and
sitting the two together invited exactly the confusion the field claimed to
prevent. It was described as required for motorcycles, scooters, courier
motorcycles and three-wheelers, and optional elsewhere, so on the nine
categories this fleet actually runs it asked every person adding a vehicle for
a number nothing reads.

The only stated use is checking an A1 against an A motorcycle licence. That
check does not exist. Licence codes are held on the driver record and nothing
compares one to a displacement.

**What is still true.**

- Tank capacity is required, and is validated on its own. It never reads engine
  capacity, and engine capacity never changes it.
- `engine_capacity_cc` stays an optional, recognised CSV import column, so an
  existing fleet export loads without being edited first.
- The vehicle taxonomy still records which categories would want a displacement
  if anything asked. That key is the fact, not the wiring. Nothing reads it to
  decide whether to show a field.

**What would have to be true to bring it back.** A workflow that consumes the
value, most likely the A1 versus A licence check. Then it returns under Vehicle
details rather than Fuel specification, shown for motorcycles only, labelled
"Engine capacity, Optional", in cc, with helper text saying it is used to check
whether the driver needs an A1 or an A motorcycle licence.

**Not to be built before then.** Make and model autofill. It waits for the
licence workflow and for reliable specification data. The current model table is
marked in the source as a stand-in, holds nine vehicles, and every one of them
is a bakkie, van or truck, so an autofill would never fire for the only category
that would show the field.

## Application-controlled selects

Year, Vehicle category and Fuel type are native `<select>` elements enhanced by
one shared implementation, `select-field.js`. The native element keeps the value
and leaves the tab order; a button and a listbox are drawn over it. Make and
Model stay searchable comboboxes. There is no per-field dropdown widget and
none is to be added.

**Decided** 20 August 2026. Enforced by `node tools/select-fields.js`.

**Browser coverage.** Automated checks run in Chrome only. **Safari and Firefox
remain manual QA** and no automated cross-browser coverage is claimed. What the
suite does establish is that none of the three opens a native menu, which is the
behaviour each engine would otherwise render differently. Check the three fields
by hand in Safari and Firefox before any release that touches this primitive.

**Manual QA list.** Open each of Year, Vehicle category and Fuel type; confirm
the popup matches the trigger's width, flips above near the bottom of the
window, scrolls internally, closes on Escape and on an outside click, returns
focus to the trigger, and that arrow keys, Home, End and typeahead all move the
highlighted option.
