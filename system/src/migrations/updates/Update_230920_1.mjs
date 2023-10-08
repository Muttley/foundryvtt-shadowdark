import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

// Migrates a character actor's Class from a free text field to a uuid
// compendium link
//
// Attempts to match any current value to a uuid compendium link if there is
// a match on the slugified names

export default class Update_230920_1 extends UpdateBaseSD {
	static version = 230920.1;

	async updateActor(actorData) {
		if (actorData.type !== "Player") return;

		const updateData = {
			"system.class": "",
			"system.-=spellcastingAbility": null,
		};

		const currentValue = actorData.system?.class ?? "";

		if (currentValue !== "") {
			const itemLut = {};
			(await shadowdark.compendiums.classes()).forEach(
				item => itemLut[item.name.slugify()] = item.uuid
			);

			const matchingItem = itemLut[currentValue.slugify()];

			if (matchingItem) {
				updateData["system.class"] = matchingItem;
			}
			else {
				ui.notifications.warn(
					game.i18n.format(
						"Class '{currentValue}' for Character '{name}' does not exist in a compendium; you will need to create this Item and update the Character manually.",
						{
							itemName: currentValue,
							name: actorData.name,
						}
					),
					{permanent: true}
				);
			}
		}

		return updateData;
	}

	async updateItem(itemData, actorData) {
		if (itemData.type !== "Spell") return;

		const updateData = {
			"system.class": [],
		};

		const currentValues = itemData.system?.class ?? [];

		if (currentValues.length > 0) {
			const itemLut = {};
			(await shadowdark.compendiums.spellcastingClasses()).forEach(
				item => itemLut[item.name.slugify()] = item.uuid
			);

			for (const value of currentValues) {
				const matchingItem = itemLut[value.slugify()];

				if (matchingItem) {
					updateData["system.class"].push(matchingItem);
				}
			}

		}

		return updateData;
	}
}
