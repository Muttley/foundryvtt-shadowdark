export default function() {
	const partials = [
		"systems/shadowdark/templates/actors/npc/abilities.hbs",
		"systems/shadowdark/templates/actors/npc/abilities/attacks.hbs",
		"systems/shadowdark/templates/actors/npc/abilities/features.hbs",
		"systems/shadowdark/templates/actors/npc/abilities/specials.hbs",
		"systems/shadowdark/templates/actors/npc/description.hbs",
		"systems/shadowdark/templates/actors/npc/partials/ability-scores.hbs",
		"systems/shadowdark/templates/actors/npc/partials/ac.hbs",
		"systems/shadowdark/templates/actors/npc/partials/hp.hbs",
		"systems/shadowdark/templates/actors/npc/partials/level.hbs",
		"systems/shadowdark/templates/actors/npc/spells.hbs",
		"systems/shadowdark/templates/actors/partials/effects.hbs",
		"systems/shadowdark/templates/actors/player/abilities.hbs",
		"systems/shadowdark/templates/actors/player/abilities/ac.hbs",
		"systems/shadowdark/templates/actors/player/abilities/attacks.hbs",
		"systems/shadowdark/templates/actors/player/abilities/class.hbs",
		"systems/shadowdark/templates/actors/player/abilities/hp.hbs",
		"systems/shadowdark/templates/actors/player/abilities/luck.hbs",
		"systems/shadowdark/templates/actors/player/abilities/stats.hbs",
		"systems/shadowdark/templates/actors/player/details.hbs",
		"systems/shadowdark/templates/actors/player/details/boons.hbs",
		"systems/shadowdark/templates/actors/player/inventory.hbs",
		"systems/shadowdark/templates/actors/player/inventory/coins.hbs",
		"systems/shadowdark/templates/actors/player/inventory/gems.hbs",
		"systems/shadowdark/templates/actors/player/inventory/slots.hbs",
		"systems/shadowdark/templates/actors/player/notes.hbs",
		"systems/shadowdark/templates/actors/player/spells.hbs",
		"systems/shadowdark/templates/actors/player/talents.hbs",
		"systems/shadowdark/templates/items/_partials/choice-selector.hbs",
		"systems/shadowdark/templates/items/_partials/cost.hbs",
		"systems/shadowdark/templates/items/_partials/description-tab.hbs",
		"systems/shadowdark/templates/items/_partials/duration.hbs",
		"systems/shadowdark/templates/items/_partials/effects-tab.hbs",
		"systems/shadowdark/templates/items/_partials/effects/active-effect.hbs",
		"systems/shadowdark/templates/items/_partials/effects/active-effects-list.hbs",
		"systems/shadowdark/templates/items/_partials/effects/predefined-selector.hbs",
		"systems/shadowdark/templates/items/_partials/header.hbs",
		"systems/shadowdark/templates/items/_partials/item-properties/ammunition.hbs",
		"systems/shadowdark/templates/items/_partials/item-properties/equipped.hbs",
		"systems/shadowdark/templates/items/_partials/item-properties/light-source.hbs",
		"systems/shadowdark/templates/items/_partials/item-properties/magic-item.hbs",
		"systems/shadowdark/templates/items/_partials/item-properties/treasure.hbs",
		"systems/shadowdark/templates/items/_partials/slots.hbs",
		"systems/shadowdark/templates/items/_partials/source-tab.hbs",
		"systems/shadowdark/templates/items/_partials/spell.hbs",
		"systems/shadowdark/templates/items/ancestry/_partials/character-generator.hbs",
		"systems/shadowdark/templates/items/ancestry/_partials/languages.hbs",
		"systems/shadowdark/templates/items/ancestry/_partials/talents.hbs",
		"systems/shadowdark/templates/items/ancestry/details-tab.hbs",
		"systems/shadowdark/templates/items/armor/_partials/armor-properties.hbs",
		"systems/shadowdark/templates/items/armor/_partials/armor.hbs",
		"systems/shadowdark/templates/items/armor/_partials/item-properties.hbs",
		"systems/shadowdark/templates/items/armor/details-tab.hbs",
		"systems/shadowdark/templates/items/basic/_partials/item-properties.hbs",
		"systems/shadowdark/templates/items/basic/_partials/light-template.hbs",
		"systems/shadowdark/templates/items/basic/_partials/light-timer.hbs",
		"systems/shadowdark/templates/items/basic/details-tab.hbs",
		"systems/shadowdark/templates/items/basic/light-tab.hbs",
		"systems/shadowdark/templates/items/boon/details-tab.hbs",
		"systems/shadowdark/templates/items/class-ability/_partials/ability-check.hbs",
		"systems/shadowdark/templates/items/class-ability/_partials/ability-group.hbs",
		"systems/shadowdark/templates/items/class-ability/_partials/options.hbs",
		"systems/shadowdark/templates/items/class-ability/details-tab.hbs",
		"systems/shadowdark/templates/items/class/_partials/details.hbs",
		"systems/shadowdark/templates/items/class/_partials/equipment.hbs",
		"systems/shadowdark/templates/items/class/_partials/languages.hbs",
		"systems/shadowdark/templates/items/class/_partials/talents.hbs",
		"systems/shadowdark/templates/items/class/details-tab.hbs",
		"systems/shadowdark/templates/items/class/spells-known-tab.hbs",
		"systems/shadowdark/templates/items/class/titles-tab.hbs",
		"systems/shadowdark/templates/items/deity/details-tab.hbs",
		"systems/shadowdark/templates/items/effect/_partials/category.hbs",
		"systems/shadowdark/templates/items/effect/_partials/duration.hbs",
		"systems/shadowdark/templates/items/effect/_partials/properties.hbs",
		"systems/shadowdark/templates/items/effect/details-tab.hbs",
		"systems/shadowdark/templates/items/gem/details-tab.hbs",
		"systems/shadowdark/templates/items/language/details-tab.hbs",
		"systems/shadowdark/templates/items/npc-attack/details-tab.hbs",
		"systems/shadowdark/templates/items/npc-special-attack/details-tab.hbs",
		"systems/shadowdark/templates/items/npc-spell/details-tab.hbs",
		"systems/shadowdark/templates/items/patron/details-tab.hbs",
		"systems/shadowdark/templates/items/potion/details-tab.hbs",
		"systems/shadowdark/templates/items/property/details-tab.hbs",
		"systems/shadowdark/templates/items/scroll/details-tab.hbs",
		"systems/shadowdark/templates/items/spell/details-tab.hbs",
		"systems/shadowdark/templates/items/talent/details-tab.hbs",
		"systems/shadowdark/templates/items/wand/details-tab.hbs",
		"systems/shadowdark/templates/items/weapon/_partials/item-properties.hbs",
		"systems/shadowdark/templates/items/weapon/_partials/weapon-properties.hbs",
		"systems/shadowdark/templates/items/weapon/_partials/weapon.hbs",
		"systems/shadowdark/templates/items/weapon/details-tab.hbs",
		"systems/shadowdark/templates/ui/sd-box.hbs",
	];

	const paths = {};
	for (const path of partials) {
		const [key] = path.split("/").slice(3).join("/").split(".");
		paths[key] = path;
	}

	return loadTemplates(paths);
}
