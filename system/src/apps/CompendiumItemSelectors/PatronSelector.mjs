import CompendiumItemSelector from "../CompendiumItemSelector";

export default class PatronSelector extends CompendiumItemSelector {

	closeOnSelection = true;

	maxChoices = 1;

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_patron.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.patrons();
	}


	async getUuids() {
		const uuid = this.object?.system?.patron;

		return uuid !== "" ? [uuid] : [];
	}

	async saveUuids(uuids) {
		const uuid = uuids[0] ?? "";

		return this.object.update({
			"system.patron": uuid,
		});
	}
}
