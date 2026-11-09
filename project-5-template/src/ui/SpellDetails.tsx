// The details of one spell as the SRD prints them. Shared by the picker and the Spells view.
import type { Spell } from '../catalog/types'

export default function SpellDetails({ spell }: { spell: Spell }) {
  return (
    <div className="spell-details">
      <dl>
        <div>
          <dt>Casting time</dt>
          <dd>{spell.castingTime}</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>{spell.range}</dd>
        </div>
        <div>
          <dt>Components</dt>
          <dd>{spell.components}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{spell.duration}</dd>
        </div>
      </dl>
      {spell.description.split('\n').map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  )
}
