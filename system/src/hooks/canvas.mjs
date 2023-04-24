// Hooks used for the Canvas & Scenes

export const CanvasHooks = {
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
				// If the item is an effect or one of the lightsource items,
				// we want to emulate dropping the item on the sheet.
				if (
					item.type === "Effect"
					|| CONFIG.SHADOWDARK.LIGHT_SOURCE_ITEM_IDS.includes(item._id)
				) {
					actor.sheet.emulateItemDrop(data);
					return false; // Stop modules for doing anything further
				}
			}
		});
	},
};
