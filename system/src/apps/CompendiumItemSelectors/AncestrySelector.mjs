import CompendiumItemSelector from "../CompendiumItemSelector";

export default class AncestrySelector extends CompendiumItemSelector {

	closeOnSelection = true;

	maxChoices = 1;

	get prompt() {
		return game.i18n.localize("SHADOWDARK.dialog.select_ancestry.prompt");
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_ancestry.title");
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.ancestries();
	}

	async getUuids() {
		const uuid = this.object?.system?.ancestry;

		return uuid !== "" ? [uuid] : [];
	}

	async saveUuids(uuids) {
		const uuid = uuids[0] ?? "";

		return this.object.update({
			"system.ancestry": uuid,
		});
	}
}
