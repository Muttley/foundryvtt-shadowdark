import {UpdateBaseSD} from "../UpdateBaseSD.mjs";

export default class Update_230329_1 extends UpdateBaseSD {

	static version = 230329.1;

	async updateActor(actorData) {
		const updateData = {};

		// Delete `flags` from system.
		updateData["system.-=flags"] = null;

		return updateData;
	}
}
