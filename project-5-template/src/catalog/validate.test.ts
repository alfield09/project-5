import { describe, expect, test } from 'vitest'
import { validateCatalog } from './validate'

const source = {
  id: 'test-source',
  name: 'Test Source',
  license: 'CC-BY-4.0',
  url: 'https://example.com',
  attribution: 'Credit text',
}

const goodBackground = {
  id: 'good',
  name: 'Good',
  edition: '2024',
  source: 'test-source',
  abilityScores: ['str', 'dex', 'con'],
  feat: 'Alert',
  skillProficiencies: ['Athletics', 'Stealth'],
  toolProficiency: 'Thieves Tools',
  equipment: 'A thing',
}

const goodSpecies = {
  id: 'goodfolk',
  name: 'Goodfolk',
  edition: '2024',
  source: 'test-source',
  creatureType: 'Humanoid',
  sizes: ['Medium'],
  speed: 30,
  traits: [{ name: 'Trait', text: 'Does something.' }],
}

const goodClass = {
  id: 'goodclass',
  name: 'Goodclass',
  edition: '2024',
  source: 'test-source',
  primaryAbility: 'Strength',
  hitDie: 8,
  savingThrows: ['str', 'con'],
  skillChoices: { count: 2, options: ['Athletics', 'History'] },
  weaponProficiencies: ['Simple'],
  armorTraining: [],
  startingEquipment: [{ id: 'A', description: 'Stuff' }],
  subclassLevel: 3,
}

const goodArmor = {
  id: 'goodarmor',
  name: 'Good Armor',
  edition: '2024',
  source: 'test-source',
  category: 'heavy',
  armorClass: 16,
  dex: 'none',
  strength: 13,
}

function load(overrides: Partial<Record<'sources' | 'species' | 'backgrounds' | 'classes' | 'armor', unknown>> = {}) {
  return validateCatalog({
    sources: [source],
    species: [goodSpecies],
    backgrounds: [goodBackground],
    classes: [goodClass],
    armor: [goodArmor],
    ...overrides,
  })
}

describe('validateCatalog', () => {
  test('loads good entries with no messages', () => {
    const { catalog, messages } = load()
    expect(messages).toEqual([])
    expect(catalog.species).toHaveLength(1)
    expect(catalog.backgrounds).toHaveLength(1)
    expect(catalog.classes).toHaveLength(1)
  })

  test('rejects an entry with no source and still loads the others', () => {
    const noSource = { ...goodBackground, id: 'nosource', source: undefined }
    const { catalog, messages } = load({ backgrounds: [noSource, goodBackground] })
    expect(catalog.backgrounds.map((entry) => entry.id)).toEqual(['good'])
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('nosource')
    expect(messages[0]).toContain('source')
  })

  test('rejects an entry whose source is not a known source', () => {
    const { catalog, messages } = load({ backgrounds: [{ ...goodBackground, source: 'mystery' }] })
    expect(catalog.backgrounds).toHaveLength(0)
    expect(messages[0]).toContain('mystery')
  })

  test('rejects an entry whose source has no license', () => {
    const unlicensed = { ...source, id: 'unlicensed', license: '' }
    const { catalog, messages } = load({
      sources: [source, unlicensed],
      backgrounds: [{ ...goodBackground, source: 'unlicensed' }],
    })
    expect(catalog.backgrounds).toHaveLength(0)
    expect(messages.join(' ')).toContain('license')
  })

  test('rejects a source that is missing its attribution', () => {
    const { catalog, messages } = load({ sources: [{ ...source, attribution: '' }] })
    expect(catalog.sources).toHaveLength(0)
    expect(catalog.backgrounds).toHaveLength(0) // its entries lose their source too
    expect(messages.join(' ')).toContain('attribution')
  })

  test('rejects an unknown skill name', () => {
    const bad = { ...goodBackground, skillProficiencies: ['Athletics', 'Basketweaving'] }
    expect(load({ backgrounds: [bad] }).catalog.backgrounds).toHaveLength(0)
  })

  test('rejects the wrong number of background abilities', () => {
    const bad = { ...goodBackground, abilityScores: ['str', 'dex'] }
    expect(load({ backgrounds: [bad] }).catalog.backgrounds).toHaveLength(0)
  })

  test('rejects an unknown ability name', () => {
    const bad = { ...goodBackground, abilityScores: ['str', 'dex', 'luck'] }
    expect(load({ backgrounds: [bad] }).catalog.backgrounds).toHaveLength(0)
  })

  test('rejects a duplicate id and keeps the first', () => {
    const { catalog, messages } = load({ backgrounds: [goodBackground, goodBackground] })
    expect(catalog.backgrounds).toHaveLength(1)
    expect(messages[0]).toContain('earlier entry')
  })

  test('rejects an edition that is not 2014 or 2024', () => {
    const bad = { ...goodBackground, edition: '3.5' }
    expect(load({ backgrounds: [bad] }).catalog.backgrounds).toHaveLength(0)
  })

  test('rejects a species with a bad speed or no traits', () => {
    expect(load({ species: [{ ...goodSpecies, speed: -5 }] }).catalog.species).toHaveLength(0)
    expect(load({ species: [{ ...goodSpecies, traits: [] }] }).catalog.species).toHaveLength(0)
  })

  test('rejects a class with an invalid spellcasting block', () => {
    const bad = { ...goodClass, spellcasting: { ability: 'cha', level1: { cantrips: 'four', preparedSpells: 2, slots: [2] } } }
    expect(load({ classes: [bad] }).catalog.classes).toHaveLength(0)
  })

  test('accepts a class with a valid spellcasting block', () => {
    const caster = { ...goodClass, spellcasting: { ability: 'cha', level1: { cantrips: 4, preparedSpells: 2, slots: [2] } } }
    expect(load({ classes: [caster] }).catalog.classes).toHaveLength(1)
  })

  test('reports a data file that is not a list', () => {
    const { catalog, messages } = load({ species: { not: 'a list' } })
    expect(catalog.species).toHaveLength(0)
    expect(messages[0]).toContain('not a list')
  })

  test('skips an entry that is not an object', () => {
    const { catalog, messages } = load({ backgrounds: ['oops', goodBackground] })
    expect(catalog.backgrounds).toHaveLength(1)
    expect(messages[0]).toContain('not an object')
  })

  test('accepts armor with a Strength requirement, and a species with the optional effects', () => {
    const { catalog, messages } = load({
      species: [{ ...goodSpecies, hitPointBonusPerLevel: 1, freeSkillChoices: 1 }],
    })
    expect(messages).toEqual([])
    expect(catalog.armor).toHaveLength(1)
    expect(catalog.species[0].hitPointBonusPerLevel).toBe(1)
  })

  test('rejects armor with a bad category, dex rule or armor class', () => {
    expect(load({ armor: [{ ...goodArmor, category: 'cloth' }] }).catalog.armor).toHaveLength(0)
    expect(load({ armor: [{ ...goodArmor, dex: 'sometimes' }] }).catalog.armor).toHaveLength(0)
    expect(load({ armor: [{ ...goodArmor, armorClass: 0 }] }).catalog.armor).toHaveLength(0)
  })

  test('rejects armor with no source, like every other entry', () => {
    const { catalog, messages } = load({ armor: [{ ...goodArmor, source: undefined }] })
    expect(catalog.armor).toHaveLength(0)
    expect(messages[0]).toContain('goodarmor')
  })

  test('rejects a species optional effect that is not a positive number', () => {
    expect(load({ species: [{ ...goodSpecies, hitPointBonusPerLevel: 'lots' }] }).catalog.species).toHaveLength(0)
    expect(load({ species: [{ ...goodSpecies, freeSkillChoices: 0 }] }).catalog.species).toHaveLength(0)
  })

  describe('starting equipment options', () => {
    const withOptions = (startingEquipment: unknown) => load({ classes: [{ ...goodClass, startingEquipment }] })

    test('accepts a package that names real armor and a shield', () => {
      const { catalog, messages } = withOptions([
        { id: 'A', description: 'Armor and shield', armorId: 'goodarmor', shield: true },
        { id: 'B', description: '50 GP' },
      ])
      expect(messages).toEqual([])
      expect(catalog.classes).toHaveLength(1)
    })

    test('rejects a package that names armor not in the catalog, and says which', () => {
      const { catalog, messages } = withOptions([{ id: 'A', description: 'Mystery armor', armorId: 'mithral' }])
      expect(catalog.classes).toHaveLength(0)
      expect(messages[0]).toContain('mithral')
    })

    test('rejects a shield named as the worn armor', () => {
      const shield = { ...goodArmor, id: 'goodshield', category: 'shield', armorClass: 2 }
      const { catalog } = load({
        armor: [goodArmor, shield],
        classes: [{ ...goodClass, startingEquipment: [{ id: 'A', description: 'x', armorId: 'goodshield' }] }],
      })
      expect(catalog.classes).toHaveLength(0)
    })

    test('rejects an empty list, a repeated id, or an option with no description', () => {
      expect(withOptions([]).catalog.classes).toHaveLength(0)
      expect(withOptions([{ id: 'A', description: 'x' }, { id: 'A', description: 'y' }]).catalog.classes).toHaveLength(0)
      expect(withOptions([{ id: 'A', description: '' }]).catalog.classes).toHaveLength(0)
      expect(withOptions('A or B').catalog.classes).toHaveLength(0)
    })

    test('rejects a shield flag that is not true or false', () => {
      expect(withOptions([{ id: 'A', description: 'x', shield: 'yes' }]).catalog.classes).toHaveLength(0)
    })
  })
})
