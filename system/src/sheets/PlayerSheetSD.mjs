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
				},
			],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/player.hbs";
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".ability-name").click(this._onRollAbilityTest.bind(this));

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		context.gearSlots = this.actor.numGearSlots();
		context.xpNextLevel = context.system.level.value * 10;

		return context;
	}

	_onRollAbilityTest(event) {
		event.preventDefault();
		let ability = event.currentTarget.parentElement.dataset.ability;
		this.actor.rollAbility(ability, {event: event});
	}
}
