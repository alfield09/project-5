// Builder step: choose a species, background and class from the catalog and see what each one contains.
// Display and input only; the data comes from the validated catalog (src/catalog).
import { useState } from 'react'
import { catalog, catalogMessages } from '../catalog/load'
import { ABILITY_NAMES } from './labels'

export default function CatalogStep() {
  const [speciesId, setSpeciesId] = useState('')
  const [backgroundId, setBackgroundId] = useState('')
  const [classId, setClassId] = useState('')

  const species = catalog.species.find((entry) => entry.id === speciesId)
  const background = catalog.backgrounds.find((entry) => entry.id === backgroundId)
  const classEntry = catalog.classes.find((entry) => entry.id === classId)

  return (
    <section aria-labelledby="catalog-heading">
      <h2 id="catalog-heading">Species, background and class</h2>

      {catalogMessages.length > 0 && (
        <div role="alert">
          <p>Some catalog entries could not be loaded:</p>
          <ul>
            {catalogMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <p>
        <label htmlFor="species-select">Species </label>
        <select id="species-select" value={speciesId} onChange={(event) => setSpeciesId(event.target.value)}>
          <option value="">Choose</option>
          {catalog.species.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </p>
      {species && (
        <div className="details">
          <p>
            {species.creatureType}. Size: {species.sizes.join(' or ')}. Speed: {species.speed} feet.
            {species.darkvision !== undefined && ` Darkvision: ${species.darkvision} feet.`}
          </p>
          <dl>
            {species.traits.map((trait) => (
              <div key={trait.name}>
                <dt>{trait.name}</dt>
                <dd>{trait.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p>
        <label htmlFor="background-select">Background </label>
        <select id="background-select" value={backgroundId} onChange={(event) => setBackgroundId(event.target.value)}>
          <option value="">Choose</option>
          {catalog.backgrounds.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </p>
      {background && (
        <div className="details">
          <ul>
            <li>Ability scores: {background.abilityScores.map((ability) => ABILITY_NAMES[ability]).join(', ')}</li>
            <li>Feat: {background.feat}</li>
            <li>Skill proficiencies: {background.skillProficiencies.join(', ')}</li>
            <li>Tool proficiency: {background.toolProficiency}</li>
            <li>Equipment: {background.equipment}</li>
          </ul>
        </div>
      )}

      <p>
        <label htmlFor="class-select">Class </label>
        <select id="class-select" value={classId} onChange={(event) => setClassId(event.target.value)}>
          <option value="">Choose</option>
          {catalog.classes.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </p>
      {classEntry && (
        <div className="details">
          <ul>
            <li>Primary ability: {classEntry.primaryAbility}</li>
            <li>Hit die: d{classEntry.hitDie}</li>
            <li>Saving throws: {classEntry.savingThrows.map((ability) => ABILITY_NAMES[ability]).join(', ')}</li>
            <li>
              Skills: choose {classEntry.skillChoices.count} from {classEntry.skillChoices.options.join(', ')}
            </li>
            <li>Weapons: {classEntry.weaponProficiencies.join(', ')}</li>
            <li>Armor training: {classEntry.armorTraining.length > 0 ? classEntry.armorTraining.join(', ') : 'None'}</li>
            <li>Starting equipment: {classEntry.startingEquipment}</li>
            <li>Subclass chosen at level {classEntry.subclassLevel}</li>
            {classEntry.spellcasting ? (
              <li>
                Spellcasting at level 1: ability {ABILITY_NAMES[classEntry.spellcasting.ability]},{' '}
                {classEntry.spellcasting.level1.cantrips} cantrips, {classEntry.spellcasting.level1.preparedSpells}{' '}
                prepared spells, {classEntry.spellcasting.level1.slots[0]} level 1 slots
              </li>
            ) : (
              <li>No spellcasting</li>
            )}
          </ul>
        </div>
      )}
    </section>
  )
}
