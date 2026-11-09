// Builder step: pick spells from the class's list. Cantrips and level 1 spells share one list,
// but each kind has its own limit (spec.md, Behavior item 1). Display and input only: the rules are in engine/spells.ts.
import { catalog } from '../catalog/load'
import type { Spell } from '../catalog/types'
import type { Character } from '../engine/character'
import { countPicks, spellLimits, spellOptions } from '../engine/spells'
import { levelLabel } from './labels'
import SpellDetails from './SpellDetails'

interface Props {
  character: Character
  onChange: (patch: Partial<Character>) => void
}

export default function SpellsStep({ character, onChange }: Props) {
  const classEntry = catalog.classes.find((entry) => entry.id === character.classId)
  const limits = spellLimits(classEntry)
  const picks = character.spellIds ?? []
  const counts = countPicks(picks, catalog)

  if (classEntry === undefined) {
    return (
      <section aria-labelledby="spells-step-heading">
        <h2 id="spells-step-heading">Spells</h2>
        <p>Choose a class to pick spells.</p>
      </section>
    )
  }
  if (limits === undefined) {
    return (
      <section aria-labelledby="spells-step-heading">
        <h2 id="spells-step-heading">Spells</h2>
        <p>{classEntry.name}s do not cast spells at level 1.</p>
      </section>
    )
  }

  const options = spellOptions(classEntry, catalog)

  function toggle(spell: Spell) {
    if (picks.includes(spell.id)) {
      onChange({ spellIds: picks.filter((id) => id !== spell.id) })
      return
    }
    const full = spell.level === 0 ? counts.cantrips >= (limits?.cantrips ?? 0) : counts.spells >= (limits?.spells ?? 0)
    if (!full) onChange({ spellIds: [...picks, spell.id] })
  }

  return (
    <section aria-labelledby="spells-step-heading">
      <h2 id="spells-step-heading">Spells</h2>
      <p role="status" className="pick-counts">
        {limits.cantrips > 0 && <span>Cantrips: {counts.cantrips} of {limits.cantrips} chosen. </span>}
        <span>Level 1 spells: {counts.spells} of {limits.spells} chosen.</span>
      </p>

      <ul className="spell-options" aria-label={`${classEntry.name} spells`}>
        {options.map((spell) => {
          const checked = picks.includes(spell.id)
          const full = spell.level === 0 ? counts.cantrips >= limits.cantrips : counts.spells >= limits.spells
          return (
            <li key={spell.id}>
              <label className="choice">
                <input type="checkbox" checked={checked} disabled={!checked && full} onChange={() => toggle(spell)} />
                {spell.name}
              </label>
              <span className="tag">
                {' '}
                {levelLabel(spell)}, {spell.school}
              </span>
              <details>
                <summary>Details</summary>
                <SpellDetails spell={spell} />
              </details>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
