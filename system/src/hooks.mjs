import { LightSourceTrackerHooks } from "./hooks/light-source-tracker.mjs";
import { ChatMessageHooks } from "./hooks/chat-messages.mjs";
import { ShadowdarklingImport } from "./hooks/shadowdarkling-import.mjs";

export const HooksSD = {
	attach: () => {
		const listeners = [
			ChatMessageHooks,
			LightSourceTrackerHooks,
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
