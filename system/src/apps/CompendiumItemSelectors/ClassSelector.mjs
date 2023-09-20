import CompendiumItemSelector from "../CompendiumItemSelector";

export default class ClassSelector extends CompendiumItemSelector {

	closeOnSelection = true;

	maxChoices = 1;

	get prompt() {
		return game.i18n.localize("SHADOWDARK.dialog.select_class.prompt");
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_class.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.classes();
	}

	async getUuids() {
		const uuid = this.object?.system?.class;

		return uuid !== "" ? [uuid] : [];
	}

	async saveUuids(uuids) {
		const uuid = uuids[0] ?? "";

		return this.object.update({
			"system.class": uuid,
		});
	}
}
