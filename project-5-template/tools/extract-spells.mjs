// Extracts the spells from the text of the SRD 5.2.1 PDF into src/catalog/data/2024/spells.json.
// This is how the spell data was produced, kept so the result can be checked and repeated. It is not part of the app.
//
// Usage (needs the `pdftotext` tool):
//   pdftotext SRD_CC_v5.2.1.pdf srd.txt
//   node tools/extract-spells.mjs srd.txt src/catalog/data/2024/spells.json
//
// The SRD prints every spell the same way:
//   Name
//   Level 3 Evocation (Sorcerer, Wizard)       or:   Evocation Cantrip (Sorcerer, Wizard)
//   Casting Time: ... Range: ... Components: ... Duration: ...   (this block may wrap onto several lines)
//   description paragraphs
import fs from 'node:fs'

const [, , rawPath, outPath] = process.argv
if (!rawPath || !outPath) throw new Error('usage: node tools/extract-spells.mjs <srd text> <output json>')

const lines = fs.readFileSync(rawPath, 'utf8').split('\n').map((line) => line.replace(/\f/g, '').trimEnd())

// The spell descriptions run from the "Spell Descriptions" heading to the "Rules Glossary".
const start = lines.findIndex((line, i) => line === 'Spell Descriptions' && lines[i + 1] === 'Acid Arrow')
const end = lines.findIndex((line, i) => i > start && line === 'Rules Glossary')
if (start < 0 || end < 0) throw new Error(`spell section not found (${start}, ${end})`)
const section = lines.slice(start + 1, end)

const headerPattern = /^(?:Level (\d) ([A-Z][a-z]+)|([A-Z][a-z]+) Cantrip) \(([^)]+)\)$/
const timesPattern = /^Casting Time: (.+?) Range: (.+?) Components?: (.+?) Duration: (.+)$/

// Page numbers and running page headers that fall in the middle of a spell.
const isNoise = (line) =>
  /^\s*$/.test(line) ||
  /^\d{1,3}$/.test(line.trim()) ||
  /^(\d{1,3}\s+)?System Reference Document 5\.2\.1(\s+\d{1,3})?$/.test(line.trim())

// The PDF text shows bullets as a garbled character, and the multiplication sign too.
function repairCharacters(text) {
  return text.replace(/(\d) � (\d)/g, '$1 × $2').replace(/�/g, '•')
}

// A paragraph that runs across a page break arrives as two lines. Join a line that clearly continues the
// one before it: the one before does not end a sentence, and the new line starts with a lowercase letter or "(".
//
// A continuation can also start with a capital letter (an ability or damage type). Tables, bullet lists and creature
// stat blocks also have capital-letter lines that must stay separate, so those joins are allowed only for the spells
// below, where the split falls in the middle of a sentence. Each was checked by reading the PDF text:
const CAPITAL_JOINS = new Set(['Antipathy/Sympathy', 'Cone of Cold', 'Find Steed', 'Harm', 'Sleet Storm'])
const LONG_LINE = 80
const joins = []
function joinBrokenParagraphs(paragraphs, spellName) {
  const joined = []
  for (const line of paragraphs) {
    const previous = joined[joined.length - 1]
    const unfinished = previous !== undefined && !/[.!?:;)"”•]$/.test(previous) && !previous.endsWith('--')
    const continues = unfinished && (/^[a-z(]/.test(line) || (CAPITAL_JOINS.has(spellName) && previous.length >= LONG_LINE))
    if (continues && !/^[a-z(]/.test(line)) joins.push(`${spellName}: "...${previous.slice(-30)}" + "${line.slice(0, 30)}..."`)
    if (!continues) joined.push(line)
    else if (/[a-z]-$/.test(previous)) joined[joined.length - 1] = previous.slice(0, -1) + line // a word split across lines
    else joined[joined.length - 1] = `${previous} ${line}`
  }
  return joined
}

const starts = []
for (let i = 0; i < section.length - 2; i++) {
  if (headerPattern.test(section[i + 1]) && section[i + 2].startsWith('Casting Time:')) starts.push(i)
}

const problems = []
const spells = []
const seen = new Set()
let joinedCount = 0

starts.forEach((at, index) => {
  const name = section[at].trim()
  const header = headerPattern.exec(section[at + 1])

  // The Casting Time / Range / Components / Duration block can wrap; join lines until the Duration line.
  let blockEnd = at + 2
  while (blockEnd < at + 14 && !section[blockEnd].includes('Duration:')) blockEnd++
  const block = section
    .slice(at + 2, blockEnd + 1)
    .filter((line) => !isNoise(line))
    .map((line) => line.trim())
    .join(' ')
  const times = timesPattern.exec(block)
  if (!header) return problems.push(`${name}: header`)
  if (!times) return problems.push(`${name}: casting block "${block}"`)

  const nextStart = index + 1 < starts.length ? starts[index + 1] : section.length
  const rawBody = section
    .slice(blockEnd + 1, nextStart)
    .filter((line) => !isNoise(line))
    .map((line) => line.trim())
  const body = joinBrokenParagraphs(rawBody, name)
  joinedCount += rawBody.length - body.length

  const id = name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (seen.has(id)) problems.push(`${name}: duplicate id ${id}`)
  seen.add(id)

  spells.push({
    id,
    name,
    edition: '2024',
    source: 'srd-5.2.1',
    level: header[1] === undefined ? 0 : Number(header[1]),
    school: header[2] ?? header[3],
    classes: header[4].split(',').map((c) => c.trim().toLowerCase()),
    castingTime: repairCharacters(times[1]),
    range: repairCharacters(times[2]),
    components: repairCharacters(times[3]),
    duration: repairCharacters(times[4]),
    description: repairCharacters(body.join('\n')),
  })
})

if (problems.length > 0) {
  console.error('problems:', problems)
  process.exit(1)
}

spells.sort((a, b) => a.name.localeCompare(b.name))
fs.writeFileSync(outPath, JSON.stringify(spells, null, 2) + '\n')

const byLevel = {}
for (const s of spells) byLevel[s.level] = (byLevel[s.level] ?? 0) + 1
console.log('joins that started with a capital letter (check these):')
for (const join of joins) console.log('  ' + join)
console.log(`wrote ${spells.length} spells to ${outPath}; by level: ${JSON.stringify(byLevel)}; paragraphs joined across page breaks: ${joinedCount}`)
