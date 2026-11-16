// Builder step: the choices that depend on species, background and class, plus worn armor.
// Display and input only; the rules are enforced by the engine (derive.ts and reconcile.ts).
import { catalog } from '../catalog/load'
import { ABILITIES, type Ability } from '../engine/abilityScores'
import type { AbilityImprovement, Character } from '../engine/character'
import { improvementLevels, invocationLimit } from '../engine/classLevels'
import { proficientSkillNames } from '../engine/classOptions'
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

/** One Ability Score Improvement: +2 to one ability, or +1 to each of two. No score goes above 20. */
function ImprovementPicker({ at, pick, onPick }: { at: number; pick: AbilityImprovement | undefined; onPick: (pick: AbilityImprovement) => void }) {
  const mode = pick?.mode ?? 'plusTwo'
  const chosen = pick?.abilities ?? []
  const setAbility = (index: number, value: string) => {
    const abilities = [...chosen]
    if (value === '') abilities.splice(index, 1)
    else abilities[index] = value as Ability
    onPick({ mode, abilities: abilities.filter((ability) => ability !== undefined) })
  }
  const abilitySelect = (index: number, label: string) => (
    <>
      <label htmlFor={`improvement-${at}-${index}`}>{label} </label>
      <select id={`improvement-${at}-${index}`} value={chosen[index] ?? ''} onChange={(event) => setAbility(index, event.target.value)}>
        <option value="">Choose</option>
        {ABILITIES.map((ability) => (
          <option key={ability} value={ability}>
            {ABILITY_NAMES[ability]}
          </option>
        ))}
      </select>{' '}
    </>
  )
  return (
    <fieldset>
      <legend>Level {at} Ability Score Improvement</legend>
      <label className="choice">
        <input type="radio" name={`improvement-${at}-mode`} checked={mode === 'plusTwo'} onChange={() => onPick({ mode: 'plusTwo', abilities: [] })} />
        +2 to one ability
      </label>
      <label className="choice">
        <input type="radio" name={`improvement-${at}-mode`} checked={mode === 'plusOneEach'} onChange={() => onPick({ mode: 'plusOneEach', abilities: [] })} />
        +1 to two abilities
      </label>
      <p>
        {mode === 'plusTwo' ? abilitySelect(0, `Level ${at}: +2 to`) : (<>{abilitySelect(0, `Level ${at}: first +1 to`)}{abilitySelect(1, `Level ${at}: second +1 to`)}</>)}
      </p>
      <p className="option-text">A score stops at 20.</p>
    </fieldset>
  )
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

  const proficient = proficientSkillNames(character, catalog) // the skills Expertise can be taken in
  const expertisePicks = character.expertiseSkills ?? []
  const toolPicks = character.toolIds ?? []
  const toolChoice = classEntry?.tools.choice
  const invocationRule = classEntry?.invocations
  const invocationCount = invocationLimit(classEntry, character.level, catalog.invocations.length).count
  const invocationPicks = character.invocationIds ?? []
  const improvements = improvementLevels(classEntry, character.level)

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

      {improvements.map((at) => (
        <ImprovementPicker
          key={at}
          at={at}
          pick={character.abilityImprovements?.[String(at)]}
          onPick={(pick) => onChange({ abilityImprovements: { ...character.abilityImprovements, [String(at)]: pick } })}
        />
      ))}

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

      {classEntry?.order && (
        <fieldset>
          <legend>{classEntry.order.name}</legend>
          {classEntry.order.options.map((option) => (
            <div key={option.id}>
              <label className="choice">
                <input
                  type="radio"
                  name="class-order"
                  checked={character.orderId === option.id}
                  onChange={() => onChange({ orderId: option.id })}
                />
                {option.name}
              </label>
              <p className="option-text">{option.description}</p>
            </div>
          ))}
        </fieldset>
      )}

      {invocationRule && (
        <fieldset>
          <legend>
            {invocationRule.label}: pick {invocationCount}
          </legend>
          {/* One invocation is a radio; more than one are checkboxes that stop at the limit. */}
          {catalog.invocations.map((invocation) => (
            <div key={invocation.id}>
              <label className="choice">
                <input
                  type={invocationCount === 1 ? 'radio' : 'checkbox'}
                  name="invocation"
                  checked={invocationPicks.includes(invocation.id)}
                  onChange={() => onChange({ invocationIds: invocationCount === 1 ? [invocation.id] : togglePick(invocationPicks, invocation.id, invocationCount) })}
                />
                {invocation.name}
              </label>
              <details>
                <summary>Details</summary>
                {invocation.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </details>
            </div>
          ))}
        </fieldset>
      )}

      {classEntry?.expertise && (
        <fieldset>
          <legend>
            Expertise: pick {classEntry.expertise.skills} skills ({expertisePicks.length} chosen)
          </legend>
          <p className="option-text">Your proficiency bonus counts twice for these skills.</p>
          {proficient.length === 0 ? (
            <p>Pick your skills first.</p>
          ) : (
            proficient.map((skill) => {
              const checked = expertisePicks.includes(skill)
              return (
                <label key={skill} className="choice">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && expertisePicks.length >= (classEntry.expertise?.skills ?? 0)}
                    onChange={() => onChange({ expertiseSkills: togglePick(expertisePicks, skill, classEntry.expertise?.skills ?? 0) })}
                  />
                  {skill}
                </label>
              )
            })
          )}
        </fieldset>
      )}

      {toolChoice && (
        <fieldset>
          <legend>
            Tool proficiencies: pick {toolChoice.count} ({toolPicks.length} chosen)
          </legend>
          {catalog.tools
            .filter((tool) => toolChoice.kinds.includes(tool.kind))
            .map((tool) => {
              const checked = toolPicks.includes(tool.id)
              return (
                <label key={tool.id} className="choice">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && toolPicks.length >= toolChoice.count}
                    onChange={() => onChange({ toolIds: togglePick(toolPicks, tool.id, toolChoice.count) })}
                  />
                  {tool.name}
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
