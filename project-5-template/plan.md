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

Rules to calculate with (2024 rules, level 1, from SRD 5.2.1). Look each one up yourself and write down the result, not the formula.
- Ability scores: assign the six base scores, then the background adds +2 to one of its three listed abilities and +1 to another, or +1 to all three. No score goes above 20.
- Modifier: (score - 10) divided by 2, rounded down. Proficiency bonus at level 1: +2.
- Saving throw: the ability's modifier, plus the proficiency bonus if your class is proficient in that save.
- Skill: the linked ability's modifier, plus the proficiency bonus if you are proficient. Proficiencies come from the background (two skills), the class (choose two from its list), and any species trait (for example Human Skillful or Elf Keen Senses).
- Passive Perception, Investigation and Insight: 10 plus that skill's bonus.
- Initiative: the Dexterity modifier.
- AC: depends on the armor you wear; look up the armor in the SRD equipment section. Use the class's starting equipment option you choose, and write down which one.
- Hit points at level 1: the highest number on the hit die plus the Constitution modifier (plus 1 for a Dwarf).
- Speed: from the species.
- Spellcasters only: spell save DC is 8 plus the spellcasting ability modifier plus the proficiency bonus; spell attack bonus is the spellcasting ability modifier plus the proficiency bonus; level 1 slots and spell counts are in the spec.

Tip: choose species and backgrounds that exercise different rules, for example a Dwarf (extra HP), a Goliath (35 feet speed), and a Human (a free skill of your choice). Avoid species whose lineage choice changes numbers (Elf, Tiefling, Gnome) for these first three; they come later.

The ready-to-fill version, one block per class, is in `test-characters.md`; fill that in and keep this block as the reference. Every line must be filled in before checkpoint 4 starts.

```
Character: Fighter | Paladin | Sorcerer   (delete two)
Edition: 2024
Species:
Background:
Base scores (method used): STR  DEX  CON  INT  WIS  CHA
Background bonus applied:  (for example +2 CON, +1 STR)
Final scores:              STR  DEX  CON  INT  WIS  CHA
Skill proficiencies (and where each comes from):
Equipment option and armor worn:

Expected:
Modifiers:                 STR  DEX  CON  INT  WIS  CHA
Proficiency bonus:
Saving throws:             STR  DEX  CON  INT  WIS  CHA
Skills (all 18, with bonus):
Passive Perception / Investigation / Insight:
Initiative:
AC:
HP:
Speed:
Spell save DC / spell attack bonus (casters only):
```

| Character | Status |
|---|---|
| Fighter | drafted by the Agent from SRD 5.2.1 on Nov 9; reviewed and approved by the Developer on Nov 9 |
| Paladin | drafted by the Agent from SRD 5.2.1 on Nov 9; reviewed and approved by the Developer on Nov 9 |
| Sorcerer | drafted by the Agent from SRD 5.2.1 on Nov 9; reviewed and approved by the Developer on Nov 9 |

The Agent filled these in at the Developer's request. Because the same Agent will later write the engine, the Developer's own hand check of every number is what makes this an independent test. Do not start the engine tests until it is done.

**Results log**

**Nov 9, checkpoint 1 (project runs).** Installed Node.js 26.13.0 LTS and npm 11.20.0 with winget. Scaffolded with create-vite 9.3.4 (React, TypeScript), added Vitest 5.1.0. Results: `npm test` passed 1 of 1 tests; `npm run build` succeeded; `npm run lint` exited 0; the dev server returned HTTP 200 and served a page titled "Sheetforge". The Developer opened http://localhost:5173 in Chrome: the page showed "Sheetforge" and "Free D&D character builder. Setup check." on a dark background, and a reload worked without errors. Checkpoint 1 verified by the Developer.

**Nov 9, checkpoint 2 (ability score logic), built; awaiting Developer review.** Added `src/engine/abilityScores.ts` and `abilityScores.test.ts`, and removed the placeholder test. Results: `npm test` passed 50 of 50; `npm run build` succeeded; `npm run lint` exited 0. The tests check every row of the SRD 5.2.1 modifier table for scores 3 to 20, every point buy cost, the 27-point limit, repeated and unavailable standard array values, the roll method with fixed dice (including the lowest and highest possible results, 3 and 18), and manual entry limits (1 to 20). Gap: the extracted SRD modifier table starts at 3, so scores 1 and 2 are checked only against the formula (floor of (score - 10) / 2), not against the table. The Developer should look at the SRD page to confirm.

**Nov 9, ability score screen added (part of checkpoint 5, brought forward).** Added `src/ui/AbilityScoreStep.tsx` with a method picker (standard array, point buy, roll, manual entry), six abilities with modifiers, the point buy counter, a confirmation when switching methods, and manual entry limits. The engine gained `checkFromPool` and `availableFromPool`, which the standard array and rolled scores share. Results: `npm test` passed 55 of 55 (including a render check of the screen); `npm run build` succeeded; `npm run lint` exited 0. Not yet done: clicking through the screen in a browser (the Developer's test), saving and reloading (checkpoint 7), and 2024 background bonuses (needs the catalog, checkpoint 3). Rolled scores are not saved yet, so a reload re-rolls until checkpoint 7.

**Nov 9, checkpoint 3 (catalog and validator), built; awaiting Developer review.** Added `src/catalog/` (types, validator, loader, and JSON data for the SRD 5.2.1: 9 species, 4 backgrounds, Fighter, Paladin and Sorcerer, and one source record with the license and attribution text) and `src/engine/skills.ts` (the 18 skills and their abilities). Results: `npm test` passed 78 of 78; `npm run build` succeeded; `npm run lint` exited 0. The tests show the validator rejects entries with no source, an unknown source, a source with no license, an unknown skill or ability, a wrong ability count, a duplicate id, a bad edition, and a bad spellcasting block, and that the other entries still load; they also check the real data against SRD numbers. Text cross-check: I compared every six-word chunk of the transcribed trait and equipment text with the PDF text. 263 of 300 chunks matched exactly. The 37 that did not are places where I rewrote lists and tables: the Draconic Ancestors, Elven Lineages and Fiendish Legacies tables (the PDF text has their columns jumbled, so I reassembled them in order), the Goliath ancestry benefits, and the Gnome lineage headings. Those parts need the Developer's check against the PDF.

**Nov 9, catalog screen added.** Added `src/ui/CatalogStep.tsx` (species, background and class pickers that show each entry's data) and `src/ui/Attribution.tsx` (the SRD credit text at the bottom of the page). Results: `npm test` passed 80 of 80 (including render checks); `npm run build` succeeded; `npm run lint` exited 0. Not yet done: the Developer's click-through in the browser. Nothing from this screen is saved yet, and choosing a species, background or class does not change the ability scores yet.

**Nov 9, checkpoint 4 (derived numbers), built; awaiting Developer review.** The Developer reviewed and approved the three test characters in `test-characters.md`. Added the character record (`src/engine/character.ts`), the calculation engine (`src/engine/derive.ts`), the SRD armor table (`src/catalog/data/2024/armor.json`), and two species effects the numbers need (Dwarf `hitPointBonusPerLevel`, Human `freeSkillChoices`). Results: `npm test` passed 115 of 115; `npm run build` succeeded; `npm run lint` exited 0. The engine's numbers for the Fighter, Paladin and Sorcerer match every expected value in `test-characters.md` (scores, modifiers, saves, all 18 skills, passives, initiative, AC, HP, speed, spell DC and attack bonus). The expected values in the tests were typed from the file, not produced by the engine. Extra tests cover incomplete and invalid choices (they give a list of problems, never numbers), the 20 cap, +1 to all three, medium armor's +2 Dexterity limit, untrained armor and shields, the Strength requirement slowing the wearer, and proficiency bonus by level. Check that the tests can fail: I broke the engine four ways (ignore the Dwarf bonus, ignore shield training, remove the 20 cap, remove the Strength speed penalty), and each made a test fail; then I restored the engine. Not yet done: the numbers are not shown on the page (checkpoint 5), and nothing is saved (checkpoint 7). Gaps by design: species choices that change numbers (Elf lineage speed, Keen Senses), feats such as Fighting Style, and levels above 1. The Developer clicked through all four methods in the browser and reported that everything worked. Scores 1 and 2 in the SRD modifier table are still unchecked.

## Simplification reviews

A project this size invites Agents to pile on code. Redirect them away from bloat, stacked patches, obsolete features, and edge cases that a simpler design or code-structure rule would prevent. At the end of Phases 3, 4, and 5, have the Agent identify these problems, then decide yourself what to change. Record what it found, what you decided and why, and the result. Update the architecture in `spec.md` if the structure changes.
