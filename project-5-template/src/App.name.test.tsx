// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'
import { SKILLS } from './engine/skills'
import { characterToFileText, parseCharacterFile } from './storage/characterFile'
import { validateCharacter } from './storage/characterStorage'
import { MemoryStorage } from './storage/memoryStorage'

afterEach(cleanup)

const sheet = () => within(screen.getByRole('region', { name: 'Character sheet' }))
const base = { edition: '2024' as const, level: 1, baseScores: {}, classSkills: [], speciesSkills: [] }

/** Reads the --row and --span numbers the sheet puts on an element for the printed layout. */
const placement = (element: HTMLElement) => {
  const style = element.getAttribute('style') ?? ''
  return { row: Number(/--row:\s*(\d+)/.exec(style)?.[1]), span: Number(/--span:\s*(\d+)/.exec(style)?.[1] ?? 0) }
}

describe('character name', () => {
  test('typing a name shows it on the sheet and it survives a reload', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await user.type(screen.getByLabelText('Character name'), 'Thrain')
    expect(sheet().getByText('Thrain')).toBeTruthy()
    first.unmount()

    render(<App storage={storage} />)
    expect((screen.getByLabelText('Character name') as HTMLInputElement).value).toBe('Thrain')
    expect(sheet().getByText('Thrain')).toBeTruthy()
  })

  test('clearing the name removes it from the saved character', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    render(<App storage={storage} />)
    await user.type(screen.getByLabelText('Character name'), 'Ab')
    await user.clear(screen.getByLabelText('Character name'))
    expect(sheet().queryByText('Ab')).toBeNull()
    expect(JSON.parse([...storage.items.values()][0]).character.name).toBeUndefined()
  })

  test('the name stops at 60 characters in the field', () => {
    render(<App storage={new MemoryStorage()} />)
    expect((screen.getByLabelText('Character name') as HTMLInputElement).maxLength).toBe(60)
  })

  test('a name is kept in a character file and read back', () => {
    expect(parseCharacterFile(characterToFileText({ ...base, name: 'Thrain' }))).toEqual({ ok: true, character: { ...base, name: 'Thrain' } })
  })

  test('a name that is not text, or is too long, is refused', () => {
    expect(validateCharacter({ ...base, name: 5 }).ok).toBe(false)
    expect(validateCharacter({ ...base, name: ['Thrain'] }).ok).toBe(false) // short, so only the "is text" rule can refuse it
    expect(validateCharacter({ ...base, name: 'x'.repeat(61) }).ok).toBe(false)
    expect(validateCharacter({ ...base, name: 'x'.repeat(60) }).ok).toBe(true)
  })
})

describe('printed sheet placement', () => {
  async function buildFighter(user: ReturnType<typeof userEvent.setup>) {
    await user.selectOptions(screen.getByLabelText('Species'), 'Dwarf')
    await user.selectOptions(screen.getByLabelText('Background'), 'Soldier')
    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    for (const [label, value] of [['Strength', '15'], ['Dexterity', '13'], ['Constitution', '14'], ['Intelligence', '10'], ['Wisdom', '12'], ['Charisma', '8']]) {
      await user.selectOptions(screen.getByLabelText(label), value)
    }
    await user.selectOptions(screen.getByLabelText('+2 to'), 'Strength')
    await user.selectOptions(screen.getByLabelText('+1 to'), 'Constitution')
    await user.click(screen.getByLabelText('Perception'))
    await user.click(screen.getByLabelText('Survival'))
    await user.click(screen.getByLabelText(/^A: Chain Mail/))
  }

  test('each ability tile spans its saving throw and skills, with no overlap and no gap', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildFighter(user)

    const tiles = [...sheet().getByRole('list', { name: 'Ability scores' }).children] as HTMLElement[]
    const spans = tiles.map(placement)
    expect(spans.map((entry) => entry.span)).toEqual([2, 4, 1, 6, 6, 5]) // Str, Dex, Con, Int, Wis, Cha
    let expected = 1
    for (const entry of spans) {
      expect(entry.row).toBe(expected) // starts right after the one before
      expected += entry.span
    }
    expect(expected - 1).toBe(6 + SKILLS.length) // six saving throws and eighteen skills
  })

  test('each skill sits in the rows of its own ability, and each row is used once', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildFighter(user)

    const tiles = [...sheet().getByRole('list', { name: 'Ability scores' }).children].map((tile) => placement(tile as HTMLElement))
    const abilityIndex = ['str', 'dex', 'con', 'int', 'wis', 'cha']
    const used = new Set<number>()

    for (const skill of SKILLS) {
      const li = sheet().getByRole('button', { name: new RegExp(`^Roll ${skill.name} check`) }).closest('li') as HTMLElement
      const { row } = placement(li)
      const tile = tiles[abilityIndex.indexOf(skill.ability)]
      expect(row).toBeGreaterThan(tile.row) // below its saving throw
      expect(row).toBeLessThan(tile.row + tile.span) // inside its tile's rows
      expect(used.has(row)).toBe(false)
      used.add(row)
    }
    // The saving throw is the first row of each tile.
    for (const [index, name] of ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].entries()) {
      const li = sheet().getByRole('button', { name: new RegExp(`^Roll ${name} saving throw`) }).closest('li') as HTMLElement
      expect(placement(li).row).toBe(tiles[index].row)
    }
  })
})
