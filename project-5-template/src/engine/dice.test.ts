import { describe, expect, test } from 'vitest'
import { ROLL_HISTORY_LIMIT, addToHistory, describeRoll, rollCheck, rollDie, type RollResult } from './dice'

// Turns the dice we want into random values, so tests are repeatable. A die with `sides` sides gives
// floor(r * sides) + 1, so r = (value - 1) / sides + 0.01 gives exactly `value`.
function d20Sequence(values: number[]) {
  let i = 0
  return () => (values[i++] - 1) / 20 + 0.01
}

describe('rollDie', () => {
  test('stays between 1 and the number of sides', () => {
    expect(rollDie(20, () => 0)).toBe(1)
    expect(rollDie(20, () => 0.9999)).toBe(20)
    expect(rollDie(6, () => 0)).toBe(1)
    expect(rollDie(6, () => 0.9999)).toBe(6)
  })
})

describe('rollCheck', () => {
  test('a normal roll rolls one d20 and adds the bonus', () => {
    const roll = rollCheck('Athletics check', 5, 'normal', d20Sequence([14]))
    expect(roll).toEqual({ label: 'Athletics check', mode: 'normal', dice: [14], kept: 14, bonus: 5, total: 19 })
  })

  test('a negative bonus subtracts', () => {
    expect(rollCheck('Stealth check', -1, 'normal', d20Sequence([10])).total).toBe(9)
  })

  test('advantage rolls two d20s and keeps the higher', () => {
    const roll = rollCheck('Stealth check', 2, 'advantage', d20Sequence([6, 17]))
    expect(roll.dice).toEqual([6, 17])
    expect(roll.kept).toBe(17)
    expect(roll.total).toBe(19)
  })

  test('disadvantage rolls two d20s and keeps the lower', () => {
    const roll = rollCheck('Stealth check', 2, 'disadvantage', d20Sequence([6, 17]))
    expect(roll.kept).toBe(6)
    expect(roll.total).toBe(8)
  })

  test('advantage and disadvantage with equal dice keep that value', () => {
    expect(rollCheck('x', 0, 'advantage', d20Sequence([9, 9])).kept).toBe(9)
    expect(rollCheck('x', 0, 'disadvantage', d20Sequence([9, 9])).kept).toBe(9)
  })

  test('a normal roll uses exactly one die and advantage exactly two', () => {
    const random = d20Sequence([3, 4, 5, 6, 7])
    rollCheck('x', 0, 'normal', random) // uses 3
    const second = rollCheck('x', 0, 'advantage', random) // uses 4 and 5
    const third = rollCheck('x', 0, 'normal', random) // uses 6
    expect(second.dice).toEqual([4, 5])
    expect(third.dice).toEqual([6])
  })

  test('lowest and highest possible d20 results', () => {
    expect(rollCheck('x', 3, 'normal', () => 0).total).toBe(1 + 3)
    expect(rollCheck('x', 3, 'normal', () => 0.9999).total).toBe(20 + 3)
  })
})

describe('roll history', () => {
  const roll = (n: number): RollResult => ({ label: `roll ${n}`, mode: 'normal', dice: [n], kept: n, bonus: 0, total: n })

  test('the newest roll comes first', () => {
    const history = addToHistory(addToHistory([], roll(1)), roll(2))
    expect(history.map((entry) => entry.total)).toEqual([2, 1])
  })

  test('keeps only the last 20 rolls', () => {
    let history: RollResult[] = []
    for (let n = 1; n <= 25; n++) history = addToHistory(history, roll(n))
    expect(ROLL_HISTORY_LIMIT).toBe(20)
    expect(history).toHaveLength(20)
    expect(history[0].total).toBe(25) // newest
    expect(history[19].total).toBe(6) // the 20th newest; rolls 1 to 5 dropped off
  })

  test('does not change the old list', () => {
    const old = [roll(1)]
    addToHistory(old, roll(2))
    expect(old).toHaveLength(1)
  })
})

describe('describeRoll', () => {
  test('a normal roll', () => {
    expect(describeRoll(rollCheck('Athletics check', 5, 'normal', d20Sequence([14])))).toBe('Athletics check: 19 (d20 14 + 5)')
  })

  test('a negative bonus', () => {
    expect(describeRoll(rollCheck('Stealth check', -1, 'normal', d20Sequence([10])))).toBe('Stealth check: 9 (d20 10 - 1)')
  })

  test('advantage and disadvantage show both dice', () => {
    expect(describeRoll(rollCheck('Stealth check', 2, 'advantage', d20Sequence([6, 17])))).toBe(
      'Stealth check: 19 (d20 6 and 17, higher 17 + 2)',
    )
    expect(describeRoll(rollCheck('Stealth check', 2, 'disadvantage', d20Sequence([6, 17])))).toBe(
      'Stealth check: 8 (d20 6 and 17, lower 6 + 2)',
    )
  })
})
