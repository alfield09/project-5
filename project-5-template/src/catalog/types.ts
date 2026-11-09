// Shapes of the catalog data. Entries live in JSON files (spec.md, Decisions and changes);
// the validator in validate.ts checks that each JSON entry matches these shapes.
import type { Ability } from '../engine/abilityScores'

export type Edition = '2014' | '2024'

/** Where content comes from. Entries point to one by id, so the attribution text is stored once. */
export interface SourceRecord {
  id: string
  name: string
  license: string
  url: string
  attribution: string
}

interface EntryBase {
  id: string
  name: string
  edition: Edition
  /** The id of a SourceRecord. */
  source: string
}

export interface Trait {
  name: string
  text: string
}

export interface Species extends EntryBase {
  creatureType: string
  sizes: string[] // one size, or two when the player chooses
  speed: number // feet
  darkvision?: number // feet; the base value, before any lineage changes it
  hitPointBonusPerLevel?: number // for example the Dwarf's Dwarven Toughness
  freeSkillChoices?: number // skills of the player's choice, for example the Human's Skillful
  traits: Trait[]
}

/** One armor or shield from the SRD Armor table. For a shield, armorClass is the bonus it adds. */
export interface Armor extends EntryBase {
  category: 'light' | 'medium' | 'heavy' | 'shield'
  armorClass: number
  dex: 'full' | 'max2' | 'none' // how much of the Dexterity modifier is added
  strength?: number // below this Strength the wearer's speed drops by 10 feet
}

export interface Background extends EntryBase {
  abilityScores: Ability[] // the three abilities the background can raise
  feat: string
  skillProficiencies: string[]
  toolProficiency: string
  equipment: string
}

export interface Spellcasting {
  ability: Ability
  // Level 1 numbers only for now. Full level tables come with higher levels (Phase 3).
  level1: { cantrips: number; preparedSpells: number; slots: number[] } // slots[0] is level 1 slots
}

export interface ClassEntry extends EntryBase {
  primaryAbility: string // display text, for example "Strength or Dexterity"
  hitDie: number
  savingThrows: Ability[]
  skillChoices: { count: number; options: string[] }
  weaponProficiencies: string[]
  armorTraining: string[]
  startingEquipment: string
  subclassLevel: number
  spellcasting?: Spellcasting
}

export interface Catalog {
  sources: SourceRecord[]
  species: Species[]
  backgrounds: Background[]
  classes: ClassEntry[]
  armor: Armor[]
}
