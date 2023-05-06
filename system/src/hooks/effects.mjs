// Hooks used for the Effects

export const EffectHooks = {
	attach: () => {
		// dropCanvasData is handled in canvas.mjs hooks instaed

		Hooks.on("deleteCombat", (combat, _config, _id) => {
			// Remove all rounds effects by the end of combat
			combat.combatants.forEach(c => {
				c.actor?.items.filter(e => e.type === "Effect" && e.system.duration.type === "rounds")
					.forEach(async i => i.delete());
			});
		});
	},
};
