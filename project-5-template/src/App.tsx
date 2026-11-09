import AbilityScoreStep from './ui/AbilityScoreStep'
import Attribution from './ui/Attribution'
import CatalogStep from './ui/CatalogStep'

// Temporary builder page: the first two builder steps exist so far.
export default function App() {
  return (
    <main>
      <h1>Sheetforge</h1>
      <p>Free D&amp;D character builder.</p>
      <CatalogStep />
      <AbilityScoreStep />
      <Attribution />
    </main>
  )
}
