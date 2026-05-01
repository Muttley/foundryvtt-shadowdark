import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_260427_1 extends UpdateBaseSD {

	static version = 260427.1;

	async updateItem(itemData, actorData) {
		if (!actorData) return;
		if (actorData.type !== "Player") return;
		if (itemData.type !== "Spell") return;

		let actor = undefined;
		if (actorData.uuid) {
			actor = await fromUuid(actorData.uuid);
		}
		else {
			actor = game.actors.find(a => a._id === actorData._id);
		}

		if (!actor) shadowdark.error(`Unable to locate Actor named "${actorData.name}"`);

		const compendiumVersion = await shadowdark.compendiums.findSpell(
			itemData.name, (itemData.system?.class ?? [])
		);

		if (!compendiumVersion) shadowdark.error(`Unable to locate Spell named "${itemData.name}" owned by "${actor.name}"`);

		if (actor && compendiumVersion) {
			shadowdark.log(`Replacing spell "${itemData.name}" owned by "${actor.name}" with newer compendium version`);

			const spell = await fromUuid(compendiumVersion.uuid);

			const spellData = spell.toObject();

			await actor.deleteEmbeddedDocuments("Item", [itemData._id]);
			await actor.createEmbeddedDocuments("Item", [spellData]);
		}
	}
}
