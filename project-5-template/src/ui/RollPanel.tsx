// Shows the roll setting, the latest result, and the roll history. Display and input only:
// the dice logic is in src/engine/dice.ts.
import { describeRoll, type RollMode, type RollResult } from '../engine/dice'

const MODE_LABELS: Record<RollMode, string> = {
  normal: 'Normal',
  advantage: 'Advantage',
  disadvantage: 'Disadvantage',
}

const MODES: RollMode[] = ['normal', 'advantage', 'disadvantage']

interface Props {
  mode: RollMode
  onModeChange: (mode: RollMode) => void
  history: RollResult[] // newest first
  onClear: () => void
}

export default function RollPanel({ mode, onModeChange, history, onClear }: Props) {
  const latest = history[0]

  return (
    <section aria-labelledby="roll-heading" className="rolls">
      <h2 id="roll-heading">Rolls</h2>

      <fieldset className="mode">
        <legend>Next roll</legend>
        {MODES.map((option) => (
          <label key={option} className="choice">
            <input
              type="radio"
              name="roll-mode"
              checked={mode === option}
              onChange={() => onModeChange(option)}
            />
            {MODE_LABELS[option]}
          </label>
        ))}
      </fieldset>

      {/* Announced to screen readers each time a roll happens. */}
      <p role="status" aria-live="polite" className="latest-roll">
        {latest ? describeRoll(latest) : 'Click a skill, saving throw, ability or initiative to roll it.'}
      </p>

      {history.length > 0 && (
        <>
          <ol aria-label="Roll history" className="history">
            {history.map((roll, index) => (
              <li key={`${history.length - index}-${roll.label}-${roll.total}`}>{describeRoll(roll)}</li>
            ))}
          </ol>
          <button type="button" onClick={onClear}>
            Clear history
          </button>
        </>
      )}
    </section>
  )
}
