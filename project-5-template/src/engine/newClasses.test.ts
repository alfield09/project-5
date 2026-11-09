import { describe, expect, test } from 'vitest'
import { catalog } from '../catalog/load'
import type { Catalog, EquipmentOption } from '../catalog/types'
import type { Character } from './character'
import { deriveCharacter } from './derive'
import { SKILLS } from './skills'

// The five characters below are the ones drafted in test-characters.md ("New classes"). The Agent wrote those
// numbers and the Developer has not verified them yet, so these tests are not independent until the Developer has.

function derive(character: Character, testCatalog: Catalog = catalog) {
  const result = deriveCharacter(character, testCatalog)
  if (!result.ok) throw new Error(`expected numbers, got problems: ${result.problems.join('; ')}`)
  return result.derived
}

function problems(character: Character, testCatalog: Catalog = catalog): string[] {
  const result = deriveCharacter(character, testCatalog)
  if (result.ok) throw new Error('expected problems, got numbers')
  return result.problems
}

/** The 18 skill bonuses in the order of the skill list (Acrobatics first), turned into a name-to-bonus object. */
function skillBonuses(values: number[]): Record<string, number> {
  return Object.fromEntries(SKILLS.map((skill, index) => [skill.name, values[index]]))
}

/** The catalog with a class's starting equipment package replaced, to test rules no real package reaches. */
function withPackage(classId: string, option: Omit<EquipmentOption, 'id'>): Catalog {
  return {
    ...catalog,
    classes: catalog.classes.map((entry) => (entry.id === classId ? { ...entry, startingEquipment: [{ id: 'T', ...option }] } : entry)),
  }
}

const barbarian: Character = {
  edition: '2024', level: 1, speciesId: 'orc', backgroundId: 'soldier', classId: 'barbarian',
  baseScores: { str: 15, dex: 12, con: 14, int: 8, wis: 10, cha: 8 },
  backgroundBonus: { plusTwo: 'str', plusOne: 'con' },
  classSkills: ['Animal Handling', 'Survival'], speciesSkills: [], equipmentOptionId: 'A',
}

const monk: Character = {
  edition: '2024', level: 1, speciesId: 'halfling', backgroundId: 'criminal', classId: 'monk',
  baseScores: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 },
  backgroundBonus: { plusTwo: 'dex', plusOne: 'con' },
  classSkills: ['Acrobatics', 'Insight'], speciesSkills: [], toolIds: ['flute'], equipmentOptionId: 'A',
}

const rogue: Character = {
  edition: '2024', level: 1, speciesId: 'human', backgroundId: 'soldier', classId: 'rogue',
  baseScores: { str: 8, dex: 15, con: 14, int: 13, wis: 10, cha: 12 },
  backgroundBonus: { plusTwo: 'dex', plusOne: 'con' },
  classSkills: ['Stealth', 'Sleight of Hand', 'Perception', 'Deception'], speciesSkills: ['Investigation'],
  expertiseSkills: ['Stealth', 'Sleight of Hand'], equipmentOptionId: 'A',
}

const cleric: Character = {
  edition: '2024', level: 1, speciesId: 'goliath', backgroundId: 'acolyte', classId: 'cleric',
  baseScores: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
  backgroundBonus: { plusTwo: 'wis', plusOne: 'cha' },
  classSkills: ['Medicine', 'Persuasion'], speciesSkills: [], orderId: 'thaumaturge', equipmentOptionId: 'A',
}

const druid: Character = {
  edition: '2024', level: 1, speciesId: 'human', backgroundId: 'sage', classId: 'druid',
  baseScores: { str: 10, dex: 13, con: 14, int: 12, wis: 15, cha: 8 },
  backgroundBonus: { plusTwo: 'wis', plusOne: 'con' },
  classSkills: ['Nature', 'Perception'], speciesSkills: ['Survival'], orderId: 'magician', equipmentOptionId: 'A',
}

describe('Barbarian (Orc, Soldier): Unarmored Defense with Constitution', () => {
  const result = derive(barbarian)

  test('scores, saves and skills', () => {
    expect(result.finalScores).toEqual({ str: 17, dex: 12, con: 15, int: 8, wis: 10, cha: 8 })
    expect(result.modifiers).toEqual({ str: 3, dex: 1, con: 2, int: -1, wis: 0, cha: -1 })
    expect(result.savingThrows).toEqual({ str: 5, dex: 1, con: 4, int: -1, wis: 0, cha: -1 })
    expect(result.skills).toEqual(skillBonuses([1, 2, -1, 5, -1, -1, 0, 1, -1, 0, -1, 0, -1, -1, -1, 1, 1, 2]))
  })

  test('armor class, hit points, passives', () => {
    expect(result.armorClass).toBe(13) // 10 + 1 Dex + 2 Con, no armor
    expect(result.maxHitPoints).toBe(14) // d12 = 12, + 2 Con
    expect(result.initiative).toBe(1)
    expect(result.passive).toEqual({ perception: 10, investigation: 9, insight: 10 })
    expect(result.speed).toBe(30)
    expect(result.spellcasting).toBeUndefined()
    expect(result.warnings).toEqual([])
  })
})

describe('Monk (Halfling, Criminal): Unarmored Defense with Wisdom', () => {
  const result = derive(monk)

  test('scores, saves and skills', () => {
    expect(result.finalScores).toEqual({ str: 12, dex: 17, con: 14, int: 10, wis: 14, cha: 8 })
    expect(result.savingThrows).toEqual({ str: 3, dex: 5, con: 2, int: 0, wis: 2, cha: -1 })
    expect(result.skills).toEqual(skillBonuses([5, 2, 0, 1, -1, 0, 4, -1, 0, 2, 0, 2, -1, -1, 0, 5, 5, 2]))
  })

  test('armor class, hit points, passives', () => {
    expect(result.armorClass).toBe(15) // 10 + 3 Dex + 2 Wis
    expect(result.maxHitPoints).toBe(10)
    expect(result.initiative).toBe(3)
    expect(result.passive).toEqual({ perception: 12, investigation: 10, insight: 14 })
    expect(result.speed).toBe(30)
  })

  test('the chosen tool shows in the training', () => {
    expect(result.training.tools).toEqual(['Thieves\' Tools', 'Flute'])
    expect(result.training.weapons).toEqual(['Simple', 'Martial weapons that have the Light property'])
    expect(result.training.armor).toEqual([])
  })
})

describe('Rogue (Human, Soldier): Expertise', () => {
  const result = derive(rogue)

  test('scores and saves', () => {
    expect(result.finalScores).toEqual({ str: 8, dex: 17, con: 15, int: 13, wis: 10, cha: 12 })
    expect(result.savingThrows).toEqual({ str: -1, dex: 5, con: 2, int: 3, wis: 0, cha: 1 })
  })

  test('skills: Expertise doubles the proficiency bonus on Stealth and Sleight of Hand', () => {
    expect(result.skills).toEqual(skillBonuses([3, 0, 1, 1, 3, 1, 0, 3, 3, 0, 1, 2, 1, 1, 1, 7, 7, 0]))
    expect(result.skills.Stealth).toBe(3 + 2 + 2) // Dex + proficiency + proficiency again
    expect(result.expertiseSkills).toEqual(['Sleight of Hand', 'Stealth'])
  })

  test('armor class, hit points, passives', () => {
    expect(result.armorClass).toBe(14) // Leather Armor 11 + 3 Dex
    expect(result.maxHitPoints).toBe(10)
    expect(result.passive).toEqual({ perception: 12, investigation: 13, insight: 10 })
    expect(result.training.tools).toContain("Thieves' Tools")
    expect(result.warnings).toEqual([])
  })
})

describe('Cleric (Goliath, Acolyte): Divine Order, Thaumaturge', () => {
  const result = derive(cleric)

  test('scores, saves and skills, with the Thaumaturge bonus on Arcana and Religion', () => {
    expect(result.finalScores).toEqual({ str: 13, dex: 10, con: 14, int: 8, wis: 17, cha: 13 })
    expect(result.savingThrows).toEqual({ str: 1, dex: 0, con: 2, int: -1, wis: 5, cha: 3 })
    expect(result.skills).toEqual(skillBonuses([0, 3, 2, 1, 1, -1, 5, 1, -1, 5, -1, 3, 1, 3, 4, 0, 0, 3]))
    expect(result.skills.Arcana).toBe(-1 + 3) // Int, plus the bonus equal to the Wisdom modifier
    expect(result.skills.Religion).toBe(-1 + 2 + 3) // Int, proficiency, and the bonus
  })

  test('armor class, spell numbers, passives', () => {
    expect(result.armorClass).toBe(15) // Chain Shirt 13 + 0 Dex, + 2 Shield
    expect(result.maxHitPoints).toBe(10)
    expect(result.speed).toBe(35)
    expect(result.passive).toEqual({ perception: 13, investigation: 9, insight: 15 })
    expect(result.spellcasting).toEqual({ ability: 'wis', saveDc: 13, attackBonus: 5, slots: [2] })
    expect(result.warnings).toEqual([])
  })
})

describe('Druid (Human, Sage): Primal Order, Magician', () => {
  const result = derive(druid)

  test('scores, saves and skills, with the Magician bonus on Arcana and Nature', () => {
    expect(result.finalScores).toEqual({ str: 10, dex: 13, con: 15, int: 12, wis: 17, cha: 8 })
    expect(result.savingThrows).toEqual({ str: 0, dex: 1, con: 2, int: 3, wis: 5, cha: -1 })
    expect(result.skills).toEqual(skillBonuses([1, 3, 6, 0, -1, 3, 3, -1, 1, 3, 6, 5, -1, -1, 1, 1, 1, 5]))
  })

  test('armor class, spell numbers, passives', () => {
    expect(result.armorClass).toBe(14) // Leather Armor 11 + 1 Dex, + 2 Shield
    expect(result.maxHitPoints).toBe(10)
    expect(result.passive).toEqual({ perception: 15, investigation: 11, insight: 13 })
    expect(result.spellcasting).toEqual({ ability: 'wis', saveDc: 13, attackBonus: 5, slots: [2] })
    expect(result.training.tools).toContain('Herbalism Kit')
  })
})

describe('Unarmored Defense rules beyond the real packages', () => {
  test('a Barbarian may carry a Shield and keeps Unarmored Defense, and the Shield adds 2', () => {
    const shielded = withPackage('barbarian', { description: 'a Shield only', shield: true })
    expect(derive({ ...barbarian, equipmentOptionId: 'T' }, shielded).armorClass).toBe(13 + 2)
  })

  test('wearing armor replaces Unarmored Defense', () => {
    const armored = withPackage('barbarian', { description: 'studded leather', armorId: 'studded-leather' })
    expect(derive({ ...barbarian, equipmentOptionId: 'T' }, armored).armorClass).toBe(12 + 1) // the armor, not 10 + Dex + Con
  })

  test('a Monk with a Shield loses Unarmored Defense, and gets no Shield bonus without training', () => {
    const shielded = withPackage('monk', { description: 'a Shield only', shield: true })
    const result = derive({ ...monk, equipmentOptionId: 'T' }, shielded)
    expect(result.armorClass).toBe(10 + 3) // plain 10 + Dex; no Wisdom, no Shield
    expect(result.warnings.join(' ')).toContain('no training with shields')
  })

  test('Unarmored Defense is not used by a class that does not have it', () => {
    const fighterUnarmored = derive({ ...cleric, classId: 'fighter', orderId: undefined, classSkills: ['Insight', 'Perception'], equipmentOptionId: 'C' })
    expect(fighterUnarmored.armorClass).toBe(10 + 0) // just 10 + Dex
  })
})

describe('the Warlock invocation (Armor of Shadows)', () => {
  const warlock: Character = {
    edition: '2024', level: 1, speciesId: 'human', backgroundId: 'criminal', classId: 'warlock',
    baseScores: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
    backgroundBonus: { plusTwo: 'dex', plusOne: 'con' },
    classSkills: ['Arcana', 'Deception'], speciesSkills: ['Perception'], equipmentOptionId: 'B', invocationIds: ['armor-of-shadows'],
  }

  test('Mage Armor at will: with no armor, AC is 13 + Dexterity', () => {
    expect(derive(warlock).armorClass).toBe(13 + 3) // Dex 14 + 2 = 16 (+3); package B has no armor
  })

  test('armor the Warlock wears is used instead when it is the better choice? No: armor replaces the feature', () => {
    // Package A has Leather Armor (11 + Dex). Wearing armor, Mage Armor does not apply.
    expect(derive({ ...warlock, equipmentOptionId: 'A' }).armorClass).toBe(11 + 3)
  })

  test('the other invocations do not change AC', () => {
    expect(derive({ ...warlock, invocationIds: ['eldritch-mind'] }).armorClass).toBe(10 + 3)
    expect(derive({ ...warlock, invocationIds: ['pact-of-the-blade'] }).armorClass).toBe(10 + 3)
  })

  test('an invocation must be chosen before the sheet shows numbers', () => {
    expect(problems({ ...warlock, invocationIds: [] })).toEqual(['choose your Eldritch Invocation'])
    expect(problems({ ...warlock, invocationIds: undefined })).toEqual(['choose your Eldritch Invocation'])
    expect(problems({ ...warlock, invocationIds: ['agonizing-blast'] })).toEqual(['unknown Eldritch Invocation'])
    expect(problems({ ...warlock, invocationIds: ['eldritch-mind', 'pact-of-the-tome'] })).toEqual(['choose your Eldritch Invocation'])
  })

  test('the Warlock casts with one level 1 slot (Pact Magic)', () => {
    expect(derive(warlock).spellcasting).toMatchObject({ ability: 'cha', slots: [1] })
  })
})

describe('the Cleric and Druid orders beyond the test characters', () => {
  test('an order must be chosen, and must be one of the class', () => {
    expect(problems({ ...cleric, orderId: undefined })).toEqual(['choose your Divine Order'])
    expect(problems({ ...druid, orderId: undefined })).toEqual(['choose your Primal Order'])
    expect(problems({ ...cleric, orderId: 'magician' })).toEqual(['unknown Divine Order "magician"'])
  })

  test('Protector adds Martial weapons and Heavy armor training, so Chain Mail is no longer a problem', () => {
    const chainMail = withPackage('cleric', { description: 'chain mail', armorId: 'chain-mail' })
    const protector = derive({ ...cleric, orderId: 'protector', equipmentOptionId: 'T' }, chainMail)
    expect(protector.training.armor).toEqual(['Light', 'Medium', 'Shields', 'Heavy'])
    expect(protector.training.weapons).toEqual(['Simple', 'Martial'])
    expect(protector.warnings).toEqual([])

    const thaumaturge = derive({ ...cleric, orderId: 'thaumaturge', equipmentOptionId: 'T' }, chainMail)
    expect(thaumaturge.warnings.join(' ')).toContain('no training with heavy armor')
    expect(thaumaturge.training.weapons).toEqual(['Simple'])
  })

  test('Protector gives no skill bonus, and Thaumaturge only the two skills', () => {
    const protector = derive({ ...cleric, orderId: 'protector' })
    expect(protector.skills.Arcana).toBe(-1) // Int only
    expect(protector.skills.Religion).toBe(-1 + 2) // Int and proficiency
    const thaumaturge = derive(cleric)
    expect(thaumaturge.skills.History).toBe(-1) // not boosted
  })

  test('Warden adds Martial weapons and Medium armor training', () => {
    const warden = derive({ ...druid, orderId: 'warden' })
    expect(warden.training.armor).toEqual(['Light', 'Shields', 'Medium'])
    expect(warden.training.weapons).toEqual(['Simple', 'Martial'])
    expect(warden.skills.Arcana).toBe(1 + 2) // Int and proficiency, no Magician bonus
  })

  test('the order bonus is at least +1 even when Wisdom is low', () => {
    // Wisdom 8 (-1) and the background bonus goes elsewhere: the bonus is +1, not -1
    const lowWisdom: Character = { ...cleric, baseScores: { ...cleric.baseScores, wis: 8 }, backgroundBonus: { plusTwo: 'cha', plusOne: 'int' } }
    const result = derive(lowWisdom)
    expect(result.modifiers.wis).toBe(-1)
    expect(result.skills.Arcana).toBe(result.modifiers.int + 1)
    expect(result.skills.Religion).toBe(result.modifiers.int + 2 + 1)
  })
})

describe('Expertise rules', () => {
  test('exactly two skills, both proficient, and not repeated', () => {
    expect(problems({ ...rogue, expertiseSkills: ['Stealth'] })).toEqual(['pick exactly 2 skills for Expertise'])
    expect(problems({ ...rogue, expertiseSkills: [] })).toEqual(['pick exactly 2 skills for Expertise'])
    expect(problems({ ...rogue, expertiseSkills: ['Stealth', 'Arcana'] })).toEqual(['Expertise must be in skills you are proficient in'])
    expect(problems({ ...rogue, expertiseSkills: ['Stealth', 'Stealth'] })).toEqual(['Expertise skills must be different from each other'])
  })

  test('a skill granted by the background can take Expertise', () => {
    const result = derive({ ...rogue, expertiseSkills: ['Athletics', 'Stealth'] }) // Athletics is the Soldier's
    expect(result.skills.Athletics).toBe(-1 + 2 + 2)
  })

  test('a class without Expertise ignores any Expertise picks', () => {
    expect(derive({ ...barbarian, expertiseSkills: ['Athletics'] }).skills.Athletics).toBe(3 + 2) // proficiency once
  })
})

describe('tool choices', () => {
  const bard: Character = {
    edition: '2024', level: 1, speciesId: 'dwarf', backgroundId: 'sage', classId: 'bard',
    baseScores: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
    backgroundBonus: { plusTwo: 'con', plusOne: 'wis' },
    classSkills: ['Acrobatics', 'Persuasion', 'Performance'], speciesSkills: [], equipmentOptionId: 'A',
    toolIds: ['lute', 'flute', 'drum'],
  }

  test('the Bard has three instruments in the training, after the background tool', () => {
    expect(derive(bard).training.tools).toEqual(["Calligrapher's Supplies", 'Lute', 'Flute', 'Drum'])
  })

  test('picks beyond three, repeats and the wrong kind are ignored, never a problem', () => {
    const extra = derive({ ...bard, toolIds: ['lute', 'lute', 'flute', 'drum', 'lyre', 'smiths-tools', 'not-a-tool'] })
    expect(extra.training.tools).toEqual(["Calligrapher's Supplies", 'Lute', 'Flute', 'Drum'])
  })

  test('a tool of the wrong kind is ignored even when it comes first and would take a place', () => {
    // The Bard may pick instruments only. An artisan tool listed first must not use up one of the three places.
    const result = derive({ ...bard, toolIds: ['smiths-tools', 'lute', 'flute', 'drum'] })
    expect(result.training.tools).toEqual(["Calligrapher's Supplies", 'Lute', 'Flute', 'Drum'])
  })

  test('the Monk may take an artisan tool or an instrument, one only', () => {
    expect(derive({ ...monk, toolIds: ['smiths-tools'] }).training.tools).toEqual(['Thieves\' Tools', "Smith's Tools"])
    expect(derive({ ...monk, toolIds: ['flute', 'lute'] }).training.tools).toEqual(['Thieves\' Tools', 'Flute'])
  })

  test('a class with no tool choice ignores picks', () => {
    expect(derive({ ...barbarian, toolIds: ['flute'] }).training.tools).toEqual(['Choose one kind of Gaming Set']) // the Soldier's tool only
  })

  test('tool choices never block the sheet', () => {
    expect(derive({ ...bard, toolIds: [] }).training.tools).toEqual(["Calligrapher's Supplies"])
  })
})
