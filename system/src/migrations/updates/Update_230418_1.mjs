import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Updated_230418_1 extends UpdateBaseSD {

	static version = 230418.1;

	async updateActor(actorData) {
		if (actorData.type === "NPC") return;

		const updateData = {};

		const rangedDamageBonus = actorData.system.bonuses.rangeDamageBonus;

		updateData["system.bonuses.rangedDamageBonus"] = rangedDamageBonus;
		updateData["system.bonuses.-=rangeDamageBonus"] = null;

		return updateData;
	}

	async updateItem(itemData, actorData) {
		if (!["Weapon", "NPC Attack", "Spell", "Talent"].includes(itemData.type)) return;

		let actor;
		let item;
		if (actorData) {
			actor = game.actors.get(actorData._id);
			item = actor.items.get(itemData._id);
		}
		else {
			item = game.items.get(itemData._id);
		}

		// Nothing to do if no bonuses or critMultiplier is here
		if (
			itemData.type === "Weapon"
			&& (
				!item?.system.bonuses.attackBonus
				&& !item?.system.damage.bonus
				&& !item?.system.damage.critMultiplier
			)
		) return;

		const updateData = {};

		if (actorData && actorData.type === "Player" && item.type === "Weapon") {
			// We can't modify the active effects of an item already owned by the
			// actor, so we modify the item and import it again.
			//
			const itemName = item.name;

			shadowdark.log(`Replacing out of date Weapon ('${itemName}') belonging to Actor ('${actorData.name}')`);

			await actor.deleteEmbeddedDocuments("Item", [item._id]);

			item.system.bonuses.attackBonus = item.system.attackBonus;
			item.system.bonuses.damageBonus = item.system.damage.bonus;
			item.system.bonuses.critical.multiplier = item.system.damage.critMultiplier;

			await actor.createEmbeddedDocuments("Item", [item]);
		}
		else if (actorData && actorData.type === "Player" && item.type === "Spell") {
			// Replace spells with new versions
			const itemName = item.name;

			shadowdark.log(`Replacing out of date Spell ('${itemName}') belonging to Actor ('${actorData.name}')`);

			const spellsPack = game.packs.get("shadowdark.spells");
			const spellId = spellsPack.index.find(i => i.name === itemName)._id;
			const spell = await spellsPack.getDocument(spellId);

			if (spell) await actor.deleteEmbeddedDocuments("Item", [item._id]);

			await actor.createEmbeddedDocuments("Item", [spell]);
		}
		else if (actorData && actorData.type === "Player" && item.type === "Talent") {
			// Replace talent with new versions
			// ... with special cases for pregens / misspelled talents
			let itemName;
			switch (item.name) {
				case "Learn Spell (Mage Armor)": {
					itemName = "Learn Spell";
					break;
				}
				case "Magic Missle Advantage": {
					itemName = "Magic Missile Advantage";
					break;
				}
				case "+1 to Spellcasting Checks": {
					itemName = "+1 on Spellcasting Checks";
					break;
				}
				default: {
					itemName = item.name;
				}
			}

			// Special handling of all the weapon & armor mastery talents
			let masteryItemRe = /\((.*)\)/;
			let masteryItem = "";
			if (item.name.includes("Mastery")) {
				itemName = item.name.split(" (")[0];
				masteryItem = item.name.match(masteryItemRe)[1];
			}

			shadowdark.log(`Replacing out of date Talent ('${item.name}') belonging to Actor ('${actorData.name}')`);

			const talentsPack = game.packs.get("shadowdark.talents");
			const talentId = talentsPack.index.find(i => i.name === itemName)?._id;
			let talent = await talentsPack.getDocument(talentId);

			// Modify the type for the mastery items
			if (masteryItem) {
				talent = talent.toObject();
				talent.effects[0].changes[0].value = masteryItem.slugify();
				talent.name += ` (${masteryItem})`;
			}

			if (talent) {
				// Delete associated effects
				await actor.effects
					.filter(e => e.origin.includes(item._id))
					.forEach(async e => {
						shadowdark.log(`Deleting Effect ('${e.label}') from Actor ('${actor.name}') associated with Item ('${item.name}')`);
						await e.delete();
					});
				await actor.deleteEmbeddedDocuments("Item", [item._id]);
				await actor.createEmbeddedDocuments("Item", [talent]);
			}
			else {
				ui.notifications.warn(
					`Failed to replace out of date Talent ('${itemName}) on Actor ('${actorData.name}'). Couldn't find appropriate talent in compendium`,
					{ permanent: true }
				);
			}
		}
		else if (actorData && actorData.type === "NPC") {
			// For NPCs we can modify the attacks directly as they don't use effects
			//
			const updates = {
				"system.bonuses.attackBonus": item.system.attack.bonus,
				"system.bonuses.damageBonus": item.system.damage.bonus,
				"system.damage.-=bonus": null,
				"system.attack.-=bonus": null,
			};

			shadowdark.log(`Migrating ${itemData.name} for NPC ${actorData.name}`);

			await item.update(updates);
		}
		else {
			// If the weapon isn't owned, we can just go ahead and update the effect
			//
			item.effects?.forEach(async e => {
				const changes = [];

				e.changes?.forEach(c => {
					const key = c.key;

					if (key === "system.attackBonus") c.key = "system.bonuses.attackBonus";
					else if (key === "system.damage.bonus") c.key = "system.bonuses.damageBonus";
					else if (key === "system.damage.critMultiplier") c.key = "system.bonuses.critical.multiplier";

					changes.push(c);
				});

				await e.update({changes});
			});
		}

		return updateData;
	}
}
