// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'
import { MemoryStorage } from './storage/memoryStorage'

afterEach(cleanup)

type User = ReturnType<typeof userEvent.setup>
type Scores = { str: number; dex: number; con: number; int: number; wis: number; cha: number }

// The characters are the ones drafted in test-characters.md ("New classes"), which the Developer has not verified yet.

const sheet = () => within(screen.getByRole('region', { name: 'Character sheet' }))
const stat = (label: string) => sheet().getByText(label).nextElementSibling?.textContent ?? ''
const row = (name: string) => sheet().getByText(name, { selector: '.name' }).closest('li')?.textContent ?? ''
const group = (name: RegExp) => within(screen.getByRole('group', { name }))
const hasGroup = (name: RegExp) => screen.queryByRole('group', { name }) !== null

async function pick(user: User, species: string, background: string, className: string) {
  await user.selectOptions(screen.getByLabelText('Species'), species)
  await user.selectOptions(screen.getByLabelText('Background'), background)
  await user.selectOptions(screen.getByLabelText('Class'), className)
}

/** Types the six base scores with the manual entry method, then sets the background bonus. */
async function scores(user: User, base: Scores, plusTwo: string, plusOne: string) {
  await user.click(screen.getByLabelText('Manual entry'))
  for (const [label, value] of [
    ['Strength', base.str], ['Dexterity', base.dex], ['Constitution', base.con],
    ['Intelligence', base.int], ['Wisdom', base.wis], ['Charisma', base.cha],
  ] as const) {
    await user.type(screen.getByLabelText(label), String(value))
  }
  await user.selectOptions(screen.getByLabelText('+2 to'), plusTwo)
  await user.selectOptions(screen.getByLabelText('+1 to'), plusOne)
}

async function classSkills(user: User, ...names: string[]) {
  for (const name of names) await user.click(group(/Class skills/).getByLabelText(name))
}

const needed = () => sheet().queryByText(/Still needed/)?.parentElement?.textContent ?? ''

describe('Barbarian: Unarmored Defense, and no other class-feature choices', () => {
  test('builds the drafted Barbarian', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await pick(user, 'Orc', 'Soldier', 'Barbarian')
    await scores(user, { str: 15, dex: 12, con: 14, int: 8, wis: 10, cha: 8 }, 'Strength', 'Constitution')
    await classSkills(user, 'Animal Handling', 'Survival')
    await user.click(screen.getByLabelText(/^A: Greataxe/))

    expect(stat('Armor class')).toBe('13') // 10 + 1 Dex + 2 Con
    expect(stat('Hit points (max)')).toBe('14')
    expect(stat('Initiative')).toBe('+1')
    expect(row('Athletics')).toContain('+5')
    expect(row('Survival')).toContain('+2')
    expect(row('Passive Perception')).toContain('10')
  })

  test('none of the special choices appear for a Barbarian, a Fighter or a Sorcerer', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    for (const name of ['Barbarian', 'Fighter', 'Sorcerer']) {
      await user.selectOptions(screen.getByLabelText('Class'), name)
      for (const legend of [/Divine Order/, /Primal Order/, /Expertise/, /Tool proficiencies/, /Eldritch Invocation/]) {
        expect(hasGroup(legend), `${name} ${legend}`).toBe(false)
      }
      expect(screen.queryByLabelText('Wizard spellbook')).toBeNull()
    }
  })
})

describe('Monk: Unarmored Defense with Wisdom, and a tool choice', () => {
  test('builds the drafted Monk, with a Flute', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await pick(user, 'Halfling', 'Criminal', 'Monk')
    await scores(user, { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 }, 'Dexterity', 'Constitution')
    await classSkills(user, 'Acrobatics', 'Insight')
    await user.click(group(/Tool proficiencies/).getByLabelText('Flute'))
    await user.click(screen.getByLabelText(/^A: Spear/))

    expect(stat('Armor class')).toBe('15') // 10 + 3 Dex + 2 Wis
    expect(stat('Hit points (max)')).toBe('10')
    expect(stat('Initiative')).toBe('+3')
    expect(row('Stealth')).toContain('+5')
    expect(sheet().getByText(/^Tools:/).textContent).toBe("Tools: Thieves' Tools, Flute")
  })

  test('the tool list has artisan tools and instruments, and one pick only', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Monk')

    const tools = group(/Tool proficiencies: pick 1 \(0 chosen\)/)
    expect(tools.getAllByRole('checkbox')).toHaveLength(27) // 17 artisan tools and 10 instruments
    await user.click(tools.getByLabelText("Smith's Tools"))
    expect((tools.getByLabelText('Flute') as HTMLInputElement).disabled).toBe(true)
    expect(group(/Tool proficiencies: pick 1 \(1 chosen\)/)).toBeTruthy()
  })

  test('the Bard picks three musical instruments and no artisan tools', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Bard')

    const tools = group(/Tool proficiencies: pick 3/)
    expect(tools.getAllByRole('checkbox')).toHaveLength(10)
    expect(tools.queryByLabelText("Smith's Tools")).toBeNull()
    for (const name of ['Lute', 'Flute', 'Drum']) await user.click(tools.getByLabelText(name))
    expect((tools.getByLabelText('Lyre') as HTMLInputElement).disabled).toBe(true)
  })
})

describe('Rogue: Expertise', () => {
  async function buildRogue(user: User, withExpertise: boolean) {
    await pick(user, 'Human', 'Soldier', 'Rogue')
    await scores(user, { str: 8, dex: 15, con: 14, int: 13, wis: 10, cha: 12 }, 'Dexterity', 'Constitution')
    await classSkills(user, 'Stealth', 'Sleight of Hand', 'Perception', 'Deception')
    await user.click(group(/Human skill/).getByLabelText('Investigation'))
    await user.click(screen.getByLabelText(/^A: Leather Armor/))
    if (withExpertise) {
      await user.click(group(/Expertise/).getByLabelText('Stealth'))
      await user.click(group(/Expertise/).getByLabelText('Sleight of Hand'))
    }
  }

  test('builds the drafted Rogue: Stealth and Sleight of Hand are +7', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildRogue(user, true)

    expect(stat('Armor class')).toBe('14') // Leather Armor 11 + 3 Dex
    expect(row('Stealth')).toContain('+7')
    expect(row('Sleight of Hand')).toContain('+7')
    expect(row('Perception')).toContain('+2')
    expect(row('Athletics')).toContain('+1') // proficient, no Expertise
    expect(sheet().getAllByLabelText('expertise')).toHaveLength(2) // the diamond marks
    expect(row('Passive Investigation')).toContain('13')
  })

  test('the sheet waits for Expertise, and Expertise lists only skills the character is proficient in', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildRogue(user, false)

    expect(needed()).toContain('pick exactly 2 skills for Expertise')
    const expertise = group(/Expertise: pick 2/)
    // the Soldier's Athletics and Intimidation, the four class skills, and the Human's Investigation
    expect(expertise.getAllByRole('checkbox').map((box) => box.parentElement?.textContent)).toEqual([
      'Athletics', 'Deception', 'Intimidation', 'Investigation', 'Perception', 'Sleight of Hand', 'Stealth',
    ])
    await user.click(expertise.getByLabelText('Stealth'))
    await user.click(expertise.getByLabelText('Sleight of Hand'))
    expect((expertise.getByLabelText('Perception') as HTMLInputElement).disabled).toBe(true) // two is the limit
    expect(stat('Armor class')).toBe('14')
  })

  test('un-picking a class skill that had Expertise removes the Expertise and says so', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildRogue(user, true)

    await user.click(group(/Class skills/).getByLabelText('Stealth')) // take the skill back out
    expect(screen.getByText(/Expertise skills no longer available: Stealth/)).toBeTruthy()
    expect(group(/Expertise: pick 2 skills \(1 chosen\)/)).toBeTruthy()
  })
})

describe('Cleric: Divine Order', () => {
  async function buildCleric(user: User) {
    await pick(user, 'Goliath', 'Acolyte', 'Cleric')
    await scores(user, { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 }, 'Wisdom', 'Charisma')
    await classSkills(user, 'Medicine', 'Persuasion')
    await user.click(screen.getByLabelText(/^A: Chain Shirt/))
  }

  test('the sheet waits for the order; Thaumaturge gives the drafted Cleric', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildCleric(user)
    expect(needed()).toContain('choose your Divine Order')

    await user.click(group(/Divine Order/).getByLabelText('Thaumaturge'))
    expect(stat('Armor class')).toBe('15') // Chain Shirt 13 + 2 Shield
    expect(row('Arcana')).toContain('+2')
    expect(row('Religion')).toContain('+4')
    expect(stat('Spell save DC')).toBe('13')
    expect(stat('Spell attack bonus')).toBe('+5')
  })

  test('Thaumaturge adds a cantrip; Protector does not and gives Martial weapons and Heavy armor training', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildCleric(user)

    await user.click(group(/Divine Order/).getByLabelText('Thaumaturge'))
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Cantrips: 0 of 4 chosen')

    await user.click(group(/Divine Order/).getByLabelText('Protector'))
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Cantrips: 0 of 3 chosen')
    expect(row('Arcana')).toContain('-1') // no Thaumaturge bonus
    expect(sheet().getByText(/^Weapons:/).textContent).toBe('Weapons: Simple, Martial')
    expect(sheet().getByText(/^Armor:/).textContent).toContain('Heavy')
  })

  test('switching from Thaumaturge to Protector drops a fourth cantrip', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Cleric')
    await user.click(group(/Divine Order/).getByLabelText('Thaumaturge'))
    const list = within(screen.getByRole('list', { name: 'Cleric spells' }))
    for (const name of ['Guidance', 'Light', 'Mending', 'Sacred Flame']) await user.click(list.getByLabelText(name))
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Cantrips: 4 of 4')

    await user.click(group(/Divine Order/).getByLabelText('Protector'))
    expect(screen.getByText(/spells no longer available: Sacred Flame/)).toBeTruthy()
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Cantrips: 3 of 3')
  })

  test('changing to a Druid clears the Cleric order and asks for the Druid one', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Cleric')
    await user.click(group(/Divine Order/).getByLabelText('Thaumaturge'))

    await user.selectOptions(screen.getByLabelText('Class'), 'Druid')
    expect(screen.getByText(/the order choice "thaumaturge", which the class does not offer/)).toBeTruthy()
    expect(hasGroup(/Divine Order/)).toBe(false)
    expect(group(/Primal Order/).getByLabelText('Magician')).toBeTruthy()
    expect((group(/Primal Order/).getByLabelText('Magician') as HTMLInputElement).checked).toBe(false)
  })
})

describe('Druid: Primal Order', () => {
  test('builds the drafted Druid with the Magician order', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await pick(user, 'Human', 'Sage', 'Druid')
    await scores(user, { str: 10, dex: 13, con: 14, int: 12, wis: 15, cha: 8 }, 'Wisdom', 'Constitution')
    await classSkills(user, 'Nature', 'Perception')
    await user.click(group(/Human skill/).getByLabelText('Survival'))
    await user.click(screen.getByLabelText(/^A: Leather Armor/))
    expect(needed()).toContain('choose your Primal Order')

    await user.click(group(/Primal Order/).getByLabelText('Magician'))
    expect(stat('Armor class')).toBe('14') // Leather Armor 11 + 1 Dex + 2 Shield
    expect(row('Arcana')).toContain('+6')
    expect(row('Nature')).toContain('+6')
    expect(row('Perception')).toContain('+5')
    expect(stat('Spell save DC')).toBe('13')
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Cantrips: 0 of 3 chosen') // 2 + 1 from Magician
    expect(sheet().getByText(/^Tools:/).textContent).toContain('Herbalism Kit')
  })

  test('Warden gives Martial weapons and Medium armor training, and no extra cantrip', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Druid')
    await user.click(group(/Primal Order/).getByLabelText('Warden'))
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Cantrips: 0 of 2 chosen')
  })
})

describe('Warlock: Eldritch Invocation', () => {
  async function buildWarlock(user: User) {
    await pick(user, 'Human', 'Criminal', 'Warlock')
    await scores(user, { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 }, 'Dexterity', 'Constitution')
    await classSkills(user, 'Arcana', 'Deception')
    await user.click(group(/Human skill/).getByLabelText('Perception'))
    await user.click(screen.getByLabelText(/^B: 100 GP/))
  }

  test('the five level 1 invocations are offered, and the sheet waits for one', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildWarlock(user)

    const invocations = group(/Eldritch Invocation: pick 1/)
    expect(invocations.getAllByRole('radio').map((radio) => radio.parentElement?.textContent)).toEqual([
      'Armor of Shadows', 'Eldritch Mind', 'Pact of the Blade', 'Pact of the Chain', 'Pact of the Tome',
    ])
    expect(needed()).toContain('choose your Eldritch Invocation')
  })

  test('Armor of Shadows makes AC 13 + Dexterity with no armor; the others leave it at 10 + Dexterity', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await buildWarlock(user)

    await user.click(group(/Eldritch Invocation/).getByLabelText('Armor of Shadows'))
    expect(stat('Armor class')).toBe('16') // 13 + 3 Dex (14 + 2)

    await user.click(group(/Eldritch Invocation/).getByLabelText('Eldritch Mind'))
    expect(stat('Armor class')).toBe('13') // 10 + 3 Dex
    expect(stat('Spell save DC')).toBe('12') // 8 + 2 Cha (Charisma 15 is +2) + 2 proficiency
  })

  test('a description can be read before choosing', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Warlock')
    const item = group(/Eldritch Invocation/).getByLabelText('Pact of the Chain').closest('div') as HTMLElement
    await user.click(within(item).getByText('Details'))
    expect(within(item).getByText(/You learn the Find Familiar spell/)).toBeTruthy()
  })

  test('the Warlock picks 2 cantrips and 2 spells and has one slot', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Warlock')
    expect(document.querySelector('.pick-counts')?.textContent).toBe('Cantrips: 0 of 2 chosen. Level 1 spells: 0 of 2 chosen.')
  })
})

describe('Wizard: the spellbook', () => {
  const book = ['Detect Magic', 'Feather Fall', 'Mage Armor', 'Magic Missile', 'Sleep', 'Thunderwave']
  const bookList = () => within(screen.getByRole('list', { name: 'Wizard spellbook' }))
  const preparedList = () => within(screen.getByRole('list', { name: 'Wizard spells' }))

  test('the book holds six level 1 spells, and none can be prepared until it has some', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Wizard')

    expect(document.querySelector('.book-count')?.textContent).toContain('Spellbook: 0 of 6 chosen')
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Fill your spellbook first')
    expect(preparedList().queryByLabelText('Magic Missile')).toBeNull() // a level 1 spell, not in the book yet
    expect(preparedList().getByLabelText('Light')).toBeTruthy() // cantrips come from the whole list

    for (const name of book) await user.click(bookList().getByLabelText(name))
    expect(document.querySelector('.book-count')?.textContent).toContain('Spellbook: 6 of 6 chosen')
    expect((bookList().getByLabelText('Burning Hands') as HTMLInputElement).disabled).toBe(true) // the book is full
  })

  test('prepared spells come only from the book, up to four', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Wizard')
    for (const name of book) await user.click(bookList().getByLabelText(name))

    const prepared = preparedList()
    expect(prepared.queryByLabelText('Burning Hands')).toBeNull() // a Wizard spell, but not in this book
    for (const name of ['Detect Magic', 'Magic Missile', 'Sleep', 'Thunderwave']) await user.click(prepared.getByLabelText(name))
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Level 1 spells: 4 of 4 chosen')
    expect((prepared.getByLabelText('Mage Armor') as HTMLInputElement).disabled).toBe(true)
  })

  test('taking a spell out of the book also takes it out of the prepared list, and says so', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Wizard')
    for (const name of book) await user.click(bookList().getByLabelText(name))
    await user.click(preparedList().getByLabelText('Sleep'))
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Level 1 spells: 1 of 4 chosen')

    await user.click(bookList().getByLabelText('Sleep')) // out of the book
    expect(screen.getByText(/spells no longer available: Sleep/)).toBeTruthy()
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Level 1 spells: 0 of 4 chosen')
  })

  test('a Wizard picks 3 cantrips', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await pick(user, 'Human', 'Sage', 'Wizard')
    expect(document.querySelector('.pick-counts')?.textContent).toContain('Cantrips: 0 of 3 chosen')
  })

  test('other casters have no spellbook', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    for (const name of ['Sorcerer', 'Cleric', 'Warlock']) {
      await user.selectOptions(screen.getByLabelText('Class'), name)
      expect(screen.queryByRole('list', { name: `${name} spellbook` })).toBeNull()
    }
  })
})

describe('the other classes at level 1', () => {
  test('the Bard picks any three skills', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Bard')
    expect(group(/Class skills: pick 3/).getAllByRole('checkbox')).toHaveLength(18)
  })

  test('the Ranger picks three skills, has no cantrips and 2 prepared spells', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Ranger')
    expect(group(/Class skills: pick 3/).getAllByRole('checkbox')).toHaveLength(8)
    expect(document.querySelector('.pick-counts')?.textContent).toBe('Level 1 spells: 0 of 2 chosen.')
  })

  test('every class can be chosen and shows its starting equipment packages', async () => {
    const user = userEvent.setup()
    render(<App storage={null} />)
    for (const name of ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard']) {
      await user.selectOptions(screen.getByLabelText('Class'), name)
      expect(group(/Starting equipment/).getAllByRole('radio').length, name).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('the new choices are saved and come back after a reload', () => {
  test('order, Expertise, invocation, tools and the spellbook', async () => {
    const storage = new MemoryStorage()
    const user = userEvent.setup()
    const first = render(<App storage={storage} />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Cleric')
    await user.click(group(/Divine Order/).getByLabelText('Thaumaturge'))
    first.unmount()

    const second = render(<App storage={storage} />)
    expect((group(/Divine Order/).getByLabelText('Thaumaturge') as HTMLInputElement).checked).toBe(true)
    await user.selectOptions(screen.getByLabelText('Class'), 'Warlock')
    await user.click(group(/Eldritch Invocation/).getByLabelText('Pact of the Tome'))
    second.unmount()

    const third = render(<App storage={storage} />)
    expect((group(/Eldritch Invocation/).getByLabelText('Pact of the Tome') as HTMLInputElement).checked).toBe(true)
    await user.selectOptions(screen.getByLabelText('Class'), 'Monk')
    await user.click(group(/Tool proficiencies/).getByLabelText('Lyre'))
    third.unmount()

    const fourth = render(<App storage={storage} />)
    expect((group(/Tool proficiencies/).getByLabelText('Lyre') as HTMLInputElement).checked).toBe(true)
    await user.selectOptions(screen.getByLabelText('Class'), 'Wizard')
    await user.click(within(screen.getByRole('list', { name: 'Wizard spellbook' })).getByLabelText('Sleep'))
    fourth.unmount()

    render(<App storage={storage} />)
    expect((within(screen.getByRole('list', { name: 'Wizard spellbook' })).getByLabelText('Sleep') as HTMLInputElement).checked).toBe(true)
  })
})
