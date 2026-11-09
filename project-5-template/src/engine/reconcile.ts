// Keeps a character's choices consistent after an edit.
// One rule handles every case: when a change makes an earlier choice invalid, the invalid choice is
// cleared and listed in `removed`, so the builder can tell the player (spec.md, "Edit later").
import type { Catalog } from '../catalog/types'
import type { Character } from './character'

export interface ReconcileResult {
  character: Character
  removed: string[] // plain-language list of what was cleared
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
