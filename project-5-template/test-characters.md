# Test characters

**Status: drafted by the Agent from SRD 5.2.1 on Nov 9; reviewed and approved by the Developer on Nov 9.** The engine tests (checkpoint 4 in `plan.md`) compare against these numbers.

Rules used, 2024, level 1 (SRD 5.2.1):
- Background adds +2 to one of its three listed abilities and +1 to another, or +1 to all three. No score goes above 20.
- Modifier is (score - 10) divided by 2, rounded down. Proficiency bonus is +2.
- Saving throw is the modifier, plus +2 if your class is proficient in it.
- Skill is its ability's modifier, plus +2 if proficient. Proficiencies come from the background (two), the class (choose two from its list), and species traits (Human Skillful gives one skill of choice).
- Passive Perception, Investigation and Insight are 10 plus that skill's bonus.
- Initiative is the Dexterity modifier.
- AC: Chain Mail is 16, a Shield adds 2, and with no armor AC is 10 plus the Dexterity modifier (SRD Armor table and character creation text). Chain Mail needs Strength 13 to avoid a speed penalty.
- HP at level 1 is the highest number on the hit die plus the Constitution modifier (plus 1 for a Dwarf, from Dwarven Toughness).
- Spell save DC is 8 + spellcasting modifier + proficiency bonus; spell attack bonus is spellcasting modifier + proficiency bonus.

What each character is meant to exercise: Fighter, a Dwarf (+1 HP) in heavy armor with the standard array. Paladin, a Goliath (35 ft speed) in armor and a shield with point buy and spellcasting. Sorcerer, a Human (one free skill) with no armor, rolled scores and spellcasting. Species with lineage choices that change numbers (Elf, Tiefling, Gnome) are left for later.

---

## Fighter

Status: reviewed and approved by the Developer on Nov 9.

```
Edition: 2024
Species: Dwarf
Background: Soldier
Score method used: Standard array (15, 14, 13, 12, 10, 8)
Base scores:            STR 15   DEX 13   CON 14   INT 10   WIS 12   CHA 8
Background bonus:       +2 STR, +1 CON
Final scores:           STR 17   DEX 13   CON 15   INT 10   WIS 12   CHA 8
Class skills picked (2): Perception, Survival
All skill proficiencies and where each comes from:
  Athletics (Soldier), Intimidation (Soldier), Perception (Fighter), Survival (Fighter)
Starting equipment option and armor worn: A, Chain Mail (no Shield)
Fighting Style feat: Great Weapon Fighting (no effect on these numbers; Defense would add 1 AC, so it is not used here)

EXPECTED
Modifiers:              STR +3   DEX +1   CON +2   INT 0    WIS +1   CHA -1
Proficiency bonus:      +2
Saving throws:          STR +5   DEX +1   CON +4   INT 0    WIS +1   CHA -1

Skills:
  Acrobatics:        +1
  Animal Handling:   +1
  Arcana:            0
  Athletics:         +5
  Deception:         -1
  History:           0
  Insight:           +1
  Intimidation:      +1
  Investigation:     0
  Medicine:          +1
  Nature:            0
  Perception:        +3
  Performance:       -1
  Persuasion:        -1
  Religion:          0
  Sleight of Hand:   +1
  Stealth:           +1
  Survival:          +3

Passive Perception:    13
Passive Investigation: 10
Passive Insight:       11
Initiative:            +1
AC:                    16
HP:                    13
Speed:                 30
```

## Paladin

Status: reviewed and approved by the Developer on Nov 9.

```
Edition: 2024
Species: Goliath
Background: Acolyte
Score method used: Point buy (26 of 27 points: STR 15 = 9, DEX 10 = 2, CON 13 = 5, INT 8 = 0, WIS 11 = 3, CHA 14 = 7)
Base scores:            STR 15   DEX 10   CON 13   INT 8    WIS 11   CHA 14
Background bonus:       +2 CHA, +1 WIS
Final scores:           STR 15   DEX 10   CON 13   INT 8    WIS 12   CHA 16
Class skills picked (2): Athletics, Persuasion
All skill proficiencies and where each comes from:
  Insight (Acolyte), Religion (Acolyte), Athletics (Paladin), Persuasion (Paladin)
Starting equipment option and armor worn: A, Chain Mail and Shield (Strength 15 meets the Chain Mail requirement of 13)

EXPECTED
Modifiers:              STR +2   DEX 0    CON +1   INT -1   WIS +1   CHA +3
Proficiency bonus:      +2
Saving throws:          STR +2   DEX 0    CON +1   INT -1   WIS +3   CHA +5

Skills:
  Acrobatics:        0
  Animal Handling:   +1
  Arcana:            -1
  Athletics:         +4
  Deception:         +3
  History:           -1
  Insight:           +3
  Intimidation:      +3
  Investigation:     -1
  Medicine:          +1
  Nature:            -1
  Perception:        +1
  Performance:       +3
  Persuasion:        +5
  Religion:          +1
  Sleight of Hand:   0
  Stealth:           0
  Survival:          +1

Passive Perception:    11
Passive Investigation: 9
Passive Insight:       13
Initiative:            0
AC:                    18
HP:                    11
Speed:                 35
Spell save DC:         13
Spell attack bonus:    +5
```

## Sorcerer

Status: reviewed and approved by the Developer on Nov 9.

```
Edition: 2024
Species: Human
Background: Criminal
Score method used: Roll (fixed values for this test: 15, 13, 13, 12, 10, 9)
Base scores:            STR 9    DEX 13   CON 13   INT 10   WIS 12   CHA 15
Background bonus:       +2 DEX, +1 CON
Final scores:           STR 9    DEX 15   CON 14   INT 10   WIS 12   CHA 15
Class skills picked (2): Arcana, Persuasion
All skill proficiencies and where each comes from:
  Sleight of Hand (Criminal), Stealth (Criminal), Arcana (Sorcerer), Persuasion (Sorcerer), Perception (Human, Skillful)
Starting equipment option and armor worn: A, no armor (Sorcerers have no armor training)

EXPECTED
Modifiers:              STR -1   DEX +2   CON +2   INT 0    WIS +1   CHA +2
Proficiency bonus:      +2
Saving throws:          STR -1   DEX +2   CON +4   INT 0    WIS +1   CHA +4

Skills:
  Acrobatics:        +2
  Animal Handling:   +1
  Arcana:            +2
  Athletics:         -1
  Deception:         +2
  History:           0
  Insight:           +1
  Intimidation:      +2
  Investigation:     0
  Medicine:          +1
  Nature:            0
  Perception:        +3
  Performance:       +2
  Persuasion:        +4
  Religion:          0
  Sleight of Hand:   +4
  Stealth:           +4
  Survival:          +1

Passive Perception:    13
Passive Investigation: 10
Passive Insight:       11
Initiative:            +2
AC:                    12
HP:                    8
Speed:                 30
Spell save DC:         12
Spell attack bonus:    +4
```

---

# New classes (drafted Nov 9)

**These five are drafted by the Agent and not yet reviewed by the Developer.** They test the level 1 rules that change the numbers: Unarmored Defense (Barbarian: Dexterity and Constitution; Monk: Dexterity and Wisdom), Rogue Expertise, and the Cleric's and Druid's order choices. The engine tests for these rules will not be written until each is checked. As before, check the numbers by hand against the SRD, not against mine.

Rules for the new features (SRD 5.2.1):
- Unarmored Defense, Barbarian: with no armor, AC is 10 + Dexterity modifier + Constitution modifier, and a Shield can still be used. Monk: with no armor and no Shield, AC is 10 + Dexterity modifier + Wisdom modifier.
- Expertise, Rogue: choose two of your skill proficiencies. For those, the proficiency bonus counts twice (here +4 instead of +2).
- Divine Order, Thaumaturge, and Primal Order, Magician: one extra cantrip, and a bonus to Arcana and Religion (Cleric) or Arcana and Nature (Druid) checks equal to your Wisdom modifier, at least +1. The bonus stacks with proficiency.
- The other level 1 features (Rage, Sneak Attack, Martial Arts, Bardic Inspiration and so on) do not change these numbers and are not part of the sheet yet.

## Barbarian (new class: Unarmored Defense)

Status: drafted by the Agent on Nov 9, not verified by the Developer.

```
Edition: 2024
Species: Orc
Background: Soldier
Score method used: Point buy (22 of 27 points: STR 15 = 9, DEX 12 = 4, CON 14 = 7, INT 8 = 0, WIS 10 = 2, CHA 8 = 0)
Base scores:            STR 15   DEX 12   CON 14   INT 8    WIS 10   CHA 8
Background bonus:       +2 STR, +1 CON
Final scores:           STR 17   DEX 12   CON 15   INT 8    WIS 10   CHA 8
Class skills picked (2): Animal Handling, Survival

All skill proficiencies and where each comes from:
  Athletics (Soldier), Intimidation (Soldier), Animal Handling (Barbarian), Survival (Barbarian)
Starting equipment option and armor worn: A (Greataxe, Handaxes and gear): no armor and no Shield

EXPECTED
Modifiers:              STR +3   DEX +1   CON +2   INT -1   WIS 0    CHA -1
Proficiency bonus:      +2
Saving throws:          STR +5   DEX +1   CON +4   INT -1   WIS 0    CHA -1

Skills:
  Acrobatics:        +1
  Animal Handling:   +2
  Arcana:            -1
  Athletics:         +5
  Deception:         -1
  History:           -1
  Insight:           0
  Intimidation:      +1
  Investigation:     -1
  Medicine:          0
  Nature:            -1
  Perception:        0
  Performance:       -1
  Persuasion:        -1
  Religion:          -1
  Sleight of Hand:   +1
  Stealth:           +1
  Survival:          +2

Passive Perception:    10
Passive Investigation: 9
Passive Insight:       10
Initiative:            +1
AC:                    13   (Unarmored Defense: 10 + 1 Dex + 2 Con)
HP:                    14   (d12 = 12, + 2 Con)
Speed:                 30
```

## Monk (new class: Unarmored Defense with Wisdom)

Status: drafted by the Agent on Nov 9, not verified by the Developer.

```
Edition: 2024
Species: Halfling
Background: Criminal
Score method used: Standard array (15, 14, 13, 12, 10, 8)
Base scores:            STR 12   DEX 15   CON 13   INT 10   WIS 14   CHA 8
Background bonus:       +2 DEX, +1 CON
Final scores:           STR 12   DEX 17   CON 14   INT 10   WIS 14   CHA 8
Class skills picked (2): Acrobatics, Insight
Tool proficiency chosen (no effect on these numbers): Flute
All skill proficiencies and where each comes from:
  Sleight of Hand (Criminal), Stealth (Criminal), Acrobatics (Monk), Insight (Monk)
Starting equipment option and armor worn: A (Spear, Daggers and gear): no armor and no Shield

EXPECTED
Modifiers:              STR +1   DEX +3   CON +2   INT 0    WIS +2   CHA -1
Proficiency bonus:      +2
Saving throws:          STR +3   DEX +5   CON +2   INT 0    WIS +2   CHA -1

Skills:
  Acrobatics:        +5
  Animal Handling:   +2
  Arcana:            0
  Athletics:         +1
  Deception:         -1
  History:           0
  Insight:           +4
  Intimidation:      -1
  Investigation:     0
  Medicine:          +2
  Nature:            0
  Perception:        +2
  Performance:       -1
  Persuasion:        -1
  Religion:          0
  Sleight of Hand:   +5
  Stealth:           +5
  Survival:          +2

Passive Perception:    12
Passive Investigation: 10
Passive Insight:       14
Initiative:            +3
AC:                    15   (Unarmored Defense: 10 + 3 Dex + 2 Wis)
HP:                    10   (d8 = 8, + 2 Con)
Speed:                 30
```

## Rogue (new class: Expertise)

Status: drafted by the Agent on Nov 9, not verified by the Developer.

```
Edition: 2024
Species: Human
Background: Soldier
Score method used: Point buy (27 of 27 points: STR 8 = 0, DEX 15 = 9, CON 14 = 7, INT 13 = 5, WIS 10 = 2, CHA 12 = 4)
Base scores:            STR 8    DEX 15   CON 14   INT 13   WIS 10   CHA 12
Background bonus:       +2 DEX, +1 CON
Final scores:           STR 8    DEX 17   CON 15   INT 13   WIS 10   CHA 12
Class skills picked (4): Stealth, Sleight of Hand, Perception, Deception
Human free skill (Skillful): Investigation
Expertise (2 of the proficient skills): Stealth, Sleight of Hand
All skill proficiencies and where each comes from:
  Athletics (Soldier), Intimidation (Soldier), Stealth (Rogue), Sleight of Hand (Rogue), Perception (Rogue), Deception (Rogue), Investigation (Human)
Starting equipment option and armor worn: A, Leather Armor (Light armor, which the Rogue is trained in)

EXPECTED
Modifiers:              STR -1   DEX +3   CON +2   INT +1   WIS 0    CHA +1
Proficiency bonus:      +2
Saving throws:          STR -1   DEX +5   CON +2   INT +3   WIS 0    CHA +1

Skills:
  Acrobatics:        +3
  Animal Handling:   0
  Arcana:            +1
  Athletics:         +1
  Deception:         +3
  History:           +1
  Insight:           0
  Intimidation:      +3
  Investigation:     +3
  Medicine:          0
  Nature:            +1
  Perception:        +2
  Performance:       +1
  Persuasion:        +1
  Religion:          +1
  Sleight of Hand:   +7
  Stealth:           +7
  Survival:          0

Passive Perception:    12
Passive Investigation: 13
Passive Insight:       10
Initiative:            +3
AC:                    14   (Leather Armor: 11 + 3 Dex)
HP:                    10   (d8 = 8, + 2 Con)
Speed:                 30
```

Note: Stealth and Sleight of Hand are +7: Dex +3, proficiency +2, and the proficiency bonus again for Expertise (+2).

## Cleric (new class: Divine Order, Thaumaturge)

Status: drafted by the Agent on Nov 9, not verified by the Developer.

```
Edition: 2024
Species: Goliath
Background: Acolyte
Score method used: Standard array (15, 14, 13, 12, 10, 8)
Base scores:            STR 13   DEX 10   CON 14   INT 8    WIS 15   CHA 12
Background bonus:       +2 WIS, +1 CHA
Final scores:           STR 13   DEX 10   CON 14   INT 8    WIS 17   CHA 13
Class skills picked (2): Medicine, Persuasion
Divine Order: Thaumaturge (one extra cantrip, and a bonus to Arcana and Religion checks equal to the Wisdom modifier, minimum +1)
All skill proficiencies and where each comes from:
  Insight (Acolyte), Religion (Acolyte), Medicine (Cleric), Persuasion (Cleric)
Starting equipment option and armor worn: A, Chain Shirt and Shield (Medium armor and Shields, which the Cleric is trained in)

EXPECTED
Modifiers:              STR +1   DEX 0    CON +2   INT -1   WIS +3   CHA +1
Proficiency bonus:      +2
Saving throws:          STR +1   DEX 0    CON +2   INT -1   WIS +5   CHA +3

Skills:
  Acrobatics:        0
  Animal Handling:   +3
  Arcana:            +2
  Athletics:         +1
  Deception:         +1
  History:           -1
  Insight:           +5
  Intimidation:      +1
  Investigation:     -1
  Medicine:          +5
  Nature:            -1
  Perception:        +3
  Performance:       +1
  Persuasion:        +3
  Religion:          +4
  Sleight of Hand:   0
  Stealth:           0
  Survival:          +3

Passive Perception:    13
Passive Investigation: 9
Passive Insight:       15
Initiative:            0
AC:                    15   (Chain Shirt: 13 + 0 Dex, + 2 for the Shield)
HP:                    10   (d8 = 8, + 2 Con)
Speed:                 35
Spell save DC:         13
Spell attack bonus:    +5
Cantrips known:        4   (3, +1 from Thaumaturge)
Level 1 spells prepared: 4
Level 1 slots:        2
```

Note: Arcana is +2: Int -1 plus the Thaumaturge bonus of +3. Religion is +4: Int -1, proficiency +2, and the bonus of +3.

## Druid (new class: Primal Order, Magician)

Status: drafted by the Agent on Nov 9, not verified by the Developer.

```
Edition: 2024
Species: Human
Background: Sage
Score method used: Standard array (15, 14, 13, 12, 10, 8)
Base scores:            STR 10   DEX 13   CON 14   INT 12   WIS 15   CHA 8
Background bonus:       +2 WIS, +1 CON
Final scores:           STR 10   DEX 13   CON 15   INT 12   WIS 17   CHA 8
Class skills picked (2): Nature, Perception
Human free skill (Skillful): Survival
Primal Order: Magician (one extra cantrip, and a bonus to Arcana and Nature checks equal to the Wisdom modifier, minimum +1)
All skill proficiencies and where each comes from:
  Arcana (Sage), History (Sage), Nature (Druid), Perception (Druid), Survival (Human)
Starting equipment option and armor worn: A, Leather Armor and Shield (Light armor and Shields, which the Druid is trained in)

EXPECTED
Modifiers:              STR 0    DEX +1   CON +2   INT +1   WIS +3   CHA -1
Proficiency bonus:      +2
Saving throws:          STR 0    DEX +1   CON +2   INT +3   WIS +5   CHA -1

Skills:
  Acrobatics:        +1
  Animal Handling:   +3
  Arcana:            +6
  Athletics:         0
  Deception:         -1
  History:           +3
  Insight:           +3
  Intimidation:      -1
  Investigation:     +1
  Medicine:          +3
  Nature:            +6
  Perception:        +5
  Performance:       -1
  Persuasion:        -1
  Religion:          +1
  Sleight of Hand:   +1
  Stealth:           +1
  Survival:          +5

Passive Perception:    15
Passive Investigation: 11
Passive Insight:       13
Initiative:            +1
AC:                    14   (Leather Armor: 11 + 1 Dex, + 2 for the Shield)
HP:                    10   (d8 = 8, + 2 Con)
Speed:                 30
Spell save DC:         13
Spell attack bonus:    +5
Cantrips known:        3   (2, +1 from Magician)
Level 1 spells prepared: 4
Level 1 slots:        2
```

Note: Arcana and Nature are +6: Int +1, proficiency +2, and the Magician bonus of +3.
