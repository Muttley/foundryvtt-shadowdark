import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_260430_1 extends UpdateBaseSD {

	static version = 260430.1;

	async updateItem(itemData, actorData) {
		if (!actorData) return;
		if (actorData.type !== "Player") return;
		if (itemData.type !== "Talent") return;

		let actor = undefined;
		if (actorData.uuid) {
			actor = await fromUuid(actorData.uuid);
		}
		else {
			actor = game.actors.find(a => a._id === actorData._id);
		}

		if (!actor) shadowdark.error(`Unable to locate Actor named "${actorData.name}"`);

		const compendiumVersion = await shadowdark.compendiums.findTalent(
			itemData.name, itemData.system.talentClass
		);

		if (!compendiumVersion) shadowdark.warn(`Unable to locate "${itemData.system.talentClass}" Talent named "${itemData.name}" owned by "${actor.name}"`);

		if (actor && compendiumVersion) {
			shadowdark.log(`Replacing "${itemData.system.talentClass}" talent "${itemData.name}" owned by "${actor.name}" with newer compendium version`);

			const talent = await fromUuid(compendiumVersion.uuid);

			const talentData = talent.toObject();
			talentData.system.level = itemData.system.level;

			await actor.deleteEmbeddedDocuments("Item", [itemData._id]);
			await actor.createEmbeddedDocuments("Item", [talentData]);
		}
	}
}
