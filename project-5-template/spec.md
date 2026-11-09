# Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose: Keep a concise, testable description of what the project should do now and how the system is structured to do it.

## Working agreement

Developer: Approve the intended behavior and the system's structure, test directly, understand each part well enough to explain it in your own words, and update this file whenever either changes.

Agent: Read the project documents and inspect the project. Turn the Developer's decisions into acceptance checks without inventing product choices or freezing details that still need testing. Propose structures suited to the project's scope, with their trade-offs, in plain language. Keep the architecture consistent with the actual project and point out where they have drifted apart. Do not restructure the project without the Developer's approval.

When you begin this step, start a fresh chat so its transcript stays clean. For example:

`Read the project documents, inspect the project, and help me specify what the next version should do.`

## Intended experience

What Users should be able to do and experience in the current version, tied to the goals in your pitch.

Current version (MVP, 2024 rules, level 1, Fighter, Paladin and Sorcerer):
- **Build:** a player chooses the 2024 rules, then species, class and background from the catalog, and sees a complete sheet without paying or making an account. (Goal: a large catalog with nothing locked.)
- **Trust the numbers:** every number on the sheet updates when a choice changes, and matches a hand calculation. (Goal: feel confident the math is right.)
- **Roll:** clicking a skill or save rolls it, with advantage or disadvantage, and the result appears in a history. (Goal: roll with one click at the table, on a phone as well as a laptop.)
- **Keep and edit:** reloading the page brings the character back, and the player can reopen the builder later to change any choice.
- **Not in this version:** second edition, subclasses (confirmed in SRD 5.2.1: Fighter, Paladin and Sorcerer all choose theirs at level 3), multiple characters, homebrew, and PDF export. These come in later phases.

## Behavior and acceptance checks

For each feature or behavior you are building, describe what it should do and what counts as working, including failure cases and accessibility where they apply. Distinguish approved behavior from provisional ideas, and leave untested details open until they are needed.

Approved for the MVP:

1. **Create a character.** Choose edition, species, class and background, and a sheet appears.
   - Works: each of Fighter, Paladin and Sorcerer produces a sheet from any SRD 5.2.1 species and background.
   - Fails safely: with a choice missing, the sheet shows an incomplete state, never numbers computed from nothing.
   - Spells: during building, a Paladin or Sorcerer picks spells from the SRD 5.2.1 spell list. The Spells tab then shows the casting ability, save DC, attack bonus, slots, and the chosen spells with level, casting time, range, duration and full text, with level filter buttons. No search bar.
   - Spells work when: cantrips and level 1 spells appear in one combined picker list, each kind is limited to its own count, the picker refuses more spells than the class allows at that level, offers only spells on the class's list, and the choices survive a reload. Spells can be changed later through the builder (see "Edit later").
   - Level 1 spell numbers from SRD 5.2.1: Paladin has no cantrips, prepares 2 level 1 spells, and has 2 level 1 slots; Sorcerer knows 4 cantrips, prepares 2 level 1 spells, and has 2 level 1 slots. Fighter has no spellcasting. Casting ability is Charisma for both (confirmed in the SRD class text).
2. **Choose ability scores.** The player picks one method first (standard array, point buy, roll or manual entry), then assigns scores to the six abilities.
   - Standard array: 15, 14, 13, 12, 10, 8, each used once.
   - Point buy: 27 points, scores from 8 to 15, with these costs from the SRD 5.2.1 "Ability Score Point Costs" table: 8 = 0, 9 = 1, 10 = 2, 11 = 3, 12 = 4, 13 = 5, 14 = 7, 15 = 9.
   - Roll: roll four d6 and total the highest three dice, six times (SRD 5.2.1 "Random Generation"). The six results are then assigned to abilities. The results are saved in the character record, so a reload never re-rolls.
   - Manual entry: the player types each score, a whole number from 1 to 20.
   - Switching methods: clears the six scores, and asks for confirmation first if any are assigned. Switching to manual entry keeps the current numbers, since manual entry accepts any value.
   - Works: a roll produces six values between 3 and 18 (tests use a fixed random source); a reload keeps them; switching methods with scores assigned asks first, and cancelling leaves everything unchanged; standard array refuses a repeated value; point buy shows points spent and remaining and blocks any change that would exceed 27 or leave the 8 to 15 range; manual entry rejects anything that is not a whole number from 1 to 20; each ability shows its modifier as soon as its score changes. The modifier is calculated by the engine (score minus 10, divided by 2, rounded down), and tests check it against the SRD's modifier table.
   - 2024 rules: the background's bonuses are added after assignment, and the sheet shows base, bonus and final for each ability.
3. **Derived numbers are correct.** Ability modifiers, proficiency bonus, saves, skills, passive scores, initiative, AC, HP and speed.
   - Works: for one test character per class, each number equals the hand-calculated value. The expected values are written down before the code that produces them, in `plan.md` under Testing and evidence, and checked by automated tests.
4. **Click to roll.** A skill or save click rolls a d20 plus that bonus.
   - Works: normal, advantage and disadvantage rolls use the shown bonus; each roll appears in the history, newest first. Tests use a fixed random source so results are repeatable.
5. **Save and reload.** The character is saved on every change and restored on reload.
   - Fails safely: if browser storage is unavailable or full, the sheet keeps working for the session and tells the user it is not being saved.
6. **Catalog loading.** Entries load from the JSON files with their source and license.
   - Fails safely: an entry that fails validation is skipped with a message that names it, and the rest still load.
7. **Accessibility and layout.** Everything usable by keyboard, roll results announced to screen readers, and the sheet readable on a phone-width screen.
8. **Edit later.** The player can reopen the builder for a saved character and change any choice: ability score method and scores, species, class, background, skill picks and spells.
   - Works: after an edit, every derived number is recomputed and matches a hand calculation for the new choices; the edit is saved; cancelling leaves the saved character unchanged.
   - Choices that no longer apply are handled by one rule: when a change makes an earlier choice invalid (for example, spells from a class the character no longer has, or skill picks the new class doesn't offer), the invalid choice is cleared and the builder lists what was removed. Current HP is clamped to the new maximum.

Provisional (not yet approved): roll history survives a reload; the sheet uses three columns on wide screens and one column on a phone.

Open questions:
- Spells: picking spells while building is in the MVP (decided Nov 9). The level 1 counts are now read from the SRD (see item 1). Decided: cantrips and level 1 spells are picked from one combined list in the same builder step, with the limits still counted separately (a Sorcerer can't use up the 4 cantrip picks on level 1 spells, or the reverse). Later: the Use button spending slots, with rests restoring them; computed hit/DC and effect columns; upcasting; search. Reference: a D&D Beyond Spells tab screenshot, used only for what information appears.

## Architecture

How the system works and the structural decisions that keep it coherent, consistent, and easy to change. Adapt these sections to your project and tech stack.

### Overview

The main parts of the system, what each is responsible for, and how they connect. Include a simple diagram.

```
 catalog JSON files ──► loader + validator ──┐
 (SRD, later homebrew)                       ▼
                                      rules modules (2024 now, 2014 later)
                                             │
 character record ──► calculation engine ◄───┘
 (saved in browser)         │
        ▲                   ▼
        └────────────  React sheet  (display, clicks, rolls)
```

- **Catalog loader and validator:** reads the JSON files, checks each entry, and exposes read-only species, classes, backgrounds and spells.
- **Rules modules:** one per edition. They hold only what differs between editions, such as where ability score bonuses come from.
- **Calculation engine:** pure functions. Character record and catalog in, derived numbers out. No UI code.
- **React sheet:** shows the numbers, takes user input, and runs rolls.
- **Storage:** saves and restores the character record in the browser.

### Data and state

What information the system keeps, where each piece lives, and how it moves and changes. Name the single source of truth for each important piece of state.

- **Character record** (single source of truth, saved in the browser): edition, name, level, species, class, background, the chosen score method, any rolled scores, base ability scores, the user's choices (such as skill picks), current HP and temp HP.
- **Derived numbers** (modifiers, bonuses, AC, max HP, and so on): computed by the engine each time, never stored, so they cannot go out of date.
- **Catalog** (read-only, loaded from JSON files in `src/catalog/data/`): every entry has an id, name, edition and a source. The source is a record, stored once in `sources.json`, with its name, license, URL and attribution text; an entry whose source is missing or has no license fails validation. The entry shapes are in `src/catalog/types.ts`. So far: armor (the SRD Armor table and the shield: category, base AC, how much Dexterity applies, Strength requirement), species (sizes, speed, darkvision, traits as name and text, plus the two effects that change numbers: the Dwarf's HP per level and the Human's free skill), backgrounds (three ability options, feat, two skills, tool, equipment), and classes (hit die, saves, skill choices, proficiencies, equipment, subclass level, and level 1 spellcasting numbers). Not yet modeled: species choices that change numbers (for example the Wood Elf's 35-foot speed), class features, subclasses, spells, and numbers beyond level 1.
- **Roll history:** session state only for now (see Provisional).

### Interaction loop

How User input or other events lead to changes in state and then to what the User sees, hears, or receives.

1. The user changes a choice or clicks a roll.
2. A choice updates the character record. A roll reads the engine's current bonus and adds a result to the history.
3. The engine recomputes every derived number from the record and the catalog.
4. The sheet re-renders, and the record is saved to the browser.

### Visual and content rules

The shared rules that establish the art style and keep the presentation consistent, such as branding, layout, color, type, motion, sound, and asset conventions.

- **Branding:** Sheetforge, as described in `pitch.md`: dark steel-gray backgrounds, ember orange for rolls and key actions, cool blue as a secondary highlight, a sturdy sans for headings and a plain sans for forms. Draft logo files are in `branding/`. Exact color and type values are decided when the first screens are built and recorded here.
- **Layout:** abilities and key numbers always visible, then saves, skills and the detail areas. Information grouping follows the reference sheet; the styling does not.
- **Credits on the site:** the SRD attribution text from `research.md` appears in the app, once per edition used.

### Structure rules

The conventions that keep the system lean: how files and code are organized, where new features belong, and the general rules that handle cases by design instead of one-off fixes.

- **Folders:** `catalog` (JSON files, loader, validator), `rules` (one module per edition), `engine` (calculation), `storage`, and `ui` (React). Tests sit next to the engine.
- **Edition differences live only in the rules modules.** Nothing else checks which edition a character uses.
- **Content lives in JSON, never in code.** Adding a species, class or background means adding a catalog entry, not changing the engine.
- **No UI code in the engine** and no calculation in the UI. The UI only displays what the engine returns.
- **Every catalog entry carries its source and license.** An entry without them fails validation.

### Decisions and changes

Consequential structural decisions, the alternatives considered, and why you chose as you did, including later changes to the structure.

**Nov 9: one shared character model with per-edition rules modules.**
- Decision: a character stores its edition (2014 or 2024). Small edition-specific modules compute the differences, for example where ability score bonuses come from (species in 2014, background in 2024). Everything else is shared.
- Alternative: two separate models. Simpler at first, but it duplicates code and doubles the work for homebrew entries.
- Why: homebrew species and subclasses must work in both editions, and the pitch names the two-edition data model as the main technical challenge.

**Nov 9: catalog data lives in static JSON files in the repo.**
- Decision: one catalog per edition. Each entry is tagged with its source and license. Homebrew content packs use the same format, so the loader handles SRD and homebrew entries identically.
- Alternative: typed data in TypeScript files. Better type checking, but harder for users to write packs by hand.
- Why: users must be able to author and share packs, and the site stays fully static. Entries are validated when loaded, since JSON isn't type checked.

**Nov 9: sheet scope in three groups.**
- Core (MVP): header (name, species, class, level), six abilities, proficiency bonus, speed, initiative, AC, HP (current, max, temp), saves, skills, passive scores, senses, proficiencies, and click-to-roll on skills and saves.
- Next: Actions (weapon attacks, with equipped gear affecting to-hit and AC), Features & Traits, Inventory.
- Later or stretch: rests and limited-use tracking, Defenses and Conditions, Background and Notes.
- Spells (changed later on Nov 9): all spell information sits on the Spells tab, and the tab is needed for Paladin and Sorcerer. Picking spells while building is in the MVP (decided later on Nov 9).
- Reference: a D&D Beyond sheet screenshot, used only for what information goes where. Its look is not copied; Sheetforge keeps its own visual identity.

**Nov 9: calculation engine is a pure-function layer.**
- Decision: character data in, derived numbers out, with no UI code. React only displays the results.
- Why: hand-calculated test characters become plain automated tests, and both editions share the same checks.

**Nov 9: characters save to browser localStorage.**
- Decision: localStorage for the MVP, with JSON export and import as the backup. Move to IndexedDB only if a limit is hit.
- Why: simplest option, no accounts, and each character is small.

**Nov 9: MVP covers three or four classes; the rest follow in Phase 3.**
- Decision: start with one martial, one half-caster and one full caster to prove the model, then add the rest of the 12 SRD classes.
- Classes: Fighter (martial), Paladin (half-caster), Sorcerer (full caster). The 2024 rules come first; 2014 is added in Phase 3.

**Nov 9: characters stay editable through the builder.**
- Decision: a saved character can be reopened in the builder and any choice changed, including spells. Nothing is locked after creation.
- Why: players change their minds, and the 2024 rules let spellcasters swap prepared spells after a rest, so locking spells at creation would not match the rules.
- Consequence: the character record stores choices, not results, and one rule clears invalid choices when an edit makes them invalid (see item 8 under Behavior and acceptance checks).
