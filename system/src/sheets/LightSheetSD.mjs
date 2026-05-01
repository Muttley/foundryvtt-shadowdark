import ActorSheetSD from "./ActorSheetSD.mjs";

export default class LightSheetSD extends ActorSheetSD {

	static DEFAULT_OPTIONS = foundry.utils.mergeObject(
		ActorSheetSD.DEFAULT_OPTIONS,
		{
			classes: ["shadowdark-app", "shadowdark-light"],
			position: { width: 450, height: 200 },
			window: {
				resizable: true,
				contentClasses: ["shadowdark", "sheet", "light"],
			},
			actions: {
				"pick-up-light": LightSheetSD.prototype._onPickupLight,
			},
		},
		{ inplace: false }
	);

	static PARTS = {
		form: {
			template: "systems/shadowdark/templates/actors/light.hbs",
		},
	};

	async _onPickupLight(event, target) {
		event.preventDefault();

		if (!this.token) {
			ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.light-source.pick-up.no-token")
			);
			return;
		}

		if (!game.user.isGM) {
			game.socket.emit(
				"system.shadowdark",
				{
					type: "pickupLightSourceFromScene",
					data: {
						character: game.user.character,
						lightActor: this.actor,
						lightToken: this.token,
						speaker: ChatMessage.getSpeaker(),
					},
				}
			);
		}
		else {
			const playerActors = game.actors.filter(
				actor => actor.type === "Player" && actor.hasPlayerOwner
			);

			const content = await foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/dialog/assign-picked-up-lightsource.hbs",
				{ playerActors }
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
				close: () => false,
			});

			if (targetActor) {
				game.shadowdark.lightSourceTracker.pickupLightSourceFromScene(
					game.actors.get(targetActor),
					this.actor,
					ChatMessage.getSpeaker()
				);
			}
		}

		this.close();
	}
}
