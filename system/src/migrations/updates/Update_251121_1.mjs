import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_241028_1 extends UpdateBaseSD {
	static version = 251121.1;

	async updateItem(itemData, actorData) {
		if (itemData.type !== "Basic") return;

		if (!itemData.name.startsWith("Potion of ", 0)) return;

		const updateData = {
			type: "Potion",
		};

		return updateData;
	}


}
