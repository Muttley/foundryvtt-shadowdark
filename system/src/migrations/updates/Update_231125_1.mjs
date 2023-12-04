import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_231125_1 extends UpdateBaseSD {

	static version = 231125.1;

	async updateItem(itemData, actorData) {
		const itemTypes = [
			"NPC Attack",
			"NPC Special Attack",
		];

		if (!itemTypes.includes(itemData.type)) return;

		const updateData = {
			"system.attack.num": `${itemData.system.attack.num}`,
		};

		return updateData;
	}
}
