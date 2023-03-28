import {UpdateBaseSD} from "../UpdateBaseSD.mjs";

export default class Update_230328_1 extends UpdateBaseSD {

	static version = 230328.1;

	async updateSettings() {
		game.settings.set("shadowdark", "pauseLightTrackingWithGame",
			shadowdark.defaults.LIGHT_TRACKER_UPDATE_INTERVAL_SECS
		);
	}
}
