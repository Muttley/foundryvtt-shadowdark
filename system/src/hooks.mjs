import { LightSourceTrackerHooks } from "./hooks/light-source-tracker.mjs";

export const HooksSD = {
	attach: () => {
		const listeners = [
			LightSourceTrackerHooks,
		];

		for (const listener of listeners) {
			listener.attach();
		}
	},
};
