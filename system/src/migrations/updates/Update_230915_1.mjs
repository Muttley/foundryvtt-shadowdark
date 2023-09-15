import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_230915_1 extends UpdateBaseSD {

	static version = 230915.1;

	async updateItem(itemData, actorData) {
		if (["Armor", "Weapon"].includes(itemData.type)) return;

		return {"system.-=properties": null};
	}
}
