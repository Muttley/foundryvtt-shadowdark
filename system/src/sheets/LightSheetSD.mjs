import ActorSheetSD from "./ActorSheetSD.mjs";

export default class LightSheetSD extends ActorSheetSD {

	// TODO: How to add a button to the token HUD for picking up torch?

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

	async _onPickupLight(event, options = {}) {
		event.preventDefault();

		if (!game.user.isGM) {
			game.socket.emit(
				"system.shadowdark",
				{
					type: "pickupLightSourceFromScene",
					data: {
						character: game.user.character,
						lightActor: options.actor ?? this.actor,
						lightToken: options.token ?? this.object.token,
						speaker: ChatMessage.getSpeaker(),
					},
				}
			);
		}
		else {
			// Display a dialog allowing the GM to choose which character to assign
			// the dropped light source to.
			const playerActors = game.actors.filter(
				actor => actor.type === "Player" && actor.hasPlayerOwner
			);
			// const activeUsers = game.users
			// 	.filter(u => u.active && !u.isGM);

			const content = await renderTemplate(
				"systems/shadowdark/templates/dialog/assign-picked-up-lightsource.hbs",
				{
					playerActors,
				}
			);

			const targetActor = await Dialog.wait({
				title: game.i18n.localize("SHADOWDARK.dialog.light_source.pick_up.title"),
				content,
				buttons: {
					select: {
						icon: "<i class=\"fa fa-square-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.select")}`,
						callback: html => {
							return html.find("input[type='radio']:checked").attr("id") ?? false;
						},
					},
					cancel: {
						icon: "<i class=\"fa fa-square-xmark\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
						callback: () => false,
					},
				},
				default: "select",
				close: () => console.log("Closed Dialog"),
			});

			if (targetActor) {
				game.shadowdark.lightSourceTracker.pickupLightSourceFromScene(
					game.actors.get(targetActor),
					options.actor ?? this.actor,
					options.token ?? this.object.token,
					ChatMessage.getSpeaker()
				);
			}
		}

		this.close();
	}
}
