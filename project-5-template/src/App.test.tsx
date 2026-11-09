// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  window.localStorage.clear() // each test starts with nothing saved
})

function sheet() {
  return within(screen.getByRole('region', { name: 'Character sheet' }))
}

/** The value shown next to a label in the sheet's stat boxes, for example "Armor class". */
function stat(label: string): string {
  return sheet().getByText(label).nextElementSibling?.textContent ?? ''
}

/** The text of one row in the sheet's skill or save lists. */
function row(name: string): string {
  return sheet().getByText(name, { selector: '.name' }).closest('li')?.textContent ?? ''
}

describe('building a character in the page', () => {
  test('before anything is chosen, the sheet lists what is needed and shows no numbers', () => {
    render(<App />)
    expect(sheet().getByText(/Still needed/)).toBeTruthy()
    expect(sheet().getByText('choose a species')).toBeTruthy()
    expect(sheet().queryByText('Armor class')).toBeNull()
  })

  test('the approved Fighter test character builds the expected sheet', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('Species'), 'Dwarf')
    await user.selectOptions(screen.getByLabelText('Background'), 'Soldier')
    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')

    // Standard array: STR 15, DEX 13, CON 14, INT 10, WIS 12, CHA 8
    await user.selectOptions(screen.getByLabelText('Strength'), '15')
    await user.selectOptions(screen.getByLabelText('Dexterity'), '13')
    await user.selectOptions(screen.getByLabelText('Constitution'), '14')
    await user.selectOptions(screen.getByLabelText('Intelligence'), '10')
    await user.selectOptions(screen.getByLabelText('Wisdom'), '12')
    await user.selectOptions(screen.getByLabelText('Charisma'), '8')

    // Still incomplete: the bonus, skills and starting equipment are not chosen, so no numbers yet.
    expect(sheet().queryByText('Armor class')).toBeNull()

    await user.selectOptions(screen.getByLabelText('+2 to'), 'Strength')
    await user.selectOptions(screen.getByLabelText('+1 to'), 'Constitution')
    await user.click(screen.getByLabelText('Perception'))
    await user.click(screen.getByLabelText('Survival'))
    await user.click(screen.getByLabelText(/^A: Chain Mail/))

    // Expected values from test-characters.md (reviewed and approved by the Developer)
    expect(stat('Armor class')).toBe('16')
    expect(stat('Hit points (max)')).toBe('13')
    expect(stat('Speed')).toBe('30 ft.')
    expect(stat('Initiative')).toBe('+1')
    expect(stat('Proficiency bonus')).toBe('+2')
    expect(stat('Darkvision')).toBe('120 ft.')
    expect(row('Athletics')).toContain('+5')
    expect(row('Survival')).toContain('+3')
    expect(row('Stealth')).toContain('+1')
    expect(row('Strength')).toContain('+5') // saving throw
    expect(row('Passive Perception')).toContain('13')
    expect(sheet().getByLabelText('Strength modifier').textContent).toBe('+3')
    expect(sheet().getByLabelText('Strength score').textContent).toBe('17') // 15 + 2 from the background

    // The other two Fighter packages: Studded Leather (12 + 1 Dex), and 155 GP with no armor (10 + 1 Dex)
    await user.click(screen.getByLabelText(/^B: Studded Leather/))
    expect(stat('Armor class')).toBe('13')
    await user.click(screen.getByLabelText(/^C: 155 GP/))
    expect(stat('Armor class')).toBe('11')
  })

  test('changing class clears the class skills and says so', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    await user.click(screen.getByLabelText('Perception'))
    await user.click(screen.getByLabelText('Survival'))
    expect((screen.getByLabelText('Perception') as HTMLInputElement).checked).toBe(true)

    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')

    expect(screen.getByText(/class skills no longer available: Perception, Survival/)).toBeTruthy()
    expect(screen.queryByLabelText('Perception')).toBeNull() // Sorcerer does not offer it
    expect((screen.getByLabelText('Arcana') as HTMLInputElement).checked).toBe(false)
  })

  test('class skills stop at the limit', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    await user.click(screen.getByLabelText('Perception'))
    await user.click(screen.getByLabelText('Survival'))
    expect((screen.getByLabelText('Athletics') as HTMLInputElement).disabled).toBe(true)
  })

  test('only a Human gets a free skill choice', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.selectOptions(screen.getByLabelText('Species'), 'Dwarf')
    expect(screen.queryByText(/Human skill/)).toBeNull()

    await user.selectOptions(screen.getByLabelText('Species'), 'Human')
    expect(screen.getByText(/Human skill: pick 1/)).toBeTruthy()
  })

  test('the background bonus choices follow the background', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.selectOptions(screen.getByLabelText('Background'), 'Soldier')
    const options = within(screen.getByLabelText('+2 to')).getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Choose', 'Strength', 'Dexterity', 'Constitution'])
  })

  test('a Sorcerer has no armor in either package, so AC is 10 plus Dexterity', async () => {
    const user = userEvent.setup()
    render(<App />)
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
    const humanSkills = within(screen.getByRole('group', { name: /Human skill/ }))
    await user.click(humanSkills.getByLabelText('Perception')) // the Human's free skill
    await user.click(screen.getByLabelText(/^A: Spear/))

    expect(stat('Armor class')).toBe('13') // 10 + 3 Dex (15 + 2 from the background = 17)
    expect(stat('Spell save DC')).toBe('12') // 8 + 2 Cha (14 + 0 = 14) + 2
    // There is no armor or shield choice any more (the Sorcerer's Shield spell is a different thing, in the spell list)
    expect(within(screen.getByRole('group', { name: /Starting equipment/ })).queryByLabelText('Shield')).toBeNull()
    expect(screen.queryByLabelText('Worn armor')).toBeNull()
  })

  test('the equipment choices follow the class, and changing class clears a package it does not offer', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('Choose a class to pick its starting equipment.')).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Class'), 'Fighter')
    expect(screen.getByLabelText(/^C: 155 GP/)).toBeTruthy()
    await user.click(screen.getByLabelText(/^C: 155 GP/))

    await user.selectOptions(screen.getByLabelText('Class'), 'Sorcerer')
    expect(screen.getByText(/starting equipment option C, which the new class does not offer/)).toBeTruthy()
    expect((screen.getByLabelText(/^A: Spear/) as HTMLInputElement).checked).toBe(false)
    expect(screen.queryByLabelText(/^C: 155 GP/)).toBeNull() // the Sorcerer offers only A and B
  })
})
