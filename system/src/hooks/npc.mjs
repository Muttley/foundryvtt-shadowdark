export const NPCHooks = {
	attach: () => {
		Hooks.on("createToken", (token, options, userId) => {
			if (token.actor.type === "Player") return;

			const rollHp = game.settings.get(
				"shadowdark", "rollNpcHpWhenAddedToScene"
			);

			if (rollHp) {
				token.actor._npcRollHP();
			}
		});
	},
};
