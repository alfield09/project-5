// Calculates every derived number for a character from the choices and the catalog.
// Pure functions only, with no UI code (spec.md, Structure rules). Rules are SRD 5.2.1, level 1.
import type { Armor, Catalog } from '../catalog/types'
import { ABILITIES, abilityModifier, type Ability } from './abilityScores'
import type { BackgroundBonus, Character, Derived, DeriveResult } from './character'
import { SKILLS, SKILL_NAMES } from './skills'

const MAX_ABILITY_SCORE = 20

/** SRD Proficiency Bonus by level: +2 for levels 1 to 4, +3 for 5 to 8, and so on up to +6. */
export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((level - 1) / 4)
}

const ARMOR_TRAINING_NAME = { light: 'Light', medium: 'Medium', heavy: 'Heavy', shield: 'Shields' } as const

type CompleteBonus = { plusTwo: Ability; plusOne: Ability } | { plusOneAll: true }

/** The bonus if it is fully chosen, otherwise undefined. */
function completeBonus(bonus: BackgroundBonus | undefined): CompleteBonus | undefined {
  if (bonus === undefined) return undefined
  if ('plusOneAll' in bonus) return bonus
  return bonus.plusTwo !== undefined && bonus.plusOne !== undefined ? { plusTwo: bonus.plusTwo, plusOne: bonus.plusOne } : undefined
}

function applyBackgroundBonus(base: Record<Ability, number>, bonus: CompleteBonus, allowed: Ability[]): Record<Ability, number> {
  const scores = { ...base }
  const raise = (ability: Ability, amount: number) => {
    scores[ability] = Math.min(MAX_ABILITY_SCORE, scores[ability] + amount) // no score goes above 20
  }
  if ('plusOneAll' in bonus) {
    for (const ability of allowed) raise(ability, 1)
  } else {
    raise(bonus.plusTwo, 2)
    raise(bonus.plusOne, 1)
  }
  return scores
}

function armorClassFor(armor: Armor | undefined, dexModifier: number): number {
  if (armor === undefined) return 10 + dexModifier // no armor
  const dexPart = armor.dex === 'full' ? dexModifier : armor.dex === 'max2' ? Math.min(dexModifier, 2) : 0
  return armor.armorClass + dexPart
}

export function deriveCharacter(character: Character, catalog: Catalog): DeriveResult {
  const problems: string[] = []

  if (character.level !== 1) problems.push('only level 1 is supported so far')

  // ---- Look up the chosen entries ----
  const inEdition = <T extends { id: string; edition: string }>(list: T[], id: string | undefined) =>
    list.find((entry) => entry.id === id && entry.edition === character.edition)

  const species = inEdition(catalog.species, character.speciesId)
  const background = inEdition(catalog.backgrounds, character.backgroundId)
  const classEntry = inEdition(catalog.classes, character.classId)
  if (species === undefined) problems.push(character.speciesId ? `unknown species "${character.speciesId}"` : 'choose a species')
  if (background === undefined) problems.push(character.backgroundId ? `unknown background "${character.backgroundId}"` : 'choose a background')
  if (classEntry === undefined) problems.push(character.classId ? `unknown class "${character.classId}"` : 'choose a class')

  // Worn armor and shield come from the class's starting equipment package (SRD: "Choose Starting Equipment").
  // A package with only gold gives none; buying gear is not modeled yet.
  const equipment = classEntry?.startingEquipment.find((option) => option.id === character.equipmentOptionId)
  if (classEntry !== undefined && equipment === undefined) {
    problems.push(character.equipmentOptionId ? `unknown starting equipment "${character.equipmentOptionId}"` : 'choose starting equipment')
  }
  const armor = equipment?.armorId === undefined ? undefined : inEdition(catalog.armor, equipment.armorId)
  const shield = equipment?.shield ? catalog.armor.find((entry) => entry.category === 'shield' && entry.edition === character.edition) : undefined
  if (equipment?.armorId !== undefined && armor === undefined) problems.push(`unknown armor "${equipment.armorId}"`)
  if (equipment?.shield && shield === undefined) problems.push('no shield in the catalog')

  // ---- Scores and the background bonus ----
  const base = {} as Record<Ability, number>
  for (const ability of ABILITIES) {
    const score = character.baseScores[ability]
    if (score === undefined) problems.push(`assign a score to ${ability.toUpperCase()}`)
    else base[ability] = score
  }

  const bonus = completeBonus(character.backgroundBonus)
  if (bonus === undefined) {
    problems.push('choose how to apply the background bonus')
  } else if (background !== undefined && !('plusOneAll' in bonus)) {
    const abilities = [bonus.plusTwo, bonus.plusOne]
    if (!abilities.every((ability) => background.abilityScores.includes(ability))) {
      problems.push(`the background bonus must go to ${background.abilityScores.join(', ')}`)
    }
    if (bonus.plusTwo === bonus.plusOne) problems.push('the +2 and the +1 must go to different abilities')
  }

  // ---- Skill choices ----
  if (classEntry !== undefined) {
    const picks = character.classSkills
    const { count, options } = classEntry.skillChoices
    if (picks.length !== count) problems.push(`pick exactly ${count} class skills`)
    if (picks.some((skill) => !options.includes(skill))) problems.push(`class skills must come from: ${options.join(', ')}`)
    if (new Set(picks).size !== picks.length) problems.push('class skills must be different from each other')
  }
  if (species !== undefined) {
    const picks = character.speciesSkills
    const count = species.freeSkillChoices ?? 0
    if (picks.length !== count) problems.push(`pick exactly ${count} species skill(s)`)
    if (picks.some((skill) => !SKILL_NAMES.includes(skill))) problems.push('species skills must be known skills')
    if (new Set(picks).size !== picks.length) problems.push('species skills must be different from each other')
  }

  if (problems.length > 0 || species === undefined || background === undefined || classEntry === undefined || bonus === undefined) {
    return { ok: false, problems }
  }

  // ---- Calculate ----
  const warnings: string[] = []
  const finalScores = applyBackgroundBonus(base, bonus, background.abilityScores)
  const modifiers = {} as Record<Ability, number>
  for (const ability of ABILITIES) modifiers[ability] = abilityModifier(finalScores[ability])

  const proficiency = proficiencyBonus(character.level)

  const savingThrows = {} as Record<Ability, number>
  for (const ability of ABILITIES) {
    savingThrows[ability] = modifiers[ability] + (classEntry.savingThrows.includes(ability) ? proficiency : 0)
  }

  // A skill counts once even if two sources grant it.
  const proficientSkills = new Set([...background.skillProficiencies, ...character.classSkills, ...character.speciesSkills])
  const skills: Record<string, number> = {}
  for (const skill of SKILLS) {
    skills[skill.name] = modifiers[skill.ability] + (proficientSkills.has(skill.name) ? proficiency : 0)
  }

  // Armor: AC applies even without training (with penalties the engine does not model); a shield counts only with training.
  let armorClass = armorClassFor(armor, modifiers.dex)
  if (armor !== undefined && !classEntry.armorTraining.includes(ARMOR_TRAINING_NAME[armor.category])) {
    warnings.push(`${classEntry.name} has no training with ${armor.category} armor`)
  }
  if (shield !== undefined) {
    if (classEntry.armorTraining.includes(ARMOR_TRAINING_NAME.shield)) armorClass += shield.armorClass
    else warnings.push(`${classEntry.name} has no training with shields, so the shield adds no AC`)
  }

  let speed = species.speed
  if (armor?.strength !== undefined && finalScores.str < armor.strength) {
    speed -= 10
    warnings.push(`${armor.name} needs Strength ${armor.strength}, so Speed drops by 10 feet`)
  }

  const casting = classEntry.spellcasting
  const spellcasting = casting && {
    ability: casting.ability,
    saveDc: 8 + modifiers[casting.ability] + proficiency,
    attackBonus: modifiers[casting.ability] + proficiency,
  }

  const derived: Derived = {
    finalScores,
    modifiers,
    proficiencyBonus: proficiency,
    savingThrows,
    skills,
    passive: {
      perception: 10 + skills.Perception,
      investigation: 10 + skills.Investigation,
      insight: 10 + skills.Insight,
    },
    initiative: modifiers.dex,
    armorClass,
    // Level 1: the highest number on the hit die, plus Constitution, plus any species bonus per level.
    maxHitPoints: classEntry.hitDie + modifiers.con + (species.hitPointBonusPerLevel ?? 0) * character.level,
    speed,
    darkvision: species.darkvision,
    proficientSaves: ABILITIES.filter((ability) => classEntry.savingThrows.includes(ability)),
    proficientSkills: SKILLS.map((skill) => skill.name).filter((name) => proficientSkills.has(name)),
    training: {
      armor: classEntry.armorTraining,
      weapons: classEntry.weaponProficiencies,
      tool: background.toolProficiency,
    },
    spellcasting,
    warnings,
  }
  return { ok: true, derived }
}
