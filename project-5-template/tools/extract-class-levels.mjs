// Adds the level 1 to 20 data of the twelve classes to src/catalog/data/2024/classes.json, from the SRD 5.2.1 PDF text.
// This is how the data was produced, kept so the result can be checked and repeated. It is not part of the app.
//
// Usage (needs the `pdftotext` tool):
//   pdftotext -raw SRD_CC_v5.2.1.pdf srd-raw.txt   # one table row per line; used for the "<Class> Features" tables
//   pdftotext      SRD_CC_v5.2.1.pdf srd.txt       # one paragraph per line; used for the feature descriptions
//   node tools/extract-class-levels.mjs srd-raw.txt srd.txt src/catalog/data/2024/classes.json
//
// For each class it writes two fields:
//   levels:   20 rows { level, proficiencyBonus, features: [names], columns: {name: value}, spellcasting?: {...} }
//   features: [{ level, name, text }] the "Level N: Name" sections of the class description (subclass sections excluded)
import fs from 'node:fs'

const [, , rawPath, textPath, classesPath] = process.argv
if (!rawPath || !textPath || !classesPath) throw new Error('usage: node tools/extract-class-levels.mjs <raw text> <text> <classes json>')

const raw = fs.readFileSync(rawPath, 'utf8').split('\n').map((line) => line.replace(/\f/g, '').trim())
const text = fs.readFileSync(textPath, 'utf8').split('\n').map((line) => line.replace(/\f/g, '').trim())

// The table columns after the "Class Features" column, in order, for each class. A spell slot column per spell level
// (1 to 9, or 1 to 5 for half casters) comes last. 'spell:' columns feed the spellcasting object; the rest are kept as printed.
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `slot${n}`)
const FIVE = [1, 2, 3, 4, 5].map((n) => `slot${n}`)
const COLUMNS = {
  barbarian: ['Rages', 'Rage Damage', 'Weapon Mastery'],
  bard: ['Bardic Die', 'spell:cantrips', 'spell:prepared', ...NINE],
  cleric: ['Channel Divinity', 'spell:cantrips', 'spell:prepared', ...NINE],
  druid: ['Wild Shape', 'spell:cantrips', 'spell:prepared', ...NINE],
  fighter: ['Second Wind', 'Weapon Mastery'],
  monk: ['Martial Arts', 'Focus Points', 'Unarmored Movement'],
  paladin: ['Channel Divinity', 'spell:prepared', ...FIVE],
  ranger: ['Favored Enemy', 'spell:prepared', ...FIVE],
  rogue: ['Sneak Attack'],
  sorcerer: ['Sorcery Points', 'spell:cantrips', 'spell:prepared', ...NINE],
  warlock: ['Eldritch Invocations', 'spell:cantrips', 'spell:prepared', 'pact:slots', 'pact:slotLevel'],
  wizard: ['spell:cantrips', 'spell:prepared', ...NINE],
}

const isNoise = (line) => line === '' || /^\d{1,3}$/.test(line) || /^(\d{1,3}\s+)?System Reference Document 5\.2\.1(\s+\d{1,3})?$/.test(line)
const valueToken = /^(--|\+?\d+|D\d+|\d+d\d+|\+\d+ ft\.)$/

/** Split "Rage, Unarmored Defense (one use), Weapon Mastery" into names, ignoring commas inside parentheses. */
function splitFeatures(textOfCell) {
  if (textOfCell === '--') return []
  const names = []
  let depth = 0
  let current = ''
  for (const char of textOfCell) {
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ',' && depth === 0) {
      names.push(current.trim())
      current = ''
    } else current += char
  }
  names.push(current.trim())
  return names.filter(Boolean)
}

/** The last `count` value tokens of a line (a "+10 ft." speed counts as one), or undefined when the line does not end in them. */
function trailingValues(line, count) {
  const tokens = line.split(/\s+/)
  const values = []
  while (values.length < count && tokens.length > 0) {
    let token = tokens.pop()
    if (token === 'ft.' && tokens.length > 0) token = `${tokens.pop()} ft.`
    if (!valueToken.test(token)) return undefined
    values.unshift(token)
  }
  return values.length === count ? { values, rest: tokens.join(' ') } : undefined
}

// Headings that follow a class's last feature in the PDF but start a different section (found by reading the output).
const END_MARKERS = { sorcerer: 'Metamagic Options', warlock: 'Eldritch Invocation Options' }

const problems = []
const droppedFragments = []
const classes = JSON.parse(fs.readFileSync(classesPath, 'utf8'))
const summary = []

for (const entry of classes) {
  const className = entry.name
  const columns = COLUMNS[entry.id]
  if (columns === undefined) {
    problems.push(`${entry.id}: no column list`)
    continue
  }

  // ---- the "<Class> Features" table, from the raw text ----
  const heading = raw.findIndex((line, i) => line === `${className} Features` && raw.slice(i + 1, i + 14).some((next) => next === 'Level' || next === 'Class Features' || next === 'Proficiency'))
  if (heading < 0) {
    problems.push(`${entry.id}: table not found`)
    continue
  }
  const rows = []
  let current
  for (let i = heading + 1; i < raw.length && rows.length < 20; i++) {
    const line = raw[i]
    const start = /^(\d{1,2}) \+(\d) (.*)$/.exec(line)
    if (start) {
      if (current) rows.push(current)
      current = { level: Number(start[1]), proficiency: Number(start[2]), body: start[3] }
    } else if (current !== undefined && !isNoise(line)) {
      // A feature name that wrapped onto a second line is joined while the row does not yet end in all its columns.
      if (trailingValues(current.body, columns.length) === undefined) current.body += ' ' + line
      else break // the row was complete; this line belongs to the text after the table
    }
    if (current && rows.length === 19 && trailingValues(current.body, columns.length) !== undefined && current.level === 20) {
      rows.push(current)
      current = undefined
      break
    }
  }
  if (current && rows.length < 20) rows.push(current)

  const levels = []
  for (const row of rows) {
    const parsed = trailingValues(row.body, columns.length)
    if (parsed === undefined) {
      problems.push(`${entry.id} level ${row.level}: could not read the columns from "${row.body}"`)
      continue
    }
    const result = { level: row.level, proficiencyBonus: row.proficiency, features: splitFeatures(parsed.rest), columns: {} }
    const spell = {}
    const pact = {}
    const slots = []
    columns.forEach((name, index) => {
      const value = parsed.values[index]
      if (name.startsWith('spell:')) spell[name.slice(6)] = value === '--' ? 0 : Number(value)
      else if (name.startsWith('pact:')) pact[name.slice(5)] = value === '--' ? 0 : Number(value)
      else if (name.startsWith('slot')) slots.push(value === '--' ? 0 : Number(value))
      else result.columns[name] = value
    })
    if (Object.keys(spell).length > 0 || slots.length > 0 || Object.keys(pact).length > 0) {
      while (slots.length > 0 && slots[slots.length - 1] === 0) slots.pop()
      result.spellcasting = { cantrips: spell.cantrips ?? 0, prepared: spell.prepared ?? 0 }
      if (columns.some((c) => c.startsWith('slot'))) result.spellcasting.slots = slots
      if (columns.some((c) => c.startsWith('pact:'))) result.spellcasting.pact = { slots: pact.slots, slotLevel: pact.slotLevel }
    }
    levels.push(result)
  }
  if (levels.length !== 20 || levels.some((row, i) => row.level !== i + 1)) problems.push(`${entry.id}: expected levels 1 to 20 in order, got ${levels.map((r) => r.level).join(',')}`)

  // ---- the feature descriptions, from the text ----
  const classHeading = text.findIndex((line) => line === `${className} Class Features`)
  const firstFeature = text.findIndex((line, i) => i > classHeading && /^Level 1: /.test(line))
  const subclassHeading = text.findIndex((line, i) => i > firstFeature && line.startsWith(`${className} Subclass: `))
  if (classHeading < 0 || firstFeature < 0 || subclassHeading < 0) {
    problems.push(`${entry.id}: feature section not found (${classHeading}, ${firstFeature}, ${subclassHeading})`)
    continue
  }
  // The last feature is followed by the class's spell list, which is not part of it.
  const spellListHeading = text.findIndex((line, i) => i > firstFeature && line === `${className} Spell List`)
  const sectionEnd = spellListHeading >= 0 && spellListHeading < subclassHeading ? spellListHeading : subclassHeading
  const section = text.slice(firstFeature, sectionEnd)

  // The table is printed in the middle of the text in a jumbled order, with its cells on short lines and no sentences.
  // Drop lines from its heading until the first "Level N:" heading or the first line of prose (a sentence-like line).
  const isProse = (line) => line.length >= 40 && /[.!?:)]$/.test(line) && !/ft\.$/.test(line) && /[a-z]{3,} [a-z]{2,}/.test(line)
  const tableAt = section.findIndex((line) => line === `${className} Features`)
  if (tableAt >= 0) {
    let end = tableAt + 1
    while (end < section.length && !/^Level \d+: /.test(section[end]) && !isProse(section[end])) end++
    section.splice(tableAt, end - tableAt)
  }

  const features = []
  for (const line of section) {
    const heading = /^Level (\d+): (.+)$/.exec(line)
    if (heading) features.push({ level: Number(heading[1]), name: heading[2], paragraphs: [] })
    else if (!isNoise(line) && features.length > 0) features[features.length - 1].paragraphs.push(line)
  }
  const repair = (value) => value.replace(/(\d) � (\d)/g, '$1 × $2').replace(/�/g, '•')
  entry.features = features.map((feature) => {
    // A paragraph that ran across a page break arrives as two lines: join a line that clearly continues the one before.
    const joined = []
    for (const paragraph of feature.paragraphs) {
      const previous = joined[joined.length - 1]
      const unfinished = previous !== undefined && !/[.!?:;)"”•]$/.test(previous)
      if (unfinished && /^[a-z(]/.test(paragraph)) joined[joined.length - 1] = /[a-z]-$/.test(previous) ? previous.slice(0, -1) + paragraph : `${previous} ${paragraph}`
      else joined.push(paragraph)
    }
    // A section that follows the last feature in the PDF and is not part of it: cut the feature before its heading.
    const stop = END_MARKERS[entry.id] === undefined ? -1 : joined.indexOf(END_MARKERS[entry.id])
    if (stop >= 0) {
      droppedFragments.push(`${entry.id} L${feature.level} ${feature.name}: cut ${joined.length - stop} lines from "${END_MARKERS[entry.id]}" on`)
      joined.length = stop
    }
    // A table in the middle of a feature arrives as a run of short fragment lines ("Max", "Level", "Forms"): drop the run.
    const isFragment = (line) => line.length < 30 && !/[.!?:)]$/.test(line) && !line.startsWith('•')
    for (let at = 0; at < joined.length; ) {
      let run = at
      while (run < joined.length && isFragment(joined[run])) run++
      if (run - at >= 4) {
        droppedFragments.push(`${entry.id} L${feature.level} ${feature.name}: dropped a table of ${run - at} fragment lines starting "${joined[at]}"`)
        joined.splice(at, run - at)
      } else at = Math.max(run, at + 1)
    }
    // A small table printed at the end of a feature arrives as short fragment lines ("Spell Slot Level"): drop them.
    while (joined.length > 1 && joined[joined.length - 1].length < 45 && !/[.!?:)]$/.test(joined[joined.length - 1]) && !joined[joined.length - 1].startsWith('•')) {
      droppedFragments.push(`${entry.id} L${feature.level} ${feature.name}: "${joined[joined.length - 1]}"`)
      joined.pop()
    }
    return { level: feature.level, name: feature.name, text: repair(joined.join('\n')) }
  })
  entry.levels = levels
  summary.push(`${entry.id}: ${levels.length} levels, ${entry.features.length} feature sections`)
}

if (problems.length > 0) {
  console.error('problems:')
  for (const problem of problems) console.error('  ' + problem)
  process.exit(1)
}

fs.writeFileSync(classesPath, JSON.stringify(classes, null, 2) + '\n')
console.log(summary.join('\n'))
console.log('table fragments dropped from the end of a feature (check these):')
for (const fragment of droppedFragments) console.log('  ' + fragment)
