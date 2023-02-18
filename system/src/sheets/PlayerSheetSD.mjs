import ActorSheetSD from "./ActorSheetSD.mjs";

export default class PlayerSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 560,
			height: 560,
			classes: ["shadowdark", "sheet", "player"],
			resizable: true,
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

		return context;
	}
}
