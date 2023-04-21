import {UpdateBaseSD} from "../UpdateBaseSD.mjs";

export default class Update_230417_2 extends UpdateBaseSD {

	static version = 230417.2;

	async updateItem(itemData, actorData) {
		if (itemData.type !== "Basic") return;
		if (actorData.type === "NPC") return;

		const updateData = {
			"system.-=scroll": null,
		};

		if (itemData.system.scroll && actorData) {
			const spellUuid = itemData.system.description.substring(
				itemData.system.description.indexOf("[") + 1,
				itemData.system.description.lastIndexOf("]")
			);

			const spell = await fromUuid(spellUuid);

			const scrollName = game.i18n.format(
				"SHADOWDARK.item.name_from_spell.Scroll",
				{spellName: spell.name}
			);

			const scroll = {
				type: "Scroll",
				img: "icons/sundries/scrolls/scroll-runed-brown-purple.webp",
				name: scrollName,
				system: spell.system,
			};

			delete scroll.system.lost;
			scroll.system.magicItem = true;


			const actor = game.actors.get(actorData._id);
			actor.createEmbeddedDocuments("Item", [scroll]);

			actor.deleteEmbeddedDocuments("Item", [itemData._id]);

			return {}; // Deleted, so no update required
		}

		return updateData;
	}
}
