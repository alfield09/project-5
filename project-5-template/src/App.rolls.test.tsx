// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  window.localStorage.clear() // each test starts with nothing saved
})

/** Random values that make each d20 come out as the next number in the list. */
function d20Sequence(values: number[]) {
  let i = 0
  return () => (values[i++] - 1) / 20 + 0.01
}

type User = ReturnType<typeof userEvent.setup>

/** Builds the approved Fighter through the page controls (see test-characters.md). */
async function buildFighter(user: User) {
  await user.selectOptions(screen.getByLabelText('Species'), 'Dwarf')
  await user.selectOptions(screen.getByLabelText('Background'), 'Soldier')
  await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
  await user.selectOptions(screen.getByLabelText('Strength'), '15')
  await user.selectOptions(screen.getByLabelText('Dexterity'), '13')
  await user.selectOptions(screen.getByLabelText('Constitution'), '14')
  await user.selectOptions(screen.getByLabelText('Intelligence'), '10')
  await user.selectOptions(screen.getByLabelText('Wisdom'), '12')
  await user.selectOptions(screen.getByLabelText('Charisma'), '8')
  await user.selectOptions(screen.getByLabelText('+2 to'), 'Strength')
  await user.selectOptions(screen.getByLabelText('+1 to'), 'Constitution')
  await user.click(screen.getByLabelText('Perception'))
  await user.click(screen.getByLabelText('Survival'))
  await user.click(screen.getByLabelText(/^A: Chain Mail/))
}

const latest = () => document.querySelector('.latest-roll')?.textContent ?? ''
const history = () => within(screen.getByRole('list', { name: 'Roll history' })).getAllByRole('listitem').map((item) => item.textContent)
const rollButton = (name: string) => screen.getByRole('button', { name })

describe('click to roll', () => {
  test('before the sheet is complete there is nothing to roll', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: /(check|saving throw|initiative),/i })).toBeNull()
    expect(screen.getByText(/Click a skill, saving throw, ability or initiative to roll it/)).toBeTruthy()
  })

  test('clicking a skill rolls a d20 plus its bonus and records it', async () => {
    const user = userEvent.setup()
    render(<App random={d20Sequence([14])} />)
    await buildFighter(user)

    await user.click(rollButton('Roll Athletics check, +5'))

    expect(latest()).toBe('Athletics check: 19 (d20 14 + 5)')
    expect(history()).toEqual(['Athletics check: 19 (d20 14 + 5)'])
  })

  test('saving throws, ability checks and initiative can all be rolled', async () => {
    const user = userEvent.setup()
    render(<App random={d20Sequence([10, 10, 10, 10])} />)
    await buildFighter(user)

    await user.click(rollButton('Roll Strength saving throw, +5')) // proficient save: +3 + 2
    await user.click(rollButton('Roll Strength check, +3')) // plain ability check
    await user.click(rollButton('Roll initiative, +1'))
    await user.click(rollButton('Roll Charisma check, -1')) // a negative modifier

    expect(history()).toEqual([
      'Charisma check: 9 (d20 10 - 1)',
      'Initiative: 11 (d20 10 + 1)',
      'Strength check: 13 (d20 10 + 3)',
      'Strength saving throw: 15 (d20 10 + 5)',
    ])
  })

  test('advantage rolls two dice, keeps the higher, and then resets to normal', async () => {
    const user = userEvent.setup()
    render(<App random={d20Sequence([6, 17, 10])} />)
    await buildFighter(user)

    await user.click(screen.getByLabelText('Advantage'))
    await user.click(rollButton('Roll Athletics check, +5'))
    expect(latest()).toBe('Athletics check: 22 (d20 6 and 17, higher 17 + 5)')
    expect((screen.getByLabelText('Normal') as HTMLInputElement).checked).toBe(true) // reset after the roll

    await user.click(rollButton('Roll Athletics check, +5'))
    expect(latest()).toBe('Athletics check: 15 (d20 10 + 5)') // a single die again
  })

  test('disadvantage keeps the lower die', async () => {
    const user = userEvent.setup()
    render(<App random={d20Sequence([6, 17])} />)
    await buildFighter(user)

    await user.click(screen.getByLabelText('Disadvantage'))
    await user.click(rollButton('Roll Stealth check, +1'))
    expect(latest()).toBe('Stealth check: 7 (d20 6 and 17, lower 6 + 1)')
  })

  test('the history lists the newest roll first and Clear empties it', async () => {
    const user = userEvent.setup()
    render(<App random={d20Sequence([5, 18])} />)
    await buildFighter(user)

    await user.click(rollButton('Roll Athletics check, +5'))
    await user.click(rollButton('Roll Survival check, +3'))
    expect(history()).toEqual(['Survival check: 21 (d20 18 + 3)', 'Athletics check: 10 (d20 5 + 5)'])

    await user.click(screen.getByRole('button', { name: 'Clear history' }))
    expect(screen.queryByRole('list', { name: 'Roll history' })).toBeNull()
    expect(latest()).toMatch(/Click a skill/)
  })

  test('the history keeps only the last 20 rolls', async () => {
    const user = userEvent.setup()
    render(<App random={d20Sequence(Array.from({ length: 22 }, (_, i) => i + 1))} />)
    await buildFighter(user)

    for (let i = 0; i < 22; i++) await user.click(rollButton('Roll Athletics check, +5'))

    const entries = history()
    expect(entries).toHaveLength(20)
    expect(entries[0]).toBe('Athletics check: 27 (d20 22 + 5)') // the newest
    expect(entries[19]).toBe('Athletics check: 8 (d20 3 + 5)') // rolls 1 and 2 dropped off
  })

  test('rollable items are real buttons that work from the keyboard', async () => {
    const user = userEvent.setup()
    render(<App random={d20Sequence([12])} />)
    await buildFighter(user)

    rollButton('Roll Perception check, +3').focus()
    await user.keyboard('{Enter}')

    expect(latest()).toBe('Perception check: 15 (d20 12 + 3)')
  })

  test('a change to the character updates the bonus that is rolled', async () => {
    const user = userEvent.setup()
    render(<App random={d20Sequence([10])} />)
    await buildFighter(user)

    // Strength 15 + 2 = 17 (+3). Raising the base to the standard array's top value is not possible twice,
    // so change the background bonus instead: +1 to all three gives Strength 16 (+3), Dexterity 14 (+2).
    await user.click(screen.getByLabelText('+1 to all three'))
    await user.click(rollButton('Roll Dexterity check, +2'))

    expect(latest()).toBe('Dexterity check: 12 (d20 10 + 2)')
  })
})
