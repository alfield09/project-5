import { describe, expect, test } from 'vitest'
import { catalog, catalogMessages } from './load'

// Checks the real SRD 5.2.1 data. The Developer also checks these entries against the PDF.
describe('SRD 5.2.1 catalog', () => {
  test('every entry loads with no problems', () => {
    expect(catalogMessages).toEqual([])
  })

  test('has the 9 species, 4 backgrounds and 3 classes', () => {
    expect(catalog.species.map((entry) => entry.id).sort()).toEqual([
      'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling',
    ])
    expect(catalog.backgrounds.map((entry) => entry.id).sort()).toEqual(['acolyte', 'criminal', 'sage', 'soldier'])
    expect(catalog.classes.map((entry) => entry.id).sort()).toEqual(['fighter', 'paladin', 'sorcerer'])
  })

  test('armor matches the SRD Armor table', () => {
    const byId = Object.fromEntries(catalog.armor.map((entry) => [entry.id, entry]))
    expect(catalog.armor).toHaveLength(13) // 12 armors and the shield
    expect(byId['studded-leather']).toMatchObject({ category: 'light', armorClass: 12, dex: 'full' })
    expect(byId['half-plate']).toMatchObject({ category: 'medium', armorClass: 15, dex: 'max2' })
    expect(byId['chain-mail']).toMatchObject({ category: 'heavy', armorClass: 16, dex: 'none', strength: 13 })
    expect(byId.plate).toMatchObject({ armorClass: 18, strength: 15 })
    expect(byId.shield).toMatchObject({ category: 'shield', armorClass: 2 })
  })

  test('the Dwarf adds 1 HP per level and the Human picks one free skill', () => {
    const byId = Object.fromEntries(catalog.species.map((entry) => [entry.id, entry]))
    expect(byId.dwarf.hitPointBonusPerLevel).toBe(1)
    expect(byId.human.freeSkillChoices).toBe(1)
    expect(catalog.species.filter((entry) => entry.hitPointBonusPerLevel !== undefined)).toHaveLength(1)
    expect(catalog.species.filter((entry) => entry.freeSkillChoices !== undefined)).toHaveLength(1)
  })

  test('every entry points to the SRD 5.2.1 source, which has a license and attribution', () => {
    const entries = [...catalog.species, ...catalog.backgrounds, ...catalog.classes, ...catalog.armor]
    expect(entries.every((entry) => entry.source === 'srd-5.2.1' && entry.edition === '2024')).toBe(true)

    const source = catalog.sources.find((candidate) => candidate.id === 'srd-5.2.1')
    expect(source?.license).toBe('CC-BY-4.0')
    expect(source?.attribution).toContain('System Reference Document 5.2.1')
  })

  test('species speeds and darkvision match the SRD', () => {
    const byId = Object.fromEntries(catalog.species.map((entry) => [entry.id, entry]))
    expect(byId.goliath.speed).toBe(35)
    expect(byId.dwarf.darkvision).toBe(120)
    expect(byId.orc.darkvision).toBe(120)
    expect(byId.human.darkvision).toBeUndefined()
    expect(catalog.species.filter((entry) => entry.id !== 'goliath').every((entry) => entry.speed === 30)).toBe(true)
  })

  test('small and medium species sizes', () => {
    const byId = Object.fromEntries(catalog.species.map((entry) => [entry.id, entry]))
    expect(byId.human.sizes).toEqual(['Medium', 'Small'])
    expect(byId.tiefling.sizes).toEqual(['Medium', 'Small'])
    expect(byId.halfling.sizes).toEqual(['Small'])
    expect(byId.gnome.sizes).toEqual(['Small'])
  })

  test('class basics match the SRD core tables', () => {
    const byId = Object.fromEntries(catalog.classes.map((entry) => [entry.id, entry]))
    expect(byId.fighter).toMatchObject({ hitDie: 10, savingThrows: ['str', 'con'], subclassLevel: 3 })
    expect(byId.paladin).toMatchObject({ hitDie: 10, savingThrows: ['wis', 'cha'] })
    expect(byId.sorcerer).toMatchObject({ hitDie: 6, savingThrows: ['con', 'cha'], armorTraining: [] })
    expect(byId.fighter.spellcasting).toBeUndefined()
  })

  test('level 1 spellcasting matches the SRD class tables', () => {
    const byId = Object.fromEntries(catalog.classes.map((entry) => [entry.id, entry]))
    expect(byId.paladin.spellcasting).toEqual({ ability: 'cha', level1: { cantrips: 0, preparedSpells: 2, slots: [2] } })
    expect(byId.sorcerer.spellcasting).toEqual({ ability: 'cha', level1: { cantrips: 4, preparedSpells: 2, slots: [2] } })
  })

  test('background abilities and skills match the SRD', () => {
    const byId = Object.fromEntries(catalog.backgrounds.map((entry) => [entry.id, entry]))
    expect(byId.acolyte).toMatchObject({ abilityScores: ['int', 'wis', 'cha'], skillProficiencies: ['Insight', 'Religion'] })
    expect(byId.criminal).toMatchObject({ abilityScores: ['dex', 'con', 'int'], skillProficiencies: ['Sleight of Hand', 'Stealth'] })
    expect(byId.sage).toMatchObject({ abilityScores: ['con', 'int', 'wis'], skillProficiencies: ['Arcana', 'History'] })
    expect(byId.soldier).toMatchObject({ abilityScores: ['str', 'dex', 'con'], skillProficiencies: ['Athletics', 'Intimidation'] })
  })
})
