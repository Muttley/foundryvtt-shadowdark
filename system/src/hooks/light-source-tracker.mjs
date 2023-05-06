// Hooks and socket events used by the Light Source Tracker
export const LightSourceTrackerHooks = {
	attach: () => {
		const lst = game.shadowdark.lightSourceTracker;

		if (game.user.isGM) {
			game.shadowdark.lightSourceTracker.start();
			Hooks.on("deleteActor", lst._deleteActorHook.bind(lst));
			Hooks.on("deleteItem", lst._deleteItemHook.bind(lst));
			Hooks.on("pauseGame", lst._pauseGameHook.bind(lst));
			Hooks.on("updateActor", lst._makeDirty.bind(lst));
			Hooks.on("updateUser", lst._makeDirty.bind(lst));
			Hooks.on("updateWorldTime", lst.onUpdateWorldTime.bind(lst));
			Hooks.on("userConnected", lst._makeDirty.bind(lst));
		}

		game.socket.on("system.shadowdark", event => {
			if (event.type === "toggleLightSource" && game.user.isGM) {
				game.shadowdark.lightSourceTracker.toggleLightSource(
					event.data.actor,
					event.data.item
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

			if (event.type === "pickupLightSourceFromScene" && game.user.isGM) {
				game.shadowdark.lightSourceTracker.pickupLightSourceFromScene(
					event.data.character,
					event.data.lightActor,
					event.data.lightToken,
					event.data.speaker
				);
			}
		});
	},
};
