import { describe, expect, test } from 'vitest'
import { catalog } from '../catalog/load'
import type { Character } from './character'
import { reconcileCharacter } from './reconcile'

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
  equipmentOptionId: 'A',
}

describe('reconcileCharacter', () => {
  test('a consistent character is unchanged and nothing is removed', () => {
    const { character, removed } = reconcileCharacter(fighter, catalog)
    expect(character).toEqual(fighter)
    expect(removed).toEqual([])
  })

  test('changing class clears class skills the new class does not offer, and says so', () => {
    // Sorcerer offers Arcana, Deception, Insight, Intimidation, Persuasion, Religion
    const { character, removed } = reconcileCharacter({ ...fighter, classId: 'sorcerer' }, catalog)
    expect(character.classSkills).toEqual([])
    expect(removed).toEqual(['class skills no longer available: Perception, Survival'])
  })

  test('skills both classes offer are kept', () => {
    const picked = { ...fighter, classSkills: ['Insight', 'Intimidation'] }
    const { character, removed } = reconcileCharacter({ ...picked, classId: 'sorcerer' }, catalog)
    expect(character.classSkills).toEqual(['Insight', 'Intimidation'])
    expect(removed).toEqual([])
  })

  test('removing the class clears every class skill', () => {
    const { character } = reconcileCharacter({ ...fighter, classId: undefined }, catalog)
    expect(character.classSkills).toEqual([])
  })

  test('changing to a species with no free skill clears the species skill', () => {
    const human = { ...fighter, speciesId: 'human', speciesSkills: ['Perception'] }
    expect(reconcileCharacter(human, catalog).removed).toEqual([])

    const { character, removed } = reconcileCharacter({ ...human, speciesId: 'dwarf' }, catalog)
    expect(character.speciesSkills).toEqual([])
    expect(removed).toEqual(['species skills no longer available: Perception'])
  })

  test('changing background clears bonus choices it does not offer but keeps ones it does', () => {
    // Soldier offers STR, DEX, CON. Acolyte offers INT, WIS, CHA, so both choices go.
    const toAcolyte = reconcileCharacter({ ...fighter, backgroundId: 'acolyte' }, catalog)
    expect(toAcolyte.character.backgroundBonus).toEqual({ plusTwo: undefined, plusOne: undefined })
    expect(toAcolyte.removed).toHaveLength(1)

    // Criminal offers DEX, CON, INT, so only the CON choice survives.
    const toCriminal = reconcileCharacter({ ...fighter, backgroundId: 'criminal' }, catalog)
    expect(toCriminal.character.backgroundBonus).toEqual({ plusTwo: undefined, plusOne: 'con' })
  })

  test('the +1 to all three choice survives a background change', () => {
    const all = { ...fighter, backgroundBonus: { plusOneAll: true as const }, backgroundId: 'acolyte' }
    const { character, removed } = reconcileCharacter(all, catalog)
    expect(character.backgroundBonus).toEqual({ plusOneAll: true })
    expect(removed).toEqual([])
  })

  test('an equipment package the new class also offers is kept', () => {
    // Fighter and Sorcerer both have a package A
    const { character, removed } = reconcileCharacter({ ...fighter, classSkills: [], classId: 'sorcerer' }, catalog)
    expect(character.equipmentOptionId).toBe('A')
    expect(removed).toEqual([])
  })

  test('an equipment package the new class does not offer is cleared, and says so', () => {
    // Fighter option C (155 GP) does not exist for the Sorcerer, who has only A and B
    const { character, removed } = reconcileCharacter(
      { ...fighter, classSkills: [], classId: 'sorcerer', equipmentOptionId: 'C' },
      catalog,
    )
    expect(character.equipmentOptionId).toBeUndefined()
    expect(removed).toEqual(['starting equipment option C, which the new class does not offer'])
  })

  test('removing the class clears the equipment package', () => {
    const { character } = reconcileCharacter({ ...fighter, classId: undefined }, catalog)
    expect(character.equipmentOptionId).toBeUndefined()
  })

  test('an id the catalog does not have is cleared, with what depended on it', () => {
    const { character, removed } = reconcileCharacter({ ...fighter, classId: 'artificer' }, catalog)
    expect(character.classId).toBeUndefined()
    expect(removed[0]).toBe('class "artificer", which the catalog does not offer')
    expect(character.classSkills).toEqual([]) // skills and equipment belonged to the class
    expect(character.equipmentOptionId).toBeUndefined()

    expect(reconcileCharacter({ ...fighter, speciesId: 'elfling' }, catalog).character.speciesId).toBeUndefined()
    expect(reconcileCharacter({ ...fighter, backgroundId: 'pirate' }, catalog).character.backgroundId).toBeUndefined()
  })

  describe('spells', () => {
    const sorcerer = { ...fighter, classId: 'sorcerer', classSkills: [], equipmentOptionId: 'A' }

    test('consistent spell picks are kept', () => {
      const picks = ['fire-bolt', 'light', 'burning-hands', 'detect-magic']
      const { character, removed } = reconcileCharacter({ ...sorcerer, spellIds: picks }, catalog)
      expect(character.spellIds).toEqual(picks)
      expect(removed).toEqual([])
    })

    test('changing class clears spells that are not on the new class list, and says so', () => {
      // The Paladin has Heroism but not Fire Bolt or Burning Hands
      const { character, removed } = reconcileCharacter(
        { ...sorcerer, classId: 'paladin', spellIds: ['fire-bolt', 'burning-hands', 'heroism'] },
        catalog,
      )
      expect(character.spellIds).toEqual(['heroism'])
      expect(removed).toEqual(['spells no longer available: Fire Bolt, Burning Hands'])
    })

    test('a class that does not cast keeps no spells', () => {
      const { character, removed } = reconcileCharacter({ ...fighter, spellIds: ['fire-bolt', 'magic-missile'] }, catalog)
      expect(character.spellIds).toEqual([])
      expect(removed).toEqual(['spells no longer available: Fire Bolt, Magic Missile'])
    })

    test('spells above level 1 are not available yet', () => {
      const { character } = reconcileCharacter({ ...sorcerer, spellIds: ['fireball', 'magic-missile'] }, catalog)
      expect(character.spellIds).toEqual(['magic-missile'])
    })

    test('picks beyond the limit of each kind are dropped, keeping the first', () => {
      // Sorcerer: 4 cantrips and 2 level 1 spells
      const picks = ['fire-bolt', 'light', 'mage-hand', 'message', 'ray-of-frost', 'magic-missile', 'shield', 'sleep']
      const { character, removed } = reconcileCharacter({ ...sorcerer, spellIds: picks }, catalog)
      expect(character.spellIds).toEqual(['fire-bolt', 'light', 'mage-hand', 'message', 'magic-missile', 'shield'])
      expect(removed).toEqual(['spells no longer available: Ray of Frost, Sleep'])
    })

    test('unknown spell ids are cleared by id', () => {
      const { character, removed } = reconcileCharacter({ ...sorcerer, spellIds: ['made-up-spell', 'light'] }, catalog)
      expect(character.spellIds).toEqual(['light'])
      expect(removed).toEqual(['spells no longer available: made-up-spell'])
    })

    test('no spell list at all stays as it was', () => {
      expect(reconcileCharacter(sorcerer, catalog).character.spellIds).toBeUndefined()
    })
  })

  test('does not change the input character', () => {
    const before = JSON.stringify(fighter)
    reconcileCharacter({ ...fighter, classId: 'sorcerer' }, catalog)
    expect(JSON.stringify(fighter)).toBe(before)
  })
})

describe('reconcileCharacter: the choices of the new classes', () => {
  const base = { ...fighter, classSkills: [], equipmentOptionId: 'A' }
  const cleric = { ...base, classId: 'cleric', classSkills: ['Insight', 'Medicine'], orderId: 'thaumaturge' }

  test('an order is kept for its class and cleared when the class changes', () => {
    expect(reconcileCharacter(cleric, catalog)).toMatchObject({ character: { orderId: 'thaumaturge' }, removed: [] })

    // A Druid has Magician and Warden, not Thaumaturge
    const toDruid = reconcileCharacter({ ...cleric, classId: 'druid', classSkills: [] }, catalog)
    expect(toDruid.character.orderId).toBeUndefined()
    expect(toDruid.removed).toEqual(['the order choice "thaumaturge", which the class does not offer'])

    expect(reconcileCharacter({ ...cleric, classId: 'fighter', classSkills: [] }, catalog).character.orderId).toBeUndefined()
  })

  test('changing class clears the extra cantrip a Thaumaturge had room for', () => {
    // Cleric: 3 cantrips + 1 from Thaumaturge = 4. Drop the order and the fourth cantrip no longer fits.
    const picks = ['guidance', 'light', 'mending', 'sacred-flame']
    const withOrder = reconcileCharacter({ ...cleric, spellIds: picks }, catalog)
    expect(withOrder.character.spellIds).toEqual(picks)

    const withoutOrder = reconcileCharacter({ ...cleric, orderId: 'protector', spellIds: picks }, catalog)
    expect(withoutOrder.character.spellIds).toEqual(['guidance', 'light', 'mending'])
    expect(withoutOrder.removed).toEqual(['spells no longer available: Sacred Flame'])
  })

  test('Expertise is kept only for skills the character is still proficient in', () => {
    const rogue = { ...base, classId: 'rogue', backgroundId: 'soldier', classSkills: ['Stealth', 'Perception', 'Deception', 'Insight'], expertiseSkills: ['Stealth', 'Perception'] }
    expect(reconcileCharacter(rogue, catalog).removed).toEqual([])

    // Change the background: the Soldier's Athletics is gone, but Stealth and Perception come from the class, so Expertise stays
    expect(reconcileCharacter({ ...rogue, backgroundId: 'sage' }, catalog).character.expertiseSkills).toEqual(['Stealth', 'Perception'])

    // Un-pick a class skill that had Expertise
    const unpicked = reconcileCharacter({ ...rogue, classSkills: ['Perception', 'Deception', 'Insight', 'Investigation'] }, catalog)
    expect(unpicked.character.expertiseSkills).toEqual(['Perception'])
    expect(unpicked.removed).toEqual(['Expertise skills no longer available: Stealth'])
  })

  test('Expertise is cleared when the class has none, and trimmed to its limit', () => {
    expect(reconcileCharacter({ ...base, classSkills: ['Athletics', 'Perception'], expertiseSkills: ['Athletics'] }, catalog).character.expertiseSkills).toEqual([])
    const rogue = { ...base, classId: 'rogue', classSkills: ['Stealth', 'Perception', 'Deception', 'Insight'], expertiseSkills: ['Stealth', 'Perception', 'Deception'] }
    expect(reconcileCharacter(rogue, catalog).character.expertiseSkills).toEqual(['Stealth', 'Perception'])
  })

  test('tool picks follow the class: kinds, count, and clearing', () => {
    const bard = { ...base, classId: 'bard', classSkills: ['Acrobatics', 'Persuasion', 'Performance'], toolIds: ['lute', 'flute', 'drum'] }
    expect(reconcileCharacter(bard, catalog)).toMatchObject({ character: { toolIds: ['lute', 'flute', 'drum'] }, removed: [] })

    // an artisan tool is not an instrument; the fourth instrument is over the limit
    const messy = reconcileCharacter({ ...bard, toolIds: ['lute', 'smiths-tools', 'flute', 'drum', 'lyre'] }, catalog)
    expect(messy.character.toolIds).toEqual(['lute', 'flute', 'drum'])
    expect(messy.removed).toEqual(["tool proficiencies no longer available: Smith's Tools, Lyre"])

    // a Fighter has no tool choice at all
    expect(reconcileCharacter({ ...bard, classId: 'fighter', classSkills: [] }, catalog).character.toolIds).toEqual([])
  })

  test('the Monk can swap to an artisan tool, but only one', () => {
    const monk = { ...base, classId: 'monk', classSkills: ['Acrobatics', 'Insight'] }
    expect(reconcileCharacter({ ...monk, toolIds: ['smiths-tools'] }, catalog).character.toolIds).toEqual(['smiths-tools'])
    expect(reconcileCharacter({ ...monk, toolIds: ['smiths-tools', 'flute'] }, catalog).character.toolIds).toEqual(['smiths-tools'])
  })

  test('an invocation belongs to the Warlock', () => {
    const warlock = { ...base, classId: 'warlock', classSkills: ['Arcana', 'Deception'], invocationIds: ['armor-of-shadows'] }
    expect(reconcileCharacter(warlock, catalog).removed).toEqual([])
    const toFighter = reconcileCharacter({ ...warlock, classId: 'fighter', classSkills: [] }, catalog)
    expect(toFighter.character.invocationIds).toEqual([])
    expect(toFighter.removed).toEqual(['invocations no longer available: Armor of Shadows'])
    expect(reconcileCharacter({ ...warlock, invocationIds: ['agonizing-blast'] }, catalog).character.invocationIds).toEqual([])
    expect(reconcileCharacter({ ...warlock, invocationIds: ['armor-of-shadows', 'eldritch-mind'] }, catalog).character.invocationIds).toEqual(['armor-of-shadows'])
  })

  describe('the Wizard spellbook', () => {
    const book = ['detect-magic', 'feather-fall', 'mage-armor', 'magic-missile', 'sleep', 'thunderwave']
    const wizard = { ...base, classId: 'wizard', classSkills: ['Arcana', 'History'], spellbookIds: book, spellIds: ['light', 'mage-hand', 'ray-of-frost', 'magic-missile', 'sleep', 'shield'] }

    test('a consistent spellbook and prepared list are kept, with a spell not in the book dropped', () => {
      const result = reconcileCharacter(wizard, catalog)
      expect(result.character.spellbookIds).toEqual(book)
      // 'shield' is a Wizard spell but not in this spellbook, so it cannot be prepared
      expect(result.character.spellIds).toEqual(['light', 'mage-hand', 'ray-of-frost', 'magic-missile', 'sleep'])
      expect(result.removed).toEqual(['spells no longer available: Shield'])
    })

    test('removing a spell from the book removes it from the prepared list too', () => {
      const result = reconcileCharacter({ ...wizard, spellIds: ['magic-missile', 'sleep'], spellbookIds: book.filter((id) => id !== 'sleep') }, catalog)
      expect(result.character.spellIds).toEqual(['magic-missile'])
      expect(result.removed).toEqual(['spells no longer available: Sleep'])
    })

    test('the book holds six, from the Wizard list, and no cantrips', () => {
      const result = reconcileCharacter({ ...wizard, spellIds: [], spellbookIds: [...book, 'burning-hands', 'light', 'cure-wounds'] }, catalog)
      expect(result.character.spellbookIds).toEqual(book)
      expect(result.removed).toEqual(['spellbook spells no longer available: Burning Hands, Light, Cure Wounds'])
    })

    test('changing class empties the spellbook', () => {
      const result = reconcileCharacter({ ...wizard, classId: 'sorcerer', classSkills: [] }, catalog)
      expect(result.character.spellbookIds).toEqual([])
      expect(result.removed[0]).toMatch(/^spellbook spells no longer available:/)
    })

    test('a class with no spellbook prepares from its whole list', () => {
      const sorcerer = reconcileCharacter({ ...base, classId: 'sorcerer', spellIds: ['burning-hands', 'sleep'] }, catalog)
      expect(sorcerer.character.spellIds).toEqual(['burning-hands', 'sleep'])
    })
  })
})
