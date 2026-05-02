export const NPCHooks = {
	attach: () => {
		Hooks.on("createToken", (token, options, userId) => {
			if (!game.user.isGM) return;

			if (token?.actor?.system?.rollHP instanceof Function) {
				if (game.settings.get("shadowdark", "rollNpcHpWhenAddedToScene")) {
					token.actor.system.rollHP();
				}
			}
		});
	},
};
