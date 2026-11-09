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
