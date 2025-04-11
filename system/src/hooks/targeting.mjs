export const TargetingHooks = {
	attach: () => {
		Hooks.on("targetToken", async (user, token, targeted) => {
			// return early if targeting is disabled
			if (!game.settings.get("shadowdark", "enableTargeting")) return;
			// return early if we are removing a target
			if (!targeted) return;

			// only GMs are allowed to have more than one target
			if (game.user.targets.size > 1 && !user.isGM) {
				game.user.updateTokenTargets([token.id]);
			}
		});
	},
};
