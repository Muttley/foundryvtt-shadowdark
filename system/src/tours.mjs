import { ShadowdarkLightsourceTrackerTour } from "./tours/ShadowdarkTourLightsourceTracker.mjs";
import { ShadowdarkPlayerRollingTour } from "./tours/ShadowdarkTourPlayerRolling.mjs";

export const ToursSD = {
	register: () => {
		const tours = {
			"shadowdark-lightsource-tracker-tour": new ShadowdarkLightsourceTrackerTour(),
			"shadowdark-player-rolls-tour": new ShadowdarkPlayerRollingTour(),
		};

		for (const [label, tour] of Object.entries(tours)) {
			game.tours.register(
				"shadowdark",
				label,
				tour
			);
		}
	},
};
