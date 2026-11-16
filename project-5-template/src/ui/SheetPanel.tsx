// The character sheet: shows what the engine calculates. No calculation happens here (spec.md, Structure rules).
import { useMemo, type CSSProperties } from 'react'
import { catalog } from '../catalog/load'
import { ABILITIES, type Ability } from '../engine/abilityScores'
import type { Character } from '../engine/character'
import { deriveCharacter } from '../engine/derive'
import { SKILLS } from '../engine/skills'
import { ABILITY_NAMES, formatModifier } from './labels'

/** Called when the player clicks something rollable, with its name and its bonus. */
export type RollHandler = (label: string, bonus: number) => void

/** `printing` is true while the browser prints: every feature shows with its full text. */
export default function SheetPanel({ character, onRoll, printing = false }: { character: Character; onRoll: RollHandler; printing?: boolean }) {
  const result = useMemo(() => deriveCharacter(character, catalog), [character])

  const species = catalog.species.find((entry) => entry.id === character.speciesId)
  const classEntry = catalog.classes.find((entry) => entry.id === character.classId)
  const background = catalog.backgrounds.find((entry) => entry.id === character.backgroundId)
  const title =
    species && classEntry ? `${species.name} ${classEntry.name}, level ${character.level}` : 'New character'

  return (
    <section aria-labelledby="sheet-heading" className="sheet">
      <h2 id="sheet-heading">Character sheet</h2>
      {character.name && <p className="sheet-name">{character.name}</p>}
      <p className="sheet-title">{title}</p>
      {background && <p className="sheet-background">Background: {background.name}</p>}

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

      {result.ok && <SheetNumbers derived={result.derived} onRoll={onRoll} printing={printing} />}
    </section>
  )
}

/** Proficiency marker: open circle, filled circle, or a diamond for Expertise (the proficiency bonus counts twice). */
function Marker({ proficient, expert = false }: { proficient: boolean; expert?: boolean }) {
  const label = expert ? 'expertise' : proficient ? 'proficient' : 'not proficient'
  return (
    <span className="marker" aria-label={label}>
      {expert ? '◆' : proficient ? '●' : '○'}
    </span>
  )
}

/**
 * Where each ability sits in the printed sheet: its saving throw and then its skills, one row each, with the ability
 * tile spanning them (the reference sheet's grouping). The numbers go to the CSS as --row and --span; the screen ignores them.
 */
function printPlacement(): { ability: Ability; row: number; span: number; skillRows: Record<string, number> }[] {
  let next = 1
  return ABILITIES.map((ability) => {
    const skills = SKILLS.filter((skill) => skill.ability === ability)
    const row = next
    next += 1 + skills.length
    return { ability, row, span: 1 + skills.length, skillRows: Object.fromEntries(skills.map((skill, index) => [skill.name, row + 1 + index])) }
  })
}

const PLACEMENT = printPlacement()
const placementOf = (ability: Ability) => PLACEMENT.find((entry) => entry.ability === ability)!
const rowStyle = (row: number, span?: number) => ({ '--row': row, ...(span === undefined ? {} : { '--span': span }) }) as CSSProperties

function SheetNumbers({
  derived,
  onRoll,
  printing,
}: {
  derived: Extract<ReturnType<typeof deriveCharacter>, { ok: true }>['derived']
  onRoll: RollHandler
  printing: boolean
}) {
  return (
    <div className="sheet-body">
      {derived.warnings.length > 0 && (
        <ul className="warnings" aria-label="Warnings">
          {derived.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <ul className="abilities" aria-label="Ability scores">
        {ABILITIES.map((ability) => (
          <li key={ability} style={rowStyle(placementOf(ability).row, placementOf(ability).span)}>
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
        <div>
          <dt>Hit dice</dt>
          <dd>
            {derived.level}d{derived.hitDie}
          </dd>
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

      <div className="part saves">
      <h3>Saving throws</h3>
      <ul className="rows">
        {ABILITIES.map((ability) => (
          <li key={ability} style={rowStyle(placementOf(ability).row)}>
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
      </div>

      <div className="part skills">
      <h3>Skills</h3>
      <ul className="rows">
        {SKILLS.map((skill) => (
          <li key={skill.name} style={rowStyle(placementOf(skill.ability).skillRows[skill.name])}>
            <button
              type="button"
              className="roll-row"
              aria-label={`Roll ${skill.name} check, ${formatModifier(derived.skills[skill.name])}`}
              onClick={() => onRoll(`${skill.name} check`, derived.skills[skill.name])}
            >
              <Marker proficient={derived.proficientSkills.includes(skill.name)} expert={derived.expertiseSkills.includes(skill.name)} />
              <span className="tag">{skill.ability.toUpperCase()}</span>
              <span className="name">{skill.name}</span>
              <span className="bonus">{formatModifier(derived.skills[skill.name])}</span>
            </button>
          </li>
        ))}
      </ul>
      </div>

      <div className="part passives">
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
      </div>

      <div className="part training">
      <h3>Training</h3>
      <p>Armor: {derived.training.armor.length > 0 ? derived.training.armor.join(', ') : 'None'}</p>
      <p>Weapons: {derived.training.weapons.join(', ')}</p>
      <p>Tools: {derived.training.tools.join(', ')}</p>
      </div>

      <div className="part features">
        <h3>Class features</h3>
        {Object.keys(derived.classColumns).length > 0 && (
          <ul className="rows" aria-label="Class numbers">
            {Object.entries(derived.classColumns).map(([name, value]) => (
              <li key={name}>
                <span className="name">{name}</span>
                <span className="bonus">{value}</span>
              </li>
            ))}
          </ul>
        )}
        <ul className="feature-list" aria-label="Class features">
          {derived.features.map((feature) => (
            <li key={`${feature.level}-${feature.name}`}>
              <details open={printing ? true : undefined}>
                <summary>
                  <strong>{feature.name}</strong> <span className="tag">Level {feature.level}</span>
                </summary>
                {feature.text.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </details>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
