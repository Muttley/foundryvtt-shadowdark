import { CanvasHooks } from "./hooks/canvas.mjs";
import { CombatHooks } from "./hooks/combat.mjs";
import { DropLightsourceHooks } from "./hooks/drop-lightsource-on-scene.mjs";
import { EffectHooks } from "./hooks/effects.mjs";
import { EffectPanelHooks } from "./hooks/effect-panel.mjs";
import { LightSourceTrackerHooks } from "./hooks/light-source-tracker.mjs";
import { NPCHooks } from "./hooks/npc.mjs";
import { TargetingHooks } from "./hooks/targeting.mjs";
import { SDAppsButtons } from "./hooks/sd-apps-buttons.mjs";
import { hotbarHooks } from "./hooks/hotbar.mjs";

export const HooksSD = {
	attach: () => {
		const listeners = [
			CanvasHooks,
			CombatHooks,
			DropLightsourceHooks,
			EffectHooks,
			LightSourceTrackerHooks,
			NPCHooks,
			TargetingHooks,
			hotbarHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};

export const HooksInitSD = {
	attach: () => {
		const listeners = [
			SDAppsButtons,
			EffectPanelHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};
