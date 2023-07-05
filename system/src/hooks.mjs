import { CanvasHooks } from "./hooks/canvas.mjs";
import { DropLightsourceHooks } from "./hooks/drop-lightsource-on-scene.mjs";
import { EffectHooks } from "./hooks/effects.mjs";
import { EffectPanelHooks } from "./hooks/effect-panel.mjs";
import { ForeignDocumentHooks } from "./hooks/ForeignDocumentHooks.mjs";
import { LightSourceTrackerHooks } from "./hooks/light-source-tracker.mjs";
import { NPCHooks } from "./hooks/npc.mjs";
import { ShadowdarklingImport } from "./hooks/shadowdarkling-import.mjs";

export const HooksSD = {
	attach: () => {
		const listeners = [
			CanvasHooks,
			DropLightsourceHooks,
			EffectHooks,
			ForeignDocumentHooks,
			LightSourceTrackerHooks,
			NPCHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};

export const HooksInitSD = {
	attach: () => {
		const listeners = [
			ShadowdarklingImport,
			EffectPanelHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};
