import {UpdateBaseSD} from "../UpdateBaseSD.mjs";

export default class Update_230325_1 extends UpdateBaseSD {

	static version = 230325.1;

	async updateActor(actorData) {
		const updateData = {};

		const hp = actorData.system.attributes.hp;

		if ( hp && !hp.base ) {
			const max = foundry.utils.getProperty(
				actorData, "system.attributes.hp.max"
			);

			const bonus = foundry.utils.getProperty(
				actorData, "system.attributes.hp.bonus"
			);

			updateData["system.attributes.hp.base"] = max;
			updateData["system.attributes.hp.max"] = max + bonus;
		}

		return updateData;
	}
}
