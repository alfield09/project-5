// The Spells view of the sheet: the class's spell numbers, and the spells the player chose.
// Display only; the numbers come from the engine. There is no search bar yet (spec.md).
import { useMemo, useState } from 'react'
import { catalog } from '../catalog/load'
import type { Character } from '../engine/character'
import { deriveCharacter } from '../engine/derive'
import { chosenOrder } from '../engine/classOptions'
import { countPicks, needsSpellAttack, pickedSpells, savingThrowAbilities, spellLimits } from '../engine/spells'
import { ABILITY_NAMES, formatModifier, levelLabel } from './labels'
import SpellDetails from './SpellDetails'
import type { RollHandler } from './SheetPanel'

type Filter = 'all' | number // a spell level, 0 for cantrips

export default function SpellsTab({ character, onRoll }: { character: Character; onRoll: RollHandler }) {
  const [filter, setFilter] = useState<Filter>('all')
  const result = useMemo(() => deriveCharacter(character, catalog), [character])

  const classEntry = catalog.classes.find((entry) => entry.id === character.classId)
  const limits = spellLimits(classEntry, chosenOrder(classEntry, character.orderId))
  const picks = character.spellIds ?? []
  const chosen = pickedSpells(picks, catalog)
  const counts = countPicks(picks, catalog)

  if (classEntry === undefined) {
    return (
      <section aria-labelledby="spells-heading" className="sheet">
        <h2 id="spells-heading">Spells</h2>
        <p>Choose a class to see its spells.</p>
      </section>
    )
  }
  if (limits === undefined) {
    return (
      <section aria-labelledby="spells-heading" className="sheet">
        <h2 id="spells-heading">Spells</h2>
        <p>{classEntry.name}s do not cast spells at level 1.</p>
      </section>
    )
  }

  const levels = Array.from({ length: limits.maxSpellLevel + 1 }, (_, level) => level).filter((level) => level > 0 || limits.cantrips > 0)
  const shown = chosen.filter((spell) => filter === 'all' || spell.level === filter)
  const casting = result.ok ? result.derived.spellcasting : undefined

  return (
    <section aria-labelledby="spells-heading" className="sheet">
      <h2 id="spells-heading">Spells</h2>

      {casting ? (
        <dl className="stats">
          <div>
            <dt>Spellcasting ability</dt>
            <dd>{ABILITY_NAMES[casting.ability]}</dd>
          </div>
          <div>
            <dt>Spell save DC</dt>
            <dd>{casting.saveDc}</dd>
          </div>
          <div>
            <dt>Spell attack bonus</dt>
            <dd>{formatModifier(casting.attackBonus)}</dd>
          </div>
          {casting.slots.map((slots, index) => (
            <div key={index}>
              <dt>Level {index + 1} slots</dt>
              <dd>{slots}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>Finish the rest of the sheet to see your spell save DC and attack bonus.</p>
      )}

      {(counts.cantrips < limits.cantrips || counts.spells < limits.spells) && (
        <p role="status">
          Still to pick in the builder:
          {counts.cantrips < limits.cantrips && ` ${limits.cantrips - counts.cantrips} cantrip(s)`}
          {counts.cantrips < limits.cantrips && counts.spells < limits.spells && ' and'}
          {counts.spells < limits.spells && ` ${limits.spells - counts.spells} level 1 spell(s)`}.
        </p>
      )}

      <div role="group" aria-label="Spell level" className="filters">
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </button>
        {levels.map((level) => (
          <button key={level} type="button" aria-pressed={filter === level} onClick={() => setFilter(level)}>
            {level === 0 ? 'Cantrips' : `Level ${level}`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p>{chosen.length === 0 ? 'No spells chosen yet.' : 'No chosen spells at this level.'}</p>
      ) : (
        <ul className="spell-list" aria-label="Chosen spells">
          {shown.map((spell) => (
            <li key={spell.id} className="spell-row">
              <details>
                <summary>
                  <strong>{spell.name}</strong> <span className="tag">{levelLabel(spell)}, {spell.school}</span>
                </summary>
                <SpellDetails spell={spell} />
              </details>
              {casting && savingThrowAbilities(spell).length > 0 && (
                <span className="save-dc">
                  {savingThrowAbilities(spell).map((ability) => ABILITY_NAMES[ability]).join(' / ')} save, DC {casting.saveDc}
                </span>
              )}
              {casting && needsSpellAttack(spell) && (
                <button
                  type="button"
                  className="roll-attack"
                  aria-label={`Roll ${spell.name} spell attack, ${formatModifier(casting.attackBonus)}`}
                  onClick={() => onRoll(`${spell.name} spell attack`, casting.attackBonus)}
                >
                  Roll attack {formatModifier(casting.attackBonus)}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
