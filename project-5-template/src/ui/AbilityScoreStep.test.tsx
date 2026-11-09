import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import AbilityScoreStep from './AbilityScoreStep'

// Render check only: the initial screen has the method choices and all six abilities.
// Clicking behavior is tested by hand in the browser (see plan.md).
test('first render shows the four methods and six abilities', () => {
  const html = renderToString(<AbilityScoreStep method="standardArray" rolled={[]} scores={{}} onChange={() => {}} />)

  for (const label of ['Standard array', 'Point buy', 'Roll (4d6, drop lowest)', 'Manual entry']) {
    expect(html).toContain(label)
  }
  for (const name of ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']) {
    expect(html).toContain(name)
  }
  expect(html).toContain('Assign all six scores to continue.')
})
