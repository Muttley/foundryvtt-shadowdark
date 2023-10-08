import CompendiumItemSelector from "../CompendiumItemSelector";

export default class ArmorPropertySelector extends CompendiumItemSelector {

	get prompt() {
		return game.i18n.localize("SHADOWDARK.dialog.select_armor_property.prompt");
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_armor_property.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.armorProperties();
	}

	async getUuids() {
		return this.object?.system?.properties ?? [];
	}

	async saveUuids(uuids) {
		return this.object.update({
			"system.properties": uuids,
		});
	}
}
