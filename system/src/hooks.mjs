import { CanvasHooks } from "./hooks/canvas.mjs";
import { ChatMessageHooks } from "./hooks/chat-messages.mjs";
import { DropLightsourceHooks } from "./hooks/drop-lightsource-on-scene.mjs";
import { EffectHooks } from "./hooks/effects.mjs";
import { EffectPanelHooks } from "./hooks/effect-panel.mjs";
import { LightSourceTrackerHooks } from "./hooks/light-source-tracker.mjs";
import { NPCHooks } from "./hooks/npc.mjs";
import { ShadowdarklingImport } from "./hooks/shadowdarkling-import.mjs";
import { hotbarHooks } from "./hooks/hotbar.mjs";

export const HooksSD = {
	attach: () => {
		const listeners = [
			CanvasHooks,
			DropLightsourceHooks,
			EffectHooks,
			LightSourceTrackerHooks,
			NPCHooks,
			hotbarHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};

export const HooksImmediate = {
	attach: () => {
		const listeners = [
			ChatMessageHooks,
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
