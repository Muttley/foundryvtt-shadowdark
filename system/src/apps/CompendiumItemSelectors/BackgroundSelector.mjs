import CompendiumItemSelector from "../CompendiumItemSelector";

export default class BackgroundSelector extends CompendiumItemSelector {

	closeOnSelection = true;

	maxChoices = 1;

	get prompt() {
		return game.i18n.localize("SHADOWDARK.dialog.select_background.prompt");
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_background.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.backgrounds();
	}

	async getUuids() {
		const uuid = this.object?.system?.background;

		return uuid !== "" ? [uuid] : [];
	}

	async saveUuids(uuids) {
		const uuid = uuids[0] ?? "";

		return this.object.update({
			"system.background": uuid,
		});
	}
}
