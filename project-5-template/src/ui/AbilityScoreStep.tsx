// Builder step: choose a score method, then assign six ability scores.
// Display and input only; every rule and calculation comes from the engine (spec.md, Structure rules).
import { useState } from 'react'
import {
  ABILITIES,
  POINT_BUY_BUDGET,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
  abilityModifier,
  availableFromPool,
  checkFromPool,
  checkManualScore,
  checkPointBuy,
  pointBuyCost,
  rollAbilityScores,
  type Ability,
  type PartialScores,
  type ScoreMethod,
} from '../engine/abilityScores'
import type { RandomSource } from '../engine/dice'
import { ABILITY_NAMES, formatModifier } from './labels'

const METHOD_LABELS: Record<ScoreMethod, string> = {
  standardArray: 'Standard array',
  pointBuy: 'Point buy',
  roll: 'Roll (4d6, drop lowest)',
  manual: 'Manual entry',
}

const METHODS: ScoreMethod[] = ['standardArray', 'pointBuy', 'roll', 'manual']


// Point buy starts with every ability at the minimum score.
function allAtMinimum(): PartialScores {
  const scores: PartialScores = {}
  for (const ability of ABILITIES) scores[ability] = POINT_BUY_MIN
  return scores
}

/** The parts of the character record this step edits. They always change together, in one patch. */
export interface ScorePatch {
  scoreMethod?: ScoreMethod
  rolledScores?: number[]
  baseScores?: PartialScores
}

interface Props {
  method: ScoreMethod
  rolled: number[] // the six rolled values, before assignment
  scores: PartialScores
  onChange: (patch: ScorePatch) => void
  random?: RandomSource // replaceable so tests can fix the dice
}

// The method, rolled values and scores live in the character record (owned by the app), so they are saved and
// restored with it. Only the text typed into the manual boxes is kept here, so half-typed numbers can be shown.
export default function AbilityScoreStep({ method, rolled, scores, onChange, random = Math.random }: Props) {
  const [manualText, setManualText] = useState<Partial<Record<Ability, string>>>({})
  const setScores = (baseScores: PartialScores) => onChange({ baseScores })

  const pointBuy = checkPointBuy(scores)
  const assignedCount = ABILITIES.filter((ability) => scores[ability] !== undefined).length
  // Point buy starts with all 8s, which is not work worth confirming over.
  const hasWork =
    method === 'pointBuy' ? pointBuy.spent > 0 : rolled.length > 0 || assignedCount > 0

  function chooseMethod(next: ScoreMethod) {
    if (next === method) return

    setManualText({})

    if (next === 'manual') {
      // Manual entry accepts any valid number, so the current scores carry over.
      onChange({ scoreMethod: next, rolledScores: [] })
      return
    }

    if (hasWork && !window.confirm('Switching methods clears your scores. Continue?')) return
    onChange({ scoreMethod: next, rolledScores: [], baseScores: next === 'pointBuy' ? allAtMinimum() : {} })
  }

  function setScore(ability: Ability, score: number | undefined) {
    setScores({ ...scores, [ability]: score })
  }

  function adjustPointBuy(ability: Ability, change: number) {
    const next = { ...scores, [ability]: (scores[ability] ?? POINT_BUY_MIN) + change }
    if (checkPointBuy(next).valid) setScores(next)
  }

  function canAdjustPointBuy(ability: Ability, change: number): boolean {
    const next = { ...scores, [ability]: (scores[ability] ?? POINT_BUY_MIN) + change }
    return checkPointBuy(next).valid
  }

  function rollScores() {
    // A new roll gives new values to assign, so the old assignments are cleared with it.
    onChange({ rolledScores: rollAbilityScores(random).sort((a, b) => b - a), baseScores: {} })
  }

  function changeManual(ability: Ability, text: string) {
    setManualText({ ...manualText, [ability]: text })
    const score = Number(text)
    setScore(ability, text.trim() !== '' && checkManualScore(score).valid ? score : undefined)
  }

  // The pool of values to hand out, for the two methods that assign from a set.
  const pool = method === 'roll' ? rolled : STANDARD_ARRAY
  const poolCheck = checkFromPool(scores, pool)
  const complete = assignedCount === ABILITIES.length && (method !== 'pointBuy' || pointBuy.valid)

  return (
    <section aria-labelledby="ability-heading">
      <h2 id="ability-heading">Ability scores</h2>

      <fieldset>
        <legend>Method</legend>
        {METHODS.map((option) => (
          <label key={option} className="choice">
            <input
              type="radio"
              name="score-method"
              checked={method === option}
              onChange={() => chooseMethod(option)}
            />
            {METHOD_LABELS[option]}
          </label>
        ))}
      </fieldset>

      {method === 'standardArray' && (
        <p>Use each of {STANDARD_ARRAY.join(', ')} once.</p>
      )}
      {method === 'pointBuy' && (
        <p role="status">
          Points spent: {pointBuy.spent} of {POINT_BUY_BUDGET}. Remaining: {pointBuy.remaining}.
          Scores run from {POINT_BUY_MIN} to {POINT_BUY_MAX}.
        </p>
      )}
      {method === 'roll' && (
        <p>
          <button type="button" onClick={rollScores}>
            {rolled.length === 0 ? 'Roll scores' : 'Roll again'}
          </button>{' '}
          {rolled.length > 0 && <span>Rolled: {rolled.join(', ')}</span>}
        </p>
      )}
      {method === 'manual' && <p>Type a whole number from 1 to 20 for each ability.</p>}

      <table>
        <thead>
          <tr>
            <th scope="col">Ability</th>
            <th scope="col">Score</th>
            <th scope="col">Modifier</th>
          </tr>
        </thead>
        <tbody>
          {ABILITIES.map((ability) => {
            const score = scores[ability]
            const text = manualText[ability] ?? (score === undefined ? '' : String(score)) // typed text, else the saved score
            const manualInvalid =
              method === 'manual' && text.trim() !== '' && !checkManualScore(Number(text)).valid
            const inputId = `score-${ability}`

            return (
              <tr key={ability}>
                <th scope="row">
                  <label htmlFor={inputId}>{ABILITY_NAMES[ability]}</label>
                </th>
                <td>
                  {(method === 'standardArray' || method === 'roll') && (
                    <select
                      id={inputId}
                      value={score ?? ''}
                      disabled={method === 'roll' && rolled.length === 0}
                      onChange={(event) =>
                        setScore(ability, event.target.value === '' ? undefined : Number(event.target.value))
                      }
                    >
                      <option value="">Choose</option>
                      {availableFromPool(pool, scores, ability).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  )}

                  {method === 'pointBuy' && (
                    <span id={inputId} className="stepper">
                      <button
                        type="button"
                        aria-label={`Decrease ${ABILITY_NAMES[ability]}`}
                        disabled={!canAdjustPointBuy(ability, -1)}
                        onClick={() => adjustPointBuy(ability, -1)}
                      >
                        -
                      </button>
                      <output aria-label={`${ABILITY_NAMES[ability]} score`}>{score}</output>
                      <button
                        type="button"
                        aria-label={`Increase ${ABILITY_NAMES[ability]}`}
                        disabled={!canAdjustPointBuy(ability, 1)}
                        onClick={() => adjustPointBuy(ability, 1)}
                      >
                        +
                      </button>
                      <small>cost {score === undefined ? '' : pointBuyCost(score)}</small>
                    </span>
                  )}

                  {method === 'manual' && (
                    <>
                      <input
                        id={inputId}
                        type="number"
                        inputMode="numeric"
                        value={text}
                        aria-invalid={manualInvalid}
                        onChange={(event) => changeManual(ability, event.target.value)}
                      />
                      {manualInvalid && (
                        <small role="alert"> Must be a whole number from 1 to 20.</small>
                      )}
                    </>
                  )}
                </td>
                <td>{score === undefined ? '-' : formatModifier(abilityModifier(score))}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!poolCheck.valid && <p role="alert">{poolCheck.errors.join(' ')}</p>}
      <p role="status">{complete ? 'All six scores are assigned.' : 'Assign all six scores to continue.'}</p>
    </section>
  )
}
