export default function listenOnSocket() {

	game.socket.on("system.shadowdark", event => {
		if (event.type === "createCharacter") {
			// only the GM should handle this event
			if (!game.user.isGM) return;

			shadowdark.apps.CharacterGeneratorSD.createActorFromData(
				event.payload.characterData,
				event.payload.characterItems,
				event.payload.userId,
				event.payload.level0
			);
		}

		if (event.type === "dropLightSourceOnScene" && game.user.isGM) {
			game.shadowdark.lightSourceTracker.dropLightSourceOnScene(
				event.data.item,
				event.data.itemOwner,
				event.data.actorData,
				event.data.dropData,
				event.data.speaker
			);
		}

		if (event.type === "openNewCharacter") {
			if (event.payload.userId === game.userId) {
				const actor = game.actors.get(event.payload.actorId);

				if (actor) {
					if (event.payload.level0) {
						actor.sheet.render(true);
					}
					else {
						new shadowdark.apps.LevelUpSD(event.payload.actorId).render(true);
					}
				}
				return ui.notifications.info(
					game.i18n.localize("SHADOWDARK.apps.character-generator.success"),
					{permanent: false}
				);
			}
		}

		if (event.type === "pickupLightSourceFromScene" && game.user.isGM) {
			game.shadowdark.lightSourceTracker.pickupLightSourceFromScene(
				event.data.character,
				event.data.lightActor,
				event.data.speaker
			);
		}

		if (event.type === "toggleLightSource" && game.user.isGM) {
			game.shadowdark.lightSourceTracker.toggleLightSource(
				event.data.actor,
				event.data.item
			);
		}
	});
}
