import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Updated_230419_1 extends UpdateBaseSD {

	static version = 240419.1;

	async updateActor(actorData) {
		if (actorData.type === "NPC") return;

		const updateData = {};

		// Effect cleanup: If we can't find the origin, it is outdated and will mess things up.
		updateData.effects = actorData.effects.filter(e =>
			e.origin === null || fromUuidSync(e.origin) !== null
		);

		return updateData;
	}
}
