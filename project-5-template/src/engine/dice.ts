// Dice rolling: single dice, d20 checks with advantage or disadvantage, and the roll history.
// Pure functions only, with no UI code. The random source is passed in so tests are repeatable.

/** Returns a number from 0 up to but not including 1, like Math.random. Tests pass a fixed one. */
export type RandomSource = () => number

/** Roll one die with the given number of sides: a whole number from 1 to `sides`. */
export function rollDie(sides: number, random: RandomSource): number {
  return Math.floor(random() * sides) + 1
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface RollResult {
  label: string // what was rolled, for example "Athletics check"
  mode: RollMode
  dice: number[] // every d20 rolled: one, or two for advantage and disadvantage
  kept: number // the d20 that counts
  bonus: number
  total: number
}

/** Roll a d20 check: with advantage or disadvantage, roll two d20s and keep the higher or lower. */
export function rollCheck(label: string, bonus: number, mode: RollMode, random: RandomSource): RollResult {
  const dice = [rollDie(20, random)]
  if (mode !== 'normal') dice.push(rollDie(20, random))

  const kept = mode === 'advantage' ? Math.max(...dice) : mode === 'disadvantage' ? Math.min(...dice) : dice[0]
  return { label, mode, dice, kept, bonus, total: kept + bonus }
}

export const ROLL_HISTORY_LIMIT = 20

/** Put a new roll at the top of the history and drop the oldest ones past the limit. Does not change the old list. */
export function addToHistory(history: RollResult[], result: RollResult, limit = ROLL_HISTORY_LIMIT): RollResult[] {
  return [result, ...history].slice(0, limit)
}

/** One line of plain text for a roll, for the history and for screen readers. */
export function describeRoll(roll: RollResult): string {
  const bonus = roll.bonus >= 0 ? `+ ${roll.bonus}` : `- ${Math.abs(roll.bonus)}`
  const dice =
    roll.dice.length === 1
      ? `d20 ${roll.kept}`
      : `d20 ${roll.dice.join(' and ')}, ${roll.mode === 'advantage' ? 'higher' : 'lower'} ${roll.kept}`
  return `${roll.label}: ${roll.total} (${dice} ${bonus})`
}
