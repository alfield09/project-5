// Download the character as a file, or load one from a file.
// Loading replaces the current character, so it asks first and says what will be replaced.
import { useState } from 'react'
import type { Character } from '../engine/character'
import { type DownloadFile } from './download'
import { MAX_FILE_BYTES, characterFileName, characterToFileText, parseCharacterFile } from '../storage/characterFile'

export default function FilePanel({
  character,
  onReplace,
  download,
}: {
  character: Character
  onReplace: (character: Character) => void
  download: DownloadFile
}) {
  const [waiting, setWaiting] = useState<Character | undefined>(undefined) // loaded from a file, not yet applied
  const [problem, setProblem] = useState<string | undefined>(undefined)
  const [done, setDone] = useState<string | undefined>(undefined)

  async function chooseFile(file: File | undefined) {
    setWaiting(undefined)
    setProblem(undefined)
    setDone(undefined)
    if (file === undefined) return
    if (file.size > MAX_FILE_BYTES) {
      setProblem('The file is too large to be a character.')
      return
    }
    const parsed = parseCharacterFile(await file.text())
    if (parsed.ok) setWaiting(parsed.character)
    else setProblem(`That file could not be used: ${parsed.reason}. Your character was not changed.`)
  }

  function exportFile() {
    download(characterFileName(character), characterToFileText(character))
    setDone('Downloaded. Keep the file somewhere safe; you can load it here later.')
    setProblem(undefined)
  }

  function replace() {
    if (waiting === undefined) return
    onReplace(waiting)
    setWaiting(undefined)
    setDone('Loaded the character from the file.')
  }

  return (
    <fieldset className="file-panel">
      <legend>Save to a file</legend>
      <p>Your character is stored in this browser only. A file is a backup you can keep or move to another device.</p>
      <div className="filters">
        <button type="button" onClick={exportFile}>
          Download character file
        </button>
        <button type="button" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <label>
          Load a character file
          <input type="file" accept="application/json,.json" onChange={(event) => void chooseFile(event.target.files?.[0])} />
        </label>
      </div>

      {waiting !== undefined && (
        <div role="alert" className="notice">
          <p>Replace the character you are building with the one in this file? The current one is lost unless you downloaded it.</p>
          <button type="button" onClick={replace}>
            Replace my character
          </button>{' '}
          <button type="button" onClick={() => setWaiting(undefined)}>
            Keep my character
          </button>
        </div>
      )}
      {problem !== undefined && (
        <p role="alert" className="notice">
          {problem}
        </p>
      )}
      {done !== undefined && <p role="status">{done}</p>}
    </fieldset>
  )
}
