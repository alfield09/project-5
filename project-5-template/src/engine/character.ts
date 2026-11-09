// The character record: the choices a player has made, and nothing that can be calculated from them.
// This is the single source of truth for a character (spec.md, Data and state).
import type { Edition } from '../catalog/types'
import type { Ability, PartialScores, ScoreMethod } from './abilityScores'

/**
 * How the background's ability bonus is spent: +2 and +1 on two of its abilities, or +1 on all three.
 * The two-ability form can be half filled in while the player is still choosing.
 */
export type BackgroundBonus = { plusTwo?: Ability; plusOne?: Ability } | { plusOneAll: true }

export interface Character {
  edition: Edition
  level: number
  speciesId?: string
  backgroundId?: string
  classId?: string
  scoreMethod?: ScoreMethod // how the scores are being chosen; standard array when left out
  rolledScores?: number[] // the six rolled values, kept so a reload never re-rolls them
  baseScores: PartialScores // scores before the background bonus
  backgroundBonus?: BackgroundBonus
  classSkills: string[] // the skills picked from the class's list
  speciesSkills: string[] // skills of the player's choice from the species, for example the Human's Skillful
  orderId?: string // the Cleric's Divine Order or the Druid's Primal Order
  invocationIds?: string[] // the Warlock's Eldritch Invocations
  expertiseSkills?: string[] // the Rogue's Expertise skills
  toolIds?: string[] // tools picked from the catalog (Bard, Monk)
  spellbookIds?: string[] // the Wizard's spellbook; the prepared spells are chosen from it
  spellIds?: string[] // chosen cantrips and level 1 spells, from the catalog; one list for both kinds
  equipmentOptionId?: string // the class's starting equipment package ('A', 'B' ...); it decides worn armor and shield
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
  darkvision?: number // feet
  proficientSaves: Ability[]
  proficientSkills: string[] // in the order of the skill list
  expertiseSkills: string[] // skills where the proficiency bonus counts twice
  training: { armor: string[]; weapons: string[]; tools: string[] }
  spellcasting?: { ability: Ability; saveDc: number; attackBonus: number; slots: number[] } // slots[0] is level 1
  warnings: string[] // legal but costly choices, such as armor the class is not trained in
}

/** Either the numbers, or a list of what is missing or invalid. Never numbers computed from nothing. */
export type DeriveResult = { ok: true; derived: Derived } | { ok: false; problems: string[] }
