// The character sheet: shows what the engine calculates. No calculation happens here (spec.md, Structure rules).
import { useMemo } from 'react'
import { catalog } from '../catalog/load'
import { ABILITIES } from '../engine/abilityScores'
import type { Character } from '../engine/character'
import { deriveCharacter } from '../engine/derive'
import { SKILLS } from '../engine/skills'
import { ABILITY_NAMES, formatModifier } from './labels'

/** Called when the player clicks something rollable, with its name and its bonus. */
export type RollHandler = (label: string, bonus: number) => void

export default function SheetPanel({ character, onRoll }: { character: Character; onRoll: RollHandler }) {
  const result = useMemo(() => deriveCharacter(character, catalog), [character])

  const species = catalog.species.find((entry) => entry.id === character.speciesId)
  const classEntry = catalog.classes.find((entry) => entry.id === character.classId)
  const title =
    species && classEntry ? `${species.name} ${classEntry.name}, level ${character.level}` : 'New character'

  return (
    <section aria-labelledby="sheet-heading" className="sheet">
      <h2 id="sheet-heading">Character sheet</h2>
      <p className="sheet-title">{title}</p>

      {!result.ok && (
        <div role="status">
          <p>The sheet appears once everything is chosen. Still needed:</p>
          <ul>
            {result.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      {result.ok && <SheetNumbers derived={result.derived} onRoll={onRoll} />}
    </section>
  )
}

function Marker({ proficient }: { proficient: boolean }) {
  return (
    <span className="marker" aria-label={proficient ? 'proficient' : 'not proficient'}>
      {proficient ? '●' : '○'}
    </span>
  )
}

function SheetNumbers({
  derived,
  onRoll,
}: {
  derived: Extract<ReturnType<typeof deriveCharacter>, { ok: true }>['derived']
  onRoll: RollHandler
}) {
  return (
    <>
      {derived.warnings.length > 0 && (
        <ul className="warnings" aria-label="Warnings">
          {derived.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <ul className="abilities" aria-label="Ability scores">
        {ABILITIES.map((ability) => (
          <li key={ability}>
            <button
              type="button"
              className="roll-tile"
              aria-label={`Roll ${ABILITY_NAMES[ability]} check, ${formatModifier(derived.modifiers[ability])}`}
              onClick={() => onRoll(`${ABILITY_NAMES[ability]} check`, derived.modifiers[ability])}
            >
              <span className="label">{ABILITY_NAMES[ability]}</span>
              <strong aria-label={`${ABILITY_NAMES[ability]} modifier`}>{formatModifier(derived.modifiers[ability])}</strong>
              <span aria-label={`${ABILITY_NAMES[ability]} score`}>{derived.finalScores[ability]}</span>
            </button>
          </li>
        ))}
      </ul>

      <dl className="stats">
        <div>
          <dt>Proficiency bonus</dt>
          <dd>{formatModifier(derived.proficiencyBonus)}</dd>
        </div>
        <div>
          <dt>Armor class</dt>
          <dd>{derived.armorClass}</dd>
        </div>
        <div>
          <dt>Initiative</dt>
          <dd>
            <button
              type="button"
              className="roll-inline"
              aria-label={`Roll initiative, ${formatModifier(derived.initiative)}`}
              onClick={() => onRoll('Initiative', derived.initiative)}
            >
              {formatModifier(derived.initiative)}
            </button>
          </dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>{derived.speed} ft.</dd>
        </div>
        <div>
          <dt>Hit points (max)</dt>
          <dd>{derived.maxHitPoints}</dd>
        </div>
        {derived.darkvision !== undefined && (
          <div>
            <dt>Darkvision</dt>
            <dd>{derived.darkvision} ft.</dd>
          </div>
        )}
        {derived.spellcasting && (
          <>
            <div>
              <dt>Spell save DC</dt>
              <dd>{derived.spellcasting.saveDc}</dd>
            </div>
            <div>
              <dt>Spell attack bonus</dt>
              <dd>{formatModifier(derived.spellcasting.attackBonus)}</dd>
            </div>
          </>
        )}
      </dl>

      <h3>Saving throws</h3>
      <ul className="rows">
        {ABILITIES.map((ability) => (
          <li key={ability}>
            <button
              type="button"
              className="roll-row"
              aria-label={`Roll ${ABILITY_NAMES[ability]} saving throw, ${formatModifier(derived.savingThrows[ability])}`}
              onClick={() => onRoll(`${ABILITY_NAMES[ability]} saving throw`, derived.savingThrows[ability])}
            >
              <Marker proficient={derived.proficientSaves.includes(ability)} />
              <span className="name">{ABILITY_NAMES[ability]}</span>
              <span className="bonus">{formatModifier(derived.savingThrows[ability])}</span>
            </button>
          </li>
        ))}
      </ul>

      <h3>Skills</h3>
      <ul className="rows">
        {SKILLS.map((skill) => (
          <li key={skill.name}>
            <button
              type="button"
              className="roll-row"
              aria-label={`Roll ${skill.name} check, ${formatModifier(derived.skills[skill.name])}`}
              onClick={() => onRoll(`${skill.name} check`, derived.skills[skill.name])}
            >
              <Marker proficient={derived.proficientSkills.includes(skill.name)} />
              <span className="tag">{skill.ability.toUpperCase()}</span>
              <span className="name">{skill.name}</span>
              <span className="bonus">{formatModifier(derived.skills[skill.name])}</span>
            </button>
          </li>
        ))}
      </ul>

      <h3>Passive scores</h3>
      <ul className="rows">
        <li>
          <span className="name">Passive Perception</span>
          <span className="bonus">{derived.passive.perception}</span>
        </li>
        <li>
          <span className="name">Passive Investigation</span>
          <span className="bonus">{derived.passive.investigation}</span>
        </li>
        <li>
          <span className="name">Passive Insight</span>
          <span className="bonus">{derived.passive.insight}</span>
        </li>
      </ul>

      <h3>Training</h3>
      <p>Armor: {derived.training.armor.length > 0 ? derived.training.armor.join(', ') : 'None'}</p>
      <p>Weapons: {derived.training.weapons.join(', ')}</p>
      <p>Tool: {derived.training.tool}</p>
    </>
  )
}
