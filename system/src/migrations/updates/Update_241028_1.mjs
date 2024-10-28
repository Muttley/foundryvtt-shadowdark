import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_241028_1 extends UpdateBaseSD {
	static version = 241028.1;

	async updateActor(actorData) {
		if (actorData.type !== "Player") return;

		let deity = actorData.system.deity;

		if (deity.startsWith("Compendium.shadowdark.deities.Item.")) {
			deity = deity.replace(
				"Compendium.shadowdark.deities.Item.",
				"Compendium.shadowdark.patrons-and-deities.Item."
			);
		}

		// Hasn't changed, skip update
		if (deity === actorData.system.deity) return;

		const updateData = {
			"system.deity": deity,
		};

		return updateData;
	}
}
