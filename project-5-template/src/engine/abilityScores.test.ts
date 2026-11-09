import { describe, expect, test } from 'vitest'
import {
  STANDARD_ARRAY,
  abilityModifier,
  availableFromPool,
  checkFromPool,
  checkManualScore,
  checkPointBuy,
  checkStandardArray,
  pointBuyCost,
  rollAbilityScore,
  rollAbilityScores,
} from './abilityScores'

// Turns the dice we want into random values, so tests are repeatable. d6 = floor(r * 6) + 1.
function diceToRandom(dice: number[]) {
  let i = 0
  return () => (dice[i++] - 1) / 6 + 0.01
}

describe('abilityModifier', () => {
  // SRD 5.2.1 "Ability Scores and Modifiers" table, scores 3 to 20.
  const srdTable: [number, number][] = [
    [3, -4],
    [4, -3], [5, -3],
    [6, -2], [7, -2],
    [8, -1], [9, -1],
    [10, 0], [11, 0],
    [12, 1], [13, 1],
    [14, 2], [15, 2],
    [16, 3], [17, 3],
    [18, 4], [19, 4],
    [20, 5],
  ]
  test.each(srdTable)('score %i gives %i', (score, modifier) => {
    expect(abilityModifier(score)).toBe(modifier)
  })

  // The extracted SRD table starts at 3, so scores 1 and 2 follow the same formula but are not checked against it.
  test('scores 1 and 2 follow the formula', () => {
    expect(abilityModifier(1)).toBe(-5)
    expect(abilityModifier(2)).toBe(-4)
  })
})

describe('standard array', () => {
  test('accepts a full valid assignment', () => {
    const result = checkStandardArray({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })
    expect(result.valid).toBe(true)
  })

  test('accepts a partial assignment', () => {
    expect(checkStandardArray({ str: 15, dex: 8 }).valid).toBe(true)
  })

  test('refuses a repeated value', () => {
    const result = checkStandardArray({ str: 15, dex: 15 })
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  test('refuses a value not in the array', () => {
    expect(checkStandardArray({ str: 16 }).valid).toBe(false)
  })
})

describe('pool of values (standard array and rolled scores)', () => {
  test('a value that appears twice in the pool can be used twice', () => {
    expect(checkFromPool({ str: 12, dex: 12 }, [12, 12, 9]).valid).toBe(true)
    expect(checkFromPool({ str: 12, dex: 12, con: 12 }, [12, 12, 9]).valid).toBe(false)
  })

  test('available values leave out what other abilities use', () => {
    const scores = { str: 15, dex: 14 }
    expect(availableFromPool(STANDARD_ARRAY, scores, 'con')).toEqual([13, 12, 10, 8])
  })

  test('an ability can still pick its own current value', () => {
    const scores = { str: 15, dex: 14 }
    expect(availableFromPool(STANDARD_ARRAY, scores, 'str')).toEqual([15, 13, 12, 10, 8])
  })

  test('duplicate pool values are listed once, and used ones are removed one at a time', () => {
    expect(availableFromPool([12, 12, 9], {}, 'str')).toEqual([12, 9])
    expect(availableFromPool([12, 12, 9], { dex: 12 }, 'str')).toEqual([12, 9])
    expect(availableFromPool([12, 12, 9], { dex: 12, con: 12 }, 'str')).toEqual([9])
  })
})

describe('point buy', () => {
  // SRD "Ability Score Point Costs" table.
  const costs: [number, number][] = [
    [8, 0], [9, 1], [10, 2], [11, 3], [12, 4], [13, 5], [14, 7], [15, 9],
  ]
  test.each(costs)('score %i costs %i', (score, cost) => {
    expect(pointBuyCost(score)).toBe(cost)
  })

  test('scores outside 8 to 15 have no cost', () => {
    expect(pointBuyCost(7)).toBeUndefined()
    expect(pointBuyCost(16)).toBeUndefined()
  })

  test('all 8s spend nothing', () => {
    const result = checkPointBuy({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })
    expect(result).toMatchObject({ valid: true, spent: 0, remaining: 27 })
  })

  test('15, 15, 15, 8, 8, 8 spends exactly 27', () => {
    const result = checkPointBuy({ str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 })
    expect(result).toMatchObject({ valid: true, spent: 27, remaining: 0 })
  })

  test('refuses spending over 27', () => {
    const result = checkPointBuy({ str: 15, dex: 15, con: 15, int: 9, wis: 8, cha: 8 })
    expect(result.valid).toBe(false)
    expect(result.spent).toBe(28)
  })

  test('refuses a score outside 8 to 15', () => {
    expect(checkPointBuy({ str: 16 }).valid).toBe(false)
    expect(checkPointBuy({ str: 7 }).valid).toBe(false)
  })

  test('tracks points while partly assigned', () => {
    expect(checkPointBuy({ str: 14, dex: 13 })).toMatchObject({ spent: 12, remaining: 15 })
  })
})

describe('roll', () => {
  test('drops the lowest of four dice', () => {
    // dice 1, 2, 3, 4: the 1 is dropped, so 2 + 3 + 4 = 9
    expect(rollAbilityScore(diceToRandom([1, 2, 3, 4]))).toBe(9)
  })

  test('drops the lowest wherever it appears', () => {
    expect(rollAbilityScore(diceToRandom([6, 1, 5, 4]))).toBe(15)
  })

  test('keeps a tie correctly', () => {
    expect(rollAbilityScore(diceToRandom([3, 3, 3, 3]))).toBe(9)
  })

  test('lowest possible result is 3 and highest is 18', () => {
    expect(rollAbilityScore(() => 0)).toBe(3)
    expect(rollAbilityScore(() => 0.9999)).toBe(18)
  })

  test('six rolls use 24 dice in order', () => {
    const dice = [
      1, 2, 3, 4, // 9
      6, 6, 6, 6, // 18
      1, 1, 1, 1, // 3
      2, 3, 4, 5, // 12
      5, 5, 1, 2, // 12
      3, 4, 6, 1, // 13
    ]
    expect(rollAbilityScores(diceToRandom(dice))).toEqual([9, 18, 3, 12, 12, 13])
  })
})

describe('manual entry', () => {
  test.each([1, 10, 20])('accepts %i', (score) => {
    expect(checkManualScore(score).valid).toBe(true)
  })

  test.each([0, 21, -1, 10.5, NaN])('refuses %s', (score) => {
    expect(checkManualScore(score).valid).toBe(false)
  })
})
