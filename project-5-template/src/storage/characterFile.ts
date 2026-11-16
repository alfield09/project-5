// The file a player can download and load again: one character, as plain JSON text.
// A file is untrusted input (anyone can edit it), so it goes through the same checks as saved text.
import type { Character } from '../engine/character'
import { validateCharacter } from './characterStorage'

export const FILE_APP = 'sheetforge'
export const FILE_KIND = 'character'
export const FILE_VERSION = 1
export const MAX_FILE_BYTES = 1_000_000 // a character is a few kilobytes; anything near this is not one

export type ParsedFile = { ok: true; character: Character } | { ok: false; reason: string }

/** The text to put in the downloaded file. */
export function characterToFileText(character: Character): string {
  return JSON.stringify({ app: FILE_APP, kind: FILE_KIND, version: FILE_VERSION, character }, null, 2)
}

/** A readable file name, for example "sheetforge-fighter.json". */
export function characterFileName(character: Character): string {
  const label = (character.classId ?? 'character').replace(/[^a-z0-9-]/gi, '')
  return `sheetforge-${label || 'character'}.json`
}

/** Read the text of a chosen file. Returns the character, or a plain-language reason it cannot be used. */
export function parseCharacterFile(text: string): ParsedFile {
  if (text.length > MAX_FILE_BYTES) return { ok: false, reason: 'the file is too large to be a character' }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'the file is not readable text in the expected format' }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ok: false, reason: 'the file does not hold a character' }

  const file = data as Record<string, unknown>
  if (file.app !== FILE_APP || file.kind !== FILE_KIND) return { ok: false, reason: 'this is not a Sheetforge character file' }
  if (file.version !== FILE_VERSION) return { ok: false, reason: 'the file was made by a different version of Sheetforge' }

  const checked = validateCharacter(file.character)
  return checked.ok ? { ok: true, character: checked.character } : { ok: false, reason: checked.reason }
}
