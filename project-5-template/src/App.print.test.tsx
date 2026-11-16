// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'
import { MemoryStorage } from './storage/memoryStorage'

afterEach(cleanup)

const startPrint = () => act(() => void window.dispatchEvent(new Event('beforeprint')))
const endPrint = () => act(() => void window.dispatchEvent(new Event('afterprint')))
const sheetRegion = () => screen.queryByRole('region', { name: 'Character sheet' })
const spellsSection = () => document.getElementById('spells-heading')?.closest('section') ?? null

describe('printing includes every part of the sheet', () => {
  test('a caster prints the stats and the chosen spells with their full text, whichever view is showing', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    await user.click(within(screen.getByRole('list', { name: 'Sorcerer spells' })).getByLabelText('Ray of Frost'))
    expect(spellsSection()).toBeNull() // the Stats view is showing

    startPrint()
    expect(sheetRegion()).toBeTruthy()
    const spells = spellsSection()
    expect(spells).toBeTruthy()
    expect(within(spells as HTMLElement).getByText('Ray of Frost')).toBeTruthy()
    expect(((spells as HTMLElement).querySelector('details') as HTMLDetailsElement).open).toBe(true) // text is expanded for paper

    endPrint()
    expect(spellsSection()).toBeNull() // back to the one view
    expect(sheetRegion()).toBeTruthy()
  })

  test('it also prints everything when the Spells view is the one showing, and puts it back afterwards', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    await user.click(within(screen.getByRole('list', { name: 'Sorcerer spells' })).getByLabelText('Ray of Frost'))
    await user.click(screen.getByRole('button', { name: 'Spells' }))
    expect(sheetRegion()).toBeNull()

    startPrint()
    expect(sheetRegion()).toBeTruthy()
    expect(spellsSection()).toBeTruthy()

    endPrint()
    expect(sheetRegion()).toBeNull() // the Spells view again
    expect(spellsSection()).toBeTruthy()
  })

  test('a class that does not cast prints no empty Spells page', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    startPrint()
    expect(sheetRegion()).toBeTruthy()
    expect(spellsSection()).toBeNull()
    endPrint()
  })

  test('the level filter does not hide spells on paper', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    const list = within(screen.getByRole('list', { name: 'Sorcerer spells' }))
    await user.click(list.getByLabelText('Ray of Frost'))
    await user.click(screen.getByRole('button', { name: 'Spells' }))
    await user.click(screen.getByRole('button', { name: 'Level 1' })) // hides the cantrip on screen
    expect(within(spellsSection() as HTMLElement).queryByText('Ray of Frost')).toBeNull()

    // The printed Spells view is built fresh, so its filter starts at All.
    startPrint()
    expect(within(spellsSection() as HTMLElement).getByText('Ray of Frost')).toBeTruthy()
    endPrint()
  })
})
