// What a class gains at each level, read from the class's Features table (SRD 5.2.1) in the catalog.
// Pure functions, no UI code.
import type { ClassEntry, ClassFeature, ClassLevel } from '../catalog/types'

export const MAX_LEVEL = 20

export const isValidLevel = (level: unknown): level is number => typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= MAX_LEVEL

/** The class's Features table row for this level, or undefined without a class or for a level outside 1 to 20. */
export function levelRow(classEntry: ClassEntry | undefined, level: number): ClassLevel | undefined {
  return isValidLevel(level) ? classEntry?.levels[level - 1] : undefined
}

const IMPROVEMENT = 'Ability Score Improvement'

/** The levels, up to and including `level`, at which the class gives an Ability Score Improvement (Fighter and Rogue get extra ones). */
export function improvementLevels(classEntry: ClassEntry | undefined, level: number): number[] {
  if (classEntry === undefined) return []
  return classEntry.levels.filter((row) => row.level <= level && row.features.includes(IMPROVEMENT)).map((row) => row.level)
}

/** The descriptions of the features the class has gained by this level, in level order. */
export function featuresUpTo(classEntry: ClassEntry | undefined, level: number): ClassFeature[] {
  if (classEntry === undefined) return []
  return classEntry.features.filter((feature) => feature.level <= level)
}

/**
 * How many Eldritch Invocations the character can pick at this level. The Warlock's table gives the number (1 at level 1,
 * 3 at level 2, and so on), but only the invocations the catalog holds can be chosen, so the count never exceeds those.
 * `short` is true when the class is entitled to more than the catalog offers.
 */
export function invocationLimit(classEntry: ClassEntry | undefined, level: number, offered: number): { count: number; short: boolean } {
  if (classEntry?.invocations === undefined) return { count: 0, short: false }
  const fromTable = Number(levelRow(classEntry, level)?.columns['Eldritch Invocations'])
  const entitled = Number.isInteger(fromTable) ? fromTable : classEntry.invocations.count
  return { count: Math.min(entitled, offered), short: entitled > offered }
}

/**
 * Maximum hit points with the SRD's fixed values: the highest number on the hit die at level 1, then the die's average
 * (half the die, plus 1) for each level after, plus the Constitution modifier every level. A species bonus per level (the
 * Dwarf's Toughness) is added for every level.
 */
export function maxHitPoints(hitDie: number, level: number, constitutionModifier: number, bonusPerLevel = 0): number {
  const average = Math.floor(hitDie / 2) + 1
  return hitDie + constitutionModifier + (level - 1) * (average + constitutionModifier) + bonusPerLevel * level
}

/**
 * Features whose effect on the sheet's numbers is not calculated yet (a bonus to saves, skills or speed, for example).
 * They are listed in a warning so the player knows a number may be higher than shown. The names are the SRD's.
 */
const NOT_CALCULATED = new Set([
  'Jack of All Trades',
  'Aura of Protection',
  'Fast Movement',
  'Unarmored Movement',
  'Reliable Talent',
  'Slippery Mind',
  'Disciplined Survivor',
  'Primal Champion',
  'Body and Mind',
  'Scholar',
  'Fighting Style',
])

/** Names of the features gained by this level that can change numbers but are not calculated yet, without repeats. */
export function featuresNotCalculated(classEntry: ClassEntry | undefined, level: number): string[] {
  if (classEntry === undefined) return []
  const names: string[] = []
  for (const row of classEntry.levels.filter((entry) => entry.level <= level)) {
    for (const name of row.features) {
      const base = name.replace(/ \(.*\)$/, '')
      // The Rogue's level 1 Expertise is calculated; every other Expertise gain (and every other class's) is not.
      const notCalculated = NOT_CALCULATED.has(base) || (base === 'Expertise' && !(classEntry.id === 'rogue' && row.level === 1))
      if (notCalculated && !names.includes(base)) names.push(base)
    }
  }
  return names
}
