import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_240910_1 extends UpdateBaseSD {
	static version = 240910.1;

	async updateActor(actorData) {
		if (actorData.type !== "Player") return;
		if (actorData.system.attributes.hp.max !== 0) return;

		const maxHP = actorData.system.attributes.hp.base
			+ actorData.system.attributes.hp.bonus;

		const updateData = {
			"system.attributes.hp.max": maxHP,
		};

		return updateData;
	}
}
