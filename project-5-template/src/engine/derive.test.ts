import { describe, expect, test } from 'vitest'
import { catalog } from '../catalog/load'
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
  armorId: 'chain-mail',
  shield: false,
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
  armorId: 'chain-mail',
  shield: true,
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
  shield: false,
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
    const empty: Character = { edition: '2024', level: 1, baseScores: {}, classSkills: [], speciesSkills: [], shield: false }
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

  test('unknown armor, and a shield passed as armor, are reported', () => {
    expect(problemsFor({ ...fighter, armorId: 'mithral' })).toEqual(['unknown armor "mithral"'])
    expect(problemsFor({ ...fighter, armorId: 'shield' })).toEqual(['unknown armor "shield"'])
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

  test('a medium armor adds at most +2 from Dexterity, light armor adds all of it', () => {
    const nimble: Character = { ...sorcerer, baseScores: { ...sorcerer.baseScores, dex: 18 } } // final DEX 20, +5
    expect(derive({ ...nimble, armorId: 'studded-leather' }).armorClass).toBe(12 + 5)
    expect(derive({ ...nimble, armorId: 'half-plate' }).armorClass).toBe(15 + 2)
  })

  test('armor the class is not trained in still gives AC but warns', () => {
    const result = derive({ ...sorcerer, armorId: 'chain-mail' })
    expect(result.armorClass).toBe(16)
    expect(result.warnings.join(' ')).toContain('no training with heavy armor')
  })

  test('a shield adds nothing without training, and warns', () => {
    const result = derive({ ...sorcerer, shield: true })
    expect(result.armorClass).toBe(12)
    expect(result.warnings.join(' ')).toContain('no training with shields')
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
