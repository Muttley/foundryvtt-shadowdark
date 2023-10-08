import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

// Migrates a character actor's Ancesty from a free text field to a uuid
// compendium link
//
// Attempts to match any current value to a uuid compendium link if there is
// a match on the slugified names

export default class Update_230923_2 extends UpdateBaseSD {
	static version = 230923.2;

	async updateActor(actorData) {
		if (actorData.type !== "Player") return;

		const updateData = {
			"system.deity": "",
		};

		const currentValue = actorData.system?.deity ?? "";

		if (currentValue !== "") {
			const itemLut = {};
			(await shadowdark.compendiums.deities()).forEach(
				item => itemLut[item.name.slugify()] = item.uuid
			);

			const matchingItem = itemLut[currentValue.slugify()];

			if (matchingItem) {
				updateData["system.deity"] = matchingItem;
			}
			else {
				ui.notifications.warn(
					game.i18n.format(
						"Deity '{itemName}' for Character '{name}' does not exist in a compendium; you will need to create this Item and update the Character manually.",
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
}
