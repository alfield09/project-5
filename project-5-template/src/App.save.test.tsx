// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'
import { STORAGE_KEY, type StorageLike } from './storage/characterStorage'
import { MemoryStorage } from './storage/memoryStorage'

afterEach(cleanup)

type User = ReturnType<typeof userEvent.setup>

const sheet = () => within(screen.getByRole('region', { name: 'Character sheet' }))
const stat = (label: string) => sheet().getByText(label).nextElementSibling?.textContent ?? ''
const saveStatus = () => document.querySelector('.save-status')?.textContent ?? ''
const savedCharacter = (storage: MemoryStorage) => JSON.parse(storage.items.get(STORAGE_KEY) ?? 'null')?.character

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

describe('saving and reloading', () => {
  test('nothing is saved until the player changes something', () => {
    const storage = new MemoryStorage()
    render(<App storage={storage} />)
    expect(storage.items.size).toBe(0)
    expect(saveStatus()).toMatch(/saved in this browser as you make changes/)
  })

  test('a reload brings back the whole character and the same sheet', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await buildFighter(user)
    expect(saveStatus()).toBe('Saved in this browser.')
    first.unmount() // closing the page

    render(<App storage={storage} />) // opening it again

    expect((screen.getByLabelText('Species') as HTMLSelectElement).value).toBe('dwarf')
    expect((screen.getByLabelText('Class') as HTMLSelectElement).value).toBe('fighter')
    expect((screen.getByLabelText('Strength') as HTMLSelectElement).value).toBe('15')
    expect((screen.getByLabelText('Perception') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText(/^A: Chain Mail/) as HTMLInputElement).checked).toBe(true)
    expect(stat('Armor class')).toBe('16') // the numbers from test-characters.md
    expect(stat('Hit points (max)')).toBe('13')
    expect(stat('Initiative')).toBe('+1')
  })

  test('rolled scores survive a reload instead of being rolled again', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} random={() => 0.5} />) // every d6 comes up 4: each score is 12
    await user.click(screen.getByLabelText('Roll (4d6, drop lowest)'))
    await user.click(screen.getByRole('button', { name: 'Roll scores' }))
    expect(screen.getByText('Rolled: 12, 12, 12, 12, 12, 12')).toBeTruthy()
    first.unmount()

    render(<App storage={storage} random={() => 0} />) // a different dice source: a re-roll would give 3s
    expect(screen.getByText('Rolled: 12, 12, 12, 12, 12, 12')).toBeTruthy()
    expect((screen.getByLabelText('Roll (4d6, drop lowest)') as HTMLInputElement).checked).toBe(true)
  })

  test('manual scores come back in the boxes', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await user.click(screen.getByLabelText('Manual entry'))
    await user.type(screen.getByLabelText('Strength'), '17')
    first.unmount()

    render(<App storage={storage} />)
    expect((screen.getByLabelText('Strength') as HTMLInputElement).value).toBe('17')
    expect((screen.getByLabelText('Manual entry') as HTMLInputElement).checked).toBe(true)
  })

  test('the roll history is not saved', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} random={() => 0.5} />)
    await buildFighter(user)
    await user.click(screen.getByRole('button', { name: 'Roll Athletics check, +5' }))
    expect(screen.getByRole('list', { name: 'Roll history' })).toBeTruthy()
    first.unmount()

    render(<App storage={storage} />)
    expect(screen.queryByRole('list', { name: 'Roll history' })).toBeNull()
    expect(JSON.stringify(savedCharacter(storage))).not.toContain('Athletics check')
  })
})

describe('editing after a reload', () => {
  test('changing a choice after a reload updates the sheet and the saved copy', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await buildFighter(user)
    first.unmount()

    render(<App storage={storage} />)
    await user.click(screen.getByLabelText(/^B: Studded Leather/)) // a different equipment package

    expect(stat('Armor class')).toBe('13')
    expect(savedCharacter(storage).equipmentOptionId).toBe('B')
  })

  test('a change that makes a choice invalid clears it, tells the player, and saves the cleared version', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await buildFighter(user)
    first.unmount()

    render(<App storage={storage} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')

    expect(screen.getByText(/class skills no longer available: Perception, Survival/)).toBeTruthy()
    expect(savedCharacter(storage).classId).toBe('sorcerer')
    expect(savedCharacter(storage).classSkills).toEqual([])
  })
})

describe('saved text that cannot be used', () => {
  test('a damaged save starts a new character and says so', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{not json')
    render(<App storage={storage} />)

    expect(screen.getByRole('alert').textContent).toMatch(/could not be read/)
    expect((screen.getByLabelText('Species') as HTMLSelectElement).value).toBe('')
    expect(storage.items.get(STORAGE_KEY)).toBe('{not json') // not touched until the player changes something
  })

  test('the damaged save is replaced by the first change', async () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{not json')
    const user = userEvent.setup()
    render(<App storage={storage} />)

    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    expect(savedCharacter(storage).classId).toBe('fighter')
  })

  test('a saved species the catalog no longer has is cleared with a notice', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        character: { edition: '2024', level: 1, speciesId: 'elfling', classId: 'fighter', baseScores: {}, classSkills: [], speciesSkills: [] },
      }),
    )
    render(<App storage={storage} />)

    expect(screen.getByText(/species "elfling", which the catalog does not offer/)).toBeTruthy()
    expect((screen.getByLabelText('Species') as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText('Class') as HTMLSelectElement).value).toBe('fighter') // the rest is kept
  })
})

describe('storage that does not work', () => {
  test('with no storage the page still works and says nothing is saved', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    expect(saveStatus()).toMatch(/Not saved: browser storage is not available/)

    await buildFighter(user)
    expect(stat('Armor class')).toBe('16')
    expect(saveStatus()).toMatch(/kept only while this page is open/)
  })

  test('when storage is full the page keeps working and says it could not save', async () => {
    const full: StorageLike = {
      getItem: () => null,
      removeItem: () => {},
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }
    const user = userEvent.setup()
    render(<App storage={full} />)

    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')

    expect(saveStatus()).toMatch(/Not saved: browser storage is full or blocked/)
    expect((screen.getByLabelText('Class') as HTMLSelectElement).value).toBe('fighter') // the change still applied
  })
})
