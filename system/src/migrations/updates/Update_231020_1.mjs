import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

// Migrates a character actor's Ancesty from a free text field to a uuid
// compendium link
//
// Attempts to match any current value to a uuid compendium link if there is
// a match on the slugified names

export default class Update_231020_1 extends UpdateBaseSD {
	static version = 231020.1;

	async updateActor(actorData) {
		if (actorData.type !== "Player") return;

		const updateData = {
			"system.luck.available": actorData.system.luck,
			"system.luck.remaining": actorData.system.luck ? 1 : 0,
		};

		return updateData;
	}
}
