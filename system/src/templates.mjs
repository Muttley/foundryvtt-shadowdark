export default function() {
	const partials = [
		"systems/shadowdark/templates/actors/player/abilities.hbs",
		"systems/shadowdark/templates/actors/player/abilities/ac.hbs",
		"systems/shadowdark/templates/actors/player/abilities/attacks.hbs",
		"systems/shadowdark/templates/actors/player/abilities/hp.hbs",
		"systems/shadowdark/templates/actors/player/abilities/luck.hbs",
		"systems/shadowdark/templates/actors/player/background.hbs",
		"systems/shadowdark/templates/actors/player/inventory.hbs",
		"systems/shadowdark/templates/actors/player/inventory/coins.hbs",
		"systems/shadowdark/templates/actors/player/inventory/slots.hbs",
		"systems/shadowdark/templates/actors/player/spells.hbs",
		"systems/shadowdark/templates/actors/player/talents.hbs",
		"systems/shadowdark/templates/items/partials/armor.hbs",
		"systems/shadowdark/templates/items/partials/cost.hbs",
		"systems/shadowdark/templates/items/partials/description.hbs",
		"systems/shadowdark/templates/items/partials/equipped.hbs",
		"systems/shadowdark/templates/items/partials/slots.hbs",
		"systems/shadowdark/templates/items/partials/spell.hbs",
		"systems/shadowdark/templates/items/partials/talent.hbs",
		"systems/shadowdark/templates/items/partials/treasure.hbs",
		"systems/shadowdark/templates/items/partials/weapon.hbs",
		"systems/shadowdark/templates/partials/weapon-attack.hbs",
	];

	const paths = {};
	for (const path of partials) {
		const key = path.split("/").slice(3).join("/");
		paths[key] = path;
	}

	return loadTemplates(paths);
}
