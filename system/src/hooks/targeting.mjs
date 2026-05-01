export const TargetingHooks = {
	attach: () => {
		Hooks.on("targetToken", async (user, token, targeted) => {
			// return early if targeting is disabled
			if (!game.settings.get("shadowdark", "enableTargeting")) return;
			// return early if we are removing a target
			if (!targeted) return;

			// if a token has a dynamic ring configured, flash using the user's color
			if (token.document.ring.enabled) {
				const color = Color.from(user.color);
				token.ring.flashColor(color,
					{
						duration: 500,
						easing: token.ring.constructor.easeTwoPeaks,
					}
				);
			}
		});
	},
};
