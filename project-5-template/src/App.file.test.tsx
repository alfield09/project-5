// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'
import { characterToFileText } from './storage/characterFile'
import { STORAGE_KEY } from './storage/characterStorage'
import { MemoryStorage } from './storage/memoryStorage'

afterEach(cleanup)

type User = ReturnType<typeof userEvent.setup>

const sheet = () => within(screen.getByRole('region', { name: 'Character sheet' }))
const stat = (label: string) => sheet().getByText(label).nextElementSibling?.textContent ?? ''
const savedCharacter = (storage: MemoryStorage) => JSON.parse(storage.items.get(STORAGE_KEY) ?? 'null')?.character

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

const fileInput = () => screen.getByLabelText('Load a character file') as HTMLInputElement
const jsonFile = (text: string, name = 'c.json') => new File([text], name, { type: 'application/json' })

describe('download and load a character file', () => {
  test('downloading gives a file that holds the whole character', async () => {
    const downloads: { name: string; text: string }[] = []
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} download={(name, text) => downloads.push({ name, text })} />)
    await buildFighter(user)

    await user.click(screen.getByRole('button', { name: 'Download character file' }))

    expect(downloads).toHaveLength(1)
    expect(downloads[0].name).toBe('sheetforge-fighter.json')
    const file = JSON.parse(downloads[0].text)
    expect(file.character.classId).toBe('fighter')
    expect(file.character.baseScores.str).toBe(15)
    expect(screen.getByText(/^Downloaded/)).toBeTruthy()
  })

  test('a downloaded file loaded into an empty page gives the same sheet', async () => {
    const downloads: string[] = []
    const user = userEvent.setup()
    const first = render(<App storage={new MemoryStorage()} download={(_name, text) => downloads.push(text)} />)
    await buildFighter(user)
    await user.click(screen.getByRole('button', { name: 'Download character file' }))
    first.unmount()

    const storage = new MemoryStorage()
    render(<App storage={storage} />) // a new device: nothing saved
    expect(sheet().queryByText('Armor class')).toBeNull()

    await user.upload(fileInput(), jsonFile(downloads[0]))
    await user.click(await screen.findByRole('button', { name: 'Replace my character' }))

    expect(stat('Armor class')).toBe('16') // the numbers from test-characters.md
    expect(stat('Hit points (max)')).toBe('13')
    expect((screen.getByLabelText('Class') as HTMLSelectElement).value).toBe('fighter')
    expect(savedCharacter(storage).classId).toBe('fighter') // and it is saved in this browser too
  })

  test('nothing changes until the player confirms, and "Keep" leaves the character alone', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStorage()
    render(<App storage={storage} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Wizard')

    const other = characterToFileText({ edition: '2024', level: 1, classId: 'fighter', baseScores: {}, classSkills: [], speciesSkills: [] })
    await user.upload(fileInput(), jsonFile(other))
    await screen.findByRole('button', { name: 'Replace my character' })
    expect((screen.getByLabelText('Class') as HTMLSelectElement).value).toBe('wizard') // still the Wizard

    await user.click(screen.getByRole('button', { name: 'Keep my character' }))
    expect(screen.queryByRole('button', { name: 'Replace my character' })).toBeNull()
    expect((screen.getByLabelText('Class') as HTMLSelectElement).value).toBe('wizard')
    expect(savedCharacter(storage).classId).toBe('wizard')
  })

  test.each([
    ['not JSON', 'hello'],
    ['another app', JSON.stringify({ app: 'other', kind: 'character', version: 1, character: {} })],
    ['an invalid character', JSON.stringify({ app: 'sheetforge', kind: 'character', version: 1, character: { level: 50 } })],
  ])('a bad file (%s) is refused, says so, and leaves the character alone', async (_name, text) => {
    const user = userEvent.setup()
    const storage = new MemoryStorage()
    render(<App storage={storage} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Wizard')

    await user.upload(fileInput(), jsonFile(text))

    expect((await screen.findByText(/could not be used/)).textContent).toMatch(/Your character was not changed/)
    expect(screen.queryByRole('button', { name: 'Replace my character' })).toBeNull()
    expect((screen.getByLabelText('Class') as HTMLSelectElement).value).toBe('wizard')
    expect(savedCharacter(storage).classId).toBe('wizard')
  })

  test('choices the catalog does not offer are cleared with a notice instead of being kept', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    const text = characterToFileText({ edition: '2024', level: 1, classId: 'fighter', speciesId: 'gnoll', baseScores: {}, classSkills: [], speciesSkills: [] })

    await user.upload(fileInput(), jsonFile(text))
    await user.click(await screen.findByRole('button', { name: 'Replace my character' }))

    expect(screen.getByText(/Cleared from the loaded file/)).toBeTruthy()
    expect(screen.getByText(/species "gnoll"/)).toBeTruthy()
    expect((screen.getByLabelText('Class') as HTMLSelectElement).value).toBe('fighter')
  })
})
