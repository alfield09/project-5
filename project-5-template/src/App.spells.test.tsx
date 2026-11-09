// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'
import { MemoryStorage } from './storage/memoryStorage'

afterEach(cleanup)

type User = ReturnType<typeof userEvent.setup>

/** Random values that make each d20 come out as the next number in the list. */
function d20Sequence(values: number[]) {
  let i = 0
  return () => (values[i++] - 1) / 20 + 0.01
}

/** Builds a Human Criminal Sorcerer (the approved Sorcerer's species, background and class) through the page controls. */
async function buildSorcerer(user: User) {
  await user.selectOptions(screen.getByLabelText('Species'), 'Human')
  await user.selectOptions(screen.getByLabelText('Background'), 'Criminal')
  await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
  await user.selectOptions(screen.getByLabelText('Strength'), '8')
  await user.selectOptions(screen.getByLabelText('Dexterity'), '15')
  await user.selectOptions(screen.getByLabelText('Constitution'), '13')
  await user.selectOptions(screen.getByLabelText('Intelligence'), '10')
  await user.selectOptions(screen.getByLabelText('Wisdom'), '12')
  await user.selectOptions(screen.getByLabelText('Charisma'), '14')
  await user.selectOptions(screen.getByLabelText('+2 to'), 'Dexterity')
  await user.selectOptions(screen.getByLabelText('+1 to'), 'Constitution')
  const classSkills = within(screen.getByRole('group', { name: /Class skills/ }))
  await user.click(classSkills.getByLabelText('Arcana'))
  await user.click(classSkills.getByLabelText('Persuasion'))
  await user.click(within(screen.getByRole('group', { name: /Human skill/ })).getByLabelText('Perception'))
  await user.click(screen.getByLabelText(/^A: Spear/))
}

const spellList = (className: string) => within(screen.getByRole('list', { name: `${className} spells` }))
const counts = () => document.querySelector('.pick-counts')?.textContent ?? ''
const checkbox = (list: ReturnType<typeof spellList>, name: string) => list.getByLabelText(name) as HTMLInputElement
const openSpellsView = async (user: User) => user.click(screen.getByRole('button', { name: 'Spells' }))
const sheetSpellsView = () => within(document.getElementById('spells-heading')?.closest('section') as HTMLElement)

describe('the spell picker in the builder', () => {
  test('asks for a class first, and a class that does not cast gets no picker', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    expect(screen.getByText('Choose a class to pick spells.')).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    expect(screen.getByText('Fighters do not cast spells at level 1.')).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Fighter spells' })).toBeNull()
  })

  test('the Sorcerer sees one list of cantrips and level 1 spells, with the SRD limits', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')

    expect(counts()).toBe('Cantrips: 0 of 4 chosen. Level 1 spells: 0 of 2 chosen.')
    const list = spellList('Sorcerer')
    expect(list.getAllByRole('listitem')).toHaveLength(37) // 16 cantrips and 21 level 1 spells
    expect(list.getByLabelText('Fire Bolt')).toBeTruthy()
    expect(list.getByLabelText('Magic Missile')).toBeTruthy()
    expect(list.queryByLabelText('Cure Wounds')).toBeNull() // not a Sorcerer spell
    expect(list.queryByLabelText('Fireball')).toBeNull() // level 3
  })

  test('the Paladin sees only level 1 spells and no cantrip count', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Paladin')

    expect(counts()).toBe('Level 1 spells: 0 of 2 chosen.')
    expect(spellList('Paladin').getAllByRole('listitem')).toHaveLength(13)
    expect(spellList('Paladin').getByLabelText('Heroism')).toBeTruthy()
    expect(spellList('Paladin').getByLabelText('Searing Smite')).toBeTruthy()
  })

  test('each kind stops at its own limit, and unchecking frees a place', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    const list = spellList('Sorcerer')

    for (const cantrip of ['Fire Bolt', 'Light', 'Mage Hand', 'Message']) await user.click(list.getByLabelText(cantrip))
    expect(counts()).toBe('Cantrips: 4 of 4 chosen. Level 1 spells: 0 of 2 chosen.')
    expect(checkbox(list, 'Ray of Frost').disabled).toBe(true) // the cantrips are full
    expect(checkbox(list, 'Magic Missile').disabled).toBe(false) // level 1 spells are not

    await user.click(list.getByLabelText('Magic Missile'))
    await user.click(list.getByLabelText('Shield'))
    expect(counts()).toBe('Cantrips: 4 of 4 chosen. Level 1 spells: 2 of 2 chosen.')
    expect(checkbox(list, 'Sleep').disabled).toBe(true)

    await user.click(list.getByLabelText('Light')) // give one cantrip back
    expect(counts()).toBe('Cantrips: 3 of 4 chosen. Level 1 spells: 2 of 2 chosen.')
    expect(checkbox(list, 'Ray of Frost').disabled).toBe(false)
    expect(checkbox(list, 'Sleep').disabled).toBe(true)
  })

  test('a spell can be read before it is chosen', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')

    const item = spellList('Sorcerer').getByLabelText('Fire Bolt').closest('li') as HTMLElement
    const details = item.querySelector('details') as HTMLDetailsElement
    expect(details.open).toBe(false)
    await user.click(within(item).getByText('Details'))
    expect(details.open).toBe(true)
    expect(within(item).getByText('120 feet')).toBeTruthy()
    expect(within(item).getByText('Casting time')).toBeTruthy()
  })
})

describe('the Spells view of the sheet', () => {
  test('shows the spell numbers and the chosen spells with their details', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildSorcerer(user)
    const list = spellList('Sorcerer')
    for (const name of ['Fire Bolt', 'Light', 'Magic Missile', 'Shield']) await user.click(list.getByLabelText(name))

    await openSpellsView(user)
    const spells = sheetSpellsView()

    // Charisma 14 (+2): save DC 8 + 2 + 2 = 12, attack +4, two level 1 slots
    expect(spells.getByText('Spellcasting ability').nextElementSibling?.textContent).toBe('Charisma')
    expect(spells.getByText('Spell save DC').nextElementSibling?.textContent).toBe('12')
    expect(spells.getByText('Spell attack bonus').nextElementSibling?.textContent).toBe('+4')
    expect(spells.getByText('Level 1 slots').nextElementSibling?.textContent).toBe('2')

    const chosen = within(screen.getByRole('list', { name: 'Chosen spells' }))
    expect(chosen.getAllByRole('listitem').map((item) => item.querySelector('strong')?.textContent)).toEqual([
      'Fire Bolt', 'Light', 'Magic Missile', 'Shield', // cantrips first
    ])
    // Two of the four cantrips are still unpicked, and both level 1 spells are done
    expect(spells.getByText('Still to pick in the builder: 2 cantrip(s).')).toBeTruthy()
  })

  test('says nothing is left to pick once every pick is made', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildSorcerer(user)
    const list = spellList('Sorcerer')
    for (const name of ['Fire Bolt', 'Light', 'Mage Hand', 'Message', 'Magic Missile', 'Shield']) await user.click(list.getByLabelText(name))
    await openSpellsView(user)

    expect(sheetSpellsView().queryByText(/Still to pick/)).toBeNull()
  })

  test('the level buttons filter the chosen spells', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildSorcerer(user)
    const list = spellList('Sorcerer')
    for (const name of ['Fire Bolt', 'Magic Missile']) await user.click(list.getByLabelText(name))
    await openSpellsView(user)

    const names = () => within(screen.getByRole('list', { name: 'Chosen spells' })).getAllByRole('listitem').map((item) => item.querySelector('strong')?.textContent)
    expect(names()).toEqual(['Fire Bolt', 'Magic Missile'])

    await user.click(screen.getByRole('button', { name: 'Cantrips' }))
    expect(names()).toEqual(['Fire Bolt'])
    expect((screen.getByRole('button', { name: 'Cantrips' }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true')

    await user.click(screen.getByRole('button', { name: 'Level 1' }))
    expect(names()).toEqual(['Magic Missile'])

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(names()).toEqual(['Fire Bolt', 'Magic Missile'])
  })

  test('says how many are still to pick, and shows nothing chosen yet', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildSorcerer(user)
    await openSpellsView(user)

    expect(screen.getByText('No spells chosen yet.')).toBeTruthy()
    expect(screen.getByText(/Still to pick in the builder: 4 cantrip\(s\) and 2 level 1 spell\(s\)/)).toBeTruthy()
  })

  test('a class that does not cast says so', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    await openSpellsView(user)
    expect(sheetSpellsView().getByText('Fighters do not cast spells at level 1.')).toBeTruthy()
  })

  test('with the sheet unfinished, the numbers wait but chosen spells still show', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    await user.click(spellList('Sorcerer').getByLabelText('Light'))
    await openSpellsView(user)

    expect(screen.getByText(/Finish the rest of the sheet to see your spell save DC/)).toBeTruthy()
    expect(within(screen.getByRole('list', { name: 'Chosen spells' })).getByText('Light')).toBeTruthy()
  })

  test('the Stats button goes back to the sheet', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    await openSpellsView(user)
    expect(screen.queryByRole('region', { name: 'Character sheet' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Stats' }))
    expect(screen.getByRole('region', { name: 'Character sheet' })).toBeTruthy()
  })
})

describe('spells and editing later', () => {
  test('the chosen spells come back after a reload', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    for (const name of ['Fire Bolt', 'Magic Missile']) await user.click(spellList('Sorcerer').getByLabelText(name))
    first.unmount()

    render(<App storage={storage} />)
    expect(checkbox(spellList('Sorcerer'), 'Fire Bolt').checked).toBe(true)
    expect(checkbox(spellList('Sorcerer'), 'Magic Missile').checked).toBe(true)
    expect(counts()).toBe('Cantrips: 1 of 4 chosen. Level 1 spells: 1 of 2 chosen.')
  })

  test('the spells can be changed after a reload', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    await user.click(spellList('Sorcerer').getByLabelText('Fire Bolt'))
    first.unmount()

    render(<App storage={storage} />)
    await user.click(spellList('Sorcerer').getByLabelText('Fire Bolt')) // take it back out
    await user.click(spellList('Sorcerer').getByLabelText('Ray of Frost'))
    expect(JSON.parse(storage.items.get('sheetforge.character') ?? '{}').character.spellIds).toEqual(['ray-of-frost'])
  })

  test('changing class clears spells the new class does not have, says so, and keeps the ones it shares', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    for (const name of ['Fire Bolt', 'Detect Magic']) await user.click(spellList('Sorcerer').getByLabelText(name))

    await user.selectOptions(screen.getByLabelText('Class'), 'Paladin')

    // Detect Magic is a Paladin spell too; Fire Bolt is not
    expect(screen.getByText(/spells no longer available: Fire Bolt/)).toBeTruthy()
    expect(checkbox(spellList('Paladin'), 'Detect Magic').checked).toBe(true)
    expect(counts()).toBe('Level 1 spells: 1 of 2 chosen.')
  })

  test('changing to a class that does not cast clears every spell', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    await user.click(spellList('Sorcerer').getByLabelText('Light'))
    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    expect(screen.getByText(/spells no longer available: Light/)).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer') // back again: nothing is remembered
    expect(counts()).toBe('Cantrips: 0 of 4 chosen. Level 1 spells: 0 of 2 chosen.')
  })
})

describe('rolling a spell attack from the Spells view', () => {
  const rollButtons = () => screen.queryAllByRole('button', { name: /spell attack/ }).map((button) => button.getAttribute('aria-label'))
  const history = () => within(screen.getByRole('list', { name: 'Roll history' })).getAllByRole('listitem').map((item) => item.textContent)

  test('only the chosen spells that need an attack roll get a button', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildSorcerer(user)
    const list = spellList('Sorcerer')
    for (const name of ['Fire Bolt', 'Light', 'Chromatic Orb', 'Magic Missile']) await user.click(list.getByLabelText(name))
    await openSpellsView(user)

    // Fire Bolt and Chromatic Orb roll to hit; Light and Magic Missile do not. Spell attack bonus is +4.
    expect(rollButtons()).toEqual(['Roll Fire Bolt spell attack, +4', 'Roll Chromatic Orb spell attack, +4'])
  })

  test('the button rolls a d20 plus the spell attack bonus into the Rolls panel', async () => {
    const user = userEvent.setup()
    render(<App storage={null} random={d20Sequence([15])} />)
    await buildSorcerer(user)
    await user.click(spellList('Sorcerer').getByLabelText('Fire Bolt'))
    await openSpellsView(user)

    await user.click(screen.getByRole('button', { name: 'Roll Fire Bolt spell attack, +4' }))

    expect(history()).toEqual(['Fire Bolt spell attack: 19 (d20 15 + 4)'])
  })

  test('advantage applies to a spell attack and then resets', async () => {
    const user = userEvent.setup()
    render(<App storage={null} random={d20Sequence([3, 18])} />)
    await buildSorcerer(user)
    await user.click(spellList('Sorcerer').getByLabelText('Fire Bolt'))
    await openSpellsView(user)

    await user.click(screen.getByLabelText('Advantage'))
    await user.click(screen.getByRole('button', { name: 'Roll Fire Bolt spell attack, +4' }))

    expect(history()).toEqual(['Fire Bolt spell attack: 22 (d20 3 and 18, higher 18 + 4)'])
    expect((screen.getByLabelText('Normal') as HTMLInputElement).checked).toBe(true)
  })

  test('there are no attack buttons until the sheet has its numbers', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    await user.click(spellList('Sorcerer').getByLabelText('Fire Bolt'))
    await openSpellsView(user)

    expect(rollButtons()).toEqual([])
  })

  test('a Paladin has none, and there is no button in the builder list', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Paladin')
    await user.click(spellList('Paladin').getByLabelText('Heroism'))
    expect(rollButtons()).toEqual([])
    await openSpellsView(user)
    expect(rollButtons()).toEqual([])
  })
})

describe('the save DC shown on each spell', () => {
  const chosenRow = (name: string) => within(screen.getByRole('list', { name: 'Chosen spells' })).getByText(name).closest('li') as HTMLElement
  const saveText = (name: string) => chosenRow(name).querySelector('.save-dc')?.textContent ?? null

  test('spells that call for a saving throw show the ability and the DC; others show nothing', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildSorcerer(user)
    const list = spellList('Sorcerer')
    for (const name of ['Fire Bolt', 'Acid Splash', 'Burning Hands', 'Sleep']) await user.click(list.getByLabelText(name))
    await openSpellsView(user)

    // Charisma 14 (+2): DC 8 + 2 + 2 = 12
    expect(saveText('Acid Splash')).toBe('Dexterity save, DC 12')
    expect(saveText('Burning Hands')).toBe('Dexterity save, DC 12')
    expect(saveText('Sleep')).toBe('Wisdom save, DC 12')
    expect(saveText('Fire Bolt')).toBeNull() // it rolls to hit instead
  })

  test('a spell can show both a save DC and an attack button', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildSorcerer(user)
    await user.click(spellList('Sorcerer').getByLabelText('Ice Knife'))
    await openSpellsView(user)

    expect(saveText('Ice Knife')).toBe('Dexterity save, DC 12')
    expect(within(chosenRow('Ice Knife')).getByRole('button', { name: 'Roll Ice Knife spell attack, +4' })).toBeTruthy()
  })

  test('the DC follows the character: a higher Charisma raises every spell at once', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildSorcerer(user)
    for (const name of ['Burning Hands', 'Sleep']) await user.click(spellList('Sorcerer').getByLabelText(name))

    // Manual entry keeps the scores; Charisma 18 is +4, so the DC is 8 + 4 + 2 = 14
    await user.click(screen.getByLabelText('Manual entry'))
    const charisma = screen.getByLabelText('Charisma')
    await user.clear(charisma)
    await user.type(charisma, '18')
    await openSpellsView(user)

    expect(saveText('Burning Hands')).toBe('Dexterity save, DC 14')
    expect(saveText('Sleep')).toBe('Wisdom save, DC 14')
    expect(sheetSpellsView().getByText('Spell save DC').nextElementSibling?.textContent).toBe('14') // the same number as the top
  })

  test('no DC is shown until the sheet has its numbers', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    await user.click(spellList('Sorcerer').getByLabelText('Burning Hands'))
    await openSpellsView(user)
    expect(saveText('Burning Hands')).toBeNull() // the sheet is unfinished, so there is no DC yet
  })

  test('a Paladin spell that calls for a save shows it, and one that does not shows nothing', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Species'), 'Goliath')
    await user.selectOptions(screen.getByLabelText('Background'), 'Acolyte')
    await user.selectOptions(screen.getByLabelText('Class'), 'Paladin')
    await user.selectOptions(screen.getByLabelText('Strength'), '15')
    await user.selectOptions(screen.getByLabelText('Dexterity'), '10')
    await user.selectOptions(screen.getByLabelText('Constitution'), '13')
    await user.selectOptions(screen.getByLabelText('Intelligence'), '8')
    await user.selectOptions(screen.getByLabelText('Wisdom'), '12')
    await user.selectOptions(screen.getByLabelText('Charisma'), '14')
    await user.selectOptions(screen.getByLabelText('+2 to'), 'Charisma')
    await user.selectOptions(screen.getByLabelText('+1 to'), 'Wisdom')
    const classSkills = within(screen.getByRole('group', { name: /Class skills/ }))
    await user.click(classSkills.getByLabelText('Athletics'))
    await user.click(classSkills.getByLabelText('Persuasion'))
    await user.click(screen.getByLabelText(/^A: Chain Mail/))
    for (const name of ['Command', 'Heroism']) await user.click(spellList('Paladin').getByLabelText(name))
    await openSpellsView(user)

    // Charisma 14 + 2 = 16 (+3): DC 8 + 3 + 2 = 13, the approved Paladin's number
    expect(saveText('Command')).toBe('Wisdom save, DC 13')
    expect(saveText('Heroism')).toBeNull()
  })
})
