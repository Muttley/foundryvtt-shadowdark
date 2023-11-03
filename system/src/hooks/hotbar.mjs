export const hotbarHooks = {
	attach: () => {
		Hooks.on("hotbarDrop", (bar, data, slot) => {
			shadowdark.utils.createHotbarMacro(data, slot);
			// Prevent other hooked events from running by returning false
			return false;
		  });
	},
};
