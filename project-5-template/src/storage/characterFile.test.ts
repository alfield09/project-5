import { describe, expect, test } from 'vitest'
import type { Character } from '../engine/character'
import { characterFileName, characterToFileText, parseCharacterFile } from './characterFile'

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

describe('character files', () => {
  test('a character written to a file reads back exactly the same', () => {
    expect(parseCharacterFile(characterToFileText(fighter))).toEqual({ ok: true, character: fighter })
  })

  test('the file says what it is, so other JSON files are refused', () => {
    const file = JSON.parse(characterToFileText(fighter))
    expect(file.app).toBe('sheetforge')
    expect(file.kind).toBe('character')
    expect(file.version).toBe(1)
    expect(parseCharacterFile(JSON.stringify({ character: fighter })).ok).toBe(false) // no marker
    expect(parseCharacterFile(JSON.stringify({ ...file, app: 'other' })).ok).toBe(false)
    expect(parseCharacterFile(JSON.stringify({ ...file, kind: 'pack' })).ok).toBe(false)
  })

  test('a different version is refused with a reason', () => {
    const file = JSON.parse(characterToFileText(fighter))
    const result = parseCharacterFile(JSON.stringify({ ...file, version: 2 }))
    expect(result).toEqual({ ok: false, reason: 'the file was made by a different version of Sheetforge' })
  })

  test.each([
    ['text that is not JSON', 'not json at all'],
    ['an empty file', ''],
    ['a list', '[]'],
    ['null', 'null'],
    ['a number', '7'],
  ])('%s is refused without throwing', (_name, text) => {
    expect(parseCharacterFile(text).ok).toBe(false)
  })

  test('a character with invalid fields is refused and the fields are named', () => {
    const file = JSON.parse(characterToFileText(fighter))
    file.character.level = 99
    file.character.baseScores.str = 'lots'
    const result = parseCharacterFile(JSON.stringify(file))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/level.*baseScores\.str/)
  })

  test('unknown fields in the file never reach the character', () => {
    const file = JSON.parse(characterToFileText(fighter))
    file.character.admin = true
    file.character.__proto__ = { polluted: true }
    const result = parseCharacterFile(JSON.stringify(file))
    expect(result.ok && 'admin' in result.character).toBe(false)
  })

  test('a very large file is refused', () => {
    const valid = characterToFileText(fighter)
    expect(parseCharacterFile(valid).ok).toBe(true)
    // The same valid file padded past the limit: only the size rule can refuse it.
    const result = parseCharacterFile(valid + ' '.repeat(1_000_000))
    expect(result).toEqual({ ok: false, reason: 'the file is too large to be a character' })
  })

  test('file names are safe and say the class', () => {
    expect(characterFileName(fighter)).toBe('sheetforge-fighter.json')
    expect(characterFileName({ ...fighter, classId: undefined })).toBe('sheetforge-character.json')
    expect(characterFileName({ ...fighter, classId: '../../x:y' })).toBe('sheetforge-xy.json')
  })
})
