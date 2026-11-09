// Builder step: pick spells from the class's list. Cantrips and level 1 spells share one list,
// but each kind has its own limit (spec.md, Behavior item 1). A Wizard first fills a spellbook, then prepares from it.
// Display and input only: the rules are in engine/spells.ts.
import { catalog } from '../catalog/load'
import type { Spell } from '../catalog/types'
import type { Character } from '../engine/character'
import { chosenOrder } from '../engine/classOptions'
import { countPicks, spellLimits, spellOptions, spellbookOptions } from '../engine/spells'
import { levelLabel } from './labels'
import SpellDetails from './SpellDetails'

interface Props {
  character: Character
  onChange: (patch: Partial<Character>) => void
}

function SpellRow({ spell, checked, disabled, onToggle }: { spell: Spell; checked: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <li>
      <label className="choice">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} />
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
}

export default function SpellsStep({ character, onChange }: Props) {
  const classEntry = catalog.classes.find((entry) => entry.id === character.classId)
  const order = chosenOrder(classEntry, character.orderId) // the Thaumaturge and Magician know one more cantrip
  const limits = spellLimits(classEntry, order)
  const picks = character.spellIds ?? []
  const bookPicks = character.spellbookIds ?? []
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

  const hasBook = limits.spellbook !== undefined
  const bookOptions = spellbookOptions(classEntry, catalog)
  const options = spellOptions(classEntry, catalog, bookPicks, order)

  function toggle(spell: Spell) {
    if (picks.includes(spell.id)) {
      onChange({ spellIds: picks.filter((id) => id !== spell.id) })
      return
    }
    const full = spell.level === 0 ? counts.cantrips >= (limits?.cantrips ?? 0) : counts.spells >= (limits?.spells ?? 0)
    if (!full) onChange({ spellIds: [...picks, spell.id] })
  }

  function toggleBook(spell: Spell) {
    if (bookPicks.includes(spell.id)) onChange({ spellbookIds: bookPicks.filter((id) => id !== spell.id) })
    else if (bookPicks.length < (limits?.spellbook ?? 0)) onChange({ spellbookIds: [...bookPicks, spell.id] })
  }

  return (
    <section aria-labelledby="spells-step-heading">
      <h2 id="spells-step-heading">Spells</h2>

      {hasBook && (
        <>
          <p role="status" className="book-count">
            Spellbook: {bookPicks.length} of {limits.spellbook} chosen. You prepare your level 1 spells from the spellbook.
          </p>
          <ul className="spell-options" aria-label={`${classEntry.name} spellbook`}>
            {bookOptions.map((spell) => (
              <SpellRow
                key={spell.id}
                spell={spell}
                checked={bookPicks.includes(spell.id)}
                disabled={!bookPicks.includes(spell.id) && bookPicks.length >= (limits.spellbook ?? 0)}
                onToggle={() => toggleBook(spell)}
              />
            ))}
          </ul>
        </>
      )}

      <p role="status" className="pick-counts">
        {limits.cantrips > 0 && <span>Cantrips: {counts.cantrips} of {limits.cantrips} chosen. </span>}
        <span>Level 1 spells: {counts.spells} of {limits.spells} chosen.</span>
        {hasBook && bookPicks.length === 0 && <span> Fill your spellbook first to prepare level 1 spells.</span>}
      </p>

      <ul className="spell-options" aria-label={`${classEntry.name} spells`}>
        {options.map((spell) => {
          const checked = picks.includes(spell.id)
          const full = spell.level === 0 ? counts.cantrips >= limits.cantrips : counts.spells >= limits.spells
          return <SpellRow key={spell.id} spell={spell} checked={checked} disabled={!checked && full} onToggle={() => toggle(spell)} />
        })}
      </ul>
    </section>
  )
}
