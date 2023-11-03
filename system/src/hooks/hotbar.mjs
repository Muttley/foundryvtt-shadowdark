export const hotbarHooks = {
	attach: () => {
		Hooks.on("hotbarDrop", (bar, data, slot) => {
			shadowdark.utils.createHotbarMacro(data, slot);
			return false;
		  });
	},
};
