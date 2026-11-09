import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import App from '../App'
import CatalogStep from './CatalogStep'

// Render checks only: clicking behavior is tested by hand in the browser (see plan.md).
test('first render lists every species, background and class', () => {
  const html = renderToString(<CatalogStep onChange={() => {}} />)

  for (const name of ['Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Goliath', 'Halfling', 'Human', 'Orc', 'Tiefling']) {
    expect(html).toContain(name)
  }
  for (const name of ['Acolyte', 'Criminal', 'Sage', 'Soldier']) {
    expect(html).toContain(name)
  }
  for (const name of ['Fighter', 'Paladin', 'Sorcerer']) {
    expect(html).toContain(name)
  }
  expect(html).not.toContain('could not be loaded')
})

test('the page shows the SRD attribution text', () => {
  const html = renderToString(<App />)
  expect(html).toContain('System Reference Document 5.2.1')
  expect(html).toContain('Creative Commons Attribution 4.0 International License')
})
