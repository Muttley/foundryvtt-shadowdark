import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_231216_1 extends UpdateBaseSD {

	static version = 231216.1;

	async updateItem(itemData, actorData) {

		const updateData = {
			"system.source.-=page": null,
		};

		return updateData;
	}
}
