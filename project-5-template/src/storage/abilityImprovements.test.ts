import { describe, expect, test } from 'vitest'
import type { Character } from '../engine/character'
import { characterToFileText, parseCharacterFile } from './characterFile'
import { STORAGE_KEY, loadCharacter, saveCharacter, validateCharacter } from './characterStorage'
import { MemoryStorage } from './memoryStorage'

const base: Character = {
  edition: '2024',
  level: 8,
  classId: 'fighter',
  baseScores: {},
  classSkills: [],
  speciesSkills: [],
  abilityImprovements: { '4': { mode: 'plusTwo', abilities: ['str'] }, '6': { mode: 'plusOneEach', abilities: ['dex', 'con'] } },
}

describe('saving the level and the Ability Score Improvements', () => {
  test('they survive a save and a load', () => {
    const storage = new MemoryStorage()
    expect(saveCharacter(storage, base)).toEqual({ ok: true })
    expect(loadCharacter(storage)).toEqual({ status: 'loaded', character: base })
  })

  test('they survive a trip through a character file', () => {
    expect(parseCharacterFile(characterToFileText(base))).toEqual({ ok: true, character: base })
  })

  test('a half-chosen improvement can be saved (the player is still choosing)', () => {
    const half: Character = { ...base, abilityImprovements: { '4': { mode: 'plusOneEach', abilities: ['str'] } } }
    expect(validateCharacter(half)).toEqual({ ok: true, character: half })
    expect(validateCharacter({ ...base, abilityImprovements: { '4': { mode: 'plusTwo', abilities: [] } } }).ok).toBe(true)
  })

  test.each([
    ['a list instead of an object', []],
    ['a level that is not a number', { four: { mode: 'plusTwo', abilities: ['str'] } }],
    ['a level above 20', { '21': { mode: 'plusTwo', abilities: ['str'] } }],
    ['level 0', { '0': { mode: 'plusTwo', abilities: ['str'] } }],
    ['an unknown mode', { '4': { mode: 'plusThree', abilities: ['str'] } }],
    ['an unknown ability', { '4': { mode: 'plusTwo', abilities: ['luck'] } }],
    ['abilities that are not a list', { '4': { mode: 'plusTwo', abilities: 'str' } }],
    ['three abilities', { '4': { mode: 'plusOneEach', abilities: ['str', 'dex', 'con'] } }],
    ['a pick that is not an object', { '4': 'str' }],
  ])('%s is refused', (_name, abilityImprovements) => {
    const result = validateCharacter({ ...base, abilityImprovements })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/abilityImprovements/)
  })

  test('only the known fields of each improvement are kept', () => {
    const result = validateCharacter({ ...base, abilityImprovements: { '4': { mode: 'plusTwo', abilities: ['str'], extra: 'x' } } })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.character.abilityImprovements).toEqual({ '4': { mode: 'plusTwo', abilities: ['str'] } })
  })

  test('older saves without the field still load', () => {
    const { abilityImprovements: _omitted, ...older } = base
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, character: older }))
    const loaded = loadCharacter(storage)
    expect(loaded.status).toBe('loaded')
    if (loaded.status === 'loaded') expect(loaded.character.abilityImprovements).toBeUndefined()
  })

  test.each([[0], [21], [2.5], ['5']])('a level of %j is refused', (level) => {
    expect(validateCharacter({ ...base, level }).ok).toBe(false)
  })
})
