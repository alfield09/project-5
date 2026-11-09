// Ability score logic: modifiers and the four ways to generate scores.
// Pure functions only, with no UI code (see spec.md, Structure rules).
// Numbers come from SRD 5.2.1 ("Generate Your Scores" and "Ability Scores and Modifiers").

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
export type Ability = (typeof ABILITIES)[number]

// Scores that are assigned so far; an ability with no score yet is left out.
export type PartialScores = Partial<Record<Ability, number>>

export type ScoreMethod = 'standardArray' | 'pointBuy' | 'roll' | 'manual'

/** The modifier for a score: subtract 10, divide by 2, round down. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

// ---- Standard array ----

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

export interface Check {
  valid: boolean
  errors: string[]
}

/**
 * Each value in the pool may be used once. Unassigned abilities are allowed while building.
 * Shared by the standard array and by rolled scores, which are both a set of values to hand out.
 */
export function checkFromPool(scores: PartialScores, pool: readonly number[]): Check {
  const errors: string[] = []
  const remaining: number[] = [...pool]

  for (const ability of ABILITIES) {
    const score = scores[ability]
    if (score === undefined) continue
    const index = remaining.indexOf(score)
    if (index === -1) {
      errors.push(`${ability}: ${score} is not available (or is already used)`)
    } else {
      remaining.splice(index, 1)
    }
  }
  return { valid: errors.length === 0, errors }
}

/** Values an ability can still take from the pool: everything not used by the other abilities. */
export function availableFromPool(
  pool: readonly number[],
  scores: PartialScores,
  ability: Ability,
): number[] {
  const remaining: number[] = [...pool]
  for (const other of ABILITIES) {
    const score = scores[other]
    if (other === ability || score === undefined) continue
    const index = remaining.indexOf(score)
    if (index !== -1) remaining.splice(index, 1)
  }
  return [...new Set(remaining)].sort((a, b) => b - a)
}

export function checkStandardArray(scores: PartialScores): Check {
  return checkFromPool(scores, STANDARD_ARRAY)
}

// ---- Point buy ----

export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN = 8
export const POINT_BUY_MAX = 15

// Cost of each score, from the SRD "Ability Score Point Costs" table.
const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

/** The cost of one score, or undefined if the score is outside 8 to 15. */
export function pointBuyCost(score: number): number | undefined {
  return POINT_BUY_COSTS[score]
}

export interface PointBuyResult extends Check {
  spent: number
  remaining: number
}

export function checkPointBuy(scores: PartialScores): PointBuyResult {
  const errors: string[] = []
  let spent = 0

  for (const ability of ABILITIES) {
    const score = scores[ability]
    if (score === undefined) continue
    const cost = pointBuyCost(score)
    if (cost === undefined) {
      errors.push(`${ability}: ${score} is outside ${POINT_BUY_MIN} to ${POINT_BUY_MAX}`)
    } else {
      spent += cost
    }
  }

  if (spent > POINT_BUY_BUDGET) {
    errors.push(`${spent} points spent, but the budget is ${POINT_BUY_BUDGET}`)
  }
  return { valid: errors.length === 0, errors, spent, remaining: POINT_BUY_BUDGET - spent }
}

// ---- Roll (4d6, drop the lowest) ----

/** Returns a number from 0 up to but not including 1, like Math.random. Tests pass a fixed one. */
export type RandomSource = () => number

function rollD6(random: RandomSource): number {
  return Math.floor(random() * 6) + 1
}

/** Roll four d6 and total the highest three. */
export function rollAbilityScore(random: RandomSource): number {
  const dice = [rollD6(random), rollD6(random), rollD6(random), rollD6(random)]
  dice.sort((a, b) => a - b)
  return dice[1] + dice[2] + dice[3] // dice[0] is the lowest and is dropped
}

/** Six rolled scores, not yet assigned to abilities. */
export function rollAbilityScores(random: RandomSource): number[] {
  return Array.from({ length: 6 }, () => rollAbilityScore(random))
}

// ---- Manual entry ----

export const MANUAL_MIN = 1
export const MANUAL_MAX = 20

/** A typed score must be a whole number from 1 to 20. */
export function checkManualScore(score: number): Check {
  if (!Number.isInteger(score) || score < MANUAL_MIN || score > MANUAL_MAX) {
    return { valid: false, errors: [`score must be a whole number from ${MANUAL_MIN} to ${MANUAL_MAX}`] }
  }
  return { valid: true, errors: [] }
}
