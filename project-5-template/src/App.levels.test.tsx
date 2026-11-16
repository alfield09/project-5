// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './storage/characterStorage'
import { MemoryStorage } from './storage/memoryStorage'

afterEach(cleanup)

type User = ReturnType<typeof userEvent.setup>

const sheet = () => within(screen.getByRole('region', { name: 'Character sheet' }))
const stat = (label: string) => sheet().getByText(label).nextElementSibling?.textContent ?? ''
const notice = () => document.querySelector('.notice')?.textContent ?? ''
const saved = (storage: MemoryStorage) => JSON.parse(storage.items.get(STORAGE_KEY) ?? 'null')?.character
const setLevel = (user: User, level: number) => user.selectOptions(screen.getByLabelText('Level'), String(level))

/** The approved Dwarf Fighter (test-characters.md), built through the page controls. */
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

describe('the level picker', () => {
  test('offers levels 1 to 20 and starts at 1, with no improvement to choose', () => {
    render(<App storage={new MemoryStorage()} />)
    const select = screen.getByLabelText('Level') as HTMLSelectElement
    expect(select.value).toBe('1')
    expect([...select.options].map((option) => option.value)).toEqual(Array.from({ length: 20 }, (_, index) => String(index + 1)))
    expect(screen.queryByText(/Ability Score Improvement$/)).toBeNull()
  })

  test('level 4 asks for an Ability Score Improvement, and the sheet waits for it', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildFighter(user)
    expect(stat('Armor class')).toBe('16')

    await setLevel(user, 4)
    expect(screen.getByRole('group', { name: 'Level 4 Ability Score Improvement' })).toBeTruthy()
    expect(sheet().queryByText('Armor class')).toBeNull() // no numbers until it is chosen
    expect(sheet().getByText('choose your level 4 Ability Score Improvement')).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Level 4: +2 to'), 'Strength')
    expect(stat('Hit points (max)')).toBe('40') // 10 + 2 + 3 x (6 + 2) + 4 (Dwarven Toughness at level 4)
    expect(stat('Proficiency bonus')).toBe('+2')
  })

  test('the Dwarf Fighter at level 5 matches the hand calculation', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildFighter(user)
    await setLevel(user, 5)
    await user.selectOptions(screen.getByLabelText('Level 4: +2 to'), 'Strength')

    expect(stat('Proficiency bonus')).toBe('+3')
    expect(stat('Armor class')).toBe('16')
    expect(stat('Hit points (max)')).toBe('49') // 10 + 2 + 4 x (6 + 2) + 5
    expect(stat('Hit dice')).toBe('5d10')
    expect(sheet().getByRole('button', { name: 'Roll Athletics check, +7' })).toBeTruthy() // STR 19 (+4) + 3
    expect(sheet().getByRole('button', { name: 'Roll Strength saving throw, +7' })).toBeTruthy()
    expect(screen.getByText(/Dwarf Fighter, level 5/)).toBeTruthy()
  })

  test('the +1 and +1 choice raises two abilities', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildFighter(user)
    await setLevel(user, 4)
    await user.click(screen.getByLabelText('+1 to two abilities'))
    await user.selectOptions(screen.getByLabelText('Level 4: first +1 to'), 'Dexterity')
    expect(sheet().queryByText('Armor class')).toBeNull() // only one of the two is chosen
    await user.selectOptions(screen.getByLabelText('Level 4: second +1 to'), 'Constitution')

    expect(sheet().getByLabelText('Dexterity score').textContent).toBe('14')
    expect(sheet().getByLabelText('Constitution score').textContent).toBe('16')
    expect(sheet().getByLabelText('Strength score').textContent).toBe('17')
  })

  test('the class features and numbers for the level are listed on the sheet', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildFighter(user)
    await setLevel(user, 3)

    const features = sheet().getByRole('list', { name: 'Class features' })
    const names = [...features.querySelectorAll('summary strong')].map((element) => element.textContent)
    expect(names).toEqual(['Fighting Style', 'Second Wind', 'Weapon Mastery', 'Action Surge', 'Tactical Mind', 'Fighter Subclass'])
    expect(within(sheet().getByRole('list', { name: 'Class numbers' })).getByText('Second Wind').nextElementSibling?.textContent).toBe('2')
    expect(sheet().queryByText('Extra Attack')).toBeNull() // gained at level 5
  })

  test('the level and improvements are saved and come back after a reload', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await buildFighter(user)
    await setLevel(user, 5)
    await user.selectOptions(screen.getByLabelText('Level 4: +2 to'), 'Strength')
    expect(saved(storage).level).toBe(5)
    first.unmount()

    render(<App storage={storage} />)
    expect((screen.getByLabelText('Level') as HTMLSelectElement).value).toBe('5')
    expect((screen.getByLabelText('Level 4: +2 to') as HTMLSelectElement).value).toBe('str')
    expect(stat('Hit points (max)')).toBe('49')
  })

  test('lowering the level removes the improvements it no longer has, with a notice', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStorage()
    render(<App storage={storage} />)
    await buildFighter(user)
    await setLevel(user, 5)
    await user.selectOptions(screen.getByLabelText('Level 4: +2 to'), 'Strength')

    await setLevel(user, 3)
    expect(notice()).toMatch(/Ability Score Improvements for levels the character no longer has: level 4/)
    expect(screen.queryByRole('group', { name: 'Level 4 Ability Score Improvement' })).toBeNull()
    expect(saved(storage).abilityImprovements).toEqual({})
    expect(stat('Hit points (max)')).toBe('31') // 10 + 2 + 2 x (6 + 2) + 3 (Dwarven Toughness at level 3; CON 15 is +2)
  })

  test('the Fighter has an improvement at level 6 as well', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildFighter(user)
    await setLevel(user, 6)
    expect(screen.getByRole('group', { name: 'Level 4 Ability Score Improvement' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Level 6 Ability Score Improvement' })).toBeTruthy()
  })
})

describe('casters at higher levels', () => {
  async function buildCaster(user: User, className: string, extra?: (user: User) => Promise<void>) {
    await user.selectOptions(screen.getByLabelText('Species'), 'Human')
    await user.selectOptions(screen.getByLabelText('Background'), 'Criminal')
    await user.selectOptions(screen.getByLabelText('Class'), className)
    await user.selectOptions(screen.getByLabelText('Strength'), '8')
    await user.selectOptions(screen.getByLabelText('Dexterity'), '14')
    await user.selectOptions(screen.getByLabelText('Constitution'), '13')
    await user.selectOptions(screen.getByLabelText('Intelligence'), '10')
    await user.selectOptions(screen.getByLabelText('Wisdom'), '12')
    await user.selectOptions(screen.getByLabelText('Charisma'), '15')
    await user.selectOptions(screen.getByLabelText('+2 to'), 'Dexterity')
    await user.selectOptions(screen.getByLabelText('+1 to'), 'Constitution')
    if (extra) await extra(user)
  }

  test('a Sorcerer at level 5 has the level 5 slots and picks up to level 3 spells', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildCaster(user, 'Sorcerer', async (u) => {
      const skills = within(screen.getByRole('group', { name: /Class skills/ }))
      await u.click(skills.getByLabelText('Arcana'))
      await u.click(skills.getByLabelText('Persuasion'))
      await u.click(within(screen.getByRole('group', { name: /Human skill/ })).getByLabelText('Perception'))
      await u.click(screen.getByLabelText(/^A: Spear/))
    })
    await setLevel(user, 5)
    await user.selectOptions(screen.getByLabelText('Level 4: +2 to'), 'Charisma')

    expect(document.querySelector('.pick-counts')?.textContent).toBe('Cantrips: 0 of 5 chosen. Level 1+ spells: 0 of 9 chosen.')
    const list = within(screen.getByRole('list', { name: 'Sorcerer spells' }))
    expect(list.getByLabelText('Fireball')).toBeTruthy() // a level 3 spell is offered at level 5
    expect(list.queryByLabelText('Wish')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Spells' }))
    const spells = within(document.getElementById('spells-heading')?.closest('section') as HTMLElement)
    expect(spells.getByText('Spell save DC').nextElementSibling?.textContent).toBe('14') // 8 + 3 + 3
    expect(spells.getByText('Level 1 slots').nextElementSibling?.textContent).toBe('4')
    expect(spells.getByText('Level 2 slots').nextElementSibling?.textContent).toBe('3')
    expect(spells.getByText('Level 3 slots').nextElementSibling?.textContent).toBe('2')
    expect(spells.queryByText('Level 4 slots')).toBeNull()
  })

  test('a Warlock at level 5 picks five invocations and shows Pact Magic slots of one level', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildCaster(user, 'Warlock', async (u) => {
      const skills = within(screen.getByRole('group', { name: /Class skills/ }))
      await u.click(skills.getByLabelText('Arcana'))
      await u.click(skills.getByLabelText('Deception'))
      await u.click(within(screen.getByRole('group', { name: /Human skill/ })).getByLabelText('Perception'))
      await u.click(screen.getByLabelText(/^B:/))
    })
    await setLevel(user, 5)
    await user.selectOptions(screen.getByLabelText('Level 4: +2 to'), 'Charisma')
    expect(screen.getByRole('group', { name: 'Eldritch Invocation: pick 5' })).toBeTruthy()
    expect(sheet().getByText('choose 5 Eldritch Invocations')).toBeTruthy()

    const group = within(screen.getByRole('group', { name: 'Eldritch Invocation: pick 5' }))
    for (const name of ['Armor of Shadows', 'Eldritch Mind', 'Pact of the Blade', 'Pact of the Chain', 'Pact of the Tome']) {
      await user.click(group.getByLabelText(name))
    }
    expect(stat('Armor class')).toBe('16') // Armor of Shadows: 13 + Dex 3

    await user.click(screen.getByRole('button', { name: 'Spells' }))
    const spells = within(document.getElementById('spells-heading')?.closest('section') as HTMLElement)
    expect(spells.getByText('Level 3 slots (Pact Magic)').nextElementSibling?.textContent).toBe('2')
    expect(spells.queryByText(/^Level 1 slots/)).toBeNull() // the zero entries are not listed
  })

  test('a Wizard at level 3 has a spellbook of 10', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Wizard')
    await setLevel(user, 3)
    expect(document.querySelector('.book-count')?.textContent).toMatch(/0 of 10/)
    expect(document.querySelector('.pick-counts')?.textContent).toMatch(/Level 1\+ spells: 0 of 6/)
  })
})

describe('printing a leveled character', () => {
  test('the features print with their full text', async () => {
    const user = userEvent.setup()
    render(<App storage={new MemoryStorage()} />)
    await buildFighter(user)
    await setLevel(user, 3)
    const details = () => [...document.querySelectorAll('.feature-list details')] as HTMLDetailsElement[]
    expect(details().every((element) => !element.open)).toBe(true) // collapsed on screen

    act(() => void window.dispatchEvent(new Event('beforeprint')))
    expect(details()).toHaveLength(6)
    expect(details().every((element) => element.open)).toBe(true)
    act(() => void window.dispatchEvent(new Event('afterprint')))
    expect(details().every((element) => !element.open)).toBe(true)
  })
})
