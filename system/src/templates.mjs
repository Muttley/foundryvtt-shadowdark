export default function() {
	const paths = [
		"systems/shadowdark/templates/actors/player/abilities.hbs",
		"systems/shadowdark/templates/actors/player/abilities/ac.hbs",
		"systems/shadowdark/templates/actors/player/abilities/hp.hbs",
		"systems/shadowdark/templates/actors/player/background.hbs",
		"systems/shadowdark/templates/actors/player/inventory.hbs",
		"systems/shadowdark/templates/actors/player/talents.hbs",
		"systems/shadowdark/templates/items/partials/cost.hbs",
		"systems/shadowdark/templates/items/partials/description.hbs",
		"systems/shadowdark/templates/items/partials/slots.hbs",
	];

	return loadTemplates(paths);
}
