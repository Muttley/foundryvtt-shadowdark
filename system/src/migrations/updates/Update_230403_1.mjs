import {UpdateBaseSD} from "../UpdateBaseSD.mjs";

export default class Update_230403_1 extends UpdateBaseSD {

	static version = 230403.1;

	async updateActor(actorData) {
		if (actorData.type === "NPC") return;

		const updateData = {};

		const actor = game.actors.get(actorData._id);

		const bonuses = {};

		const abilityKeys = CONFIG.SHADOWDARK.ABILITY_KEYS;
		abilityKeys.forEach(ability => bonuses[ability] = 0);

		console.log(bonuses);

		const items = actor.items;
		for (const item of items) {
			if (item.type === "Talent") {
				if (item.hasProperty("abilityImprovement")) {
					abilityKeys.forEach(ability => {
						bonuses[ability] +=
							Number(item.system.abilities[ability].value || 0);
					});
				}
			}
		}

		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			const value = actorData.system.abilities[ability].value;

			updateData[`system.abilities.${ability}.-=value`] = null;
			updateData[`system.abilities.${ability}.base`] = value - bonuses[ability];
		}
		// Delete `flags` from system.
		// updateData["system.-=flags"] = null;

		return updateData;
	}

	async updateItem(itemData, actorData) {
		if (itemData.type !== "Talent") return;

		const updateData = {};

		let item;
		if (actorData) {
			const actor = game.actors.get(actorData._id);
			item = actor.items.get(itemData._id);
		}
		else {
			item = game.items.get(itemData._id);
		}

		if (item?.hasProperty("abilityImprovement")) {
			for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
				const value = Number(itemData.system.abilities[ability].value || 0);
				updateData[`system.abilities.${ability}.-=value`] = null;
				updateData[`system.abilities.${ability}.bonus`] = value;
			}
		}

		return updateData;
	}
}
