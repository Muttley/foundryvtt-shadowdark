// Namespace Configuration Values
const SHADOWDARK = {};

SHADOWDARK.ABILITIES_LONG = {
	str: "SHADOWDARK.ability_strength",
	int: "SHADOWDARK.ability_intelligence",
	wis: "SHADOWDARK.ability_wisdom",
	con: "SHADOWDARK.ability_constitution",
	cha: "SHADOWDARK.ability_charisma",
	dex: "SHADOWDARK.ability_dexterity",
};

SHADOWDARK.ABILITY_KEYS = [
	"str",
	"int",
	"dex",
	"wis",
	"con",
	"cha",
];

SHADOWDARK.ALIGNMENTS = {
	lawful: "SHADOWDARK.alignment.lawful",
	neutral: "SHADOWDARK.alignment.neutral",
	chaotic: "SHADOWDARK.alignment.chaotic",
};

SHADOWDARK.ARMOR_BONUS_ATTRIBUTES = {
	dex: "SHADOWDARK.ability_dex",
};

SHADOWDARK.DICE = {
	d2: "d2",
	d4: "d4",
	d6: "d6",
	d8: "d8",
	d10: "d10",
	d12: "d12",
	d20: "d20",
};

SHADOWDARK.DAMAGE_DICE = [
	"d4",
	"d6",
	"d8",
	"d10",
	"d12",
];

SHADOWDARK.BOON_TYPES = {
	blessing: "SHADOWDARK.boons.blessing",
	oath: "SHADOWDARK.boons.oath",
	patron: "SHADOWDARK.boons.patron",
	secret: "SHADOWDARK.boons.secret",
};

SHADOWDARK.DEFAULTS = {
	BASE_ARMOR_CLASS: 10,
	GEAR_SLOTS: 10,
	GEMS_PER_SLOT: 10,
	FREE_COIN_CARRY: 100,
	LEARN_SPELL_DC: 15,
	LIGHT_TRACKER_UPDATE_INTERVAL_SECS: 30,
	ITEM_IMAGES: {
		"Ancestry": "icons/environment/people/group.webp",
		"Armor": "icons/equipment/chest/breastplate-banded-steel-gold.webp",
		"Background": "icons/environment/people/commoner.webp",
		"Basic": "icons/containers/bags/pouch-simple-brown.webp",
		"Boon": "icons/skills/social/diplomacy-writing-letter.webp",
		"Class Ability": "icons/tools/navigation/map-chart-tan.webp",
		"Class": "icons/sundries/documents/document-sealed-brown-red.webp",
		"Deity": "icons/magic/holy/yin-yang-balance-symbol.webp",
		"Effect": "icons/commodities/tech/cog-brass.webp",
		"Gem": "icons/commodities/gems/gem-faceted-navette-red.webp",
		"Language": "icons/tools/scribal/ink-quill-pink.webp",
		"NPC Attack": "icons/skills/melee/weapons-crossed-swords-yellow.webp",
		"NPC Feature": "icons/creatures/abilities/dragon-breath-purple.webp",
		"NPC Special Attack": "icons/magic/death/weapon-sword-skull-purple.webp",
		"NPC Spell": "icons/magic/symbols/runes-star-magenta.webp",
		"Patron": "icons/magic/unholy/silhouette-light-fire-blue.webp",
		"Potion": "icons/consumables/potions/bottle-corked-red.webp",
		"Property": "icons/sundries/documents/document-torn-diagram-tan.webp",
		"Scroll": "icons/sundries/scrolls/scroll-runed-brown-purple.webp",
		"Spell": "icons/magic/symbols/runes-star-blue.webp",
		"Talent": "icons/sundries/books/book-worn-brown-grey.webp",
		"Wand": "icons/weapons/wands/wand-gem-violet.webp",
		"Weapon": "icons/weapons/swords/swords-short.webp",
	},
};

SHADOWDARK.LANGUAGE_RARITY = {
	common: "SHADOWDARK.language.rarity.common",
	rare: "SHADOWDARK.language.rarity.rare",
};

SHADOWDARK.LIGHT_SETTING_NAMES = {
	lantern: "SHADOWDARK.light_source.lantern",
	lightSpellDouble: "SHADOWDARK.light_source.light_spell.double_near",
	lightSpellNear: "SHADOWDARK.light_source.light_spell.near",
	torch: "SHADOWDARK.light_source.torch",
};

SHADOWDARK.LIGHT_SOURCE_ITEM_IDS = [
	"PkQXG3AaHNMVwGTc", // Light Spell
	"rjNBToTJCYLLdVcT", // Light Spell (Double Time)
	"BBDG7QpHOFXG6sKe", // Light Spell (Double Range)
];

SHADOWDARK.NPC_ATTACK_TYPES = {
	physical: "SHADOWDARK.npc_attack.type.physical",
	special: "SHADOWDARK.npc_attack.type.special",
};

SHADOWDARK.NPC_MOVES = {
	none: "SHADOWDARK.npc_move.none",
	close: "SHADOWDARK.npc_move.close",
	near: "SHADOWDARK.npc_move.near",
	doubleNear: "SHADOWDARK.npc_move.double_near",
	tripleNear: "SHADOWDARK.npc_move.triple_near",
	far: "SHADOWDARK.npc_move.far",
	special: "SHADOWDARK.npc_move.special",
};

SHADOWDARK.PROPERTY_TYPES = {
	armor: "SHADOWDARK.property.type.option.armor",
	weapon: "SHADOWDARK.property.type.option.weapon",
};

SHADOWDARK.RANGES = {
	close: "SHADOWDARK.range.close",
	near: "SHADOWDARK.range.near",
	far: "SHADOWDARK.range.far",
	nearLine: "SHADOWDARK.range.nearLine",
};

SHADOWDARK.RANGES_SHORT = {
	close: "SHADOWDARK.range.close_short",
	near: "SHADOWDARK.range.near_short",
	far: "SHADOWDARK.range.far_short",
	self: "SHADOWDARK.range.self_short",
};

SHADOWDARK.OFFICIAL_SOURCES = {
	"bard-and-ranger": "SHADOWDARK.source.bard-and-ranger",
	"core-rules": "SHADOWDARK.source.core-rules",
	"cursed-scroll-1": "SHADOWDARK.source.cursed-scroll-1",
	"cursed-scroll-2": "SHADOWDARK.source.cursed-scroll-2",
	"cursed-scroll-3": "SHADOWDARK.source.cursed-scroll-3",
	"cursed-scroll-4": "SHADOWDARK.source.cursed-scroll-4",
	"cursed-scroll-5": "SHADOWDARK.source.cursed-scroll-5",
	"cursed-scroll-6": "SHADOWDARK.source.cursed-scroll-6",
	"quickstart": "SHADOWDARK.source.quickstart",
};

SHADOWDARK.SPELL_DURATIONS = {
	focus: "SHADOWDARK.spell_duration.focus",
	instant: "SHADOWDARK.spell_duration.instant",
	rounds: "SHADOWDARK.spell_duration.rounds",
	turns: "SHADOWDARK.spell_duration.turns",
	days: "SHADOWDARK.spell_duration.days",
	realTime: "SHADOWDARK.spell_duration.real_time",
	permanent: "SHADOWDARK.spell_duration.permanent",
};

SHADOWDARK.EFFECT_ASK_INPUT = [
	"system.bonuses.weaponMastery",
	"system.bonuses.armorMastery",
	"system.bonuses.advantage",
];

SHADOWDARK.EFFECT_CATEGORIES = {
	effect: "SHADOWDARK.item.effect.category.effect",
	condition: "SHADOWDARK.item.effect.category.condition",
};

SHADOWDARK.EFFECT_DURATIONS = {
	instant: "SHADOWDARK.spell_duration.instant",
	rounds: "SHADOWDARK.spell_duration.rounds",
	turns: "SHADOWDARK.effect_duration.turns",
	seconds: "SHADOWDARK.effect_duration.seconds",
	minutes: "SHADOWDARK.effect_duration.minutes",
	hours: "SHADOWDARK.effect_duration.hours",
	days: "SHADOWDARK.spell_duration.days",
	focus: "SHADOWDARK.spell_duration.focus",
	permanent: "SHADOWDARK.spell_duration.permanent",
	unlimited: "SHADOWDARK.effect_duration.unlimited",
};

SHADOWDARK.EFFECT_TRANSLATIONS = {
	"system.abilities.cha.base": "SHADOWDARK.ability_cha",
	"system.abilities.cha.bonus": "SHADOWDARK.ability_cha",
	"system.abilities.con.base": "SHADOWDARK.ability_con",
	"system.abilities.con.bonus": "SHADOWDARK.ability_con",
	"system.abilities.dex.base": "SHADOWDARK.ability_dex",
	"system.abilities.dex.bonus": "SHADOWDARK.ability_dex",
	"system.abilities.int.base": "SHADOWDARK.ability_int",
	"system.abilities.int.bonus": "SHADOWDARK.ability_int",
	"system.abilities.str.base": "SHADOWDARK.ability_str",
	"system.abilities.str.bonus": "SHADOWDARK.ability_str",
	"system.abilities.wis.base": "SHADOWDARK.ability_wis",
	"system.abilities.wis.bonus": "SHADOWDARK.ability_wis",
	"system.bonuses.acBonus": "SHADOWDARK.talent.type.armor_bonus",
	"system.bonuses.advantage": "SHADOWDARK.talent.type.advantage.title",
	"system.bonuses.armorMastery": "SHADOWDARK.item.effect.predefined_effect.armorMastery",
	"system.bonuses.attackBonus": "SHADOWDARK.item.magic_item.type.attackBonus",
	"system.bonuses.backstabDie": "SHADOWDARK.talent.type.backstab_die",
	"system.bonuses.critical.failureThreshold": "SHADOWDARK.item.magic_item.type.criticalFailureThreshold",
	"system.bonuses.critical.multiplier": "SHADOWDARK.item.magic_item.type.critMultiplier",
	"system.bonuses.critical.successThreshold": "SHADOWDARK.item.magic_item.type.criticalSuccessThreshold",
	"system.bonuses.damageBonus": "SHADOWDARK.item.magic_item.type.damageBonus",
	"system.bonuses.gearSlots": "SHADOWDARK.inventory.slots",
	"system.bonuses.meleeAttackBonus": "SHADOWDARK.talent.type.melee_attack_bonus",
	"system.bonuses.meleeDamageBonus": "SHADOWDARK.talent.type.melee_damage_bonus",
	"system.bonuses.rangedAttackBonus": "SHADOWDARK.talent.type.ranged_attack_bonus",
	"system.bonuses.rangedDamageBonus": "SHADOWDARK.talent.type.ranged_damage_bonus",
	"system.bonuses.spellcastingCheckBonus": "SHADOWDARK.talent.type.spell_bonus",
	"system.bonuses.spellcastingClasses": "SHADOWDARK.talent.type.bonus_caster_classes",
	"system.bonuses.weaponMastery": "SHADOWDARK.talent.type.weapon_mastery",
};

SHADOWDARK.JOURNAL_UUIDS = {
	RELEASE_NOTES: "Compendium.shadowdark.documentation.JournalEntry.UJ60Lf9ecijEOO6I",
};

SHADOWDARK.PREDEFINED_EFFECTS = {
	abilityImprovementCha: {
		defaultValue: 1,
		effectKey: "system.abilities.cha.bonus",
		icon: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementCha",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	abilityImprovementCon: {
		defaultValue: 1,
		effectKey: "system.abilities.con.bonus",
		icon: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementCon",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	abilityImprovementDex: {
		defaultValue: 1,
		effectKey: "system.abilities.dex.bonus",
		icon: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementDex",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	abilityImprovementInt: {
		defaultValue: 1,
		effectKey: "system.abilities.int.bonus",
		icon: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementInt",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	abilityImprovementStr: {
		defaultValue: 1,
		effectKey: "system.abilities.str.bonus",
		icon: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementStr",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	abilityImprovementWis: {
		defaultValue: 1,
		effectKey: "system.abilities.wis.bonus",
		icon: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.abilityImprovementWis",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	acBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.acBonus",
		icon: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.acBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	acBonusFromAttribute: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.acBonusFromAttribute",
		icon: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.acBonusFromAttribute",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	additionalGearSlots: {
		defaultValue: 1,
		effectKey: "system.bonuses.gearSlots",
		icon: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.additionalGearSlots",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	armorMastery: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.armorMastery",
		icon: "icons/magic/defensive/shield-barrier-deflect-teal.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.armorMastery",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	backstabDie: {
		defaultValue: 1,
		effectKey: "system.bonuses.backstabDie",
		icon: "icons/skills/melee/strike-dagger-white-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.backstabDie",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	criticalFailureThreshold: {
		defaultValue: 3,
		effectKey: "system.bonuses.critical.failureThreshold",
		icon: "icons/magic/life/cross-area-circle-green-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.criticalFailureThreshold",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	criticalSuccessThreshold: {
		defaultValue: 18,
		effectKey: "system.bonuses.critical.successThreshold",
		icon: "icons/magic/fire/flame-burning-fist-strike.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.criticalSuccessThreshold",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	critMultiplier: {
		defaultValue: 4,
		effectKey: "system.bonuses.critical.multiplier",
		icon: "icons/skills/melee/hand-grip-staff-yellow-brown.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.critMultiplier",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
		transfer: false,
	},
	damageMultiplier: {
		defaultValue: 2,
		effectKey: "system.bonuses.damageMultiplier",
		icon: "icons/skills/melee/strike-hammer-destructive-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.damageMultiplier",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	hpAdvantage: {
		defaultValue: "hp",
		effectKey: "system.bonuses.advantage",
		icon: "icons/magic/life/cross-area-circle-green-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.hpAdvantage",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	initAdvantage: {
		defaultValue: "initiative",
		effectKey: "system.bonuses.advantage",
		icon: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.initAdvantage",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	lightSource: {
		defaultValue: "REPLACEME",
		effectKey: "system.light.template",
		icon: "icons/magic/light/torch-fire-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.lightSource",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	meleeAttackBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.meleeAttackBonus",
		icon: "icons/skills/melee/strike-polearm-glowing-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.meleeAttackBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	meleeDamageBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.meleeDamageBonus",
		icon: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.meleeDamageBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	permanentAbilityCha: {
		defaultValue: 18,
		effectKey: "system.abilities.cha.base",
		icon: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityCha",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	permanentAbilityCon: {
		defaultValue: 18,
		effectKey: "system.abilities.con.base",
		icon: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityCon",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	permanentAbilityDex: {
		defaultValue: 18,
		effectKey: "system.abilities.dex.base",
		icon: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityDex",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	permanentAbilityInt: {
		defaultValue: 18,
		effectKey: "system.abilities.int.base",
		icon: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityInt",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	permanentAbilityStr: {
		defaultValue: 18,
		effectKey: "system.abilities.str.base",
		icon: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityStr",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	permanentAbilityWis: {
		defaultValue: 18,
		effectKey: "system.abilities.wis.base",
		icon: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.permanentAbilityWis",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
	},
	rangedAttackBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.rangedAttackBonus",
		icon: "icons/weapons/ammunition/arrow-head-war-flight.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.rangedAttackBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	rangedDamageBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.rangedDamageBonus",
		icon: "icons/skills/melee/strike-axe-blood-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.rangedDamageBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	spellAdvantage: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.advantage",
		icon: "icons/magic/air/air-smoke-casting.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.spellAdvantage",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	spellCastingBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.spellcastingCheckBonus",
		icon: "icons/magic/fire/flame-burning-fist-strike.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.spellCastingBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	spellcastingClasses: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.spellcastingClasses",
		icon: "icons/sundries/documents/document-sealed-brown-red.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.spellcastingClasses",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	unarmoredAcBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.unarmoredAcBonus",
		icon: "icons/skills/melee/shield-block-gray-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.unarmoredAcBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	weaponAttackBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.attackBonus",
		icon: "icons/skills/melee/strike-polearm-glowing-white.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponAttackBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
		restriction: "Weapon",
		transfer: false,
	},
	weaponDamageBonus: {
		defaultValue: 1,
		effectKey: "system.bonuses.damageBonus",
		icon: "icons/weapons/ammunition/arrow-head-war-flight.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageBonus",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
		restriction: "Weapon",
		transfer: false,
	},
	weaponDamageDieD12: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageDieD12",
		icon: "icons/skills/ranged/arrows-flying-salvo-blue-light.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageDieD12",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	weaponDamageDieImprovementByProperty: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageDieImprovementByProperty",
		icon: "icons/skills/ranged/arrows-flying-salvo-blue-light.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageDieImprovementByProperty",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	weaponDamageExtraDieByProperty: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageExtraDieByProperty",
		icon: "icons/skills/ranged/arrows-flying-salvo-blue-light.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageExtraDieByProperty",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	weaponDamageExtraDieImprovementByProperty: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponDamageExtraDieImprovementByProperty",
		icon: "icons/skills/ranged/arrows-flying-salvo-blue-light.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponDamageExtraDieImprovementByProperty",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
	weaponDamageMultiplier: {
		defaultValue: 2,
		effectKey: "system.bonuses.damageMultiplier",
		icon: "icons/skills/melee/strike-hammer-destructive-orange.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.damageMultiplier",
		mode: "CONST.ACTIVE_EFFECT_MODES.OVERRIDE",
		transfer: false,
	},
	weaponMastery: {
		defaultValue: "REPLACEME",
		effectKey: "system.bonuses.weaponMastery",
		icon: "icons/skills/melee/weapons-crossed-swords-white-blue.webp",
		name: "SHADOWDARK.item.effect.predefined_effect.weaponMastery",
		mode: "CONST.ACTIVE_EFFECT_MODES.ADD",
	},
};

SHADOWDARK.VARIABLE_DURATIONS = [
	"days",
	"hours",
	"minutes",
	"realTime",
	"rounds",
	"seconds",
	"turns",
];

SHADOWDARK.DURATION_UNITS = {
	seconds: 1,
	rounds: 6,
	minutes: 60,
	turns: 600,
	hours: 3600,
	days: 86400,
};

SHADOWDARK.SPELL_RANGES = {
	self: "SHADOWDARK.range.self",
	close: "SHADOWDARK.range.close",
	near: "SHADOWDARK.range.near",
	far: "SHADOWDARK.range.far",
	touch: "SHADOWDARK.range.touch",
	samePlane: "SHADOWDARK.range.samePlane",
	unlimited: "SHADOWDARK.range.unlimited",
};

SHADOWDARK.TALENT_CLASSES = {
	ancestry: "SHADOWDARK.talent.class.ancestry",
	class: "SHADOWDARK.talent.class.class",
	level: "SHADOWDARK.talent.class.level",
};

SHADOWDARK.WEAPON_BASE_DAMAGE = {
	d2: "1d2",
	d4: "1d4",
	d6: "1d6",
	d8: "1d8",
	d10: "1d10",
	d12: "1d12",
};

SHADOWDARK.WEAPON_BASE_DAMAGE_DIE_ONLY = {
	d2: "d2",
	d4: "d4",
	d6: "d6",
	d8: "d8",
	d10: "d10",
	d12: "d12",
};

SHADOWDARK.WEAPON_TYPES = {
	melee: "SHADOWDARK.weapon.type.melee",
	ranged: "SHADOWDARK.weapon.type.ranged",
};

export default SHADOWDARK;
