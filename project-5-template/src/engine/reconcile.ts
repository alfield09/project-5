// Keeps a character's choices consistent after an edit.
// One rule handles every case: when a change makes an earlier choice invalid, the invalid choice is
// cleared and listed in `removed`, so the builder can tell the player (spec.md, "Edit later").
// The choices are checked in the order they depend on each other: class, then its order and skills, then spells.
import type { Catalog } from '../catalog/types'
import type { Character } from './character'
import { chosenOrder, proficientSkillNames } from './classOptions'
import { spellLimits, spellOptions, spellbookOptions } from './spells'

export interface ReconcileResult {
  character: Character
  removed: string[] // plain-language list of what was cleared
}

/** Keep at most `limit` ids that pass `isValid`, without repeats and in their original order; report the rest by name. */
function keepValid(ids: string[], isValid: (id: string) => boolean, limit: number, nameOf: (id: string) => string): { kept: string[]; dropped: string[] } {
  const kept: string[] = []
  const dropped: string[] = []
  for (const id of ids) {
    if (isValid(id) && !kept.includes(id) && kept.length < limit) kept.push(id)
    else dropped.push(nameOf(id))
  }
  return { kept, dropped }
}

export function reconcileCharacter(character: Character, catalog: Catalog): ReconcileResult {
  const removed: string[] = []
  const next: Character = { ...character }
  const inEdition = <T extends { id: string; edition: string }>(list: T[], id: string | undefined) =>
    list.find((entry) => entry.id === id && entry.edition === character.edition)

  const species = inEdition(catalog.species, next.speciesId)
  const background = inEdition(catalog.backgrounds, next.backgroundId)
  const classEntry = inEdition(catalog.classes, next.classId)

  // An id that is not in the catalog (for example from an older save) cannot be used, so it is cleared.
  if (next.speciesId !== undefined && species === undefined) {
    removed.push('species "' + next.speciesId + '", which the catalog does not offer')
    next.speciesId = undefined
  }
  if (next.backgroundId !== undefined && background === undefined) {
    removed.push('background "' + next.backgroundId + '", which the catalog does not offer')
    next.backgroundId = undefined
  }
  if (next.classId !== undefined && classEntry === undefined) {
    removed.push('class "' + next.classId + '", which the catalog does not offer')
    next.classId = undefined
  }

  // Class skills must come from the chosen class's list, and there may be no more than it allows.
  if (next.classSkills.length > 0) {
    const options = classEntry?.skillChoices.options ?? []
    const limit = classEntry?.skillChoices.count ?? 0
    const kept = next.classSkills.filter((skill) => options.includes(skill)).slice(0, limit)
    const dropped = next.classSkills.filter((skill) => !kept.includes(skill))
    if (dropped.length > 0) removed.push(`class skills no longer available: ${dropped.join(', ')}`)
    next.classSkills = kept
  }

  // Species skills only exist for species with free skill choices.
  if (next.speciesSkills.length > 0) {
    const limit = species?.freeSkillChoices ?? 0
    const dropped = next.speciesSkills.slice(limit)
    if (dropped.length > 0) removed.push(`species skills no longer available: ${dropped.join(', ')}`)
    next.speciesSkills = next.speciesSkills.slice(0, limit)
  }

  // The order (Divine Order, Primal Order) must be one the chosen class offers.
  if (next.orderId !== undefined && chosenOrder(classEntry, next.orderId) === undefined) {
    removed.push(`the order choice "${next.orderId}", which the class does not offer`)
    next.orderId = undefined
  }
  const order = chosenOrder(classEntry, next.orderId)

  // Expertise must be in skills the character is proficient in, and no more than the class allows. This comes after the
  // skill choices above because a changed skill can make an Expertise pick invalid.
  if ((next.expertiseSkills ?? []).length > 0) {
    const proficient = proficientSkillNames(next, catalog)
    const { kept, dropped } = keepValid(next.expertiseSkills ?? [], (skill) => proficient.includes(skill), classEntry?.expertise?.skills ?? 0, (skill) => skill)
    if (dropped.length > 0) removed.push(`Expertise skills no longer available: ${dropped.join(', ')}`)
    next.expertiseSkills = kept
  }

  // Tools must be of a kind the class lets the player pick, and no more than it allows.
  if ((next.toolIds ?? []).length > 0) {
    const choice = classEntry?.tools.choice
    const { kept, dropped } = keepValid(
      next.toolIds ?? [],
      (id) => {
        const tool = inEdition(catalog.tools, id)
        return tool !== undefined && (choice?.kinds.includes(tool.kind) ?? false)
      },
      choice?.count ?? 0,
      (id) => inEdition(catalog.tools, id)?.name ?? id,
    )
    if (dropped.length > 0) removed.push(`tool proficiencies no longer available: ${dropped.join(', ')}`)
    next.toolIds = kept
  }

  // Invocations must exist in the catalog, and no more than the class allows.
  if ((next.invocationIds ?? []).length > 0) {
    const { kept, dropped } = keepValid(
      next.invocationIds ?? [],
      (id) => inEdition(catalog.invocations, id) !== undefined,
      classEntry?.invocations?.count ?? 0,
      (id) => inEdition(catalog.invocations, id)?.name ?? id,
    )
    if (dropped.length > 0) removed.push(`invocations no longer available: ${dropped.join(', ')}`)
    next.invocationIds = kept
  }

  // A spellbook (Wizard) holds leveled spells from the class's list, up to its size.
  if ((next.spellbookIds ?? []).length > 0) {
    const allowed = new Set(spellbookOptions(classEntry, catalog).map((spell) => spell.id))
    const { kept, dropped } = keepValid(
      next.spellbookIds ?? [],
      (id) => allowed.has(id),
      spellLimits(classEntry)?.spellbook ?? 0,
      (id) => catalog.spells.find((spell) => spell.id === id)?.name ?? id,
    )
    if (dropped.length > 0) removed.push('spellbook spells no longer available: ' + dropped.join(', '))
    next.spellbookIds = kept
  }

  // Spells must be on the chosen class's list (for a spellbook class, in the spellbook), within its level 1 limits
  // (counting a cantrip the order adds), and no more than it allows of each kind.
  if ((next.spellIds ?? []).length > 0) {
    const allowed = new Map(spellOptions(classEntry, catalog, next.spellbookIds ?? [], order).map((spell) => [spell.id, spell]))
    const limits = spellLimits(classEntry, order)
    const kept: string[] = []
    const dropped: string[] = []
    let cantrips = 0
    let leveled = 0

    for (const id of next.spellIds ?? []) {
      const spell = allowed.get(id)
      const room = spell === undefined || limits === undefined ? false : spell.level === 0 ? cantrips < limits.cantrips : leveled < limits.spells
      if (spell === undefined || !room) {
        dropped.push(catalog.spells.find((entry) => entry.id === id)?.name ?? id)
        continue
      }
      if (spell.level === 0) cantrips++
      else leveled++
      kept.push(id)
    }
    if (dropped.length > 0) removed.push('spells no longer available: ' + dropped.join(', '))
    next.spellIds = kept
  }

  // The background bonus must go to abilities the chosen background offers.
  const bonus = next.backgroundBonus
  if (bonus !== undefined && !('plusOneAll' in bonus)) {
    const offered = background?.abilityScores ?? []
    const plusTwo = bonus.plusTwo !== undefined && offered.includes(bonus.plusTwo) ? bonus.plusTwo : undefined
    const plusOne = bonus.plusOne !== undefined && offered.includes(bonus.plusOne) ? bonus.plusOne : undefined
    if (plusTwo !== bonus.plusTwo || plusOne !== bonus.plusOne) {
      removed.push('background bonus choices that the new background does not offer')
      next.backgroundBonus = { plusTwo, plusOne }
    }
  }

  // The equipment package must be one the chosen class offers.
  if (next.equipmentOptionId !== undefined) {
    const offered = classEntry?.startingEquipment.some((option) => option.id === next.equipmentOptionId) ?? false
    if (!offered) {
      removed.push(`starting equipment option ${next.equipmentOptionId}, which the new class does not offer`)
      next.equipmentOptionId = undefined
    }
  }

  return { character: next, removed }
}
