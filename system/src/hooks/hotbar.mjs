export const hotbarHooks = {
	attach: () => {
		Hooks.on("hotbarDrop", (bar, data, slot) => {
			if (data.type === "Item") {
				shadowdark.utils.createHotbarMacro(data, slot);
				return false;
			}
		});
	},
};
