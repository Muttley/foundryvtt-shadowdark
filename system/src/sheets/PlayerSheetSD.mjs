import ActorSheetSD from "./ActorSheetSD.mjs";

export default class PlayerSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "player"],
			width: 560,
			height: 560,
			resizable: true,
			tabs: [
				{
					navSelector: ".player-navigation",
					contentSelector: ".player-body",
					initial: "pc-tab-abilities",
				}
			]
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/player.hbs";
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		context.xpNextLevel = context.system.level.value * 10;
		context.gearSlots = this.actor.numGearSlots();

		return context;
	}
}
