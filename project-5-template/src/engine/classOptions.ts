// Small lookups for the choices a class can have at level 1. Pure functions, no UI code.
import type { Catalog, ClassEntry, ClassOrder } from '../catalog/types'
import type { Character } from './character'
import { SKILLS } from './skills'

/** The Cleric's Divine Order or the Druid's Primal Order the player picked, if the class has one and it is valid. */
export function chosenOrder(classEntry: ClassEntry | undefined, orderId: string | undefined): ClassOrder | undefined {
  return classEntry?.order?.options.find((option) => option.id === orderId)
}

/**
 * Every skill the character is proficient in: the background's two, the class skills picked, and the species skills picked.
 * In the order of the skill list. A skill granted twice counts once.
 */
export function proficientSkillNames(character: Character, catalog: Catalog): string[] {
  const background = catalog.backgrounds.find((entry) => entry.id === character.backgroundId && entry.edition === character.edition)
  const all = new Set([...(background?.skillProficiencies ?? []), ...character.classSkills, ...character.speciesSkills])
  return SKILLS.map((skill) => skill.name).filter((name) => all.has(name))
}
