import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_230911_1 extends UpdateBaseSD {

	static version = 230911.1;

	async updateItem(itemData, actorData) {
		const requiredTypes = [
			"Effect",
			"NPC Attack",
			"NPC Feature",
			"Spell",
			"Talent",
		];

		if (!requiredTypes.includes(itemData.type)) return;

		const updateData = {
			"system.-=magicItem": null,
		};

		return updateData;
	}
}
