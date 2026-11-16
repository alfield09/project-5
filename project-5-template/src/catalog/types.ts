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

/** One spell from the SRD spell descriptions. `classes` lists the class ids whose spell list includes it. */
export interface Spell extends EntryBase {
  level: number // 0 for a cantrip
  school: string
  classes: string[]
  castingTime: string
  range: string
  components: string
  duration: string
  description: string // paragraphs separated by line breaks
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
  /** The level 1 numbers. The level-by-level numbers are in the class's `levels`; the two must agree (checked on load). */
  level1: { cantrips: number; preparedSpells: number; slots: number[]; spellbookSpells?: number } // slots[0] is level 1 slots; spellbookSpells is the Wizard's spellbook size
  /** Spells added to a spellbook at each level after 1 (Wizard: 2). */
  spellbookPerLevel?: number
}

/** The spellcasting numbers in one row of a class's Features table. */
export interface LevelSpellcasting {
  cantrips: number
  prepared: number // level 1+ spells prepared
  slots?: number[] // slots[0] is level 1 slots, up to the highest level the class has
  pact?: { slots: number; slotLevel: number } // Warlock Pact Magic: this many slots, all of this level
}

/** One row of a class's Features table (SRD "<Class> Features"): what the class gains at this level. */
export interface ClassLevel {
  level: number
  proficiencyBonus: number
  features: string[] // names as the table lists them; "Subclass feature" marks a subclass feature
  columns: Record<string, string> // the class's own columns as printed, for example "Rages": "2", "Rage Damage": "+2"
  spellcasting?: LevelSpellcasting
}

/** The text of one class feature: a "Level N: Name" section of the class description. */
export interface ClassFeature {
  level: number
  name: string
  text: string
}

/** One starting equipment package a class offers at level 1 (SRD: "Choose Starting Equipment"). */
export interface EquipmentOption {
  id: string // 'A', 'B' or 'C', as in the SRD
  description: string // the package as the SRD words it
  armorId?: string // worn armor from the catalog, if the package includes armor
  shield?: boolean // true if the package includes a Shield
}

/** A Warlock Eldritch Invocation. Only the ones with no level requirement are in the catalog (level 1 only). */
export interface Invocation extends EntryBase {
  description: string // the SRD text
  /** If set, with no armor the base Armor Class is this number plus Dexterity (Armor of Shadows casts Mage Armor at will). */
  unarmoredBaseAc?: number
}

export type ToolKind = 'artisan' | 'instrument'

/** An artisan's tool or a musical instrument the player can pick as a class tool proficiency. */
export interface Tool extends EntryBase {
  kind: ToolKind
}

/** A level 1 choice of a sacred role: the Cleric's Divine Order or the Druid's Primal Order. */
export interface ClassOrder {
  id: string
  name: string
  description: string // the SRD text
  weaponProficiencies?: string[] // added weapon proficiency
  armorTraining?: string[] // added armor training
  extraCantrips?: number // extra cantrips known
  skillBonus?: { skills: string[]; ability: Ability; minimum: number } // a bonus to these skill checks equal to the ability modifier, at least the minimum
}

export interface ClassEntry extends EntryBase {
  primaryAbility: string // display text, for example "Strength or Dexterity"
  hitDie: number
  savingThrows: Ability[]
  skillChoices: { count: number; options: string[] }
  weaponProficiencies: string[]
  armorTraining: string[]
  tools: {
    fixed: string[] // tool proficiencies the class always gives
    choice?: { count: number; kinds: ToolKind[] } // tools the player picks, from these kinds
  }
  startingEquipment: EquipmentOption[]
  /** Armor class without armor is 10 + Dexterity + this ability (Barbarian, Monk). */
  unarmoredDefense?: { ability: Ability; shieldAllowed: boolean }
  /** Skills the player picks Expertise in (Rogue): the proficiency bonus counts twice. */
  expertise?: { skills: number }
  /** Eldritch Invocations the player picks at level 1 (Warlock). */
  invocations?: { label: string; count: number }
  /** A sacred role chosen at level 1 (Cleric, Druid). */
  order?: { name: string; options: ClassOrder[] }
  subclassLevel: number
  spellcasting?: Spellcasting
  levels: ClassLevel[] // levels 1 to 20, in order
  features: ClassFeature[] // the descriptions of the features the table names
}

export interface Catalog {
  sources: SourceRecord[]
  species: Species[]
  backgrounds: Background[]
  classes: ClassEntry[]
  armor: Armor[]
  spells: Spell[]
  tools: Tool[]
  invocations: Invocation[]
}
