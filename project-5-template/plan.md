# Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Track the five-week map, the next build checkpoints, testing, and simplification reviews.

## Working agreement

Developer: Choose priorities, plan only the next few checkpoints in detail, test results directly, and keep the map current.

Agent: Read the project documents and inspect the project. Where practical, keep each checkpoint small enough to run and judge. Do not expand scope or mark the Developer's verification complete.

When you begin this step, start a fresh chat so its transcript stays clean. For example:

`Read the project documents, inspect the project, and help me complete the next checkpoint.`

## Five-week map

The current plan for each phase, starting from the map in your pitch. Update it as the project evolves.

Map as in the pitch, with status on Nov 9:
- **Phase 1 (to Nov 2):** pitch and approval; check SRD and source licenses. *Status:* pitch submitted. SRD 5.1 and 5.2.1 licenses read from the PDFs. Still open: OpenAI terms for the logo, Open5e terms (matters less now), favicon-size check.
- **Phase 2 (Nov 2–9):** the MVP for one edition, including the data model (built to hold homebrew entries). *Status:* `spec.md` drafted and decisions recorded; no code yet.
- **Phase 3 (Nov 9–16):** second edition, more classes and levels, multiple characters, JSON export, homebrew creator and content-pack import and export.
- **Phase 4 (Nov 16–30):** additional openly licensed catalog content, PDF export, click-to-roll polish, accessibility and mobile; version ready for peer review.
- **Phase 5 (Nov 30–Dec 7):** peer-review fixes, deploy, final verification, breakdown and debrief.

The dates above are unchanged from the pitch. Phase 2 has not produced a running MVP, so they need to be re-planned; the Developer decides how (see below).

## Checkpoints

The next few results to build, each with what it should produce and how you will test it against the acceptance checks in `spec.md`. Test each result before moving on, including related behavior that already worked, and commit meaningful working checkpoints.

Item numbers refer to "Behavior and acceptance checks" in `spec.md`. The Developer marks each checkpoint verified; the Agent does not.

**Next checkpoints (in detail)**

1. **Project runs.** Vite, React and TypeScript set up, with a test runner (Vitest is the usual pair for Vite; to confirm).
   - Produces: a page that loads locally, and one trivial passing test. The commands to run and test go into `AGENTS.md`.
   - Test: start the dev server and see the page; run the tests and see them pass.
2. **Ability score logic** (item 2, engine only, no screen).
   - Produces: modifier calculation, the standard array check, point buy costs and the 27-point limit, the roll method with an injectable random source, and manual entry limits (1 to 20).
   - Test: automated tests, including every row of the SRD modifier table, each point buy cost, a rejected repeated value in the standard array, a rejected over-budget point buy, and a roll with a fixed random source giving a known result.
3. **Catalog and validator** (item 6).
   - Produces: JSON files for the SRD 5.2.1 species (9), backgrounds (4), and the Fighter, Paladin and Sorcerer classes, each entry with its source and license, and a validator that skips a bad entry with a message naming it.
   - Test: the validator rejects an entry with no source or license and still loads the others. The Developer checks the entries against the PDF.
4. **Derived numbers for three test characters** (items 1 and 3).
   - Before this starts, the Developer hand-calculates one level 1 test character per class (Fighter, Paladin, Sorcerer) and writes the inputs and expected numbers under Testing and evidence. The Agent does not choose the expected values.
   - Produces: the 2024 rules module (background ability bonuses) and the engine's skills, saves, passive scores, initiative, AC, HP and speed.
   - Test: automated tests compare every number to the hand-calculated value; the Developer reviews the results.

**Following checkpoints (outline only, detailed when they come up)**

5. Sheet screen with the core panels and a basic builder flow (items 1 and 7).
6. Click to roll with advantage and disadvantage and a roll history (item 4).
7. Save and reload, and edit later (items 5 and 8).
8. Spells data from the SRD PDF, the Spells tab and the spell picker (item 1, spells).

Phase 3 work (second edition, higher levels, multiple characters, JSON export, homebrew) is planned after the MVP runs.

## Testing and evidence

Record what you tested and what happened. For peer testing, note what people did or said separately from your interpretation, keep it non-identifying, and record the revisions you made and how you verified them.

**Hand-calculated test characters** (to be written by the Developer before checkpoint 4)

| Character | Inputs (edition, species, background, class, score method and scores, skill picks) | Expected numbers (modifiers, saves, skills, passives, initiative, AC, HP, speed) |
|---|---|---|
| Fighter | not yet written | not yet written |
| Paladin | not yet written | not yet written |
| Sorcerer | not yet written | not yet written |

**Results log**

**Nov 9, checkpoint 1 (project runs).** Installed Node.js 26.13.0 LTS and npm 11.20.0 with winget. Scaffolded with create-vite 9.3.4 (React, TypeScript), added Vitest 5.1.0. Results: `npm test` passed 1 of 1 tests; `npm run build` succeeded; `npm run lint` exited 0; the dev server returned HTTP 200 and served a page titled "Sheetforge". Not yet checked: the page in a browser by the Developer.

## Simplification reviews

A project this size invites Agents to pile on code. Redirect them away from bloat, stacked patches, obsolete features, and edge cases that a simpler design or code-structure rule would prevent. At the end of Phases 3, 4, and 5, have the Agent identify these problems, then decide yourself what to change. Record what it found, what you decided and why, and the result. Update the architecture in `spec.md` if the structure changes.
