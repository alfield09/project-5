import { describe, expect, test } from 'vitest'
import { catalog } from '../catalog/load'
import { chosenOrder } from './classOptions'
import { countPicks, needsSpellAttack, pickedSpells, savingThrowAbilities, spellLimits, spellOptions, spellbookOptions } from './spells'

const byId = (id: string) => catalog.classes.find((entry) => entry.id === id)
const names = (list: { name: string }[]) => list.map((spell) => spell.name)

describe('spell limits at level 1 (SRD 5.2.1 class tables)', () => {
  test('Sorcerer: 4 cantrips, 2 prepared spells, slots up to level 1', () => {
    expect(spellLimits(byId('sorcerer'))).toEqual({ cantrips: 4, spells: 2, maxSpellLevel: 1 })
  })

  test('Paladin: no cantrips, 2 prepared spells, slots up to level 1', () => {
    expect(spellLimits(byId('paladin'))).toEqual({ cantrips: 0, spells: 2, maxSpellLevel: 1 })
  })

  test('Fighter does not cast, and no class at all gives nothing', () => {
    expect(spellLimits(byId('fighter'))).toBeUndefined()
    expect(spellLimits(undefined)).toBeUndefined()
  })
})

describe('spell options', () => {
  test('the Sorcerer can pick 16 cantrips and 21 level 1 spells, cantrips first', () => {
    const options = spellOptions(byId('sorcerer'), catalog)
    expect(options.filter((spell) => spell.level === 0)).toHaveLength(16)
    expect(options.filter((spell) => spell.level === 1)).toHaveLength(21)
    expect(options).toHaveLength(37) // nothing above level 1
    expect(options[0].level).toBe(0)
    expect(options[options.length - 1].level).toBe(1)
  })

  test('the Sorcerer list includes the spells the SRD recommends, and leaves out other classes', () => {
    const list = names(spellOptions(byId('sorcerer'), catalog))
    for (const recommended of ['Light', 'Prestidigitation', 'Shocking Grasp', 'Sorcerous Burst', 'Burning Hands', 'Detect Magic']) {
      expect(list).toContain(recommended)
    }
    expect(list).not.toContain('Cure Wounds') // a Cleric and Paladin spell
    expect(list).not.toContain('Fireball') // level 3, no slots for it yet
    expect(list).not.toContain('Eldritch Blast') // a Warlock cantrip, not on this list
  })

  test('the Paladin can pick 13 level 1 spells and no cantrips', () => {
    const options = spellOptions(byId('paladin'), catalog)
    expect(options).toHaveLength(13)
    expect(options.every((spell) => spell.level === 1)).toBe(true)
    expect(names(options)).toEqual([
      'Bless', 'Command', 'Cure Wounds', 'Detect Evil and Good', 'Detect Magic', 'Detect Poison and Disease',
      'Divine Favor', 'Divine Smite', 'Heroism', 'Protection from Evil and Good', 'Purify Food and Drink',
      'Searing Smite', 'Shield of Faith',
    ])
  })

  test('a class that does not cast has no options', () => {
    expect(spellOptions(byId('fighter'), catalog)).toEqual([])
    expect(spellOptions(undefined, catalog)).toEqual([])
  })
})

describe('picked spells and counts', () => {
  test('lists the chosen spells cantrips first, and ignores ids the catalog does not have', () => {
    const picked = pickedSpells(['magic-missile', 'nonsense', 'fire-bolt', 'light'], catalog)
    expect(names(picked)).toEqual(['Fire Bolt', 'Light', 'Magic Missile'])
  })

  test('counts cantrips and leveled spells separately', () => {
    expect(countPicks(['fire-bolt', 'light', 'magic-missile'], catalog)).toEqual({ cantrips: 2, spells: 1 })
    expect(countPicks([], catalog)).toEqual({ cantrips: 0, spells: 0 })
  })
})

describe('which spells need a spell attack roll', () => {
  const spell = (id: string) => {
    const found = catalog.spells.find((entry) => entry.id === id)
    if (!found) throw new Error('no such spell: ' + id)
    return found
  }

  test('the Sorcerer cantrips that roll to hit', () => {
    for (const id of ['chill-touch', 'fire-bolt', 'poison-spray', 'ray-of-frost', 'shocking-grasp', 'sorcerous-burst']) {
      expect(needsSpellAttack(spell(id)), id).toBe(true)
    }
  })

  test('the Sorcerer level 1 spells that roll to hit', () => {
    for (const id of ['chromatic-orb', 'ice-knife', 'ray-of-sickness']) expect(needsSpellAttack(spell(id)), id).toBe(true)
  })

  test('spells that use a saving throw, or hit automatically, or have no attack, do not', () => {
    for (const id of ['light', 'mage-hand', 'prestidigitation', 'magic-missile', 'burning-hands', 'sleep', 'shield', 'thunderwave', 'mage-armor']) {
      expect(needsSpellAttack(spell(id)), id).toBe(false)
    }
  })

  test('none of the 13 Paladin level 1 spells needs one', () => {
    for (const option of spellOptions(byId('paladin'), catalog)) expect(needsSpellAttack(option), option.name).toBe(false)
  })

  test('the Sorcerer has 6 cantrips and 3 level 1 spells that roll to hit, out of 37', () => {
    const options = spellOptions(byId('sorcerer'), catalog)
    expect(options.filter((option) => option.level === 0 && needsSpellAttack(option))).toHaveLength(6)
    expect(options.filter((option) => option.level === 1 && needsSpellAttack(option))).toHaveLength(3)
  })

  test('25 of the 339 SRD spells mention a spell attack', () => {
    expect(catalog.spells.filter(needsSpellAttack)).toHaveLength(25)
  })
})

describe('which spells call for a saving throw against the caster save DC', () => {
  const abilities = (id: string) => {
    const found = catalog.spells.find((entry) => entry.id === id)
    if (!found) throw new Error('no such spell: ' + id)
    return savingThrowAbilities(found)
  }

  test('the Sorcerer spells that use a saving throw', () => {
    expect(abilities('acid-splash')).toEqual(['dex'])
    expect(abilities('burning-hands')).toEqual(['dex'])
    expect(abilities('charm-person')).toEqual(['wis'])
    expect(abilities('color-spray')).toEqual(['con'])
    expect(abilities('grease')).toEqual(['dex'])
    expect(abilities('ice-knife')).toEqual(['dex']) // also rolls to hit: both numbers apply
    expect(abilities('sleep')).toEqual(['wis'])
    expect(abilities('thunderwave')).toEqual(['con'])
  })

  test('the Paladin spells that use a saving throw', () => {
    expect(abilities('command')).toEqual(['wis'])
    expect(abilities('searing-smite')).toEqual(['con'])
  })

  test('spells that only roll to hit, or need no roll, have none', () => {
    for (const id of ['fire-bolt', 'chill-touch', 'ray-of-frost', 'magic-missile', 'light', 'mage-hand', 'shield', 'mage-armor', 'heroism', 'divine-smite', 'chromatic-orb']) {
      expect(abilities(id), id).toEqual([])
    }
  })

  test('benefits that mention saving throws, and fixed-DC saves, do not count', () => {
    expect(abilities('bless')).toEqual([]) // "adds 1d4 to ... a saving throw"
    expect(abilities('haste')).toEqual([]) // "Advantage on Dexterity saving throws"
    expect(abilities('contact-other-plane')).toEqual([]) // "make a DC 15 Intelligence saving throw": a fixed DC
    expect(abilities('wish')).toEqual([])
  })

  test('sentences that were split across a page break are still found', () => {
    expect(abilities('cone-of-cold')).toEqual(['con'])
    expect(abilities('sleet-storm')).toEqual(['dex'])
    expect(abilities('harm')).toEqual(['con'])
    expect(abilities('antipathy-sympathy')).toEqual(['wis'])
  })

  test('summoned creatures that use the caster spell save DC', () => {
    expect(abilities('find-steed')).toEqual(['wis'])
    expect(abilities('giant-insect')).toEqual(['con'])
    expect(abilities('summon-dragon')).toEqual(['dex'])
  })

  test('a spell with several saves lists each ability once, in the order the text gives them', () => {
    expect(abilities('prismatic-spray')).toEqual(['dex', 'con', 'wis'])
    expect(abilities('symbol')).toEqual(['con', 'wis'])
  })

  test('133 of the 339 SRD spells call for a save', () => {
    expect(catalog.spells.filter((spell) => savingThrowAbilities(spell).length > 0)).toHaveLength(133)
  })
})

describe('limits for the other casters (SRD 5.2.1 class tables)', () => {
  test('each class at level 1', () => {
    expect(spellLimits(byId('bard'))).toEqual({ cantrips: 2, spells: 4, maxSpellLevel: 1, spellbook: undefined })
    expect(spellLimits(byId('cleric'))).toEqual({ cantrips: 3, spells: 4, maxSpellLevel: 1, spellbook: undefined })
    expect(spellLimits(byId('druid'))).toEqual({ cantrips: 2, spells: 4, maxSpellLevel: 1, spellbook: undefined })
    expect(spellLimits(byId('ranger'))).toEqual({ cantrips: 0, spells: 2, maxSpellLevel: 1, spellbook: undefined })
    expect(spellLimits(byId('warlock'))).toEqual({ cantrips: 2, spells: 2, maxSpellLevel: 1, spellbook: undefined })
    expect(spellLimits(byId('wizard'))).toEqual({ cantrips: 3, spells: 4, maxSpellLevel: 1, spellbook: 6 })
    for (const id of ['barbarian', 'monk', 'rogue']) expect(spellLimits(byId(id)), id).toBeUndefined()
  })

  test('the Thaumaturge and the Magician each add one cantrip; Protector and Warden add none', () => {
    const cleric = byId('cleric')
    const druid = byId('druid')
    expect(spellLimits(cleric, chosenOrder(cleric, 'thaumaturge'))?.cantrips).toBe(4)
    expect(spellLimits(cleric, chosenOrder(cleric, 'protector'))?.cantrips).toBe(3)
    expect(spellLimits(druid, chosenOrder(druid, 'magician'))?.cantrips).toBe(3)
    expect(spellLimits(druid, chosenOrder(druid, 'warden'))?.cantrips).toBe(2)
    expect(spellLimits(cleric)?.cantrips).toBe(3) // no order chosen yet
  })
})

describe('options for the other casters', () => {
  test('the Ranger has no cantrips and picks from its level 1 spells', () => {
    const options = spellOptions(byId('ranger'), catalog)
    expect(options.every((spell) => spell.level === 1)).toBe(true)
    expect(names(options)).toContain('Hunter\'s Mark')
    expect(names(options)).toContain('Cure Wounds')
  })

  test('Warlock cantrips include Eldritch Blast', () => {
    expect(names(spellOptions(byId('warlock'), catalog).filter((spell) => spell.level === 0))).toContain('Eldritch Blast')
  })

  test('each caster lists only its own spells', () => {
    for (const id of ['bard', 'cleric', 'druid', 'ranger', 'warlock', 'wizard']) {
      const options = spellOptions(byId(id), catalog, catalog.spells.map((spell) => spell.id))
      expect(options.length, id).toBeGreaterThan(0)
      expect(options.every((spell) => spell.classes.includes(id)), id).toBe(true)
      expect(options.every((spell) => spell.level <= 1), id).toBe(true)
    }
  })
})

describe('the Wizard spellbook', () => {
  const wizard = byId('wizard')

  test('the spellbook may hold any level 1 Wizard spell, and no cantrips', () => {
    const options = spellbookOptions(wizard, catalog)
    expect(options.length).toBeGreaterThan(10)
    expect(options.every((spell) => spell.level === 1 && spell.classes.includes('wizard'))).toBe(true)
    expect(names(options)).toEqual(expect.arrayContaining(['Detect Magic', 'Feather Fall', 'Mage Armor', 'Magic Missile', 'Sleep', 'Thunderwave']))
  })

  test('only a class with a spellbook has spellbook options', () => {
    expect(spellbookOptions(byId('sorcerer'), catalog)).toEqual([])
    expect(spellbookOptions(byId('cleric'), catalog)).toEqual([])
    expect(spellbookOptions(undefined, catalog)).toEqual([])
  })

  test('prepared spells come from the spellbook, cantrips from the whole list', () => {
    const none = spellOptions(wizard, catalog, [])
    expect(none.every((spell) => spell.level === 0)).toBe(true) // nothing prepared until the book has spells
    expect(none.length).toBeGreaterThan(10)

    const withBook = spellOptions(wizard, catalog, ['magic-missile', 'sleep'])
    expect(names(withBook.filter((spell) => spell.level === 1))).toEqual(['Magic Missile', 'Sleep'])
    expect(withBook.filter((spell) => spell.level === 0)).toHaveLength(none.length)
  })
})
