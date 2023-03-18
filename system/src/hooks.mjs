import { LightSourceTrackerHooks } from "./hooks/light-source-tracker.mjs";
import { ChatMessageHooks } from "./hooks/chat-messages.mjs";

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
