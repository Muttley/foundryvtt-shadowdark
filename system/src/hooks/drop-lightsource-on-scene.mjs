// Hooks used for the Canvas & Scenes

async function addTorchButton(hud, hudHTML, _hudData) {
	const token = hud.object.document;
	const actor = game.actors.get(hud.object.document.actorId);
	// Check if token belongs to a Light actor
	if (actor.type !== "Light") return;

	// Add button to HUD
	const button = $(`
		<div class="control-icon light-source" data-tooltip="
		${game.i18n.localize("SHADOWDARK.light-source.pick-up-lightsource.tooltip")}
		">
			<i class="fas fa-fire-flame-simple"></i>
		</div>
	`);

	hudHTML.find(".col.middle").prepend(button);

	// Add listeners to button
	button.find("i").click(async event => {
		event.preventDefault();
		event.stopPropagation();

		actor.sheet._onPickupLight(event, { actor, token });
	});
}

export const DropLightsourceHooks = {
	attach: () => {

		Hooks.on("renderTokenHUD", (app, html, data) => {
			addTorchButton(app, html, data);
		});

		Hooks.on("dropCanvasData", async (canvas, data) => {

			// Create the item on the actor if it was an effect
			if (data.type === "Item") {
				let item = {};
				try {
					item = fromUuidSync(data.uuid);
				}
				catch(error) {
					shadowdark.log(`Couldn't read anything: ${error}`);
				}

				// Check if the dropped item is a lightsource
				if (item && item.isLight()) {
					const actorData = {
						name: game.i18n.format("SHADOWDARK.light-source.dropped", {name: item.name}),
						img: item.img,
						type: "Light",
						prototypeToken: {
							light: item.parent.prototypeToken.light,
							texture: {
								src: item.img,
								scaleX: 0.5,
								scaleY: 0.5,
							},
						},
						ownership: { default: 3 }, // Everyone is owner
					};

					// Let a GM handle the dropping as it requires elevated permissions
					if (game.user.isGM) {
						game.shadowdark.lightSourceTracker.dropLightSourceOnScene(
							item,
							item.parent,
							actorData,
							data,
							ChatMessage.getSpeaker()
						);
					}
					else {
						game.socket.emit(
							"system.shadowdark",
							{
								type: "dropLightSourceOnScene",
								data: {
									item,
									itemOwner: item.actor,
									actorData,
									dropData: { x: data.x, y: data.y },
									speaker: ChatMessage.getSpeaker(),
								},
							}
						);
					}

					return false; // Prevent further modifications
				}
			}
		});
	},
};
