// The character record: the choices a player has made, and nothing that can be calculated from them.
// This is the single source of truth for a character (spec.md, Data and state).
import type { Edition } from '../catalog/types'
import type { Ability, PartialScores } from './abilityScores'

/** How the background's ability bonus is spent: +2 and +1 on two of its abilities, or +1 on all three. */
export type BackgroundBonus = { plusTwo: Ability; plusOne: Ability } | { plusOneAll: true }

export interface Character {
  edition: Edition
  level: number
  speciesId?: string
  backgroundId?: string
  classId?: string
  baseScores: PartialScores // scores before the background bonus
  backgroundBonus?: BackgroundBonus
  classSkills: string[] // the skills picked from the class's list
  speciesSkills: string[] // skills of the player's choice from the species, for example the Human's Skillful
  armorId?: string // worn armor, from the catalog; leave out for no armor
  shield: boolean
}

/** Numbers calculated from a character. Never saved; always recomputed. */
export interface Derived {
  finalScores: Record<Ability, number>
  modifiers: Record<Ability, number>
  proficiencyBonus: number
  savingThrows: Record<Ability, number>
  skills: Record<string, number> // keyed by skill name
  passive: { perception: number; investigation: number; insight: number }
  initiative: number
  armorClass: number
  maxHitPoints: number
  speed: number
  spellcasting?: { ability: Ability; saveDc: number; attackBonus: number }
  warnings: string[] // legal but costly choices, such as armor the class is not trained in
}

/** Either the numbers, or a list of what is missing or invalid. Never numbers computed from nothing. */
export type DeriveResult = { ok: true; derived: Derived } | { ok: false; problems: string[] }
