export default function() {
	const paths = [
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
		"systems/shadowdark/templates/apps/weapon-properties.hbs",
		"systems/shadowdark/templates/items/partials/cost.hbs",
		"systems/shadowdark/templates/items/partials/description.hbs",
		"systems/shadowdark/templates/items/partials/slots.hbs",
		"systems/shadowdark/templates/items/partials/weapon.hbs",
	];

	return loadTemplates(paths);
}
