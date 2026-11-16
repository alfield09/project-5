import { describe, expect, test } from 'vitest'
import { catalog } from '../catalog/load'
import type { Character } from './character'
import { featuresNotCalculated, improvementLevels, invocationLimit, maxHitPoints } from './classLevels'
import { deriveCharacter } from './derive'
import { reconcileCharacter } from './reconcile'
import { spellLimits } from './spells'

// Every expected number below is read from the "<Class> Features" tables in SRD 5.2.1 (the rows are quoted in the comments)
// or worked out by hand from the SRD's rules. None of them is produced by the code under test.

const classOf = (id: string) => catalog.classes.find((entry) => entry.id === id)

function derive(character: Character) {
  const result = deriveCharacter(character, catalog)
  if (!result.ok) throw new Error(`expected numbers, got problems: ${result.problems.join('; ')}`)
  return result.derived
}

function problems(character: Character): string[] {
  const result = deriveCharacter(character, catalog)
  if (result.ok) throw new Error('expected problems, got numbers')
  return result.problems
}

// The approved test characters (test-characters.md), taken to higher levels.
const fighter: Character = {
  edition: '2024', level: 1, speciesId: 'dwarf', backgroundId: 'soldier', classId: 'fighter',
  baseScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  backgroundBonus: { plusTwo: 'str', plusOne: 'con' },
  classSkills: ['Perception', 'Survival'], speciesSkills: [], equipmentOptionId: 'A', // Chain Mail
}
const sorcerer: Character = {
  edition: '2024', level: 1, speciesId: 'human', backgroundId: 'criminal', classId: 'sorcerer',
  baseScores: { str: 9, dex: 13, con: 13, int: 10, wis: 12, cha: 15 },
  backgroundBonus: { plusTwo: 'dex', plusOne: 'con' },
  classSkills: ['Arcana', 'Persuasion'], speciesSkills: ['Perception'], equipmentOptionId: 'A',
}
const warlock: Character = {
  edition: '2024', level: 1, speciesId: 'human', backgroundId: 'criminal', classId: 'warlock',
  baseScores: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
  backgroundBonus: { plusTwo: 'dex', plusOne: 'con' },
  classSkills: ['Arcana', 'Deception'], speciesSkills: ['Perception'], equipmentOptionId: 'B', invocationIds: ['armor-of-shadows'],
}
const plusTwo = (ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') => ({ mode: 'plusTwo' as const, abilities: [ability] })
const ALL_INVOCATIONS = ['armor-of-shadows', 'eldritch-mind', 'pact-of-the-blade', 'pact-of-the-chain', 'pact-of-the-tome']

describe('hit points (SRD: the highest die roll at level 1, then the average, plus Constitution every level)', () => {
  test.each([
    // [hit die, level, Con modifier, bonus per level, expected, working]
    [10, 1, 2, 1, 13, '10 + 2 + 1 (the approved level 1 Dwarf Fighter)'],
    [10, 5, 2, 1, 49, '10 + 2 + 4 levels x (6 + 2) + 5 (Dwarven Toughness)'],
    [6, 5, 2, 0, 32, '6 + 2 + 4 x (4 + 2)'],
    [8, 5, 2, 0, 38, '8 + 2 + 4 x (5 + 2)'],
    [12, 1, 3, 0, 15, '12 + 3'],
    [12, 20, 3, 0, 205, '12 + 3 + 19 x (7 + 3)'],
    [6, 1, -1, 0, 5, '6 - 1'],
    [8, 3, 0, 0, 18, '8 + 2 x 5'],
  ])('d%i at level %i with Con %i and bonus %i is %i (%s)', (die, level, con, bonus, expected) => {
    expect(maxHitPoints(die, level, con, bonus)).toBe(expected)
  })
})

describe('Ability Score Improvement levels (SRD Features tables)', () => {
  test('every class has them at 4, 8, 12 and 16, except the Fighter and the Rogue', () => {
    for (const id of ['barbarian', 'bard', 'cleric', 'druid', 'monk', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard']) {
      expect(improvementLevels(classOf(id), 20), id).toEqual([4, 8, 12, 16])
    }
  })

  test('the Fighter also gets them at 6 and 14, and the Rogue at 10', () => {
    expect(improvementLevels(classOf('fighter'), 20)).toEqual([4, 6, 8, 12, 14, 16])
    expect(improvementLevels(classOf('rogue'), 20)).toEqual([4, 8, 10, 12, 16])
  })

  test('only the ones reached so far count, and Epic Boon at 19 is not one', () => {
    expect(improvementLevels(classOf('fighter'), 3)).toEqual([])
    expect(improvementLevels(classOf('fighter'), 4)).toEqual([4])
    expect(improvementLevels(classOf('fighter'), 7)).toEqual([4, 6])
    expect(improvementLevels(classOf('wizard'), 19)).toEqual([4, 8, 12, 16])
    expect(improvementLevels(undefined, 20)).toEqual([])
  })
})

describe('spell numbers by level (SRD Features tables)', () => {
  test('Wizard: cantrips, prepared spells, highest slot level and spellbook size', () => {
    // 1: 3 cantrips, 4 prepared, slots 2. 3: 3, 6, slots 4 2. 5: 4, 9, slots 4 3 2. 20: 5, 25, slots up to level 9.
    // The spellbook starts at 6 spells and grows by 2 each level after 1.
    expect(spellLimits(classOf('wizard'), undefined, 1)).toEqual({ cantrips: 3, spells: 4, maxSpellLevel: 1, spellbook: 6 })
    expect(spellLimits(classOf('wizard'), undefined, 3)).toEqual({ cantrips: 3, spells: 6, maxSpellLevel: 2, spellbook: 10 })
    expect(spellLimits(classOf('wizard'), undefined, 5)).toEqual({ cantrips: 4, spells: 9, maxSpellLevel: 3, spellbook: 14 })
    expect(spellLimits(classOf('wizard'), undefined, 20)).toEqual({ cantrips: 5, spells: 25, maxSpellLevel: 9, spellbook: 44 })
  })

  test('Sorcerer: row 5 is 5 cantrips, 9 prepared, slots 4 3 2; row 20 is 6, 22, slots up to level 9', () => {
    expect(spellLimits(classOf('sorcerer'), undefined, 5)).toEqual({ cantrips: 5, spells: 9, maxSpellLevel: 3, spellbook: undefined })
    expect(spellLimits(classOf('sorcerer'), undefined, 20)).toEqual({ cantrips: 6, spells: 22, maxSpellLevel: 9, spellbook: undefined })
  })

  test('Warlock: the highest spell level is the Pact Magic slot level', () => {
    // 5: 3 cantrips, 6 prepared, 2 slots of level 3. 9: 3, 10, slot level 5. 11: 4, 11. 20: 4, 15.
    expect(spellLimits(classOf('warlock'), undefined, 5)).toMatchObject({ cantrips: 3, spells: 6, maxSpellLevel: 3 })
    expect(spellLimits(classOf('warlock'), undefined, 9)).toMatchObject({ cantrips: 3, spells: 10, maxSpellLevel: 5 })
    expect(spellLimits(classOf('warlock'), undefined, 11)).toMatchObject({ cantrips: 4, spells: 11, maxSpellLevel: 5 })
    expect(spellLimits(classOf('warlock'), undefined, 20)).toMatchObject({ cantrips: 4, spells: 15, maxSpellLevel: 5 })
  })

  test('Paladin has no cantrips; row 5 is 6 prepared with slots 4 2, row 17 is 14 with slots up to level 5', () => {
    expect(spellLimits(classOf('paladin'), undefined, 5)).toMatchObject({ cantrips: 0, spells: 6, maxSpellLevel: 2 })
    expect(spellLimits(classOf('paladin'), undefined, 17)).toMatchObject({ cantrips: 0, spells: 14, maxSpellLevel: 5 })
  })

  test("a Thaumaturge's extra cantrip is added to the Cleric's row (level 5: 4 cantrips + 1, 9 prepared, slots up to level 3)", () => {
    const thaumaturge = classOf('cleric')?.order?.options.find((option) => option.id === 'thaumaturge')
    expect(spellLimits(classOf('cleric'), thaumaturge, 5)).toMatchObject({ cantrips: 5, spells: 9, maxSpellLevel: 3 })
  })

  test('classes that do not cast have no spell numbers at any level', () => {
    for (const id of ['barbarian', 'fighter', 'monk', 'rogue']) expect(spellLimits(classOf(id), undefined, 20), id).toBeUndefined()
  })
})

describe('Dwarf Fighter at level 5', () => {
  // Level 4: Ability Score Improvement, +2 Strength: STR 17 + 2 = 19 (+4). Proficiency bonus +3 at level 5.
  const level5: Character = { ...fighter, level: 5, abilityImprovements: { '4': plusTwo('str') } }
  const result = derive(level5)

  test('scores, proficiency bonus and saves', () => {
    expect(result.finalScores).toEqual({ str: 19, dex: 13, con: 15, int: 10, wis: 12, cha: 8 })
    expect(result.proficiencyBonus).toBe(3)
    expect(result.savingThrows).toEqual({ str: 7, dex: 1, con: 5, int: 0, wis: 1, cha: -1 }) // STR 4 + 3, CON 2 + 3
  })

  test('skills, armor class and hit points', () => {
    expect(result.skills.Athletics).toBe(7) // proficient (Soldier): 4 + 3
    expect(result.skills.Perception).toBe(4) // proficient: 1 + 3
    expect(result.skills.Stealth).toBe(1) // not proficient
    expect(result.armorClass).toBe(16) // Chain Mail, unchanged by level
    expect(result.maxHitPoints).toBe(49) // 10 + 2 + 4 x (6 + 2) + 5
    expect(result.level).toBe(5)
    expect(result.hitDie).toBe(10)
  })

  test("the class's own numbers and features for level 5 (table row: Extra Attack, Tactical Shift; Second Wind 3; Weapon Mastery 4)", () => {
    expect(result.classColumns).toEqual({ 'Second Wind': '3', 'Weapon Mastery': '4' })
    expect(result.features.map((feature) => `${feature.level}:${feature.name}`)).toEqual([
      '1:Fighting Style', '1:Second Wind', '1:Weapon Mastery', '2:Action Surge', '2:Tactical Mind',
      '3:Fighter Subclass', '4:Ability Score Improvement', '5:Extra Attack', '5:Tactical Shift',
    ])
    expect(result.features.every((feature) => feature.text.length > 20)).toBe(true)
  })

  test('the sheet warns about the Fighting Style, which is not calculated', () => {
    expect(result.warnings).toEqual(['These features can change numbers but are not calculated yet: Fighting Style'])
  })

  test('level 1 is unchanged by all of this', () => {
    expect(derive(fighter).maxHitPoints).toBe(13)
    expect(derive(fighter).proficiencyBonus).toBe(2)
  })
})

describe('Human Sorcerer at level 5', () => {
  // Level 4: +2 Charisma: 15 + 2 = 17 (+3). Table row 5: 5 Sorcery Points, 5 cantrips, 9 prepared, slots 4 3 2.
  const result = derive({ ...sorcerer, level: 5, abilityImprovements: { '4': plusTwo('cha') } })

  test('scores, spell save DC and spell attack', () => {
    expect(result.finalScores).toEqual({ str: 9, dex: 15, con: 14, int: 10, wis: 12, cha: 17 })
    expect(result.proficiencyBonus).toBe(3)
    expect(result.spellcasting).toEqual({ ability: 'cha', saveDc: 14, attackBonus: 6, slots: [4, 3, 2] }) // 8 + 3 + 3; 3 + 3
  })

  test('hit points and saves', () => {
    expect(result.maxHitPoints).toBe(32) // 6 + 2 + 4 x (4 + 2)
    expect(result.savingThrows).toMatchObject({ con: 5, cha: 6 }) // 2 + 3, 3 + 3
  })

  test('skills', () => {
    expect(result.skills).toMatchObject({ Arcana: 3, Persuasion: 6, Perception: 4, Deception: 3 })
  })

  test('the class numbers for level 5 are the Sorcery Points', () => {
    expect(result.classColumns).toEqual({ 'Sorcery Points': '5' })
  })
})

describe('Human Warlock at levels 5 and 7', () => {
  // Level 4: +2 Charisma: 15 + 0 (human has no bonus) ... base 15 + 2 = 17 (+3). Table row 5: 5 invocations, 3 cantrips, 6 prepared, 2 slots of level 3.
  const level5: Character = { ...warlock, level: 5, abilityImprovements: { '4': plusTwo('cha') }, invocationIds: ALL_INVOCATIONS }

  test('Pact Magic slots are shown at their level, and the numbers follow the row', () => {
    const result = derive(level5)
    expect(result.spellcasting).toEqual({ ability: 'cha', saveDc: 14, attackBonus: 6, slots: [0, 0, 2], pact: true }) // 8 + 3 + 3
    expect(result.maxHitPoints).toBe(38) // 8 + 2 + 4 x (5 + 2)
    expect(result.armorClass).toBe(16) // Armor of Shadows: 13 + Dex 3
  })

  test('the table gives five invocations at level 5, so exactly five must be chosen', () => {
    expect(problems({ ...level5, invocationIds: ['armor-of-shadows'] })).toEqual(['choose 5 Eldritch Invocations'])
    expect(problems({ ...level5, invocationIds: [...ALL_INVOCATIONS.slice(0, 4), 'eldritch-mind'] })).toEqual(['the Eldritch Invocations must be different from each other'])
  })

  test('at level 7 the table gives six but the catalog holds five, so five can be chosen and the sheet says so', () => {
    const result = derive({ ...level5, level: 7 })
    expect(result.warnings).toContain('The catalog holds only 5 Eldritch Invocations, fewer than the Warlock gets at level 7')
    expect(result.spellcasting?.slots).toEqual([0, 0, 0, 2]) // row 7: 2 slots of level 4
  })

  test('invocationLimit follows the table (1, 3, 3, 3, 5, 5, 6) but never exceeds what the catalog offers', () => {
    const counts = [1, 2, 3, 4, 5, 6, 7].map((level) => invocationLimit(classOf('warlock'), level, 5).count)
    expect(counts).toEqual([1, 3, 3, 3, 5, 5, 5])
    expect(invocationLimit(classOf('warlock'), 7, 5)).toEqual({ count: 5, short: true })
    expect(invocationLimit(classOf('warlock'), 5, 5)).toEqual({ count: 5, short: false })
    expect(invocationLimit(classOf('warlock'), 5, 2)).toEqual({ count: 2, short: true })
    expect(invocationLimit(classOf('fighter'), 5, 5)).toEqual({ count: 0, short: false })
  })
})

describe('Ability Score Improvement choices', () => {
  const level4: Character = { ...fighter, level: 4 }

  test('every improvement gained so far must be chosen before the sheet shows numbers', () => {
    expect(problems(level4)).toEqual(['choose your level 4 Ability Score Improvement'])
    // The Fighter has improvements at 4 and 6 (and 8), so a level 6 Fighter owes two.
    expect(problems({ ...level4, level: 6, abilityImprovements: { '4': plusTwo('str') } })).toEqual(['choose your level 6 Ability Score Improvement'])
    expect(problems({ ...level4, level: 6 })).toEqual(['choose your level 4 Ability Score Improvement', 'choose your level 6 Ability Score Improvement'])
  })

  test('a half-finished choice does not count', () => {
    expect(problems({ ...level4, abilityImprovements: { '4': { mode: 'plusTwo', abilities: [] } } })).toEqual(['choose your level 4 Ability Score Improvement'])
    expect(problems({ ...level4, abilityImprovements: { '4': { mode: 'plusOneEach', abilities: ['str'] } } })).toEqual(['choose your level 4 Ability Score Improvement'])
  })

  test('+1 to two abilities needs two different abilities', () => {
    expect(problems({ ...level4, abilityImprovements: { '4': { mode: 'plusOneEach', abilities: ['str', 'str'] } } })).toEqual([
      'the two abilities of your level 4 improvement must be different',
    ])
    const result = derive({ ...level4, abilityImprovements: { '4': { mode: 'plusOneEach', abilities: ['dex', 'con'] } } })
    expect(result.finalScores).toMatchObject({ str: 17, dex: 14, con: 16 }) // 13 + 1, 15 + 1
    expect(result.maxHitPoints).toBe(10 + 3 + 3 * (6 + 3) + 4) // Con 16 is +3, and applies to every level, plus 4 for Toughness
  })

  test('an improvement for a level the character has not reached is ignored', () => {
    const result = derive({ ...fighter, level: 3, abilityImprovements: { '4': plusTwo('str') } })
    expect(result.finalScores.str).toBe(17)
  })

  test('no score goes above 20', () => {
    // Fighter at level 6 has improvements at 4 and 6: 17 + 2 + 2 = 21, which stops at 20.
    const result = derive({ ...fighter, level: 6, abilityImprovements: { '4': plusTwo('str'), '6': plusTwo('str') } })
    expect(result.finalScores.str).toBe(20)
  })

  test('the Constitution bonus counts for every level, not only the ones after it', () => {
    // Level 4 Dwarf Fighter, +2 Constitution: 15 + 2 = 17 (+3). HP: 10 + 3 + 3 x (6 + 3) + 4 = 44.
    const result = derive({ ...fighter, level: 4, abilityImprovements: { '4': plusTwo('con') } })
    expect(result.modifiers.con).toBe(3)
    expect(result.maxHitPoints).toBe(44)
  })
})

describe('Dwarf Fighter at level 20', () => {
  // Fighter improvements at 4, 6, 8, 12, 14, 16. Each gives +1 Dexterity and +1 Constitution: DEX 13 + 6 = 19, CON 15 + 6 = 21 -> 20.
  const picks = Object.fromEntries([4, 6, 8, 12, 14, 16].map((at) => [String(at), { mode: 'plusOneEach' as const, abilities: ['dex' as const, 'con' as const] }]))
  const result = derive({ ...fighter, level: 20, abilityImprovements: picks })

  test('proficiency bonus +6, scores capped at 20, and hit points', () => {
    expect(result.proficiencyBonus).toBe(6)
    expect(result.finalScores).toMatchObject({ dex: 19, con: 20 })
    // Con 20 is +5: 10 + 5 + 19 x (6 + 5) + 20 (Toughness) = 244
    expect(result.maxHitPoints).toBe(244)
    expect(result.classColumns).toEqual({ 'Second Wind': '4', 'Weapon Mastery': '6' }) // table row 20: 4 and 6
  })

  test('the features are everything the class has gained', () => {
    const names = result.features.map((feature) => feature.name)
    expect(names).toContain('Three Extra Attacks')
    expect(names).toContain('Epic Boon')
    expect(names.filter((name) => name === 'Ability Score Improvement')).toHaveLength(1) // described once, granted six times
  })
})

describe('features whose effects are not calculated yet are named in a warning', () => {
  test.each([
    ['fighter', 1, ['Fighting Style']],
    ['bard', 1, []],
    ['bard', 2, ['Expertise', 'Jack of All Trades']],
    ['rogue', 1, []], // the Rogue's level 1 Expertise is calculated
    ['rogue', 2, []],
    ['rogue', 6, ['Expertise']],
    ['rogue', 7, ['Expertise', 'Reliable Talent']],
    ['paladin', 6, ['Fighting Style', 'Aura of Protection']],
    ['barbarian', 5, ['Fast Movement']],
    ['monk', 2, ['Unarmored Movement']],
    ['wizard', 2, ['Scholar']],
    ['sorcerer', 5, []],
  ])('%s at level %i: %j', (id, level, expected) => {
    expect(featuresNotCalculated(classOf(id), level)).toEqual(expected)
  })
})

describe('reconcileCharacter with levels', () => {
  const l8: Character = {
    ...fighter,
    level: 8,
    abilityImprovements: { '4': plusTwo('str'), '6': plusTwo('str'), '8': plusTwo('con') },
  }

  test('a consistent leveled character is unchanged', () => {
    const { character, removed } = reconcileCharacter(l8, catalog)
    expect(character).toEqual(l8)
    expect(removed).toEqual([])
  })

  test('lowering the level drops the improvements gained after it, and says so', () => {
    const { character, removed } = reconcileCharacter({ ...l8, level: 5 }, catalog)
    expect(character.abilityImprovements).toEqual({ '4': plusTwo('str') })
    expect(removed).toEqual(['Ability Score Improvements for levels the character no longer has: level 6, level 8'])
  })

  test('lowering the level below 4 drops them all', () => {
    const { character } = reconcileCharacter({ ...l8, level: 3 }, catalog)
    expect(character.abilityImprovements).toEqual({})
  })

  test("changing to a class that does not have the Fighter's level 6 improvement drops that one only", () => {
    const { character, removed } = reconcileCharacter({ ...l8, classId: 'barbarian', equipmentOptionId: 'A' }, catalog)
    expect(Object.keys(character.abilityImprovements ?? {})).toEqual(['4', '8'])
    expect(removed).toEqual(['Ability Score Improvements for levels the character no longer has: level 6'])
  })

  test('removing the class drops every improvement', () => {
    const { character } = reconcileCharacter({ ...l8, classId: undefined }, catalog)
    expect(character.abilityImprovements).toEqual({})
  })

  test('a Sorcerer that loses levels keeps the first picks that still fit and drops the rest', () => {
    // Level 5 holds 5 cantrips and 9 spells (up to level 3). At level 1 the limits are 4 cantrips and 2 level 1 spells.
    const picked = ['acid-splash', 'fire-bolt', 'light', 'mage-hand', 'ray-of-frost', 'burning-hands', 'chromatic-orb', 'magic-missile', 'shield', 'sleep', 'scorching-ray', 'misty-step', 'fireball']
    const l5: Character = { ...sorcerer, level: 5, abilityImprovements: { '4': plusTwo('cha') }, spellIds: picked }
    expect(reconcileCharacter(l5, catalog).removed).toEqual([]) // 5 cantrips and 8 leveled spells fit at level 5

    const { character, removed } = reconcileCharacter({ ...l5, level: 1 }, catalog)
    expect(character.spellIds).toEqual(['acid-splash', 'fire-bolt', 'light', 'mage-hand', 'burning-hands', 'chromatic-orb'])
    expect(removed.join(' ')).toMatch(/Ray of Frost/)
    expect(removed.join(' ')).toMatch(/Fireball/)
    expect(removed.join(' ')).toMatch(/Ability Score Improvements/)
  })

  test('a Wizard that loses levels keeps a spellbook that fits the new size and level', () => {
    const level1Spells = ['magic-missile', 'shield', 'sleep', 'mage-armor', 'detect-magic', 'feather-fall']
    const level2Spells = ['misty-step', 'web', 'invisibility', 'mirror-image']
    const wizard: Character = { ...sorcerer, classId: 'wizard', classSkills: ['Arcana', 'History'], level: 3, spellbookIds: [...level1Spells, ...level2Spells] }
    expect(reconcileCharacter(wizard, catalog).removed).toEqual([]) // 10 spells at level 3: six of level 1, four of level 2

    const { character, removed } = reconcileCharacter({ ...wizard, level: 1 }, catalog)
    expect(character.spellbookIds).toEqual(level1Spells)
    expect(removed).toEqual(['spellbook spells no longer available: Misty Step, Web, Invisibility, Mirror Image'])
  })

  test('a Warlock that loses levels keeps as many invocations as the lower level allows', () => {
    const l5: Character = { ...warlock, level: 5, abilityImprovements: { '4': plusTwo('cha') }, invocationIds: ALL_INVOCATIONS }
    expect(reconcileCharacter(l5, catalog).removed).toEqual([])

    const { character, removed } = reconcileCharacter({ ...l5, level: 1 }, catalog)
    expect(character.invocationIds).toEqual(['armor-of-shadows'])
    expect(removed).toContain('invocations no longer available: Eldritch Mind, Pact of the Blade, Pact of the Chain, Pact of the Tome')
  })
})
