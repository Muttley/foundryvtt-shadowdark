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

SHADOWDARK.ALIGNMENTS = {
	lawful: "SHADOWDARK.alignment.lawful",
	neutral: "SHADOWDARK.alignment.neutral",
	chaotic: "SHADOWDARK.alignment.chaotic",
};

SHADOWDARK.ALIGNMENTS_SHORT = {
	lawful: "SHADOWDARK.alignment.lawful_short",
	neutral: "SHADOWDARK.alignment.neutral_short",
	chaotic: "SHADOWDARK.alignment.chaotic_short",
};

SHADOWDARK.ARMOR_BONUS_ATTRIBUTES = {
	dex: "SHADOWDARK.ability_dex",
};

SHADOWDARK.ARMOR_PROPERTIES = {
	disadvStealth: "SHADOWDARK.armor.properties.disadvantage_stealth",
	disadvSwim: "SHADOWDARK.armor.properties.disadvantage_swimming",
	noSwim: "SHADOWDARK.armor.properties.no_swimming",
	oneHanded: "SHADOWDARK.armor.properties.one_handed",
	shield: "SHADOWDARK.armor.properties.shield",
};

SHADOWDARK.CLASSES = {
	fighter: "SHADOWDARK.class.fighter",
	priest: "SHADOWDARK.class.priest",
	thief: "SHADOWDARK.class.thief",
	wizard: "SHADOWDARK.class.wizard",
};

SHADOWDARK.DEFAULTS = {
	BASE_ARMOR_CLASS: 10,
	GEAR_SLOTS: 10,
	FREE_COIN_CARRY: 100,
};

SHADOWDARK.INVENTORY = {
	GEMS_PER_SLOT: 10,
};

SHADOWDARK.LANGUAGES = {
	celestial: "SHADOWDARK.language.celestial",
	common: "SHADOWDARK.language.common",
	diabolic: "SHADOWDARK.language.diabolic",
	draconic: "SHADOWDARK.language.draconic",
	dwarvish: "SHADOWDARK.language.dwarvish",
	elvish: "SHADOWDARK.language.elvish",
	giant: "SHADOWDARK.language.giant",
	goblin: "SHADOWDARK.language.goblin",
	merran: "SHADOWDARK.language.merran",
	orcish: "SHADOWDARK.language.orcish",
	primordial: "SHADOWDARK.language.primordial",
	reptilian: "SHADOWDARK.language.reptilian",
	sylvan: "SHADOWDARK.language.sylvan",
	thanian: "SHADOWDARK.language.thanian",
};

SHADOWDARK.NPC_ATTACK_TYPES = {
	physical: "SHADOWDARK.npc_attack.type.physical",
	ability: "SHADOWDARK.npc_attack.type.ability",
};

SHADOWDARK.RANGES = {
	close: "SHADOWDARK.range.close",
	near: "SHADOWDARK.range.near",
	far: "SHADOWDARK.range.far",
};

SHADOWDARK.RANGES_SHORT = {
	close: "SHADOWDARK.range.close_short",
	near: "SHADOWDARK.range.near_short",
	far: "SHADOWDARK.range.far_short",
	self: "SHADOWDARK.range.self_short",
};

SHADOWDARK.SPELL_CASTER_CLASSES = {
	priest: "SHADOWDARK.spell_caster.priest",
	wizard: "SHADOWDARK.spell_caster.wizard",
};

SHADOWDARK.SPELL_DURATIONS = {
	focus: "SHADOWDARK.spell_duration.focus",
	instant: "SHADOWDARK.spell_duration.instant",
	rounds: "SHADOWDARK.spell_duration.rounds",
};

SHADOWDARK.SPELL_RANGES = {
	self: "SHADOWDARK.range.self",
	close: "SHADOWDARK.range.close",
	near: "SHADOWDARK.range.near",
	far: "SHADOWDARK.range.far",
};

SHADOWDARK.TALENT_TYPES = {
	abilityImprovement: "SHADOWDARK.talent.type.ability_improvement",
	attackBonus: "SHADOWDARK.talent.type.attack_bonus",
	damageBonus: "SHADOWDARK.talent.type.damage_bonus",
	armorBonus: "SHADOWDARK.talent.type.armor_bonus",
	spellBonus: "SHADOWDARK.talent.type.spell_bonus",
	initAdvantage: "SHADOWDARK.talent.type.initiative_advantage",
	spellAdvantage: "SHADOWDARK.talent.type.spell_advantage",
	weaponMastery: "SHADOWDARK.talent.type.weapon_mastery",
	backstabDie: "SHADOWDARK.talent.type.backstab_die",
	custom: "SHADOWDARK.talent.type.custom",
};

SHADOWDARK.TALENT_PROPERTIES = {
	"system.abilities.cha.value": "SHADOWDARK.ability_cha",
	"system.abilities.con.value": "SHADOWDARK.ability_con",
	"system.abilities.dex.value": "SHADOWDARK.ability_dex",
	"system.abilities.int.value": "SHADOWDARK.ability_int",
	"system.abilities.str.value": "SHADOWDARK.ability_str",
	"system.abilities.wis.value": "SHADOWDARK.ability_wis",
	"system.talent.attackBonus": "SHADOWDARK.talent.type.attack_bonus",
	"system.talent.damageBonus": "SHADOWDARK.talent.type.damage_bonus",
};

SHADOWDARK.WEAPON_BASE_DAMAGE = {
	d4: "1d4",
	d6: "1d6",
	d8: "1d8",
	d10: "1d10",
	d12: "1d12",
};

SHADOWDARK.WEAPON_PROPERTIES = {
	finesse: "SHADOWDARK.weapon.properties.finesse",
	loading: "SHADOWDARK.weapon.properties.loading",
	thrown: "SHADOWDARK.weapon.properties.thrown",
	twoHanded: "SHADOWDARK.weapon.properties.two_handed",
	versatile: "SHADOWDARK.weapon.properties.versatile",
};

SHADOWDARK.WEAPON_TYPES = {
	melee: "SHADOWDARK.weapon.type.melee",
	ranged: "SHADOWDARK.weapon.type.ranged",
};

export default SHADOWDARK;
