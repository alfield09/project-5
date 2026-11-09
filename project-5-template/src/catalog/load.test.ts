import { describe, expect, test } from 'vitest'
import { catalog, catalogMessages } from './load'

// Checks the real SRD 5.2.1 data. The Developer also checks these entries against the PDF.
describe('SRD 5.2.1 catalog', () => {
  test('every entry loads with no problems', () => {
    expect(catalogMessages).toEqual([])
  })

  test('has the 9 species, 4 backgrounds and all 12 classes', () => {
    expect(catalog.species.map((entry) => entry.id).sort()).toEqual([
      'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling',
    ])
    expect(catalog.backgrounds.map((entry) => entry.id).sort()).toEqual(['acolyte', 'criminal', 'sage', 'soldier'])
    expect(catalog.classes.map((entry) => entry.id).sort()).toEqual([
      'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
    ])
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

  test('sentences split across a page break in the PDF are whole again', () => {
    const text = (id: string) => catalog.spells.find((spell) => spell.id === id)?.description ?? ''
    expect(text('cone-of-cold')).toContain('makes a Constitution saving throw, taking 8d8 Cold damage')
    expect(text('sleet-storm')).toContain('must succeed on a Dexterity saving throw or have the Prone condition')
    expect(text('harm')).toContain('it takes 14d6 Necrotic damage')
    expect(text('antipathy-sympathy')).toContain('makes a Wisdom saving throw when it comes within 120 feet')
    expect(text('find-steed')).toContain('Hit Dice [d10s] equal to the spell')
  })

  test('tables and stat blocks keep their separate lines', () => {
    const lines = (id: string) => (catalog.spells.find((spell) => spell.id === id)?.description ?? '').split('\n')
    expect(lines('creation').some((line) => line.startsWith('Duration 24 hours'))).toBe(true)
    expect(lines('animate-objects').some((line) => line.startsWith('Senses Blindsight'))).toBe(true)
    expect(lines('commune-with-nature').some((line) => line.startsWith('For example, you could'))).toBe(true)
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

  describe('the twelve classes match the SRD core tables', () => {
    const byId = () => Object.fromEntries(catalog.classes.map((entry) => [entry.id, entry]))

    test('hit die, saving throws, skill choices and training', () => {
      // id: [hit die, saves, number of skills to pick, armor training, weapon proficiencies]
      const expected: Record<string, [number, string[], number, string[], string[]]> = {
        barbarian: [12, ['str', 'con'], 2, ['Light', 'Medium', 'Shields'], ['Simple', 'Martial']],
        bard: [8, ['dex', 'cha'], 3, ['Light'], ['Simple']],
        cleric: [8, ['wis', 'cha'], 2, ['Light', 'Medium', 'Shields'], ['Simple']],
        druid: [8, ['int', 'wis'], 2, ['Light', 'Shields'], ['Simple']],
        fighter: [10, ['str', 'con'], 2, ['Light', 'Medium', 'Heavy', 'Shields'], ['Simple', 'Martial']],
        monk: [8, ['str', 'dex'], 2, [], ['Simple', 'Martial weapons that have the Light property']],
        paladin: [10, ['wis', 'cha'], 2, ['Light', 'Medium', 'Heavy', 'Shields'], ['Simple', 'Martial']],
        ranger: [10, ['str', 'dex'], 3, ['Light', 'Medium', 'Shields'], ['Simple', 'Martial']],
        rogue: [8, ['dex', 'int'], 4, ['Light'], ['Simple', 'Martial weapons that have the Finesse or Light property']],
        sorcerer: [6, ['con', 'cha'], 2, [], ['Simple']],
        warlock: [8, ['wis', 'cha'], 2, ['Light'], ['Simple']],
        wizard: [6, ['int', 'wis'], 2, [], ['Simple']],
      }
      const classes = byId()
      for (const [id, [hitDie, saves, skillCount, armor, weapons]] of Object.entries(expected)) {
        expect(classes[id], id).toMatchObject({ hitDie, savingThrows: saves, armorTraining: armor, weaponProficiencies: weapons })
        expect(classes[id].skillChoices.count, id).toBe(skillCount)
        expect(classes[id].subclassLevel, id).toBe(3)
      }
    })

    test('skill lists', () => {
      const classes = byId()
      expect(classes.barbarian.skillChoices.options).toEqual(['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'])
      expect(classes.cleric.skillChoices.options).toEqual(['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'])
      expect(classes.monk.skillChoices.options).toEqual(['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'])
      expect(classes.rogue.skillChoices.options).toHaveLength(10)
      expect(classes.bard.skillChoices.options).toHaveLength(18) // "Choose any 3 skills"
    })

    test('the starting equipment packages, and which of them include armor or a shield', () => {
      const classes = byId()
      const packages = (id: string) => classes[id].startingEquipment.map((option) => [option.id, option.armorId ?? null, option.shield ?? false])
      expect(packages('barbarian')).toEqual([['A', null, false], ['B', null, false]]) // Greataxe and Handaxes, no armor
      expect(packages('bard')).toEqual([['A', 'leather', false], ['B', null, false]])
      expect(packages('cleric')).toEqual([['A', 'chain-shirt', true], ['B', null, false]])
      expect(packages('druid')).toEqual([['A', 'leather', true], ['B', null, false]])
      expect(packages('monk')).toEqual([['A', null, false], ['B', null, false]])
      expect(packages('ranger')).toEqual([['A', 'studded-leather', false], ['B', null, false]])
      expect(packages('rogue')).toEqual([['A', 'leather', false], ['B', null, false]])
      expect(packages('warlock')).toEqual([['A', 'leather', false], ['B', null, false]])
      expect(packages('wizard')).toEqual([['A', null, false], ['B', null, false]])
      expect(classes.barbarian.startingEquipment[1].description).toBe('75 GP')
      expect(classes.cleric.startingEquipment[1].description).toBe('110 GP')
      expect(classes.ranger.startingEquipment[1].description).toBe('150 GP')
    })

    test('level 1 spellcasting of every class', () => {
      const classes = byId()
      const casting = (id: string) => classes[id].spellcasting
      expect(casting('bard')).toEqual({ ability: 'cha', level1: { cantrips: 2, preparedSpells: 4, slots: [2] } })
      expect(casting('cleric')).toEqual({ ability: 'wis', level1: { cantrips: 3, preparedSpells: 4, slots: [2] } })
      expect(casting('druid')).toEqual({ ability: 'wis', level1: { cantrips: 2, preparedSpells: 4, slots: [2] } })
      expect(casting('ranger')).toEqual({ ability: 'wis', level1: { cantrips: 0, preparedSpells: 2, slots: [2] } })
      expect(casting('warlock')).toEqual({ ability: 'cha', level1: { cantrips: 2, preparedSpells: 2, slots: [1] } }) // Pact Magic: one level 1 slot
      expect(casting('wizard')).toEqual({ ability: 'int', level1: { cantrips: 3, preparedSpells: 4, slots: [2], spellbookSpells: 6 } })
      for (const id of ['barbarian', 'fighter', 'monk', 'rogue']) expect(casting(id), id).toBeUndefined()
    })

    test('tool proficiencies', () => {
      const classes = byId()
      expect(classes.rogue.tools).toEqual({ fixed: ["Thieves' Tools"] })
      expect(classes.druid.tools).toEqual({ fixed: ['Herbalism Kit'] })
      expect(classes.bard.tools).toEqual({ fixed: [], choice: { count: 3, kinds: ['instrument'] } })
      expect(classes.monk.tools).toEqual({ fixed: [], choice: { count: 1, kinds: ['artisan', 'instrument'] } })
      for (const id of ['barbarian', 'cleric', 'fighter', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard']) {
        expect(classes[id].tools, id).toEqual({ fixed: [] })
      }
    })

    test('level 1 features that change the sheet numbers', () => {
      const classes = byId()
      expect(classes.barbarian.unarmoredDefense).toEqual({ ability: 'con', shieldAllowed: true })
      expect(classes.monk.unarmoredDefense).toEqual({ ability: 'wis', shieldAllowed: false })
      expect(classes.rogue.expertise).toEqual({ skills: 2 })

      expect(classes.cleric.order?.name).toBe('Divine Order')
      const [protector, thaumaturge] = classes.cleric.order?.options ?? []
      expect(protector).toMatchObject({ id: 'protector', weaponProficiencies: ['Martial'], armorTraining: ['Heavy'] })
      expect(thaumaturge).toMatchObject({ id: 'thaumaturge', extraCantrips: 1, skillBonus: { skills: ['Arcana', 'Religion'], ability: 'wis', minimum: 1 } })

      expect(classes.druid.order?.name).toBe('Primal Order')
      const [magician, warden] = classes.druid.order?.options ?? []
      expect(magician).toMatchObject({ id: 'magician', extraCantrips: 1, skillBonus: { skills: ['Arcana', 'Nature'], ability: 'wis', minimum: 1 } })
      expect(warden).toMatchObject({ id: 'warden', weaponProficiencies: ['Martial'], armorTraining: ['Medium'] })

      // no other class has these features
      for (const id of ['bard', 'fighter', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard']) {
        expect(classes[id].unarmoredDefense, id).toBeUndefined()
        expect(classes[id].expertise, id).toBeUndefined()
        expect(classes[id].order, id).toBeUndefined()
      }
    })
  })

  test('the Warlock picks one invocation, from the five with no level requirement', () => {
    expect(catalog.classes.find((entry) => entry.id === 'warlock')?.invocations).toEqual({ label: 'Eldritch Invocation', count: 1 })
    expect(catalog.classes.filter((entry) => entry.invocations !== undefined)).toHaveLength(1)

    expect(catalog.invocations.map((entry) => entry.id)).toEqual(['armor-of-shadows', 'eldritch-mind', 'pact-of-the-blade', 'pact-of-the-chain', 'pact-of-the-tome'])
    const byId = Object.fromEntries(catalog.invocations.map((entry) => [entry.id, entry]))
    expect(byId['armor-of-shadows']).toMatchObject({ unarmoredBaseAc: 13, description: 'You can cast Mage Armor on yourself without expending a spell slot.' })
    expect(catalog.invocations.filter((entry) => entry.unarmoredBaseAc !== undefined)).toHaveLength(1) // only Armor of Shadows changes AC
    expect(byId['pact-of-the-tome'].description).toContain('choose three cantrips, and choose two level 1 spells that have the Ritual tag')
    expect(byId['pact-of-the-tome'].description).not.toContain('The\nbook') // the page-break split is joined
  })

  test('the tool lists: 17 artisan tools and 10 musical instruments', () => {
    const artisan = catalog.tools.filter((tool) => tool.kind === 'artisan').map((tool) => tool.name)
    const instruments = catalog.tools.filter((tool) => tool.kind === 'instrument').map((tool) => tool.name)
    expect(artisan).toHaveLength(17)
    expect(artisan).toContain("Alchemist's Supplies")
    expect(artisan).toContain("Woodcarver's Tools")
    expect(instruments).toEqual(['Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Horn', 'Lute', 'Lyre', 'Pan Flute', 'Shawm', 'Viol'])
    expect(new Set(catalog.tools.map((tool) => tool.id)).size).toBe(27)
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
