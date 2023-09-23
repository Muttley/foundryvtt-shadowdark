import CompendiumItemSelector from "../CompendiumItemSelector";

export default class DeitySelector extends CompendiumItemSelector {

	closeOnSelection = true;

	maxChoices = 1;

	get prompt() {
		return game.i18n.localize("SHADOWDARK.dialog.select_deity.prompt");
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.select_deity.title");
	}

	async decorateName(item) {
		// Decorate rare languages so they're easy to spot in the selector
		return item.system.alignment === ""
			? `${item.name} (?)`
			: `${item.name} (${CONFIG.SHADOWDARK.ALIGNMENTS[item.system.alignment]})`;
	}

	async getAvailableItems() {
		return await shadowdark.compendiums.deities();
	}


	async getUuids() {
		const uuid = this.object?.system?.deity;

		return uuid !== "" ? [uuid] : [];
	}

	async saveUuids(uuids) {
		const uuid = uuids[0] ?? "";

		return this.object.update({
			"system.deity": uuid,
		});
	}
}
