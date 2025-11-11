import CompendiumItemSelector from "../CompendiumItemSelector.mjs";

export default class VehiclePropertySelector extends CompendiumItemSelector {

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_vehicle_property.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.vehicleProperties();
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
