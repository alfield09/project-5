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

  test('has all 339 SRD 5.2.1 spells, by level', () => {
    expect(catalog.spells).toHaveLength(339)
    const byLevel: Record<number, number> = {}
    for (const spell of catalog.spells) byLevel[spell.level] = (byLevel[spell.level] ?? 0) + 1
    expect(byLevel).toEqual({ 0: 27, 1: 57, 2: 57, 3: 42, 4: 34, 5: 38, 6: 31, 7: 20, 8: 17, 9: 16 })
  })

  test('spells carry the details the SRD prints', () => {
    const byId = Object.fromEntries(catalog.spells.map((entry) => [entry.id, entry]))
    expect(byId['fire-bolt']).toMatchObject({ level: 0, school: 'Evocation', classes: ['sorcerer', 'wizard'], castingTime: 'Action', range: '120 feet', components: 'V, S', duration: 'Instantaneous' })
    expect(byId.fireball).toMatchObject({ level: 3, school: 'Evocation', range: '150 feet', components: 'V, S, M (a ball of bat guano and sulfur)' })
    expect(byId.heroism).toMatchObject({ level: 1, classes: ['bard', 'paladin'], duration: 'Concentration, up to 1 minute' })
    expect(byId['detect-magic'].castingTime).toBe('Action or Ritual')
    expect(byId['divine-smite'].classes).toEqual(['paladin'])
  })

  test('spell text was cleaned: paragraphs joined across page breaks, symbols repaired, no page headers', () => {
    const everything = catalog.spells.map((spell) => spell.description + spell.range + spell.components).join('\n')
    expect(everything).not.toContain('System Reference Document')
    expect(everything).not.toContain('\uFFFD')
    expect(catalog.spells.find((spell) => spell.id === 'false-life')?.description).toContain('5 additional Temporary Hit Points')
    expect(catalog.spells.find((spell) => spell.id === 'control-weather')?.description).toContain('1d4 \u00D7 10 minutes')
    expect(catalog.spells.find((spell) => spell.id === 'shield')?.description).toContain('+5 bonus to AC')
  })

  test('every spell id is unique and every spell points to the SRD source', () => {
    expect(new Set(catalog.spells.map((spell) => spell.id)).size).toBe(catalog.spells.length)
    expect(catalog.spells.every((spell) => spell.source === 'srd-5.2.1' && spell.edition === '2024')).toBe(true)
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

  test('starting equipment packages match the SRD class tables', () => {
    const byId = Object.fromEntries(catalog.classes.map((entry) => [entry.id, entry]))
    const summary = (id: string) =>
      byId[id].startingEquipment.map((option) => [option.id, option.armorId ?? null, option.shield ?? false])

    expect(summary('fighter')).toEqual([['A', 'chain-mail', false], ['B', 'studded-leather', false], ['C', null, false]])
    expect(summary('paladin')).toEqual([['A', 'chain-mail', true], ['B', null, false]])
    expect(summary('sorcerer')).toEqual([['A', null, false], ['B', null, false]])
    expect(byId.fighter.startingEquipment[2].description).toBe('155 GP')
    expect(byId.paladin.startingEquipment[1].description).toBe('150 GP')
    expect(byId.sorcerer.startingEquipment[1].description).toBe('50 GP')
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
