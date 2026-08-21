# Design notes, EngenXT fleet portal

Extracted from `tfn-fleet-portal.html` when the annotations were taken out
of the rendered product. Nothing here is loaded by any route; it is the
argument for the design, kept where it can still be read.

Each heading is the screen the note was written against.

## driver-left

- It asks a question rather than stating an intention. "Has Thabo left the company?" is answerable from what somebody knows. "Mark as left" is a thing they are about to do to a record, and the two invite different amounts of care.
- The vehicle is named on purpose. A driver leaving strands a bakkie, and the person doing this is the one who knows who takes it next. Nothing here reassigns it; the line exists so nobody forgets it happened.
- Absolute, so it takes the red that Report stolen takes. Undoing it means adding the person again, which is a new record and a new invitation, not an undo.

## driver-states

- Three fields, and the split was only half done. The record already separated “is this person on the account” from “may their card be used today”. It did not separate the third question, and the third question was hiding inside the first: Invited and Active are facts about an app, and Left is a fact about employment, and all three lived in one field. So the product could not say that a driver is still employed and their app account is off, and could not say that an invitation bounced at all.
- The app status is the one nothing on this screen can set. Every one of its six values is a report of something that already happened somewhere else: a message queued, a message delivered, a phone that opened the app, a number that was not on WhatsApp. The menu behind the badge is an action menu, not a picker: it offers Send, Resend, Copy link, Review the number, and never Invite sent or Active. The old row menu did offer the second one, as They have the app, and it was a control for asserting a fact about a device nobody in the office can see.
- Which is why leaving writes two fields and nothing writes the app status on its own. Marking somebody as left deactivates their app account, because that is what leaving means for the phone in their pocket. Bringing them back restores what the app status was before they left, so a driver who returns in March is not invited a second time to an app already installed. One gesture, two consequences, and the second one is derived rather than chosen.
- An invitation you cannot skip. A record is not a driver until the app is on their phone. Until then a card exists with nobody attached to it, and no manager can make that not so: the driver has to do something.
- Which is why the vehicles do not have this state and the drivers do. A vehicle's invitation goes out with the upload and nothing is waiting on anyone, so vehicles get three temporary messages on the import flow and no waiting state at all. A driver's invitation is waiting on a person with a phone, and that genuinely is a state they sit in for days. The two look alike and are not, and copying the driver pattern onto the vehicles is exactly the duplicated step this prototype removed.
- Sick leave is not a status either, and neither is annual leave, a disciplinary or waiting for a vehicle. All four stop the card and nothing else about them is alike, which is the definition of a reason rather than a state. Model them as four statuses and the list needs four badges, four filters and four translations for one answer at a pump; model them as one state with a reason and the list stays readable and the reason is what a report counts.
- Which makes Suspended the wrong word for the state. It is the right word for one of the reasons and an accusation attached to the rest. A driver on sick leave should not read as suspended to their manager, or in a report their supervisor sees. The state wants a neutral name that says what is true at a pump, the way the vehicles now say cannot fuel, and the reason underneath carries the meaning.
- A lapsed licence is not a status. A clock would set it, not a person, and that changes who is allowed to undo it. It is a flag on the record and a tab on the list instead, and it does not stop fuel: the card expires, the licence does not, and a driver inside the three-month renewal grace is driving legally on a receipt this system cannot see. The state that would justify stopping fuel is a licence that has been suspended or cancelled, and nothing here carries it yet. See decisions.

## drivers-directory

- Expiry shows only when it matters. A date next to all twelve licence codes is noise. Two drivers here have lapsed: Pretty Mahlangu’s licence in May, Sibusiso Mahlangu’s PrDP last month. Both are still Active, on live cards.
- Needs attention is a filter, not a status. A lapsed permit does not change what someone is. It changes what you have to do about them. Status still answers one question: can this person fuel right now.
- The tab needs the expiry field. Licence expiry is optional on the form, so a driver added without one never shows up here.
- Your design shows this tab at zero. The vehicle screen settled this already: a tab appears when it holds something. Worth settling once, for both.

## drivers-failed

- It says what did not happen. Somebody whose team will not load wonders whether they have been locked out of their own account, so the first thing to answer is that nothing has changed. Then the retry, because that fixes it most of the time.

## drivers-import-review

- This screen does not say whether twelve WhatsApp messages are about to be sent, and it is the screen that most needs to. The Add driver sheet asks the question: send the invitation now, or invite later from the table. That choice was built for one driver at a time, and one driver at a time is not when it matters. The case it was written for is exactly this one, twelve people entered on a Tuesday to be invited on Friday, and this is the button that would message all twelve without mentioning it. Import is Phase 2, so this is recorded rather than drawn: the same two options belong beside Import 12 drivers, and the button should name what it is about to do the way the sheet's does.
- Refused and flagged are different, and this file has both. A lapsed licence is true, so it imports and gets flagged. A landline cannot receive the setup link, so that row is not a driver yet.
- The button counts what is coming. Twelve, not fourteen. "Import" alone leaves you guessing whether the refused rows come too.

## drivers-loading

- The shape of the answer, not a spinner. Seven columns of the right widths means the page does not jump when the rows arrive, and somebody can start reading the headings while they wait.

## failed

- It says what did not happen. A person whose fleet will not load wonders whether something broke on their account, so the first thing to answer is that nothing has changed. Then the retry, because that fixes it most of the time.
- And it holds on to the search. A failure is not a reason to throw away what somebody typed. The word stays in the box, the message names it so they can see it survived, and Try again carries it back into the list rather than landing them on an unfiltered hundred rows. It is one attribute (data-goto-search) and it turns a retry into a resume.

## import-review

- Three answers, on the row that raised the question. Fix it, bring it in as it is, or leave it out of this import. The screen used to name the two rows and then say they were coming in either way, which is a notification dressed as a review: the only thing left to decide was whether to abandon the whole file over one missing fleet number.
- Fixing happens here, not in the spreadsheet. A tank capacity typed into this row is worth about ninety seconds; the alternative is opening the file, finding the line, saving, and uploading again, and what people actually do with that alternative is press Import and mean to come back.
- The button counts what is coming, and it will not move until both rows are answered. This is the one place in the product where a control is held closed, and it is because there is no honest default: importing the flagged rows and dropping them are both real answers, and the file cannot tell you which one you meant. The line above it says how many are outstanding, so it is never a button that has gone quiet for no stated reason.
- Needs a look is still not an error. Nothing here is refused. A row that cannot be imported at all is a refusal, it is counted separately, and the driver import shows that case.

## invites

- The page is named after what finished. It was called Sending invitations, which names a completion page after the one part of it still in progress and makes the outcome look conditional on the progress. The vehicles are in the fleet and fuelling; the invitations are a footnote with a retry on it, so they sit below the fold of the sentence.
- Three delivery states, none of them a vehicle status. Sending invitation, invitation sent, and invitation failed with a retry. They describe a message in flight, they clear when it lands, and they never appear in the Status column. Writing "invitation sent" into a status field would put a fact about a delivery attempt where a rule about a forecourt belongs, and the column would stop meaning one thing.
- Every row names its recipient. The invitation goes to the driver, on their mobile number. An invitation whose recipient is not on screen cannot be chased: the manager knows a message failed and not who to phone. Name and number together, because the number is both the thing that failed and the thing they will correct.
- A failed invitation does not stop the vehicle. Stated on the row, in the band above it, and again in the footer, because this is the exact place a fleet manager will otherwise invent a rule that does not exist and go looking for an activation step that does not exist. What the failure does cost is named too: the recipient cannot set the fuel tag up yet.
- Leaving is safe, and the way out is in the header. The primary button sits beside the heading rather than at the end of the delivery list, so it is reachable before the list has been read at all. Delivery continues in the background and failures are addressable later. A screen that quietly requires you to stay is the same trap as a step that quietly requires you to press something.
- Waiting on grouping. The recipient is settled: the driver, on their mobile number, which is why Send to another number is the second way out of a failure. An imported row carries its driver, so this page can name one. A vehicle added by hand cannot, because linking a vehicle to a driver is the grouping work and that is a later phase. Until it exists, a single add says the vehicle is in the fleet and fuelling and that the invitation follows, rather than claiming a message went to somebody the product cannot name.

## loading

- The shape of the answer, not a spinner. Seven columns of the right widths means the page does not jump when the rows arrive, and somebody can start reading the headings while they wait.
- Only the first time. A skeleton is the right answer when there is nothing to keep, and the wrong one every load after that, because by then the screen already holds a correct list. What happens on a reload is that the rows stay exactly as they are.

## no-results

- A search that found nothing is a screen with one thing worth doing on it. So that one thing is a button in the middle of the empty table, not a sentence recommending that somebody go back up the page and delete eight characters by hand. A second button appears beside it only when filters are narrowing the list too, because then there genuinely are two different things to undo.

## override

- The arithmetic is the answer. A tank that took 62 litres half an hour ago has room for 18 more, and a request to pump 80 into it is not a second fill. It is a second vehicle. A manager can settle that from two numbers without opening anything or ringing anybody.
- How much, and for how long, are part of the decision. This screen asked a manager to release a fill without telling them the size of it. Tank capacity bounds the litres, your policy bounds the rand, and the sentence above the button states the lower of the two, because "one fill" on an 80-litre bakkie and "one fill" on a 400-litre truck are not the same amount of trust.
- The expiry is an actual time, not only a countdown. A manager who looks away for a minute needs to know whether it is worth reading; 1:47 is unreadable the moment it is stale, and 08:52 is not.
- Both extra actions are things managers already do. They ring the driver, or they check the location. Having them here means the answer takes fifteen seconds rather than a walk to somebody else's desk.
- Approve is not the bigger button. Decline sits first and quieter. Two buttons of equal weight on a decision about money is a coin toss.
- **Figure.** The arithmetic is the answer. A tank that took 62 litres half an hour ago has room for 18 more, and a request to pump 80 into it is not a second fill. It is a second vehicle. A manager can settle that from two numbers without opening anything or ringing anybody. How much, and for how long, are part of the decision. This screen asked a manager to release a fill without telling them the size of it. Tank capacity bounds the litres, your policy bounds the rand, and the sentence above the button states the lower of the two, because "one fill" on an 80-litre bakkie and "one fill" on a 400-litre truck are not the same amount of trust. The expiry is an actual time, not only a countdown. A manager who looks away for a minute needs to know whether it is worth reading; 1:47 is unreadable the moment it is stale, and 08:52 is not. Both extra actions are things managers already do. They ring the driver, or they check the location. Having them here means the answer takes fifteen seconds rather than a walk to somebody else's desk. Approve is not the bigger button. Decline sits first and quieter. Two buttons of equal weight on a decision about money is a coin toss.

## override-approved

- The second button is the point. Three approvals for the same station is not an emergency. It is a rule that needs changing, and this is the moment somebody notices. Without it they approve the same fill every week for a year.
- It is a receipt, so it says what was released and what was not. One transaction, a stated ceiling, an expiry that runs whether or not he pumps, and the two things that did not move. A manager who is not sure afterwards whether they widened somebody's rules is a manager who stops using break-glass.
- Named, timed and written down. The approval goes into the vehicle's activity history and the driver's, with who did it. A one-off release of company money that leaves no trail is the thing an auditor asks about first.
- **Figure.** The second button is the point. Three approvals for the same station is not an emergency. It is a rule that needs changing, and this is the moment somebody notices. Without it they approve the same fill every week for a year. It is a receipt, so it says what was released and what was not. One transaction, a stated ceiling, an expiry that runs whether or not he pumps, and the two things that did not move. A manager who is not sure afterwards whether they widened somebody's rules is a manager who stops using break-glass. Named, timed and written down. The approval goes into the vehicle's activity history and the driver's, with who did it. A one-off release of company money that leaves no trail is the thing an auditor asks about first.

## override-cap

- The cap is a fact about the policy, not a refusal. So the screen offers the largest thing it is allowed to offer and says plainly that it is a part tank. Hiding the shortfall would send a driver away from a pump with half of what he came for and no idea why.
- The button says the number it will actually release. Not "Approve", 93 litres. A manager who presses expecting a full tank and gets a quarter of one has been misled by the control, not by the policy.
- Raising the cap is deliberately not here. It is an administrator's change to a policy that governs twelve vehicles, and doing it from a forecourt request at 11:15 is how a one-off becomes a permanent hole.
- **Figure.** The cap is a fact about the policy, not a refusal. So the screen offers the largest thing it is allowed to offer and says plainly that it is a part tank. Hiding the shortfall would send a driver away from a pump with half of what he came for and no idea why. The button says the number it will actually release. Not "Approve", 93 litres. A manager who presses expecting a full tank and gets a quarter of one has been misled by the control, not by the policy. Raising the cap is deliberately not here. It is an administrator's change to a policy that governs twelve vehicles, and doing it from a forecourt request at 11:15 is how a one-off becomes a permanent hole.

## override-declined

- Declining leaves somebody stranded, so the driver's number stays one click away. A driver who cannot fuel and cannot reach anyone is the version of this that ends in a tow truck.
- It also tells the manager what the driver was told, so the call starts from the same facts.
- **Figure.** Declining leaves somebody stranded, so the driver's number stays one click away. A driver who cannot fuel and cannot reach anyone is the version of this that ends in a tow truck. It also tells the manager what the driver was told, so the call starts from the same facts.

## override-lands

- The banner sits above the page and is the only thing allowed to. It is there because the request is expiring, and a badge you have to notice is the wrong instrument for something with ninety seconds on it.
- It leaves when the request is answered or closes. A bar that outlives its moment teaches people to scroll past the next one.
- The bell is up in the bar, where every product puts it. Open it from there to see the panel: the live request first and marked, then what already happened. The count says waiting rather than a bare number, because "3" could be three things nobody needs to look at.

## override-lapsed

- It says what happened to Thabo, not to the request. "Expired" describes a row in a database. He is the one standing at a pump that will not pay.
- Ringing him is the only useful thing left, so it is the only thing offered.
- **Figure.** It says what happened to Thabo, not to the request. "Expired" describes a row in a database. He is the one standing at a pump that will not pay. Ringing him is the only useful thing left, so it is the only thing offered.

## override-taken

- Two managers, one notification, one pump. Break-glass goes to everybody who can answer it, which is the point. Somebody is standing at a forecourt. It also means two people will open the same request, and the second press has to be answered rather than swallowed.
- It leads with the outcome, not with the refusal. What the second manager needs first is that Thabo can fuel; that their own press did nothing is the second sentence. An error-shaped screen here would read as though the driver were still stuck.
- And it names who. Otherwise the next thing that happens is a phone call to find out whether anybody answered it.
- **Figure.** Two managers, one notification, one pump. Break-glass goes to everybody who can answer it, which is the point. Somebody is standing at a forecourt. It also means two people will open the same request, and the second press has to be answered rather than swallowed. It leads with the outcome, not with the refusal. What the second manager needs first is that Thabo can fuel; that their own press did nothing is the second sentence. An error-shaped screen here would read as though the driver were still stuck. And it names who. Otherwise the next thing that happens is a phone call to find out whether anybody answered it.

## rules

- The last line is the whole screen. The offer came from one driver being refused three times, and accepting it changes the rules for twelve vehicles and nine people. Somebody pressing this from a notification has not thought about the other eleven, and it costs one sentence to make them.
- Two lists, not one list with a marked chip. It was a single row captioned "areas these drivers can already use" with Goodwood sitting in it, under a heading asking whether to add Goodwood. So the screen said the thing had happened and asked permission for it in the same breath, and a tint on the fourth chip was all that separated the two. Before and after, side by side, with the count under each, so the change is read rather than deduced.
- The before list cannot be edited. The three chips lost their remove buttons: this screen asks one question with two answers, and a policy editor that appears inside a confirmation is a second decision nobody came here to make.
- **Figure.** The last line is the whole screen. The offer came from one driver being refused three times, and accepting it changes the rules for twelve vehicles and nine people. Somebody pressing this from a notification has not thought about the other eleven, and it costs one sentence to make them. Two lists, not one list with a marked chip. It was a single row captioned "areas these drivers can already use" with Goodwood sitting in it, under a heading asking whether to add Goodwood. So the screen said the thing had happened and asked permission for it in the same breath, and a tint on the fourth chip was all that separated the two. Before and after, side by side, with the count under each, so the change is read rather than deduced. The before list cannot be edited. The three chips lost their remove buttons: this screen asks one question with two answers, and a policy editor that appears inside a confirmation is a second decision nobody came here to make.

## states

- Two fields, one column. Fuel access and fleet lifecycle answer different questions and were being held in one word, so a reader had to work out which kind of thing each of five options was before they could use any of them. Separating them is what keeps Removed from fleet out of a report counting vehicle-weeks off the road: a sold van and a van in the workshop are not the same absence and should not be counted together.
- The column still shows one value. Both fields were drawn for a while, and once the waiting state went, the lifecycle pill read the same on every vehicle in the fleet and changed for none of them. A column of identical badges costs the exceptional row its one chance of being noticed, so the row draws whichever field is currently deciding anything: fuel access while the vehicle is yours, lifecycle once it is not.
- Importing is not a state. A vehicle is in the fleet and able to fuel the moment it is added or imported. Its invitation is sent automatically in the background and governs nothing here. What the import has instead is three delivery messages (sending invitation, invitation sent, invitation failed with a retry) which clear when the request lands and never touch this column. Writing "invitation sent" into a status field would put a fact about a delivery attempt where a rule about a forecourt goes.
- Broken down, in for a service, accident damage, waiting for parts: none of these is a state. They are all the same answer at a pump, which is no, and the difference between them is a reason, not a status. Modelling them as six statuses means six things to draw, six to filter, six to translate and six a manager has to tell apart under pressure; as one state and a reason it is one badge, one filter and a list that can grow next year without touching the gate.
- A reason and a note are still different things, and the reason is not a preset any more. It was a short list per status, chosen so that a year of them would be a report: how many vehicle-weeks went to accident damage. That is worth having and it is not what this is yet. The categories have not been agreed, and a preset built on a first draft writes that draft into every record before anybody can correct it. So the reason is typed, and the question above the box still comes from the status. The note stays what it always was: whatever somebody needs to write, stamped with who and when. The two are still separate fields, which is the part that was right; they used to share one box called Details, and neither could be relied on.
- Mark recovered belongs to a stolen vehicle and nowhere else. It used to be offered on a permanently removed one, where it meant nothing: a sold van has not been recovered. That was not a wording slip, it was the single-field model showing through, and splitting the fields is what made it impossible to reach. It now lands on Cannot fuel rather than on a waiting state, which keeps the old promise. Somebody looks the vehicle over before it fuels, using a state that still exists.
- Every state here is set by a person. The moment anything is suspended automatically after repeated breaches, status stops being a decision and becomes partly a consequence, which changes who is allowed to undo it. Worth deciding before it is built.

## stolen-filed

- The first line is the whole screen. A person who has just pressed a red button wants one thing, which is to know it took. A time is what makes that believable; a tick is not. 14:32 is a thing you can repeat down a phone.
- A reference number, because the proof has to leave the building. SR-4821 is what gets read to the recovery company, the insurer and the station manager. It is the part of this that exists outside the app.
- What the attendant sees. The block is a claim about a forecourt three hundred kilometres away, and showing the words a stranger will read is the only way to make that concrete. The line about not confronting anyone is there because a fuel attendant is not security.
- No attempts since 14:32. Silence after a block is ambiguous. It reads as working or as broken, and a worried person will keep opening the app to find out. Counting nothing is still an answer.
- The note comes after the block, and says so. Asking what happened before blocking the vehicle would make a theft into a form. Asking after costs nothing, and this is the only moment somebody has the details in their head.
- Optional, all of them. The case number does not exist yet at 14:32. It is issued once the case is registered, and the law allows twenty-four hours, so the field says that rather than sitting there looking unfilled. A required field here would be guessed at or would send somebody out of the screen.
- Four buttons and a box, not a box alone. A tap gives the fleet something countable across a year of reports; the box catches what only this person knows. Not sure is one of the four on purpose, because a rattled person should never have to overstate what they know to get to the end.
- Saved as you type. Details arrive over hours, not in one sitting. A save button turns every interruption into a question about whether the typing survived.
- The way out is named before it is needed. Nobody presses an absolute button comfortably unless they already know what happens if they are wrong, and sometimes the answer is that a driver took the bakkie home.
- **Figure.** The first line is the whole screen. A person who has just pressed a red button wants one thing, which is to know it took. A time is what makes that believable; a tick is not. 14:32 is a thing you can repeat down a phone. A reference number, because the proof has to leave the building. SR-4821 is what gets read to the recovery company, the insurer and the station manager. It is the part of this that exists outside the app. What the attendant sees. The block is a claim about a forecourt three hundred kilometres away, and showing the words a stranger will read is the only way to make that concrete. The line about not confronting anyone is there because a fuel attendant is not security. No attempts since 14:32. Silence after a block is ambiguous. It reads as working or as broken, and a worried person will keep opening the app to find out. Counting nothing is still an answer. The note comes after the block, and says so. Asking what happened before blocking the vehicle would make a theft into a form. Asking after costs nothing, and this is the only moment somebody has the details in their head. Optional, all of them. The case number does not exist yet at 14:32. It is issued once the case is registered, and the law allows twenty-four hours, so the field says that rather than sitting there looking unfilled. A required field here would be guessed at or would send somebody out of the screen. Four buttons and a box, not a box alone. A tap gives the fleet something countable across a year of reports; the box catches what only this person knows. Not sure is one of the four on purpose, because a rattled person should never have to overstate what they know to get to the end. Saved as you type. Details arrive over hours, not in one sitting. A save button turns every interruption into a question about whether the typing survived. The way out is named before it is needed. Nobody presses an absolute button comfortably unless they already know what happens if they are wrong, and sometimes the answer is that a driver took the bakkie home.

## stolen-record

- The banner is the answer to a question nobody asks out loud. Twelve days after reporting a vehicle a person wants to know the block is still on, and without a durable state they find out by reporting it again. It repeats the confirmation card's own words, because a receipt that paraphrases reads as a different event.
- Still blocked, twelve days. A count of nothing is still news. Silence after a block reads as working or as broken, and only one of those is true.
- The block sits at the foot of the record. It was at the head, above the history, which put the loudest thing on the screen in front of the thing somebody opened the record to read. The state and the way out of it now close the record instead of opening it, and Mark recovered stays inside the block, so the exit is in the same place as the state it undoes rather than hunted for under stress.
- One column, not two. A refused fill is machine news and the note above it is human, and splitting them into separate feeds means reading the story twice. This is also where the note from the receipt ends up, which is why the form did not need to be a place of its own.
- Add to, never edit. A record somebody can quietly rewrite is worth nothing to an investigation, and the append-only rule is cheaper to build than a permissions argument.
- **Figure.** The banner is the answer to a question nobody asks out loud. Twelve days after reporting a vehicle a person wants to know the block is still on, and without a durable state they find out by reporting it again. It repeats the confirmation card's own words, because a receipt that paraphrases reads as a different event. Still blocked, twelve days. A count of nothing is still news. Silence after a block reads as working or as broken, and only one of those is true. The block sits at the foot of the record. It was at the head, above the history, which put the loudest thing on the screen in front of the thing somebody opened the record to read. The state and the way out of it now close the record instead of opening it, and Mark recovered stays inside the block, so the exit is in the same place as the state it undoes rather than hunted for under stress. One column, not two. A refused fill is machine news and the note above it is human, and splitting them into separate feeds means reading the story twice. This is also where the note from the receipt ends up, which is why the form did not need to be a place of its own. Add to, never edit. A record somebody can quietly rewrite is worth nothing to an investigation, and the append-only rule is cheaper to build than a permissions argument.

## stolen-recovered

- This is the only place in the flow that asks for anything, and it is the right place. Reporting a theft is done in a hurry by somebody who has just lost a vehicle. Undoing it is done at a desk, days later, and it is the move that starts a vehicle back towards a pump. The friction belongs on the way back in, not on the way out.
- Both fields are on the screen with the button. A rule that rejects the press afterwards and does not say where to type is the one failure this flow must never have.
- No, but it was never stolen. A fair number of these end with a driver who took the bakkie home. That is a different fact from a recovery and the record should not be made to call it one.
- Stopped, not fuelling. The catch was named on the card that started this, twelve days and two screens ago, and it is named again here. A reassurance that turns out to have a condition attached costs more than it bought.
- **Figure.** This is the only place in the flow that asks for anything, and it is the right place. Reporting a theft is done in a hurry by somebody who has just lost a vehicle. Undoing it is done at a desk, days later, and it is the move that starts a vehicle back towards a pump. The friction belongs on the way back in, not on the way out. Both fields are on the screen with the button. A rule that rejects the press afterwards and does not say where to type is the one failure this flow must never have. No, but it was never stolen. A fair number of these end with a driver who took the bakkie home. That is a different fact from a recovery and the record should not be made to call it one. Stopped, not fuelling. The catch was named on the card that started this, twelve days and two screens ago, and it is named again here. A reassurance that turns out to have a condition attached costs more than it bought.

## stolen-sighting

- This is the reason the state is worth having. Blocking the card silently is correct and useless. The same event, reported, is a station, a time and a card number, which is more than most people get in the first day.
- Copy details copies the details as text somebody can read down a phone. It does not pretend to file a case.
- Mark recovered sits here and stays quiet. Sometimes the answer is that a driver took the vehicle home and nobody told the office.
- **Figure.** This is the reason the state is worth having. Blocking the card silently is correct and useless. The same event, reported, is a station, a time and a card number, which is more than most people get in the first day. Copy details copies the details as text somebody can read down a phone. It does not pretend to file a case. Mark recovered sits here and stays quiet. Sometimes the answer is that a driver took the vehicle home and nobody told the office.
