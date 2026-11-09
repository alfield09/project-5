// Loads the catalog from the JSON files and checks every entry.
// To add content, add an entry to a JSON file (or a new file listed here); no engine change is needed.
import sources from './data/sources.json'
import armor2024 from './data/2024/armor.json'
import backgrounds2024 from './data/2024/backgrounds.json'
import classes2024 from './data/2024/classes.json'
import species2024 from './data/2024/species.json'
import { validateCatalog } from './validate'

const result = validateCatalog({
  sources,
  species: species2024,
  backgrounds: backgrounds2024,
  classes: classes2024,
  armor: armor2024,
})

export const catalog = result.catalog

/** Problems found while loading, one per skipped entry. Empty when everything loaded. */
export const catalogMessages = result.messages
