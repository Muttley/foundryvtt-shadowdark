import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_231025_1 extends UpdateBaseSD {

	static version = 231025.1;

	async updateItem(itemData, actorData) {
		const requiredTypes = ["Scroll", "Wand"];

		const updateData = {};

		if (requiredTypes.includes(itemData.type)) {

			const spellcasterClass = itemData.system.class;
			if (typeof spellcasterClass === "string") {
				const itemLut = {};
				(await shadowdark.compendiums.spellcastingClasses()).forEach(
					item => itemLut[item.name.slugify()] = item.uuid
				);

				updateData["system.class"] = [];

				const newClassUuid = itemLut[spellcasterClass.slugify()];

				if (newClassUuid) {
					updateData["system.class"].push(newClassUuid);
				}
			}
		}

		return updateData;
	}
}
