export const hotbarHooks = {
	attach: () => {
		Hooks.on("hotbarDrop", (bar, data, slot) => {
			if (data.type !== "Item") return true;
			if (data.type === "Macro" || data.type === "RollTable") return true;

			shadowdark.utils.createHotbarMacro(data, slot);
			return false;
		});
	},
};
