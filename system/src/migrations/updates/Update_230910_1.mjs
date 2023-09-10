import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_230910_1 extends UpdateBaseSD {

	static version = 230910.1;

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
			const attackBonus = item?.system?.attack?.bonus ?? null;
			const damageBonus = item?.system?.damage?.bonus ?? null;

			if (Number.isInteger(attackBonus) && Number.isInteger(damageBonus)) {
				// For NPCs we can modify the attacks directly as they don't use
				// effects
				//
				const updates = {
					"system.bonuses.attackBonus": attackBonus,
					"system.bonuses.damageBonus": damageBonus,
					"system.damage.-=bonus": null,
					"system.attack.-=bonus": null,
				};

				shadowdark.log(`Migrating ${itemData.name} for NPC ${actorData.name}`);

				await item.update(updates);
			}
		}

		return updateData;
	}
}
