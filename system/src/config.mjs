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
	oath: "SHADOWDARK.boons.oath",
	secret: "SHADOWDARK.boons.secret",
	blessing: "SHADOWDARK.boons.blessing",
};

/* eslint-disable quote-props */
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
		"Potion": "icons/consumables/potions/bottle-corked-red.webp",
		"Property": "icons/sundries/documents/document-torn-diagram-tan.webp",
		"Scroll": "icons/sundries/scrolls/scroll-runed-brown-purple.webp",
		"Spell": "icons/magic/symbols/runes-star-blue.webp",
		"Talent": "icons/sundries/books/book-worn-brown-grey.webp",
		"Wand": "icons/weapons/wands/wand-gem-violet.webp",
		"Weapon": "icons/weapons/swords/swords-short.webp",
	},
};
/* eslint-enable quote-props */

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
	"cursed-scroll-1": "Cursed Scroll Vol.1, Diablerie!",
	"cursed-scroll-2": "Cursed Scroll Vol.2, Red Sands",
	"cursed-scroll-3": "Cursed Scroll Vol.3, Midnight Sun",
	"quickstart-game-master-guide": "Quickstart: Game Master Guide",
	"quickstart-player-guide": "Quickstart: Player Guide",
	"bard-and-ranger": "Shadowdark RPG: Bard and Ranger",
	"core-rules": "Shadowdark RPG: Core Rules",
};

SHADOWDARK.SPELL_DURATIONS = {
	focus: "SHADOWDARK.spell_duration.focus",
	instant: "SHADOWDARK.spell_duration.instant",
	rounds: "SHADOWDARK.spell_duration.rounds",
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
	"system.bonuses.weaponMastery": "SHADOWDARK.talent.type.weapon_mastery",
};

SHADOWDARK.VARIABLE_DURATIONS = [
	"days",
	"rounds",
	"realTime",
	"seconds",
	"minutes",
	"hours",
];

SHADOWDARK.DURATION_UNITS = {
	seconds: 1,
	minutes: 60,
	rounds: 360,
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
	d4: "1d4",
	d6: "1d6",
	d8: "1d8",
	d10: "1d10",
	d12: "1d12",
};

SHADOWDARK.WEAPON_BASE_DAMAGE_DIE_ONLY = {
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
