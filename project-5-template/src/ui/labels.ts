// Display names shared by the screens.
import type { Spell } from '../catalog/types'
import type { Ability } from '../engine/abilityScores'

export const ABILITY_NAMES: Record<Ability, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

/** A modifier with its sign, for example +3, +0 or -1. */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

/** "Cantrip" or "Level 1", for spell labels. */
export function levelLabel(spell: Spell): string {
  return spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`
}
