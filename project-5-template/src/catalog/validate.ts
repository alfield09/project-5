// Checks catalog entries loaded from JSON. JSON is not type checked, so every entry is verified here.
// A bad entry is skipped with a message that names it; the rest still load (spec.md, item 6).
import { ABILITIES } from '../engine/abilityScores'
import { SKILL_NAMES } from '../engine/skills'
import type { Armor, Background, Catalog, ClassEntry, Invocation, SourceRecord, Species, Spell, Tool } from './types'

type Raw = Record<string, unknown>

export interface LoadResult {
  catalog: Catalog
  messages: string[] // one per skipped or problem entry
}

// ---- Small field checks. Each returns an error message, or undefined when the field is fine. ----

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, field: string): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? undefined : `${field} must be non-empty text`
}

function positiveNumber(value: unknown, field: string): string | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? undefined : `${field} must be a positive number`
}

function textList(value: unknown, field: string, minLength = 1): string | undefined {
  const ok = Array.isArray(value) && value.length >= minLength && value.every((item) => typeof item === 'string' && item.trim() !== '')
  return ok ? undefined : `${field} must be a list of at least ${minLength} text item(s)`
}

function abilityList(value: unknown, field: string, length: number): string | undefined {
  const ok =
    Array.isArray(value) &&
    value.length === length &&
    value.every((item) => (ABILITIES as readonly unknown[]).includes(item))
  return ok ? undefined : `${field} must list exactly ${length} abilities (${ABILITIES.join(', ')})`
}

function skillList(value: unknown, field: string, length?: number): string | undefined {
  const ok =
    Array.isArray(value) &&
    (length === undefined || value.length === length) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && SKILL_NAMES.includes(item))
  return ok ? undefined : `${field} must list known skill names${length ? ` (exactly ${length})` : ''}`
}

/** The fields every entry needs: id, name, edition and a source that exists and carries a license. */
function baseErrors(raw: Raw, sources: SourceRecord[]): string[] {
  const errors = [text(raw.id, 'id'), text(raw.name, 'name')]
  if (raw.edition !== '2014' && raw.edition !== '2024') errors.push('edition must be "2014" or "2024"')

  const source = sources.find((candidate) => candidate.id === raw.source)
  if (source === undefined) errors.push(`source "${String(raw.source)}" is missing or not a known source`)
  else if (text(source.license, 'license')) errors.push(`source "${source.id}" has no license`)

  return errors.filter((error): error is string => error !== undefined)
}

// ---- One validator per entry kind ----

function speciesErrors(raw: Raw): string[] {
  const errors = [
    text(raw.creatureType, 'creatureType'),
    textList(raw.sizes, 'sizes'),
    positiveNumber(raw.speed, 'speed'),
  ]
  if (raw.darkvision !== undefined) errors.push(positiveNumber(raw.darkvision, 'darkvision'))
  if (raw.hitPointBonusPerLevel !== undefined) errors.push(positiveNumber(raw.hitPointBonusPerLevel, 'hitPointBonusPerLevel'))
  if (raw.freeSkillChoices !== undefined) errors.push(positiveNumber(raw.freeSkillChoices, 'freeSkillChoices'))

  const traitsOk =
    Array.isArray(raw.traits) &&
    raw.traits.length > 0 &&
    raw.traits.every((trait) => isRecord(trait) && !text(trait.name, 'name') && !text(trait.text, 'text'))
  if (!traitsOk) errors.push('traits must be a list of {name, text}')

  return errors.filter((error): error is string => error !== undefined)
}

function armorErrors(raw: Raw): string[] {
  const errors = [positiveNumber(raw.armorClass, 'armorClass')]
  if (!['light', 'medium', 'heavy', 'shield'].includes(raw.category as string)) {
    errors.push('category must be light, medium, heavy or shield')
  }
  if (!['full', 'max2', 'none'].includes(raw.dex as string)) errors.push('dex must be full, max2 or none')
  if (raw.strength !== undefined) errors.push(positiveNumber(raw.strength, 'strength'))
  return errors.filter((error): error is string => error !== undefined)
}

function spellErrors(raw: Raw): string[] {
  const errors = [
    text(raw.school, 'school'),
    textList(raw.classes, 'classes'),
    text(raw.castingTime, 'castingTime'),
    text(raw.range, 'range'),
    text(raw.components, 'components'),
    text(raw.duration, 'duration'),
    text(raw.description, 'description'),
  ]
  if (!Number.isInteger(raw.level) || (raw.level as number) < 0 || (raw.level as number) > 9) errors.push('level must be a whole number from 0 to 9')
  return errors.filter((error): error is string => error !== undefined)
}

function backgroundErrors(raw: Raw): string[] {
  return [
    abilityList(raw.abilityScores, 'abilityScores', 3),
    text(raw.feat, 'feat'),
    skillList(raw.skillProficiencies, 'skillProficiencies', 2),
    text(raw.toolProficiency, 'toolProficiency'),
    text(raw.equipment, 'equipment'),
  ].filter((error): error is string => error !== undefined)
}

function spellcastingErrors(value: unknown): string[] {
  if (!isRecord(value)) return ['spellcasting must be an object']
  const level1 = value.level1
  const errors: (string | undefined)[] = [
    (ABILITIES as readonly unknown[]).includes(value.ability) ? undefined : 'spellcasting.ability must be an ability',
  ]
  if (!isRecord(level1)) {
    errors.push('spellcasting.level1 must be an object')
  } else {
    const countsOk = [level1.cantrips, level1.preparedSpells].every((n) => Number.isInteger(n) && (n as number) >= 0)
    const slotsOk = Array.isArray(level1.slots) && level1.slots.every((n) => Number.isInteger(n) && n >= 0)
    if (!countsOk) errors.push('spellcasting.level1 cantrips and preparedSpells must be whole numbers')
    if (level1.spellbookSpells !== undefined && !(Number.isInteger(level1.spellbookSpells) && (level1.spellbookSpells as number) > 0)) errors.push('spellcasting.level1.spellbookSpells must be a positive whole number')
    if (!slotsOk) errors.push('spellcasting.level1.slots must be a list of whole numbers')
  }
  return errors.filter((error): error is string => error !== undefined)
}

function equipmentErrors(value: unknown, armor: Armor[]): string[] {
  if (!Array.isArray(value) || value.length === 0) return ['startingEquipment must be a list of options']
  const errors: string[] = []
  const seen = new Set<string>()
  for (const option of value) {
    if (!isRecord(option) || text(option.id, 'id') || text(option.description, 'description')) {
      errors.push('each starting equipment option needs an id and a description')
      continue
    }
    if (seen.has(option.id as string)) errors.push(`starting equipment option ${option.id} appears twice`)
    seen.add(option.id as string)
    if (option.armorId !== undefined) {
      const found = armor.find((entry) => entry.id === option.armorId)
      if (found === undefined || found.category === 'shield') errors.push(`starting equipment option ${option.id}: unknown armor "${String(option.armorId)}"`)
    }
    if (option.shield !== undefined && typeof option.shield !== 'boolean') errors.push(`starting equipment option ${option.id}: shield must be true or false`)
  }
  return errors
}

function invocationErrors(raw: Raw): string[] {
  const errors = [text(raw.description, 'description')]
  if (raw.unarmoredBaseAc !== undefined) errors.push(positiveNumber(raw.unarmoredBaseAc, 'unarmoredBaseAc'))
  return errors.filter((error): error is string => error !== undefined)
}

function toolErrors(raw: Raw): string[] {
  return raw.kind === 'artisan' || raw.kind === 'instrument' ? [] : ['kind must be "artisan" or "instrument"']
}

const isAbility = (value: unknown) => (ABILITIES as readonly unknown[]).includes(value)

function orderErrors(value: unknown): string[] {
  if (!isRecord(value)) return ['order must be an object']
  const errors: (string | undefined)[] = [text(value.name, 'order.name')]
  if (!Array.isArray(value.options) || value.options.length < 2) {
    errors.push('order.options must list at least two options')
  } else {
    const ids = new Set<string>()
    for (const option of value.options) {
      if (!isRecord(option)) {
        errors.push('each order option must be an object')
        continue
      }
      errors.push(text(option.id, 'order option id'), text(option.name, 'order option name'), text(option.description, 'order option description'))
      if (typeof option.id === 'string') {
        if (ids.has(option.id)) errors.push(`order option ${option.id} appears twice`)
        ids.add(option.id)
      }
      if (option.weaponProficiencies !== undefined) errors.push(textList(option.weaponProficiencies, 'order option weaponProficiencies'))
      if (option.armorTraining !== undefined) errors.push(textList(option.armorTraining, 'order option armorTraining'))
      if (option.extraCantrips !== undefined) errors.push(positiveNumber(option.extraCantrips, 'order option extraCantrips'))
      if (option.skillBonus !== undefined) {
        const bonus = option.skillBonus
        if (!isRecord(bonus)) errors.push('order option skillBonus must be an object')
        else {
          errors.push(skillList(bonus.skills, 'order option skillBonus.skills'), positiveNumber(bonus.minimum, 'order option skillBonus.minimum'))
          if (!isAbility(bonus.ability)) errors.push('order option skillBonus.ability must be an ability')
        }
      }
    }
  }
  return errors.filter((error): error is string => error !== undefined)
}

function classFeatureErrors(raw: Raw): string[] {
  const errors: (string | undefined)[] = []

  const tools = raw.tools
  if (!isRecord(tools)) errors.push('tools must be an object')
  else {
    errors.push(textList(tools.fixed, 'tools.fixed', 0))
    if (tools.choice !== undefined) {
      const choice = tools.choice
      if (!isRecord(choice)) errors.push('tools.choice must be an object')
      else {
        errors.push(positiveNumber(choice.count, 'tools.choice.count'))
        const kindsOk = Array.isArray(choice.kinds) && choice.kinds.length > 0 && choice.kinds.every((kind) => kind === 'artisan' || kind === 'instrument')
        if (!kindsOk) errors.push('tools.choice.kinds must list "artisan" and/or "instrument"')
      }
    }
  }

  if (raw.unarmoredDefense !== undefined) {
    const defense = raw.unarmoredDefense
    if (!isRecord(defense) || !isAbility(defense.ability) || typeof defense.shieldAllowed !== 'boolean') {
      errors.push('unarmoredDefense needs an ability and shieldAllowed true or false')
    }
  }
  if (raw.invocations !== undefined) {
    const invocations = raw.invocations
    if (!isRecord(invocations)) errors.push('invocations must be an object')
    else errors.push(text(invocations.label, 'invocations.label'), positiveNumber(invocations.count, 'invocations.count'))
  }
  if (raw.expertise !== undefined) {
    errors.push(isRecord(raw.expertise) ? positiveNumber(raw.expertise.skills, 'expertise.skills') : 'expertise must be an object')
  }
  const found = errors.filter((error): error is string => error !== undefined)
  if (raw.order !== undefined) found.push(...orderErrors(raw.order))
  return found
}

function classErrors(raw: Raw, armor: Armor[]): string[] {
  const errors = [
    text(raw.primaryAbility, 'primaryAbility'),
    positiveNumber(raw.hitDie, 'hitDie'),
    abilityList(raw.savingThrows, 'savingThrows', 2),
    textList(raw.weaponProficiencies, 'weaponProficiencies'),
    textList(raw.armorTraining, 'armorTraining', 0),
    positiveNumber(raw.subclassLevel, 'subclassLevel'),
  ]

  const choices = raw.skillChoices
  if (!isRecord(choices)) errors.push('skillChoices must be an object')
  else {
    errors.push(positiveNumber(choices.count, 'skillChoices.count'), skillList(choices.options, 'skillChoices.options'))
  }

  const result = errors.filter((error): error is string => error !== undefined)
  result.push(...equipmentErrors(raw.startingEquipment, armor), ...classFeatureErrors(raw))
  if (raw.spellcasting !== undefined) result.push(...spellcastingErrors(raw.spellcasting))
  return result
}

// ---- Loading a list of entries ----

function loadEntries<T>(
  kind: string,
  rawList: unknown,
  sources: SourceRecord[],
  extraErrors: (raw: Raw) => string[],
  messages: string[],
): T[] {
  if (!Array.isArray(rawList)) {
    messages.push(`${kind}: the data file is not a list`)
    return []
  }

  const entries: T[] = []
  const seenIds = new Set<string>()

  rawList.forEach((raw, index) => {
    if (!isRecord(raw)) {
      messages.push(`${kind} #${index + 1}: skipped, entry is not an object`)
      return
    }
    const name = typeof raw.id === 'string' && raw.id ? raw.id : `#${index + 1}`
    const errors = [...baseErrors(raw, sources), ...extraErrors(raw)]
    if (typeof raw.id === 'string' && seenIds.has(raw.id)) errors.push('id is used by an earlier entry')

    if (errors.length > 0) {
      messages.push(`${kind} ${name}: skipped. ${errors.join('; ')}`)
      return
    }
    seenIds.add(raw.id as string)
    entries.push(raw as unknown as T)
  })
  return entries
}

function loadSources(rawList: unknown, messages: string[]): SourceRecord[] {
  if (!Array.isArray(rawList)) {
    messages.push('sources: the data file is not a list')
    return []
  }
  const sources: SourceRecord[] = []
  rawList.forEach((raw, index) => {
    const errors = isRecord(raw)
      ? [text(raw.id, 'id'), text(raw.name, 'name'), text(raw.license, 'license'), text(raw.url, 'url'), text(raw.attribution, 'attribution')].filter(
          (error): error is string => error !== undefined,
        )
      : ['entry is not an object']
    if (errors.length > 0) messages.push(`source #${index + 1}: skipped. ${errors.join('; ')}`)
    else sources.push(raw as unknown as SourceRecord)
  })
  return sources
}

/** Validate the raw JSON lists. Bad entries are skipped and reported; good ones load. */
export function validateCatalog(raw: {
  sources: unknown
  species: unknown
  backgrounds: unknown
  classes: unknown
  armor: unknown
  spells: unknown
  tools: unknown
  invocations: unknown
}): LoadResult {
  const messages: string[] = []
  const sources = loadSources(raw.sources, messages)

  const armor = loadEntries<Armor>('armor', raw.armor, sources, armorErrors, messages)

  const catalog: Catalog = {
    sources,
    species: loadEntries<Species>('species', raw.species, sources, speciesErrors, messages),
    backgrounds: loadEntries<Background>('background', raw.backgrounds, sources, backgroundErrors, messages),
    classes: loadEntries<ClassEntry>('class', raw.classes, sources, (entry) => classErrors(entry, armor), messages),
    armor,
    spells: loadEntries<Spell>('spell', raw.spells, sources, spellErrors, messages),
    tools: loadEntries<Tool>('tool', raw.tools, sources, toolErrors, messages),
    invocations: loadEntries<Invocation>('invocation', raw.invocations, sources, invocationErrors, messages),
  }
  return { catalog, messages }
}
