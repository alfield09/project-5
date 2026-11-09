// Builder step: the choices that depend on species, background and class, plus worn armor.
// Display and input only; the rules are enforced by the engine (derive.ts and reconcile.ts).
import { catalog } from '../catalog/load'
import type { Ability } from '../engine/abilityScores'
import type { Character } from '../engine/character'
import { SKILL_NAMES } from '../engine/skills'
import { ABILITY_NAMES } from './labels'

interface Props {
  character: Character
  onChange: (patch: Partial<Character>) => void
}

/** Add a skill to a list of picks, or remove it. A new pick is ignored once the limit is reached. */
function togglePick(picks: string[], skill: string, limit: number): string[] {
  if (picks.includes(skill)) return picks.filter((pick) => pick !== skill)
  return picks.length < limit ? [...picks, skill] : picks
}

export default function ChoicesStep({ character, onChange }: Props) {
  const species = catalog.species.find((entry) => entry.id === character.speciesId)
  const background = catalog.backgrounds.find((entry) => entry.id === character.backgroundId)
  const classEntry = catalog.classes.find((entry) => entry.id === character.classId)

  const bonus = character.backgroundBonus
  const bonusMode = bonus !== undefined && 'plusOneAll' in bonus ? 'all' : 'split'
  const split = bonus !== undefined && !('plusOneAll' in bonus) ? bonus : {}

  function chooseAbility(field: 'plusTwo' | 'plusOne', value: string) {
    onChange({ backgroundBonus: { ...split, [field]: value === '' ? undefined : (value as Ability) } })
  }

  const freeSkills = species?.freeSkillChoices ?? 0

  return (
    <section aria-labelledby="choices-heading">
      <h2 id="choices-heading">Choices</h2>

      {background ? (
        <fieldset>
          <legend>Background bonus ({background.name})</legend>
          <label className="choice">
            <input
              type="radio"
              name="bonus-mode"
              checked={bonusMode === 'split'}
              onChange={() => onChange({ backgroundBonus: {} })}
            />
            +2 to one ability and +1 to another
          </label>
          <label className="choice">
            <input
              type="radio"
              name="bonus-mode"
              checked={bonusMode === 'all'}
              onChange={() => onChange({ backgroundBonus: { plusOneAll: true } })}
            />
            +1 to all three
          </label>

          {bonusMode === 'split' && (
            <p>
              <label htmlFor="bonus-two">+2 to </label>
              <select id="bonus-two" value={split.plusTwo ?? ''} onChange={(event) => chooseAbility('plusTwo', event.target.value)}>
                <option value="">Choose</option>
                {background.abilityScores
                  .filter((ability) => ability !== split.plusOne)
                  .map((ability) => (
                    <option key={ability} value={ability}>
                      {ABILITY_NAMES[ability]}
                    </option>
                  ))}
              </select>{' '}
              <label htmlFor="bonus-one">+1 to </label>
              <select id="bonus-one" value={split.plusOne ?? ''} onChange={(event) => chooseAbility('plusOne', event.target.value)}>
                <option value="">Choose</option>
                {background.abilityScores
                  .filter((ability) => ability !== split.plusTwo)
                  .map((ability) => (
                    <option key={ability} value={ability}>
                      {ABILITY_NAMES[ability]}
                    </option>
                  ))}
              </select>
            </p>
          )}
          {bonusMode === 'all' && (
            <p>Raises {background.abilityScores.map((ability) => ABILITY_NAMES[ability]).join(', ')} by 1 each.</p>
          )}
        </fieldset>
      ) : (
        <p>Choose a background to set its ability bonus.</p>
      )}

      {classEntry ? (
        <fieldset>
          <legend>
            Class skills: pick {classEntry.skillChoices.count} ({character.classSkills.length} chosen)
          </legend>
          {classEntry.skillChoices.options.map((skill) => {
            const checked = character.classSkills.includes(skill)
            return (
              <label key={skill} className="choice">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && character.classSkills.length >= classEntry.skillChoices.count}
                  onChange={() =>
                    onChange({ classSkills: togglePick(character.classSkills, skill, classEntry.skillChoices.count) })
                  }
                />
                {skill}
              </label>
            )
          })}
        </fieldset>
      ) : (
        <p>Choose a class to pick its skills.</p>
      )}

      {freeSkills > 0 && (
        <fieldset>
          <legend>
            {species?.name} skill: pick {freeSkills} ({character.speciesSkills.length} chosen)
          </legend>
          {SKILL_NAMES.map((skill) => {
            const checked = character.speciesSkills.includes(skill)
            return (
              <label key={skill} className="choice">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && character.speciesSkills.length >= freeSkills}
                  onChange={() => onChange({ speciesSkills: togglePick(character.speciesSkills, skill, freeSkills) })}
                />
                {skill}
              </label>
            )
          })}
        </fieldset>
      )}

      {classEntry ? (
        <fieldset>
          <legend>Starting equipment ({classEntry.name})</legend>
          {classEntry.startingEquipment.map((option) => (
            <label key={option.id} className="choice">
              <input
                type="radio"
                name="equipment-option"
                checked={character.equipmentOptionId === option.id}
                onChange={() => onChange({ equipmentOptionId: option.id })}
              />
              {option.id}: {option.description}
            </label>
          ))}
          <p>Your starting armor and shield come from the package you choose. Buying equipment with gold comes later.</p>
        </fieldset>
      ) : (
        <p>Choose a class to pick its starting equipment.</p>
      )}
    </section>
  )
}
