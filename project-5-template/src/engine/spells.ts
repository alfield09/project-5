// Which spells a class can pick at level 1, and how many. Pure functions, no UI code.
// The numbers come from the class tables in SRD 5.2.1 (stored in the catalog as the class's level 1 spellcasting).
import type { Catalog, ClassEntry, Spell } from '../catalog/types'

export interface SpellLimits {
  cantrips: number // cantrips the class knows
  spells: number // leveled spells the class has prepared
  maxSpellLevel: number // the highest spell level the class has slots for
}

/** The class's level 1 limits, or undefined if the class does not cast spells. */
export function spellLimits(classEntry: ClassEntry | undefined): SpellLimits | undefined {
  const casting = classEntry?.spellcasting
  if (casting === undefined) return undefined
  return {
    cantrips: casting.level1.cantrips,
    spells: casting.level1.preparedSpells,
    maxSpellLevel: casting.level1.slots.length, // one entry per spell level the class has slots for
  }
}

/** Every spell the class may pick, cantrips first, then by level, then by name. */
export function spellOptions(classEntry: ClassEntry | undefined, catalog: Catalog): Spell[] {
  const limits = spellLimits(classEntry)
  if (classEntry === undefined || limits === undefined) return []

  return catalog.spells
    .filter((spell) => spell.edition === classEntry.edition && spell.classes.includes(classEntry.id))
    .filter((spell) => (spell.level === 0 ? limits.cantrips > 0 : spell.level <= limits.maxSpellLevel))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
}

/** The chosen spells as catalog entries, cantrips first, then by level, then by name. Unknown ids are left out. */
export function pickedSpells(spellIds: string[], catalog: Catalog): Spell[] {
  return catalog.spells
    .filter((spell) => spellIds.includes(spell.id))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
}

/** How many of the chosen spells are cantrips and how many are leveled spells. */
export function countPicks(spellIds: string[], catalog: Catalog): { cantrips: number; spells: number } {
  const picked = pickedSpells(spellIds, catalog)
  const cantrips = picked.filter((spell) => spell.level === 0).length
  return { cantrips, spells: picked.length - cantrips }
}

/**
 * True if the spell's SRD text calls for a spell attack roll ("Make a ranged spell attack...") or, for summoned
 * creatures, says their attack bonus "equals your spell attack modifier". 25 of the 339 SRD spells do.
 * Spells that use a saving throw (the spell save DC) are not rolled by the caster, so they have no attack button.
 */
export function needsSpellAttack(spell: Spell): boolean {
  return /spell attack/i.test(spell.description)
}
