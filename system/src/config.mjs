// Namespace Configuration Values
const SHADOWDARK = {};

SHADOWDARK.ARMOR_BONUS_ATTRIBUTES = {
	dex: "SHADOWDARK.ability_dex",
};

SHADOWDARK.ARMOR_PROPERTIES = {
	disadvStealth: "SHADOWDARK.armor.properties.disadvStealth",
	disadvSwim: "SHADOWDARK.armor.properties.disadvSwim",
	noSwim: "SHADOWDARK.armor.properties.noSwim",
	oneHanded: "SHADOWDARK.armor.properties.oneHanded",
	shield: "SHADOWDARK.armor.properties.shield",
};

SHADOWDARK.DEFAULTS = {
	BASE_ARMOR_CLASS: 10,
	GEAR_SLOTS: 10,
	FREE_COIN_CARRY: 100,
};

SHADOWDARK.INVENTORY = {
	GEMS_PER_SLOT: 10,
};

SHADOWDARK.RANGES = {
	close: "SHADOWDARK.range.close",
	near: "SHADOWDARK.range.near",
	far: "SHADOWDARK.range.far",
};

SHADOWDARK.SPELL_DURATIONS = {
	focus: "SHADOWDARK.spell_duration.focus",
	instant: "SHADOWDARK.spell_duration.instant",
	rounds: "SHADOWDARK.spell_duration.rounds",
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
	twoHanded: "SHADOWDARK.weapon.properties.twoHanded",
	versatile: "SHADOWDARK.weapon.properties.versatile",
};

SHADOWDARK.WEAPON_TYPES = {
	melee: "SHADOWDARK.weapon.type.melee",
	ranged: "SHADOWDARK.weapon.type.ranged",
};

export default SHADOWDARK;
