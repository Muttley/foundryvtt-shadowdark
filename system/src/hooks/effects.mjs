// Hooks used for the Effects

export const EffectHooks = {
	attach: () => {
		Hooks.on("dropCanvasData", (canvas, data) => {
			// Calculate if the item was droppen on a token
			const dropTarget = [...canvas.tokens.placeables]
				.sort((a, b) => b.document.sort - a.document.sort)
				.find(token => {
					const maximumX = token.x + (token.hitArea?.right ?? 0);
					const maximumY = token.y + (token.hitArea?.bottom ?? 0);
					return data.x >= token.x
						&& data.y >= token.y
						&& data.x <= maximumX
						&& data.y <= maximumY;
				});

			const actor = dropTarget?.actor;

			// Create the item on the actor if it was an effect
			if (actor && data.type === "Item") {
				let item = {};
				try {
					item = fromUuidSync(data.uuid);
				}
				catch(error) {
					shadowdark.log(`Couldn't read anything: ${error}`);
				}
				if (item.type === "Effect") {
					actor.sheet.emulateItemDrop(data);
					return false; // Stop modules for doing anything further
				}
			}
		});

		Hooks.on("deleteCombat", (combat, _config, _id) => {
			// Remove all rounds effects by the end of combat
			combat.combatants.forEach(c => {
				c.actor?.items.filter(e => e.type === "Effect" && e.system.duration.type === "rounds")
					.forEach(async i => i.delete());
			});
		});
	},
};
