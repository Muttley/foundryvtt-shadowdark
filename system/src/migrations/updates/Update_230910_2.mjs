import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_230910_2 extends UpdateBaseSD {

	static version = 230910.2;

	async updateItem(itemData, actorData) {
		if (itemData.type !== "NPC Attack") return;

		let actor;
		let item;
		if (actorData) {
			actor = game.actors.get(actorData._id);
			item = actor.items.get(itemData._id);
		}
		else {
			item = game.items.get(itemData._id);
		}

		const updateData = {};

		if (actorData && actorData.type === "NPC") {
			const updates = {
				"system.attack.-=damage": null,
			};

			shadowdark.log(`Migrating ${itemData.name} for NPC ${actorData.name}`);

			await item.update(updates);
		}

		return updateData;
	}
}
