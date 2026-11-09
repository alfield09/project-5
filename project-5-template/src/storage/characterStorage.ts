// Saves and loads the character in the browser, on this device only (no accounts, no server).
// Anything read back is checked before use, because stored text can be old, edited or damaged.
import { ABILITIES, type Ability, type ScoreMethod } from '../engine/abilityScores'
import type { BackgroundBonus, Character } from '../engine/character'

export const STORAGE_KEY = 'sheetforge.character'
const FORMAT_VERSION = 1

/** The few parts of the browser's Storage that are used, so tests can pass a fake. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** The browser's localStorage, or undefined when it is missing or blocked (some private windows). */
export function browserStorage(): StorageLike | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

export type SaveResult = { ok: true } | { ok: false; reason: string }

export type LoadResult =
  | { status: 'empty' } // nothing saved yet
  | { status: 'loaded'; character: Character }
  | { status: 'unreadable'; reason: string } // something is stored but cannot be used
  | { status: 'unavailable' } // the browser does not allow storage

export function saveCharacter(storage: StorageLike | undefined, character: Character): SaveResult {
  if (storage === undefined) return { ok: false, reason: 'browser storage is not available' }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: FORMAT_VERSION, character }))
    return { ok: true }
  } catch {
    return { ok: false, reason: 'browser storage is full or blocked' }
  }
}

export function loadCharacter(storage: StorageLike | undefined): LoadResult {
  if (storage === undefined) return { status: 'unavailable' }

  let text: string | null
  try {
    text = storage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }
  if (text === null) return { status: 'empty' }

  let saved: unknown
  try {
    saved = JSON.parse(text)
  } catch {
    return { status: 'unreadable', reason: 'the saved text is damaged' }
  }
  if (!isRecord(saved) || saved.version !== FORMAT_VERSION) {
    return { status: 'unreadable', reason: 'it was saved by a different version' }
  }

  const parsed = validateCharacter(saved.character)
  return parsed.ok ? { status: 'loaded', character: parsed.character } : { status: 'unreadable', reason: parsed.reason }
}

// ---- Checking a stored character ----

type Raw = Record<string, unknown>

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const SCORE_METHODS: ScoreMethod[] = ['standardArray', 'pointBuy', 'roll', 'manual']

const isAbility = (value: unknown): value is Ability => (ABILITIES as readonly unknown[]).includes(value)
const isTextList = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')
const isWholeNumber = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max

function backgroundBonusProblem(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) return 'backgroundBonus'
  if ('plusOneAll' in value) return value.plusOneAll === true ? undefined : 'backgroundBonus'
  const fine = (entry: unknown) => entry === undefined || isAbility(entry)
  return fine(value.plusTwo) && fine(value.plusOne) ? undefined : 'backgroundBonus'
}

/** Check a value read from storage and, if it is sound, return a clean Character with only the known fields. */
export function validateCharacter(raw: unknown): { ok: true; character: Character } | { ok: false; reason: string } {
  if (!isRecord(raw)) return { ok: false, reason: 'the saved character is not an object' }

  const problems: string[] = []
  if (raw.edition !== '2014' && raw.edition !== '2024') problems.push('edition')
  if (!isWholeNumber(raw.level, 1, 20)) problems.push('level')
  for (const field of ['speciesId', 'backgroundId', 'classId', 'equipmentOptionId']) {
    if (raw[field] !== undefined && typeof raw[field] !== 'string') problems.push(field)
  }
  if (!isTextList(raw.classSkills)) problems.push('classSkills')
  if (!isTextList(raw.speciesSkills)) problems.push('speciesSkills')

  const baseScores: Character['baseScores'] = {}
  if (!isRecord(raw.baseScores)) {
    problems.push('baseScores')
  } else {
    for (const [ability, score] of Object.entries(raw.baseScores)) {
      if (isAbility(ability) && isWholeNumber(score, 1, 20)) baseScores[ability] = score
      else problems.push(`baseScores.${ability}`)
    }
  }

  const bonusProblem = backgroundBonusProblem(raw.backgroundBonus)
  if (bonusProblem) problems.push(bonusProblem)

  if (raw.scoreMethod !== undefined && !SCORE_METHODS.includes(raw.scoreMethod as ScoreMethod)) problems.push('scoreMethod')

  const rolled = raw.rolledScores
  if (rolled !== undefined && !(Array.isArray(rolled) && rolled.length <= 6 && rolled.every((value) => isWholeNumber(value, 3, 18)))) {
    problems.push('rolledScores')
  }

  if (problems.length > 0) return { ok: false, reason: `these saved fields are not valid: ${problems.join(', ')}` }

  // Copy only the known fields, so unknown ones in the stored text never reach the app.
  const character: Character = {
    edition: raw.edition as Character['edition'],
    level: raw.level as number,
    baseScores,
    classSkills: raw.classSkills as string[],
    speciesSkills: raw.speciesSkills as string[],
  }
  for (const field of ['speciesId', 'backgroundId', 'classId', 'equipmentOptionId'] as const) {
    if (raw[field] !== undefined) character[field] = raw[field] as string
  }
  if (raw.backgroundBonus !== undefined) character.backgroundBonus = raw.backgroundBonus as BackgroundBonus
  if (raw.scoreMethod !== undefined) character.scoreMethod = raw.scoreMethod as ScoreMethod
  if (rolled !== undefined) character.rolledScores = rolled as number[]
  return { ok: true, character }
}
