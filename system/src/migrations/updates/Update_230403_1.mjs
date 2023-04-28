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

			if (value) {
				updateData[`system.abilities.${ability}.-=value`] = null;
				updateData[`system.abilities.${ability}.base`] = value - bonuses[ability];
			}
		}

		return updateData;
	}

	async updateItem(itemData, actorData) {
		if (itemData.type !== "Talent") return;

		let actor;
		let item;
		if (actorData) {
			actor = game.actors.get(actorData._id);
			item = actor.items.get(itemData._id);
		}
		else {
			item = game.items.get(itemData._id);
		}

		// Nothing to do if its not an ability improvement
		if (!item?.hasProperty("abilityImprovement")) return;

		const updateData = {};

		if (actorData) {
			// We can't update the settings of active effects attached to an
			// Actor, so we have to delete the existing Talent item and replace
			// it with an already updated one from the system compendiums
			//
			const itemName = item.name;

			shadowdark.log(`Replacing out of date Talent '${itemName}' belonging to Actor '${actorData.name}`);

			await actor.deleteEmbeddedDocuments("Item", [item._id]);

			const talentsPack = game.packs.get("shadowdark.talents");
			const talentId = talentsPack.index.find(i => i.name === itemName)._id;
			const talent = await talentsPack.getDocument(talentId);
			await actor.createEmbeddedDocuments("Item", [talent]);
		}
		else {
			// We can just upgrade the active effect settings for items not
			// attached to an actor
			//
			for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
				const value = itemData.system.abilities[ability].value;
				if (value) {
					updateData[`system.abilities.${ability}.-=value`] = null;
					updateData[`system.abilities.${ability}.bonus`] = Number(value);
				}
			}

			const effect = item.effects.find(e => e.label === "abilityImprovement");

			const re = /(system.abilities.[a-z]{3}).value/;

			const changes = [];
			for (const change of effect.changes) {
				const key = change.key;
				const match = key.match(re);

				if (match) {
					change.key = `${match[1]}.bonus`;
					change.value = change.value === "" ? "0" : change.value;
				}

				changes.push(change);
			}

			await effect.update({changes});

		}

		return updateData;
	}
}
