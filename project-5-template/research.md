# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Keep the evidence, decisions, and current scope that guide the build.

## Working agreement

Developer: Direct the inquiry toward what the next decision needs, judge sources and options, make the consequential decisions, and keep this file current.

Agent: Read the project documents and inspect the project. Help investigate, compare options, and test assumptions quickly. Verify sources directly.

When you begin this step, start a fresh chat so its transcript stays clean. For example:

`Read the project documents and help me research what I need for the next build decision.`

## Inquiry and decisions

Record what informs your build decisions: the questions you investigated, useful sources and what they support, experiments and their results, and the decisions you made with your reasons. Distinguish evidence from assumptions; an Agent's recommendation alone is not evidence.

### Catalog size (Nov 1)

**Question:** SRD 5.1 and 5.2.1 together give about 9 species (13 entries with subraces in 2014) and 12 subclasses per edition, one per class. That is smaller than the pitch's "large catalog of species and subclasses." How can the catalog grow without breaking license rules?

**Evidence (read from primary documents):**
- SRD 5.2.1: 9 species, 12 subclasses, 4 backgrounds. SRD 5.1: 9 races with 4 subraces, 12 subclasses, 1 background (Acolyte).
- A5E SRD (https://a5esrd.com/a5esrd, license text in https://a5esrd.com/s/Legal-Information.pdf): 8 heritages in the Adventurer's Guide, more in the Voidrunner's Codex and Gate Pass Gazette, several dozen archetypes, about 21 backgrounds. The count of archetypes is rough and unverified.
- A5E is a different ruleset (exertion, maneuvers, expertise dice, different class list), so its archetypes cannot be computed by an engine built for the 2014 or 2024 rules without adding a third ruleset.

**Decisions (Developer):**
1. The homebrew creator and importable content packs (JSON) are planned, not optional. They give a large catalog with the least rules risk. The data model treats SRD content and user content the same way from Phase 2.
2. A5E is a possible optional third rules edition in a later phase, or a source of inspiration for homebrew the Developer writes.
3. A5E is CC-BY-4.0 and may be adapted with attribution, so A5E heritages may be reworked into 2014/2024-shaped species. This depends on an open question: whether A5E heritage traits translate to 2014/2024 species stats. Not yet checked.

**Not adopted:** reproducing non-SRD Wizards content in other words (legal line unclear; conflicts with the plan to verify every license), D&D Wiki, and the ryanmiville gist (see Sources and credits).

**Decided (Nov 1):** the homebrew species and subclass creator, with importable and exportable content packs, moves from stretch goal to core scope. See Scope changes.

**Open:** what is cut or moved to make room in the five-week map, and when the creator is built (the data model for it is designed in Phase 2).

## Scope

### Stretch goals

Keep the current stretch goals in priority order, starting from your approved pitch, noting cuts and additions.

Current order (the pitch is not yet approved; this follows the pitch with one change):
1. Dice animation
2. Level-up helper
3. Damage rolls and conditions

Removed: homebrew species and subclass creator (moved to core scope, Nov 1).
Possible later addition: A5E as an optional third rules edition (see Catalog size).

### Scope changes

Record consequential changes to the approved scope: what changed, why, and what was added or cut. Update `spec.md` when a change alters the intended behavior.

**Nov 1: homebrew creator moved to core scope.**
- Changed: the homebrew species and subclass creator, with JSON content packs that users can import and export, was a stretch goal and the Catalog size fallback in the pitch. It is now core.
- Why: the SRD gives about 9 species and 12 subclasses per edition, and no other openly licensed source fits the 2014/2024 rules (see Catalog size). Homebrew gives a large catalog with the least rules and license risk.
- Added: the creator, pack import and export, and a clear source label on each entry (SRD, homebrew pack, and so on).
- Cut or moved: nothing cut yet. Pitch edited Nov 1 to place the creator and pack import/export in Phase 3 (with JSON export); the Developer still decides what is cut if Phase 3 slips.
- Pitch updated to match (Concept, Technical goals, five-week map, stretch goals, risks). `spec.md` has no content on this yet.

## Sources and credits

List every external source, code library, asset, and dataset you use, with its link, license or usage terms, and required credit.

Status key: **Read** = the Developer or Agent read the primary document. **To verify** = taken from a secondary source or an API summary; the Developer must check it before use.

### Content

**SRD 5.2.1 (2024 rules): in use, planned**
- Source: https://www.dndbeyond.com/srd (PDF: https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf)
- License: CC-BY-4.0, https://creativecommons.org/licenses/by/4.0/legalcode
- Status: license and attribution text **Read** in the PDF's Legal Information page (Agent read it; Developer to confirm).
- Contents found: 9 species, 12 classes with 1 subclass each, 4 backgrounds. Counts to be spot-checked by the Developer.
- Required credit, to appear in the site and in PDF exports (wording from the SRD; do not add other attribution to Wizards):

  > This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

- Allowed: a statement that the site is "compatible with fifth edition" or "5E compatible."
- Not covered: fan content (streaming, fan art, cosplay) falls under Wizards' Fan Content Policy, not the SRD license.

**SRD 5.1 (2014 rules): planned**
- Source: https://www.dndbeyond.com/srd (PDF: https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf)
- License: CC-BY-4.0 (also offered under OGL 1.0a; the plan is to use CC-BY-4.0 only).
- Status: license and attribution text **Read** in the PDF's Legal Information page (Agent read it; Developer to confirm).
- Contents found: 9 races (Dwarf, Elf, Halfling, Human, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling) with 4 subraces (Hill Dwarf, High Elf, Lightfoot Halfling, Rock Gnome), 12 classes with 1 subclass each, and 1 background (Acolyte). Counts to be spot-checked by the Developer.
- Required credit (note the wording differs from SRD 5.2.1):

  > This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

- Same rules as SRD 5.2.1: no other attribution to Wizards; "compatible with fifth edition" or "5E compatible" is allowed.

**Open5e API: candidate data source**
- Source: https://api.open5e.com/v2/ (code: https://github.com/open5e/open5e-api)
- License: the API code is under a Modified MIT License that excludes the repo's artwork (CC BY-NC 4.0) and third-party SRD content. Content licenses are set per document (see below).
- Status: **To verify.** License summary taken from the repo's LICENSE.md and the API's documents endpoint. No API terms of use page found. Check open5e.com/legal and the repo's LICENSE.md directly.
- Decision (Developer): copy data from the SRD PDFs into the project's own JSON instead of calling the API at runtime. Reasons: the PDFs are the primary source, the site stays fully static, and there is no dependency on Open5e's availability or terms. The API's SRD counts (9 species and 13 for 2014, 24 class entries each) matched the PDFs, so it can be used once as a convenient starting point, but every entry should be checked against the PDF.

**Other Open5e documents considered (not adopted)**

| Document | Publisher | License per Open5e | What it adds | Status |
|---|---|---|---|---|
| Black Flag SRD | Kobold Press | CC-BY-4.0 | 1 class (Mechanist), 1 subclass; no species listed | To verify; attribution text not retrieved |
| Level Up A5E Adventurer's Guide | EN Publishing | CC-BY-4.0, OGL 1.0a and ORC (any one may be used) | Open5e lists 1 class (Marshal) with 3 subclasses and 21 backgrounds; the A5E SRD itself has 8 heritages and several dozen archetypes | License **Read** in Legal-Information.pdf. Attribution text for CC-BY to be copied in full before use. "Level Up," "EN Publishing" and the compatibility logo are not licensed with the content. A different ruleset; see Catalog size |
| Tome of Heroes | Kobold Press | OGL 1.0a only | 11 races (v1 API) | To verify; OGL terms not evaluated |

**Sources rejected**
- D&D Wiki "Alphabetical 5e Races" (https://www.dandwiki.com/wiki/Alphabetical_5e_Races): the footer says GNU Free Documentation License 1.3 "except where otherwise specified." Mostly user homebrew, license varies per page, and GFDL compatibility with this project is unresolved.
- Gist "official_race_class_list" (https://gist.github.com/ryanmiville/aec3cb470167337bf24e067472a78e20): a name index of official content with no license. Not a content source.

### Branding

**Sheetforge logo and icon (draft files in `branding/`)**
- Generated with ChatGPT.
- Terms: **To verify.** The OpenAI Terms of Use could not be fetched (HTTP 403). Open https://openai.com/policies/row-terms-of-use/ in a browser and record here: date checked, the section on ownership of output, and any restrictions.
- Favicon-size check of the icon: TODO.

### Code and libraries

None chosen yet. For each, record name, version, link, license, and required notice. Planned: TypeScript, React, Vite, a PDF library (to be chosen in Phase 4).
