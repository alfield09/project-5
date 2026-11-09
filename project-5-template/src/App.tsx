import { useState } from 'react'
import { catalog } from './catalog/load'
import type { Character } from './engine/character'
import { addToHistory, rollCheck, type RandomSource, type RollMode, type RollResult } from './engine/dice'
import { reconcileCharacter } from './engine/reconcile'
import { browserStorage, loadCharacter, saveCharacter, type StorageLike } from './storage/characterStorage'
import AbilityScoreStep from './ui/AbilityScoreStep'
import Attribution from './ui/Attribution'
import CatalogStep from './ui/CatalogStep'
import ChoicesStep from './ui/ChoicesStep'
import RollPanel from './ui/RollPanel'
import SheetPanel from './ui/SheetPanel'
import SpellsStep from './ui/SpellsStep'
import SpellsTab from './ui/SpellsTab'

const newCharacter: Character = {
  edition: '2024',
  level: 1,
  baseScores: {},
  classSkills: [],
  speciesSkills: [],
}

type SaveStatus = { kind: 'idle' } | { kind: 'saved' } | { kind: 'not-saved'; reason: string }

/** Choices that were cleared, with the sentence that explains why. */
interface Cleared {
  heading: string
  items: string[]
}

interface Start {
  character: Character
  cleared?: Cleared // choices dropped because the catalog no longer offers them
  notice?: string // something the player should know about the saved character
  saveStatus: SaveStatus
}

/** The character to start with: the saved one if there is a usable one, otherwise a new one. */
function startFrom(storage: StorageLike | undefined): Start {
  const loaded = loadCharacter(storage)

  if (loaded.status === 'loaded') {
    const { character, removed } = reconcileCharacter(loaded.character, catalog)
    const cleared = removed.length > 0 ? { heading: 'Cleared from your saved character because the catalog no longer offers it:', items: removed } : undefined
    return { character, cleared, saveStatus: { kind: 'idle' } }
  }
  if (loaded.status === 'unreadable') {
    return {
      character: newCharacter,
      notice: `Your saved character could not be read (${loaded.reason}), so a new one was started. The old save is replaced as soon as you make a change.`,
      saveStatus: { kind: 'idle' },
    }
  }
  if (loaded.status === 'unavailable') {
    return { character: newCharacter, saveStatus: { kind: 'not-saved', reason: 'browser storage is not available' } }
  }
  return { character: newCharacter, saveStatus: { kind: 'idle' } }
}

function saveMessage(status: SaveStatus): string {
  if (status.kind === 'saved') return 'Saved in this browser.'
  if (status.kind === 'not-saved') return `Not saved: ${status.reason}. Your character is kept only while this page is open.`
  return 'Your character is saved in this browser as you make changes.'
}

// The one character record. Every edit goes through change(), which keeps the choices consistent,
// reports anything it had to clear (spec.md, "Edit later"), and saves the result.
// `random` and `storage` are replaceable so tests can fix the dice and use a stand-in for the browser's storage.
export default function App({
  random = Math.random,
  storage: storageProp,
}: {
  random?: RandomSource
  storage?: StorageLike | null // null means no storage; leave out to use the browser's
}) {
  const [storage] = useState<StorageLike | undefined>(() => (storageProp === undefined ? browserStorage() : (storageProp ?? undefined)))
  const [start] = useState<Start>(() => startFrom(storage))

  const [character, setCharacter] = useState<Character>(start.character)
  const [cleared, setCleared] = useState<Cleared | undefined>(start.cleared)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(start.saveStatus)
  const [rollMode, setRollMode] = useState<RollMode>('normal')
  const [rolls, setRolls] = useState<RollResult[]>([]) // newest first; not saved (spec.md, provisional)
  const [view, setView] = useState<'sheet' | 'spells'>('sheet') // which part of the sheet is showing

  function change(patch: Partial<Character>) {
    const result = reconcileCharacter({ ...character, ...patch }, catalog)
    setCharacter(result.character)
    setCleared(result.removed.length > 0 ? { heading: 'Cleared because of your last change:', items: result.removed } : undefined)

    const saved = saveCharacter(storage, result.character)
    setSaveStatus(saved.ok ? { kind: 'saved' } : { kind: 'not-saved', reason: saved.reason })
  }

  function roll(label: string, bonus: number) {
    setRolls(addToHistory(rolls, rollCheck(label, bonus, rollMode, random)))
    setRollMode('normal') // advantage and disadvantage apply to one roll only
  }

  return (
    <main>
      <h1>Sheetforge</h1>
      <p>Free D&amp;D character builder.</p>

      <div className="layout">
        <div className="builder">
          {start.notice && (
            <div role="alert" className="notice">
              <p>{start.notice}</p>
            </div>
          )}
          {cleared && (
            <div role="status" className="notice">
              <p>{cleared.heading}</p>
              <ul>
                {cleared.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <p role="status" className="save-status">
            {saveMessage(saveStatus)}
          </p>

          <CatalogStep
            speciesId={character.speciesId}
            backgroundId={character.backgroundId}
            classId={character.classId}
            onChange={change}
          />
          <AbilityScoreStep
            method={character.scoreMethod ?? 'standardArray'}
            rolled={character.rolledScores ?? []}
            scores={character.baseScores}
            onChange={change}
            random={random}
          />
          <ChoicesStep character={character} onChange={change} />
          <SpellsStep character={character} onChange={change} />
        </div>

        <div className="sheet-pane">
          <RollPanel mode={rollMode} onModeChange={setRollMode} history={rolls} onClear={() => setRolls([])} />
          <div role="group" aria-label="Sheet view" className="filters">
            <button type="button" aria-pressed={view === 'sheet'} onClick={() => setView('sheet')}>
              Stats
            </button>
            <button type="button" aria-pressed={view === 'spells'} onClick={() => setView('spells')}>
              Spells
            </button>
          </div>
          {view === 'sheet' ? <SheetPanel character={character} onRoll={roll} /> : <SpellsTab character={character} onRoll={roll} />}
        </div>
      </div>

      <Attribution />
    </main>
  )
}
