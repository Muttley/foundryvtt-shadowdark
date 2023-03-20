import ActorSheetSD from "./ActorSheetSD.mjs";

export default class NpcSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "npc"],
			width: 600,
			height: 666, // Memnon says "Hi!"
			resizable: true,
			tabs: [
				{
					navSelector: ".npc-navigation",
					contentSelector: ".npc-body-content",
					initial: "tab-details",
				},
			],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/npc.hbs";
	}

	/** @inheritdoc */
	activateListeners(html) {
		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		context.attacks = [];

		return context;
	}
}
