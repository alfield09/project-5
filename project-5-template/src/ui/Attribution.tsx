// Credits for the content shown in the app. The license requires this text to appear (research.md, Sources and credits).
import { catalog } from '../catalog/load'

export default function Attribution() {
  return (
    <footer>
      <h2>Credits</h2>
      {catalog.sources.map((source) => (
        <p key={source.id}>{source.attribution}</p>
      ))}
    </footer>
  )
}
