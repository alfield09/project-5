import { describe, expect, test } from 'vitest'
import { catalog } from '../catalog/load'
import type { Catalog } from '../catalog/types'
import type { Character } from './character'
import { deriveCharacter, proficiencyBonus } from './derive'

// The three test characters and their expected numbers come from test-characters.md,
// which the Developer reviewed and approved. Nothing here is calculated by the engine.

function derive(character: Character) {
  const result = deriveCharacter(character, catalog)
  if (!result.ok) throw new Error(`expected numbers, got problems: ${result.problems.join('; ')}`)
  return result.derived
}

const fighter: Character = {
  edition: '2024',
  level: 1,
  speciesId: 'dwarf',
  backgroundId: 'soldier',
  classId: 'fighter',
  baseScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  backgroundBonus: { plusTwo: 'str', plusOne: 'con' },
  classSkills: ['Perception', 'Survival'],
  speciesSkills: [],
  equipmentOptionId: 'A', // Chain Mail
}

const paladin: Character = {
  edition: '2024',
  level: 1,
  speciesId: 'goliath',
  backgroundId: 'acolyte',
  classId: 'paladin',
  baseScores: { str: 15, dex: 10, con: 13, int: 8, wis: 11, cha: 14 },
  backgroundBonus: { plusTwo: 'cha', plusOne: 'wis' },
  classSkills: ['Athletics', 'Persuasion'],
  speciesSkills: [],
  equipmentOptionId: 'A', // Chain Mail and a Shield
}

const sorcerer: Character = {
  edition: '2024',
  level: 1,
  speciesId: 'human',
  backgroundId: 'criminal',
  classId: 'sorcerer',
  baseScores: { str: 9, dex: 13, con: 13, int: 10, wis: 12, cha: 15 },
  backgroundBonus: { plusTwo: 'dex', plusOne: 'con' },
  classSkills: ['Arcana', 'Persuasion'],
  speciesSkills: ['Perception'],
  equipmentOptionId: 'A', // no armor
}

describe('Fighter (Dwarf, Soldier)', () => {
  const result = derive(fighter)

  test('scores, modifiers and proficiency bonus', () => {
    expect(result.finalScores).toEqual({ str: 17, dex: 13, con: 15, int: 10, wis: 12, cha: 8 })
    expect(result.modifiers).toEqual({ str: 3, dex: 1, con: 2, int: 0, wis: 1, cha: -1 })
    expect(result.proficiencyBonus).toBe(2)
  })

  test('saving throws', () => {
    expect(result.savingThrows).toEqual({ str: 5, dex: 1, con: 4, int: 0, wis: 1, cha: -1 })
  })

  test('all 18 skills', () => {
    expect(result.skills).toEqual({
      Acrobatics: 1, 'Animal Handling': 1, Arcana: 0, Athletics: 5, Deception: -1, History: 0,
      Insight: 1, Intimidation: 1, Investigation: 0, Medicine: 1, Nature: 0, Perception: 3,
      Performance: -1, Persuasion: -1, Religion: 0, 'Sleight of Hand': 1, Stealth: 1, Survival: 3,
    })
  })

  test('passives, initiative, AC, HP and speed', () => {
    expect(result.passive).toEqual({ perception: 13, investigation: 10, insight: 11 })
    expect(result.initiative).toBe(1)
    expect(result.armorClass).toBe(16)
    expect(result.maxHitPoints).toBe(13) // d10 + 2 Con + 1 Dwarven Toughness
    expect(result.speed).toBe(30)
    expect(result.spellcasting).toBeUndefined()
    expect(result.warnings).toEqual([])
  })
})

describe('Paladin (Goliath, Acolyte)', () => {
  const result = derive(paladin)

  test('scores, modifiers and proficiency bonus', () => {
    expect(result.finalScores).toEqual({ str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 16 })
    expect(result.modifiers).toEqual({ str: 2, dex: 0, con: 1, int: -1, wis: 1, cha: 3 })
    expect(result.proficiencyBonus).toBe(2)
  })

  test('saving throws', () => {
    expect(result.savingThrows).toEqual({ str: 2, dex: 0, con: 1, int: -1, wis: 3, cha: 5 })
  })

  test('all 18 skills', () => {
    expect(result.skills).toEqual({
      Acrobatics: 0, 'Animal Handling': 1, Arcana: -1, Athletics: 4, Deception: 3, History: -1,
      Insight: 3, Intimidation: 3, Investigation: -1, Medicine: 1, Nature: -1, Perception: 1,
      Performance: 3, Persuasion: 5, Religion: 1, 'Sleight of Hand': 0, Stealth: 0, Survival: 1,
    })
  })

  test('passives, initiative, AC, HP, speed and spellcasting', () => {
    expect(result.passive).toEqual({ perception: 11, investigation: 9, insight: 13 })
    expect(result.initiative).toBe(0)
    expect(result.armorClass).toBe(18) // Chain Mail 16 + Shield 2
    expect(result.maxHitPoints).toBe(11)
    expect(result.speed).toBe(35)
    expect(result.spellcasting).toEqual({ ability: 'cha', saveDc: 13, attackBonus: 5 })
    expect(result.warnings).toEqual([])
  })
})

describe('Sorcerer (Human, Criminal)', () => {
  const result = derive(sorcerer)

  test('scores, modifiers and proficiency bonus', () => {
    expect(result.finalScores).toEqual({ str: 9, dex: 15, con: 14, int: 10, wis: 12, cha: 15 })
    expect(result.modifiers).toEqual({ str: -1, dex: 2, con: 2, int: 0, wis: 1, cha: 2 })
    expect(result.proficiencyBonus).toBe(2)
  })

  test('saving throws', () => {
    expect(result.savingThrows).toEqual({ str: -1, dex: 2, con: 4, int: 0, wis: 1, cha: 4 })
  })

  test('all 18 skills', () => {
    expect(result.skills).toEqual({
      Acrobatics: 2, 'Animal Handling': 1, Arcana: 2, Athletics: -1, Deception: 2, History: 0,
      Insight: 1, Intimidation: 2, Investigation: 0, Medicine: 1, Nature: 0, Perception: 3,
      Performance: 2, Persuasion: 4, Religion: 0, 'Sleight of Hand': 4, Stealth: 4, Survival: 1,
    })
  })

  test('passives, initiative, AC, HP, speed and spellcasting', () => {
    expect(result.passive).toEqual({ perception: 13, investigation: 10, insight: 11 })
    expect(result.initiative).toBe(2)
    expect(result.armorClass).toBe(12) // no armor: 10 + 2 Dex
    expect(result.maxHitPoints).toBe(8)
    expect(result.speed).toBe(30)
    expect(result.spellcasting).toEqual({ ability: 'cha', saveDc: 12, attackBonus: 4 })
    expect(result.warnings).toEqual([])
  })
})

describe('incomplete or invalid choices give problems, never numbers', () => {
  function problemsFor(character: Character): string[] {
    const result = deriveCharacter(character, catalog)
    if (result.ok) throw new Error('expected problems, got numbers')
    return result.problems
  }

  test('an empty character lists what to choose', () => {
    const empty: Character = { edition: '2024', level: 1, baseScores: {}, classSkills: [], speciesSkills: [] }
    const problems = problemsFor(empty)
    expect(problems).toContain('choose a species')
    expect(problems).toContain('choose a background')
    expect(problems).toContain('choose a class')
    expect(problems).toContain('assign a score to STR')
    expect(problems).toContain('choose how to apply the background bonus')
  })

  test('a missing score is reported', () => {
    const { dex: _dex, ...rest } = fighter.baseScores
    expect(problemsFor({ ...fighter, baseScores: rest })).toEqual(['assign a score to DEX'])
  })

  test('an unknown species is reported', () => {
    expect(problemsFor({ ...fighter, speciesId: 'mystery' })).toEqual(['unknown species "mystery"'])
  })

  test('a background bonus on an ability the background does not offer is reported', () => {
    // Soldier offers STR, DEX and CON
    const problems = problemsFor({ ...fighter, backgroundBonus: { plusTwo: 'cha', plusOne: 'con' } })
    expect(problems[0]).toContain('the background bonus must go to')
  })

  test('the +2 and +1 cannot go to the same ability', () => {
    const problems = problemsFor({ ...fighter, backgroundBonus: { plusTwo: 'str', plusOne: 'str' } })
    expect(problems).toContain('the +2 and the +1 must go to different abilities')
  })

  test('the wrong number of class skills, or a skill off the list, is reported', () => {
    expect(problemsFor({ ...fighter, classSkills: ['Perception'] })).toContain('pick exactly 2 class skills')
    expect(problemsFor({ ...fighter, classSkills: ['Perception', 'Arcana'] }).join(' ')).toContain('class skills must come from')
    expect(problemsFor({ ...fighter, classSkills: ['Perception', 'Perception'] })).toContain('class skills must be different from each other')
  })

  test('a Human must pick a species skill and a Dwarf must not', () => {
    expect(problemsFor({ ...sorcerer, speciesSkills: [] })).toContain('pick exactly 1 species skill(s)')
    expect(problemsFor({ ...fighter, speciesSkills: ['Athletics'] })).toContain('pick exactly 0 species skill(s)')
  })

  test('only level 1 is supported so far', () => {
    expect(problemsFor({ ...fighter, level: 2 })).toContain('only level 1 is supported so far')
  })

  test('starting equipment must be chosen, and must be one the class offers', () => {
    expect(problemsFor({ ...fighter, equipmentOptionId: undefined })).toEqual(['choose starting equipment'])
    expect(problemsFor({ ...fighter, equipmentOptionId: 'Z' })).toEqual(['unknown starting equipment "Z"'])
    // The Sorcerer offers only A and B
    expect(problemsFor({ ...sorcerer, equipmentOptionId: 'C' })).toEqual(['unknown starting equipment "C"'])
  })
})

describe('worn armor comes from the starting equipment package', () => {
  test('the Fighter options: Chain Mail, Studded Leather, or gold only', () => {
    expect(derive({ ...fighter, equipmentOptionId: 'A' }).armorClass).toBe(16) // Chain Mail
    expect(derive({ ...fighter, equipmentOptionId: 'B' }).armorClass).toBe(12 + 1) // Studded Leather + 1 Dex
    expect(derive({ ...fighter, equipmentOptionId: 'C' }).armorClass).toBe(10 + 1) // 155 GP: no armor
  })

  test('the Paladin options: Chain Mail and a Shield, or gold only', () => {
    expect(derive({ ...paladin, equipmentOptionId: 'A' }).armorClass).toBe(18)
    expect(derive({ ...paladin, equipmentOptionId: 'B' }).armorClass).toBe(10) // 150 GP: no armor, DEX +0
  })

  test('the Sorcerer has no armor in either package', () => {
    expect(derive({ ...sorcerer, equipmentOptionId: 'A' }).armorClass).toBe(12)
    expect(derive({ ...sorcerer, equipmentOptionId: 'B' }).armorClass).toBe(12)
  })
})

describe('proficiency markers and training for the sheet', () => {
  test('Fighter', () => {
    const result = derive(fighter)
    expect(result.proficientSaves).toEqual(['str', 'con'])
    expect(result.proficientSkills).toEqual(['Athletics', 'Intimidation', 'Perception', 'Survival'])
    expect(result.training).toEqual({
      armor: ['Light', 'Medium', 'Heavy', 'Shields'],
      weapons: ['Simple', 'Martial'],
      tool: 'Choose one kind of Gaming Set',
    })
    expect(result.darkvision).toBe(120)
  })

  test('Paladin', () => {
    const result = derive(paladin)
    expect(result.proficientSaves).toEqual(['wis', 'cha'])
    expect(result.proficientSkills).toEqual(['Athletics', 'Insight', 'Persuasion', 'Religion'])
    expect(result.training.tool).toBe("Calligrapher's Supplies")
    expect(result.darkvision).toBeUndefined()
  })

  test('Sorcerer', () => {
    const result = derive(sorcerer)
    expect(result.proficientSaves).toEqual(['con', 'cha'])
    expect(result.proficientSkills).toEqual(['Arcana', 'Perception', 'Persuasion', 'Sleight of Hand', 'Stealth'])
    expect(result.training).toEqual({ armor: [], weapons: ['Simple'], tool: "Thieves' Tools" })
  })
})

describe('a half-chosen background bonus', () => {
  test('is reported as a problem, not calculated', () => {
    const half = deriveCharacter({ ...fighter, backgroundBonus: { plusTwo: 'str' } }, catalog)
    expect(half).toEqual({ ok: false, problems: ['choose how to apply the background bonus'] })
  })
})

describe('rules beyond the three test characters', () => {
  test('a score never goes above 20', () => {
    const strong: Character = { ...fighter, baseScores: { ...fighter.baseScores, str: 19 } }
    expect(derive(strong).finalScores.str).toBe(20) // 19 + 2 would be 21
  })

  test('+1 to all three background abilities', () => {
    const result = derive({ ...fighter, backgroundBonus: { plusOneAll: true } })
    expect(result.finalScores).toEqual({ str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 })
  })

  // The real class packages only include a few armors, so these rules are checked with a catalog whose
  // Sorcerer package is changed to include the armor under test.
  function sorcererWearing(armorId?: string, shield = false): Catalog {
    const option = { id: 'T', description: 'test package', armorId, shield }
    return {
      ...catalog,
      classes: catalog.classes.map((entry) => (entry.id === 'sorcerer' ? { ...entry, startingEquipment: [option] } : entry)),
    }
  }

  function deriveWith(character: Character, testCatalog: Catalog) {
    const result = deriveCharacter({ ...character, equipmentOptionId: 'T' }, testCatalog)
    if (!result.ok) throw new Error(result.problems.join('; '))
    return result.derived
  }

  test('a medium armor adds at most +2 from Dexterity, light armor adds all of it', () => {
    const nimble: Character = { ...sorcerer, baseScores: { ...sorcerer.baseScores, dex: 18 } } // final DEX 20, +5
    expect(deriveWith(nimble, sorcererWearing('studded-leather')).armorClass).toBe(12 + 5)
    expect(deriveWith(nimble, sorcererWearing('half-plate')).armorClass).toBe(15 + 2)
  })

  test('heavy armor ignores Dexterity', () => {
    expect(deriveWith(sorcerer, sorcererWearing('ring-mail')).armorClass).toBe(14)
  })

  test('armor the class is not trained in still gives AC but warns', () => {
    const result = deriveWith(sorcerer, sorcererWearing('chain-mail'))
    expect(result.armorClass).toBe(16)
    expect(result.warnings.join(' ')).toContain('no training with heavy armor')
  })

  test('a shield adds nothing without training, and warns', () => {
    const result = deriveWith(sorcerer, sorcererWearing(undefined, true))
    expect(result.armorClass).toBe(12)
    expect(result.warnings.join(' ')).toContain('no training with shields')
  })

  test('a shield adds 2 for a class trained with shields', () => {
    expect(derive(paladin).armorClass).toBe(16 + 2)
  })

  test('armor with a Strength requirement slows a weaker wearer by 10 feet', () => {
    const weak: Character = { ...paladin, baseScores: { ...paladin.baseScores, str: 8 } } // final STR 8, Chain Mail needs 13
    const result = derive(weak)
    expect(result.speed).toBe(25) // Goliath 35 - 10
    expect(result.warnings.join(' ')).toContain('Strength 13')
  })

  test('proficiency bonus by level follows the SRD table', () => {
    const table: [number, number][] = [[1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [12, 4], [13, 5], [16, 5], [17, 6], [20, 6]]
    for (const [level, bonus] of table) expect(proficiencyBonus(level)).toBe(bonus)
  })

  test('a skill granted twice counts once', () => {
    // The Sorcerer's Arcana from the class, plus the same skill picked as the Human's free skill
    const doubled = derive({ ...sorcerer, speciesSkills: ['Arcana'] })
    expect(doubled.skills.Arcana).toBe(2)
  })
})
