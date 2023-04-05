import { ChatMessageHooks } from "./hooks/chat-messages.mjs";
import { LightSourceTrackerHooks } from "./hooks/light-source-tracker.mjs";
import { NPCHooks } from "./hooks/npc.mjs";
import { ShadowdarklingImport } from "./hooks/shadowdarkling-import.mjs";

export const HooksSD = {
	attach: () => {
		const listeners = [
			ChatMessageHooks,
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
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};
