// Hooks used for the Effect Panel

export const EffectPanelHooks = {
	attach: () => {
		Hooks.on("collapseSidebar", () => {
			game.shadowdark.effectPanel.updateFromRightPx();
		});

		Hooks.on("rtcSettingsChanged", () => {
			game.shadowdark.effectPanel.updateFromRightPx();
		});

		// Render the panel when the canvas is ready
		Hooks.on("canvasReady", () => {
			game.shadowdark.effectPanel.render(true);
		});

		Hooks.on("updateWorldTime", (total, diff) => {
			game.shadowdark.effectPanel.refresh();
			game.shadowdark.effectPanel.deleteExpiredEffects();
		});

		Hooks.on("createActiveEffect", (activeEffect, config, userId) => {
			game.shadowdark.effectPanel.refresh();
		});

		Hooks.on("updateActiveEffect", (activeEffect, config, userId) => {
			game.shadowdark.effectPanel.refresh();
		});

		Hooks.on("deleteActiveEffect", (activeEffect, config, userId) => {
			game.shadowdark.effectPanel.refresh();
		});
	},
};
