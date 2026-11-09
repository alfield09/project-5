import { describe, expect, test } from 'vitest'
import type { Character } from '../engine/character'
import { STORAGE_KEY, loadCharacter, saveCharacter, validateCharacter, type StorageLike } from './characterStorage'
import { MemoryStorage } from './memoryStorage'

const fighter: Character = {
  edition: '2024',
  level: 1,
  speciesId: 'dwarf',
  backgroundId: 'soldier',
  classId: 'fighter',
  scoreMethod: 'roll',
  rolledScores: [15, 13, 13, 12, 10, 9],
  baseScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  backgroundBonus: { plusTwo: 'str', plusOne: 'con' },
  classSkills: ['Perception', 'Survival'],
  speciesSkills: [],
  equipmentOptionId: 'A',
  spellIds: ['light', 'magic-missile'],
}

/** Store text directly, as if an old or edited version had saved it. */
function storeRaw(value: unknown): MemoryStorage {
  const storage = new MemoryStorage()
  storage.setItem(STORAGE_KEY, typeof value === 'string' ? value : JSON.stringify(value))
  return storage
}

describe('saving and loading', () => {
  test('a saved character comes back exactly as it was', () => {
    const storage = new MemoryStorage()
    expect(saveCharacter(storage, fighter)).toEqual({ ok: true })
    expect(loadCharacter(storage)).toEqual({ status: 'loaded', character: fighter })
  })

  test('rolled scores and the score method survive', () => {
    const storage = new MemoryStorage()
    saveCharacter(storage, fighter)
    const result = loadCharacter(storage)
    if (result.status !== 'loaded') throw new Error('not loaded')
    expect(result.character.rolledScores).toEqual([15, 13, 13, 12, 10, 9])
    expect(result.character.scoreMethod).toBe('roll')
  })

  test('chosen spells survive', () => {
    const storage = new MemoryStorage()
    saveCharacter(storage, fighter)
    const result = loadCharacter(storage)
    expect(result.status === 'loaded' && result.character.spellIds).toEqual(['light', 'magic-missile'])
  })

  test('a half-filled character saves and loads too', () => {
    const storage = new MemoryStorage()
    const partial: Character = { edition: '2024', level: 1, baseScores: { str: 15 }, classSkills: [], speciesSkills: [] }
    saveCharacter(storage, partial)
    expect(loadCharacter(storage)).toEqual({ status: 'loaded', character: partial })
  })

  test('the newest save replaces the older one', () => {
    const storage = new MemoryStorage()
    saveCharacter(storage, fighter)
    saveCharacter(storage, { ...fighter, classId: 'paladin' })
    const result = loadCharacter(storage)
    expect(result.status === 'loaded' && result.character.classId).toBe('paladin')
  })

  test('nothing saved yet', () => {
    expect(loadCharacter(new MemoryStorage())).toEqual({ status: 'empty' })
  })
})

describe('storage that does not work', () => {
  test('no storage at all', () => {
    expect(saveCharacter(undefined, fighter)).toEqual({ ok: false, reason: 'browser storage is not available' })
    expect(loadCharacter(undefined)).toEqual({ status: 'unavailable' })
  })

  test('storage that is full or blocked when saving', () => {
    const full: StorageLike = { ...new MemoryStorage(), getItem: () => null, removeItem: () => {}, setItem: () => { throw new Error('quota') } }
    expect(saveCharacter(full, fighter)).toEqual({ ok: false, reason: 'browser storage is full or blocked' })
  })

  test('storage that throws when reading counts as unavailable', () => {
    const blocked: StorageLike = { getItem: () => { throw new Error('blocked') }, setItem: () => {}, removeItem: () => {} }
    expect(loadCharacter(blocked)).toEqual({ status: 'unavailable' })
  })
})

describe('saved text that cannot be used', () => {
  test('damaged text is reported, not thrown', () => {
    const result = loadCharacter(storeRaw('{not json'))
    expect(result).toEqual({ status: 'unreadable', reason: 'the saved text is damaged' })
  })

  test('a different version is refused', () => {
    expect(loadCharacter(storeRaw({ version: 2, character: fighter })).status).toBe('unreadable')
    expect(loadCharacter(storeRaw({ character: fighter })).status).toBe('unreadable')
    expect(loadCharacter(storeRaw([1, 2])).status).toBe('unreadable')
  })

  test('a character with the wrong shape is refused, naming the bad fields', () => {
    const bad = { ...fighter, level: 'one', classSkills: 'Athletics', baseScores: { str: 99, luck: 5 }, scoreMethod: 'dice' }
    const result = loadCharacter(storeRaw({ version: 1, character: bad }))
    expect(result.status).toBe('unreadable')
    if (result.status !== 'unreadable') return
    for (const field of ['level', 'classSkills', 'baseScores.str', 'baseScores.luck', 'scoreMethod']) {
      expect(result.reason).toContain(field)
    }
  })

  test('each kind of bad value is caught', () => {
    const cases: Record<string, unknown> = {
      edition: { ...fighter, edition: '3.5' },
      'level too high': { ...fighter, level: 25 },
      'id not text': { ...fighter, classId: 7 },
      'bonus not an ability': { ...fighter, backgroundBonus: { plusTwo: 'luck' } },
      'bonus not true': { ...fighter, backgroundBonus: { plusOneAll: 'yes' } },
      'rolled too many': { ...fighter, rolledScores: [10, 10, 10, 10, 10, 10, 10] },
      'rolled out of range': { ...fighter, rolledScores: [19, 10, 10, 10, 10, 10] },
      'score not whole': { ...fighter, baseScores: { str: 10.5 } },
      'spells not a list': { ...fighter, spellIds: 'fire-bolt' },
      'spell id not text': { ...fighter, spellIds: [7] },
      'not an object': 'a string',
    }
    for (const [name, character] of Object.entries(cases)) {
      expect(validateCharacter(character).ok, name).toBe(false)
    }
  })

  test('unknown fields in the saved text are dropped', () => {
    const result = validateCharacter({ ...fighter, evil: 'script', rollHistory: [1, 2, 3] })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.character).toEqual(fighter)
  })

  test('a bonus that is still half chosen is accepted', () => {
    expect(validateCharacter({ ...fighter, backgroundBonus: { plusTwo: 'str' } }).ok).toBe(true)
    expect(validateCharacter({ ...fighter, backgroundBonus: {} }).ok).toBe(true)
    expect(validateCharacter({ ...fighter, backgroundBonus: { plusOneAll: true } }).ok).toBe(true)
  })
})
