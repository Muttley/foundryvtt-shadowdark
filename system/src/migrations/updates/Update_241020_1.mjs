import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_241020_1 extends UpdateBaseSD {

	static version = 241020.1;

	async updateItem(itemData, actorData) {
		if (itemData.type !== "Class") return;

		if (itemData.system?.spellcasting?.class !== "NONE") return;

		const updateData = {
			"system.spellcasting.class": "__not_spellcaster__",
		};

		return updateData;
	}
}
