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
    const { character, removed } = reconcileCharacter({ ...fighter, classId: 'wizard' }, catalog)
    expect(character.classId).toBeUndefined()
    expect(removed[0]).toBe('class "wizard", which the catalog does not offer')
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
