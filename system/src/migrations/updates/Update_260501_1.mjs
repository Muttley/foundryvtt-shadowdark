import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_260501_1 extends UpdateBaseSD {

	static version = 260501.1;

	async updateItem(itemData, actorData) {
		if (!actorData) return;
		if (itemData.type !== "Weapon") return;

		if (itemData.effects.length <= 0) return;

		const updateData = { effects: [] };

		for (const effect of itemData.effects) {
			if (effect.changes.length <= 0) {
				updateData.effects.push(effect);
			}
			else {
				for (const change of effect.changes) {
					if (change.key.endsWith(".this")) {
						effect.transfer = true;
						break;
					}
				}
				updateData.effects.push(effect);
			}
		}

		return updateData;
	}
}
