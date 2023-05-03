import ActorSheetSD from "./ActorSheetSD.mjs";

export default class LightSheetSD extends ActorSheetSD {

	// @todo: How to add a button to the token HUD for picking up torch?

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "light"],
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
		return "systems/shadowdark/templates/actors/light.hbs";
	}

	/** @inheritdoc */
	activateListeners(html) {
		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);

		// Button that transfers the light source to the assigned character
		// and deletes the Light actor.
		html.find(".pick-up-light").click(
			event => this._onPickupLight(event)
		);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		return context;
	}

	async _onPickupLight(event) {
		event.preventDefault();

		if (!game.user.isGM) {
			game.socket.emit(
				"system.shadowdark",
				{
					type: "pickupLightSourceFromScene",
					data: {
						character: game.user.character,
						lightActor: this.actor,
						lightToken: this.object.token,
					},
				}
			);
		}

		this.close();
	}
}
