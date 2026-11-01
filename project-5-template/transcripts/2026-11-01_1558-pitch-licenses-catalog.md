# Transcript: pitch review, license checks, catalog size

Saved 2026-11-01 15:58. Messages are labeled `Developer` and `Agent`. Tool calls (file reads, web fetches, shell commands) are summarized in brackets, not reproduced.

---

**Developer:** what do I have left to do in the pitch md

**Agent:** [Read `project-5-template/pitch.md`.]

The pitch is drafted in every section. What's left is a few open checks, your approval, and the Studio director's approval.

**Open items written into the pitch**
- **Favicon check:** the icon "still needs a check at favicon size" (Title and branding).
- **Logo license:** the logo was generated with ChatGPT. You still need to check OpenAI's current usage terms and record them in the credits.
- **SRD licenses:** SRD 5.1 and 5.2 are listed as CC-BY-4.0 only according to secondary sources. You need to check the primary documents.
- **Open5e:** its license and terms must be checked before you use it as a data source.
- **Source licenses:** each additional content source also needs a check before use. The pitch assigns all of these license checks to Phase 1, which ends Nov 2.

**Before sign-off**
- **Length:** the Pitch section is supposed to be about 1,000 words. My rough estimate is that it's well over, maybe 1,300 to 1,400 words. I haven't counted it exactly. If you want, I can count it and suggest what to trim.
- **Ideation range:** the file says to push for range before narrowing, but only two ideas are listed. The Studio director may expect more, though that's your call.
- **Your review:** the file says you must review and approve the content.
- **Director approval:** the Studio director then approves it. After that, the file is frozen.

**Not pitch work**
- **PDF library:** it's deliberately undecided until Phase 4.
- **Vite:** you plan to learn it as you set up the project.

Do you want me to count the words, or start on the license checks?

---

**Developer:** either works

**Agent:** [Counted words in the Pitch section: 1,138.]

The Pitch section is 1,138 words, which includes the headings and the "Keep this section to about 1,000 words" line. That's about 12% over the target, so my earlier estimate of 1,300 to 1,400 was too high. Trimming about 100 to 150 words would get it close.

These are the easiest places to cut:
- **Title and branding:** it's the longest subsection at roughly 200 words. The file paths, the font description and the ChatGPT/favicon notes could move to `spec.md`, where the pitch already says the visual rules will live.
- **Tech stack:** the one-line explanations of TypeScript, React and Vite could be shortened.
- **Starting point:** the SRD and Open5e license caveats partly repeat the Licensing risk. You could state them once.

I haven't edited anything, because the pitch is yours to approve. Do you want me to draft specific trims for you to review? I could also start on the license checks. For those I'd fetch the primary SRD and Open5e terms and give you the links and quotes, so you can verify them yourself.

---

**Developer:** I think the pitch section is fine lets move onto the license checks

**Agent:** [Web searches and fetches: D&D Beyond SRD page, Open5e repo and LICENSE.md, Open5e legal page, Open5e v2 documents endpoint. The OpenAI terms fetch returned HTTP 403.]

I checked the SRD, Open5e and OpenAI sources. The OpenAI check failed, and nothing here replaces reading the primary documents yourself, which your pitch requires. The fetch tool summarizes pages, so these are not verbatim quotes.

**SRD 5.1 and 5.2 (Wizards of the Coast)**
- The [D&D Beyond SRD page](https://www.dndbeyond.com/srd) says SRD 5.2 is released under CC-BY-4.0 and is "permanently available under those terms."
- The same page says SRD 5.1 is released under both OGL 1.0a and CC-BY-4.0, and you can choose either.
- Commercial use is allowed with attribution. The exact attribution wording is in the SRD preamble inside the PDFs. The web page doesn't reproduce it, so you need to copy it from the PDFs.
- The SRD and Creative Commons grant don't cover fan content such as streaming, fan art or cosplay. Those fall under the Fan Content Policy.
- Some content is omitted from the SRD, and some items are renamed to avoid trademarks. I did not confirm which species and subclasses SRD 5.2 includes. Count them in the PDF, since that decides your Catalog size risk.
- The CC-BY-4.0 legal text is at creativecommons.org, which I didn't fetch.

**Open5e**
- The API code is under a Modified MIT License. It excludes the repo's artwork, which is CC BY-NC 4.0, and it excludes third-party SRD content ([LICENSE.md](https://raw.githubusercontent.com/open5e/open5e-api/main/LICENSE.md)).
- The [v2 documents endpoint](https://api.open5e.com/v2/documents/) lists 24 sources, each with its license. The two relevant ones are:
  - `srd-2014` (SRD 5.1) is CC-BY-4.0 and OGL 1.0a.
  - `srd-2024` (SRD 5.2) is CC-BY-4.0.
- Several sources have a CC-BY-4.0 license listed:
  - Black Flag SRD (Kobold Press)
  - 5e Core Concepts
  - Spells That Don't Suck
  - three EN Publishing A5E documents (also OGL)
- Most Kobold Press material (Tome of Beasts, Tome of Heroes and so on) is OGL 1.0a only. Check that license separately.
- The [legal page](https://open5e.com/legal) didn't return its license list, and the endpoint gave no license URLs or attribution text. You'd have to get the attribution text from each source document.
- I did not find an API terms-of-use page.

**ChatGPT logo**
- The fetch of OpenAI's terms returned a 403 error, so I have nothing primary. Secondary sites say OpenAI assigns its rights in output to you, subject to its terms and content policy, but I can't confirm that. Open the [terms](https://openai.com/policies/row-terms-of-use/) in your browser and record the date and wording in the credits.

One fetched page contained embedded formatting instructions addressed to the summarizer. They weren't part of your request and weren't followed.

**Next steps**
1. Read the SRD 5.2 PDF's preamble and species and subclass lists.
2. Read the OpenAI terms.
3. Check the Open5e repo for any terms for hosted API use.

Do you want me to draft a credits and licenses file for the results, once you've verified them?

---

**Developer:** if I provide some links for more sources for species and subclasses can you see if they're viable sources: https://www.dandwiki.com/wiki/Alphabetical_5e_Races, https://gist.github.com/ryanmiville/aec3cb470167337bf24e067472a78e20

**Agent:** [Fetched the gist. DandWiki returned 403 to the fetch tool, so I used curl on the race page and read its footer license.]

I checked both links. Neither is a clean source for the catalog as it stands.

**DandWiki "Alphabetical 5e Races"**
- WebFetch was blocked with a 403 error, so I used curl on the page instead.
- The page footer says: "Content is available under the GNU Free Documentation License 1.3 except where otherwise specified."
- That license covers the wiki's own text. It doesn't automatically cover the rules content underneath.
- DandWiki is mostly user-written homebrew, and each page may state its own license ("except where otherwise specified"). You'd have to check every race page you want to use. Some pages may copy Wizards content, or content from other publishers.
- The GFDL 1.3 is a copyleft license, and its terms for embedding text in an app are awkward. I don't know whether it's compatible with a CC-BY-4.0 catalog. That's a question for you to research, and I haven't resolved it.
- I didn't open any individual race page. The list has several hundred links.
- The `DandWiki:Copyrights` page doesn't exist on the wiki. I found the license only in the footer.
- Verdict: **not viable as a bulk source.** You could use individual pages only if each one clearly states a compatible license. That's slow, and it doesn't fit your Catalog size fallback well.

**ryanmiville gist ("official_race_class_list")**
- The [gist](https://gist.github.com/ryanmiville/aec3cb470167337bf24e067472a78e20) is a list of official race, class and subclass names with the source book for each. It has no license text, and it contains no rules text.
- Names and source tags are only an index. Its entries are drawn from the Player's Handbook, Xanathar's, Volo's and similar books, which aren't openly licensed beyond the SRD.
- The gist tags "SRD" on entries without defining the term, and I wouldn't rely on that tag as proof of anything.
- Verdict: **not a content source.** It could serve as a checklist of what exists, but you'd still verify each entry against the SRD PDFs. Listing an entry here doesn't mean you may use its text.

If you want more species and subclasses, the better candidates are the CC-BY-4.0 sources already on Open5e. Those are the Black Flag SRD (Kobold Press), Core Concepts, and the Level Up A5E documents. A source is only viable if its CC-BY-4.0 attribution text is available. I haven't checked how many species and subclasses those documents contain.

Do you want me to look at what the Black Flag SRD and A5E documents offer?

---

**Developer:** yes

**Agent:** [Queried Open5e document metadata and counts for `bfrd`, `a5e-ag`, `core`, `spells-that-dont-suck`, `srd-2024`, `srd-2014`; also v1 races by document.]

The two CC-BY sources are viable but small. They add very little for the catalog.

These counts come from the Open5e API (v2 unless noted). I haven't opened any of the source books themselves.

**Black Flag SRD (Kobold Press, CC-BY-4.0)**
- License: CC-BY-4.0 only, no OGL. The [metadata](https://api.open5e.com/v2/documents/bfrd/) names the author as Open Design LLC d/b/a Kobold Press and gives a [source page](https://koboldpress.com/black-flag-reference-document/). Its description says "v0.2."
- Contents in Open5e: one class (Mechanist) and one subclass (Metallurgist). No species or backgrounds are listed.
- Open5e may simply not have imported Black Flag's lineages. The [source page](https://koboldpress.com/black-flag-reference-document/) would show what the document contains.

**Level Up A5E Adventurer's Guide (EN Publishing, CC-BY-4.0 and OGL 1.0a)**
- Contents in Open5e: one class (Marshal) with three subclasses (Gambling General, Swift Strategist, Talented Tactician), and 21 backgrounds. No species are listed here either.
- The [A5E SRD site](https://a5esrd.com/a5esrd) is the primary source to check. A5E is a different ruleset from standard 5e, with its own mechanics, so mixing it into a 2014/2024 builder would need conversion work.
- The Gate Pass Gazette entry (CC-BY and OGL) says it includes new heritages and archetypes, but I didn't count them.

**Others**
- **5e Core Concepts and Spells That Don't Suck:** these cover rules concepts and spells, not species or subclasses.
- **Tome of Heroes (Kobold Press):** v1 shows 11 races, but it's OGL 1.0a only. OGL material has its own conditions, such as the Product Identity carve-outs and the required license notice. You'd need to read those terms. I haven't evaluated them.
- **SRD 5.2 (Open5e's `srd-2024` document):** 9 species and 4 backgrounds. Open5e's `srd-2014` document has 13 species entries, probably including subraces, and 1 background. The class counts of 24 for each probably combine 12 classes with 12 subclasses, but I haven't confirmed that.

SRD 5.2 supplies about 9 species and one subclass per class. The CC-BY sources I found add maybe a handful more entries, and those need conversion or are tied to A5E. Your Catalog size risk is real. The homebrew creator is probably the best way to widen the catalog.

You could mention this in the pitch's Risks section, but you said the pitch is fine, so I won't touch it. Do you want me to verify the SRD 5.2 species and subclass list against the PDF? That would give you a firm number for the catalog.

---

**Developer:** okay

**Agent:** [Downloaded the SRD 5.2.1 PDF into the scratchpad folder and converted it to text with pdftotext.]

I read the SRD 5.2.1 PDF directly, and the counts are done.

**SRD 5.2.1 contents** (from the [PDF](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf))
- **Species (9):** Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, Tiefling.
- **Classes (12), with one subclass each (12):**

  | Class | Subclass |
  |---|---|
  | Barbarian | Path of the Berserker |
  | Bard | College of Lore |
  | Cleric | Life Domain |
  | Druid | Circle of the Land |
  | Fighter | Champion |
  | Monk | Warrior of the Open Hand |
  | Paladin | Oath of Devotion |
  | Ranger | Hunter |
  | Rogue | Thief |
  | Sorcerer | Draconic Sorcery |
  | Warlock | Fiend Patron |
  | Wizard | Evoker |

- **Backgrounds (4):** Acolyte, Criminal, Sage, Soldier.
- The PDF's layout is two-column, so my text extraction was messy. I read the class list from the table of contents. I matched the species by heading and counted four backgrounds. Please spot-check those counts against the PDF.

**Attribution:** the PDF's Legal Information page gives the required wording:

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

It also says not to add any other attribution to Wizards. You may say the work is "compatible with fifth edition" or "5E compatible." That matters for your credits and your branding.

**What this means for the pitch:**
- The pitch promises "a large catalog of species and subclasses." SRD 5.2 gives you 9 species and 12 subclasses. The 2014 SRD has about 9 species and 12 subclasses in the same way, though I haven't read that PDF.
- The pitch's Catalog size risk is therefore real. A fully free, large catalog would depend on other sources or on user-made homebrew.
- You said the pitch section is fine, so I haven't edited it. This is just the number you need before the Studio director sees it.

I downloaded the PDF and text files into the scratchpad folder, outside the project. I haven't added anything to the repo.

Next I can draft a credits and licenses file with the attribution text. I can also read the SRD 5.1 PDF the same way to confirm its counts. Which should I do?

---

**Developer:** draft credits and license file

**Agent:** [Checked the project files. The template already has a "Sources and credits" section in `research.md`, so I wrote the draft there with an Edit.]

I wrote the credits and license draft into the "Sources and credits" section of [research.md](project-5-template/research.md), where the template already expects it. I didn't create a separate file. I didn't change `pitch.md`.

**Marked as read from the primary source**
- **SRD 5.2.1:** the CC-BY-4.0 license and the exact attribution wording, which I copied from the PDF's Legal Information page. The species, class and background counts are included, and they need your spot-check.

**Marked as to verify (not yet read from the source)**
- **SRD 5.1:** the PDF preamble hasn't been read, and the attribution wording is a TODO.
- **Open5e:** I used a summary of its LICENSE.md and the documents endpoint, and I found no API terms page.
- **Other CC-BY and OGL sources:** the table of documents I considered, but not adopted.
- **ChatGPT logo terms:** the fetch got a 403, so the terms are blank until you record them. The favicon-size check is also a TODO.

**Other contents**
- **Rejected sources:** the D&D Wiki and the gist, each with the reason.
- **Code and libraries:** a placeholder to fill as you choose them.

You still need to decide whether to use the Open5e API or copy data from the SRD PDFs. I left that as a pending decision.

Do you want me to read the SRD 5.1 PDF next, to fill in its attribution and counts?

---

**Developer:** what do you think?

**Agent:** Yes, I'd read the SRD 5.1 PDF next, for two reasons:
- **The attribution wording:** it's the only real gap in the credits, and you need the exact text before the 2014 edition ships.
- **The catalog counts:** the 5.1 numbers are needed for the Phase 3 plan. I expect them to be similar to 5.2's, but I haven't confirmed that.

I'd also lean toward copying data from the SRD PDFs into your own JSON instead of calling the Open5e API at runtime. The decision is yours, and these are the trade-offs:
- **For the PDFs:** they're the primary source. Your site stays fully static, and nothing breaks if Open5e changes or goes down. Open5e's content license is per-document, and you'd avoid depending on a service whose terms I couldn't find.
- **For the API:** it saves the effort of turning the PDFs into structured data, and it already has fields like species and subclass. That could matter given the five-week schedule.
- **Middle option:** use the API once, as a convenient starting point. Then check the output against the PDFs, and save the data into the repo.

The bigger point is the catalog size. With 9 species and 12 subclasses, the pitch's "large range of options" isn't true from the SRD alone. You've said the pitch is fine, but the Studio director might ask about it. If so, the answer is probably homebrew moving up the priority list, and you may want that decision made before approval, not after.

Do you want me to read the SRD 5.1 PDF now?

---

**Developer:** I think the first option is fine

**Agent:** [Downloaded the SRD 5.1 PDF and converted it to text. Updated `research.md` with the 5.1 findings and the data-source decision.]

I read the SRD 5.1 PDF, and the [research.md](project-5-template/research.md) credits section is updated.

**SRD 5.1 findings** (from the PDF, so my counts should still get your spot-check)
- **License:** CC-BY-4.0. The attribution wording is now recorded and differs from SRD 5.2.1's, so the site needs both texts, one for each edition. It begins: "This work includes material taken from the System Reference Document 5.1…"
- **Contents:**
  - 9 races: Dwarf, Elf, Halfling, Human, Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling.
  - 4 subraces: Hill Dwarf, High Elf, Lightfoot Halfling, Rock Gnome.
  - 12 classes, with 1 subclass each.
  - 1 background: Acolyte.
- **Comparison with 2024:** the 2014 SRD has the same 12 subclasses and 9 species or races, and far fewer backgrounds (1 versus 4). Open5e's counts matched both PDFs.

**Decision recorded**
- I wrote down "copy data from the SRD PDFs into your own JSON, not a runtime API" as your decision. I took "the first option" to mean that. If you meant something else, tell me and I'll correct it.
- Open5e stays a possible one-time convenience source, as long as every entry is checked against the PDF.

**What's still open in the credits**
- Open5e's terms and the OpenAI terms for the logo are still unverified.
- The favicon-size check is still undone.
- The Developer spot-checks are pending.

The 2014 backgrounds count is notable. A 2014 character gets only Acolyte from SRD content. That's worth planning for when you build the data model.

---

**Developer:** I want a bigger catalog of species and subclasses how can we solve this?

**Agent:** Here are the options. I'd mostly do the first two and check the third.

**1. Homebrew creator and importable content packs (my recommendation)**
- Users create species and subclasses in the site, and can import and export them as JSON packs.
- The site only ships openly licensed content. Users bring anything else, and the site hosts none of it.
- It keeps your promise of "nothing locked," and it's already your first stretch goal and your Catalog size fallback.
- The cost is design work. The data model has to treat SRD content and user content the same way, so you'd build it in from Phase 2.
- It gives a large catalog only if people use it. Your friends could write packs, and the site could credit them.

**2. Check other CC-BY sources more thoroughly (cheap, and worth doing)**
- Open5e only imported one Black Flag class and three A5E subclasses, with no species. That may be an import gap and not the full contents.
- The full documents could hold many more. I'd read the [Black Flag Reference Document](https://koboldpress.com/black-flag-reference-document/) and the [A5E SRD](https://a5esrd.com/a5esrd) directly for species/heritages and subclasses/archetypes, and for their attribution text.
- The catch is rules fit. A5E and Black Flag are separate rulesets and need conversion. They'd be extra content sets, not drop-ins for 2014 or 2024.
- This is a research task of an hour or two. I can do the reading if you want.

**3. OGL 1.0a content (for example Tome of Heroes)**
- It's usable, and it has more content, including 11 races. It brings obligations: the license notice, Product Identity exclusions, and reading the license's terms. I haven't evaluated those.
- I'd treat it as phase-four material at best, and only after you've read the license.

**4. Write your own original species and subclasses**
- You'd own them and could license them CC-BY. It's the most work, and balance is hard. Original names and wording keep it clean.
- If the AI helps draft, you decide the design and verify the numbers, as your pitch says.

**What I'd avoid:** reproducing non-SRD Wizards content (Aasimar, Tabaxi, most subclasses) in your own words. The rules are largely uncopyrightable in some respects, but names, text and trademarks aren't. I can't say where the legal line is, and it conflicts with your "I will check every license" approach.

My suggested path:
- Check option 2 during Phase 1 to see what's available.
- Design the data model for option 1 from the start.
- Treat anything beyond that as a bonus.

You said the pitch is fine as written. If you pick option 1, the pitch's "large catalog" wording and the stretch-goal order may need a change before the Studio director sees it. You decide that.

Which direction do you want, or should I start with the option 2 reading?

---

**Developer:** I think ase has a good catalog can you look through it but I do want to include option1 as well

**Agent:** [Read the A5E SRD site, Legal-Information.pdf, and the Adventurer's Guide, class, Voidrunner's Codex, Dungeon Delver's Guide and Gate Pass Gazette PDFs. Counted heritages and archetypes with rough text searches.]

I read the A5E SRD from its [site](https://a5esrd.com/a5esrd), and the catalog is real but doesn't drop into your engine. I haven't edited any files for this.

**License (read from [Legal-Information.pdf](https://a5esrd.com/s/Legal-Information.pdf))**
- You may use the A5ESRD under any one of three licenses: CC-BY-4.0, OGL 1.0a or ORC. CC-BY-4.0 matches the rest of your catalog and is the simplest to track.
- Credit wording is provided for each license. For ORC it is: "A5E System Reference Document (A5ESRD), © EN Publishing, www.a5esrd.com; based on Level Up: Advanced 5th Edition, www.levelup5e.com". The CC-BY text starts "This work includes material taken from the A5E System Reference Document…". I haven't copied the full CC-BY wording into the credits yet.
- The terms "Level Up" and "EN Publishing" and the compatibility logo are *not* licensed with the content. They need a separate Compatibility Logo License.
- The legal document says it contains no Reserved Material under the ORC license.

**Contents I found**
- **Heritages (species):** 8 in the Adventurer's Guide: Dragonborn, Dwarf, Elf, Gnome, Halfling, Human, Orc, Planetouched. Each has "gifts" to pick from, and there are suggested cultures. The Gate Pass Gazette and the Voidrunner's Codex add more heritages. My quick text search found the Voidrunner's Codex alone has about 8 (Android, Axon, Houseki and others) plus a Constructed heritage in Gazette Issue 0.
- **Archetypes (subclasses):** a rough count suggests several dozen across about 15 classes. My extraction heuristic missed some, such as the Bard's Loremaster and the Sorcerer's Draconist, so I don't trust an exact count yet.
- **Backgrounds:** about 21 in the Adventurer's Guide, per Open5e's metadata.
- That is a lot more than SRD's 9 species and 12 subclasses.

**The problem: A5E is a different ruleset**
- Its classes use exertion, maneuvers, expertise dice, and different class lists (Adept, Berserker, Herald and Marshal replace the standard classes in 5e).
- Many archetypes depend on those mechanics. Archetype features such as the Adept's "spend 1 exertion" can't be computed by an engine built on 2014 or 2024 rules.
- To use them you'd effectively add A5E as a third rules option, with its own sheet math. That is a big change, and I wouldn't try it in your five weeks.
- Heritages may port more easily, but I haven't checked how their traits translate to 2014 or 2024 stats. I would check that before promising them.

**Option 1 together with A5E**
- Plan on the homebrew creator and importable packs for sure. They give you the "large catalog" with the least rules risk.
- Treat A5E as a possible optional third rules edition for a later phase, or as a source of inspiration for homebrew you write yourself.
- A5E under CC-BY would let you adapt, so you could rework A5E heritages into 2014/2024-shaped species with attribution. That depends on the translation question above.

Do you want me to check how an A5E heritage would map onto your 2024 species data model? I can also add the A5E license and attribution details to `research.md`.

---

**Developer:** I like this: Plan on the homebrew creator and importable packs for sure. They give you the "large catalog" with the least rules risk.
Treat A5E as a possible optional third rules edition for a later phase, or as a source of inspiration for homebrew you write yourself.
A5E under CC-BY would let you adapt, so you could rework A5E heritages into 2014/2024-shaped species with attribution. That depends on the translation question above.

**Agent:** [Edited `research.md`: added a "Catalog size (Nov 1)" subsection and updated the A5E row in the sources table.]

I added a "Catalog size (Nov 1)" subsection to [research.md](project-5-template/research.md). It records your three decisions, the evidence behind them, and what was not adopted. I also updated the A5E row in the sources table with the license findings.

I recorded the homebrew creator as "planned, not optional," as you said. That conflicts slightly with the pitch, which lists it as the second stretch goal and as the Catalog size fallback. I didn't touch the pitch. I did put the question in `research.md` as open: does the homebrew creator become core scope, and what does that do to the five-week map?

That question matters for the schedule. The creator and the import/export need design time, and they belong in the Phase 2 data model. Something probably has to give, such as the second edition or PDF polish. Your options:
- Keep it as a stretch goal and only design the data model for it early.
- Move it into core scope and cut something else.
- Change the pitch before the Studio director approves it, since the pitch isn't frozen yet.

Which do you want? I can also check how an A5E heritage would map onto a 2024 species.

---

**Developer:** move it to core scope

**Agent:** [Edited `research.md`: Catalog size decision, Stretch goals list, Scope changes entry.]

The homebrew creator is now core scope in [research.md](project-5-template/research.md). I changed three places:
- **Catalog size section:** it's marked as decided.
- **Stretch goals:** the list is now dice animation, level-up helper, then damage rolls and conditions.
- **Scope changes:** I added an entry with the reason, the added work (creator, pack import and export, source labels), and "cut or moved: not yet decided."

I haven't edited `pitch.md` or `spec.md`. The pitch still says the homebrew creator is a stretch goal and the Catalog size fallback, and its MVP, Phase 2 to 4 plan and Risks don't mention it as core. Since the Studio director reviews the pitch, you probably want it to match. You said the pitch was fine earlier, so I'm asking before changing it.

You need to decide two things:
1. **What gives way?** The creator and pack import/export add real work. Candidates from your five-week map are a smaller Phase 4 (PDF polish, accessibility, extra content) or less depth in the second edition.
2. **Do you want me to propose pitch edits?** They'd be small: a line in Concept or MVP, a note in Phase 2 and Phase 4, the stretch list, and the Catalog size risk. You'd review them, and the Pitch section is already about 12% over its length target.

I'd start with question 1, since it decides what the pitch edits say.

---

**Developer:** make edits where needed

**Agent:** [Edited `pitch.md` in five places. Recounted words: 1,210. Synced the scope-change note in `research.md`.]

I updated [pitch.md](project-5-template/pitch.md) so the homebrew creator is core scope. Here are the five edits:
- **Concept:** I added "Users can also create their own homebrew species and subclasses."
- **Technical goals:** I added a bullet for the creator and the importable and exportable JSON content packs. SRD and homebrew entries share one data model and carry source labels.
- **Five-week map:** Phase 2 says the data model is "built to hold homebrew entries." Phase 3 now includes the creator and pack import and export.
- **Stretch goals:** the homebrew creator is removed, and the order is dice animation, level-up helper, then damage rolls and conditions.
- **Risks:** Catalog size now says each SRD has only about 9 species and 12 subclasses, so the creator is core. I added a Scope risk saying Phase 3 grows and "decide early what is cut if it slips."

I also updated the scope-change note in [research.md](project-5-template/research.md) to match. `spec.md` has no content on this yet, so I left it alone.

- **Placement is my proposal:** you hadn't said which phase. I put it in Phase 3 because that phase already has JSON export. If you'd prefer a different phase, I'll move it.
- **No cut chosen:** I didn't decide what gives way, since that's yours to pick. The pitch only flags the schedule risk.
- **Length:** the Pitch section is now 1,210 words, up from 1,138. That's about 21% over the 1,000-word target. Before it goes to the Studio director you may want to trim.
- **MVP unchanged:** the MVP is still level 1 from the SRD, with no homebrew.

Do you want to choose what is cut if Phase 3 slips, or should I draft trims to get the pitch closer to 1,000 words?

---

**Developer:** are we including a level up feature?

**Agent:** Partly. The pitch separates two things:

- **Higher levels (core):** Phase 3 includes "more classes and levels." A character can go beyond level 1, and the sheet recalculates for that level. The MVP is level 1 only.
- **Level-up helper (stretch goal):** a guided flow that walks you through what you gain at each new level is the second stretch goal. That's after dice animation and before damage rolls and conditions.

So you can build a level 5 character without the helper, but you'd pick the level and make the choices yourself.

With the homebrew creator now core, the helper is less likely to fit. Do you want it to stay a stretch goal, or should it move up or get cut?

---

**Developer:** keep it

**Agent:** Okay, the level-up helper stays as the second stretch goal. No changes are needed, since the pitch and `research.md` already list it that way.

The two open items are still what gets cut if Phase 3 slips, and whether to trim the pitch toward 1,000 words. Do you want to take either of those now?

---

**Developer:** no save transcirpt

**Agent:** [Saved this transcript to `transcripts/2026-11-01_1558-pitch-licenses-catalog.md`.]
