import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Updated_230419_1 extends UpdateBaseSD {

	static version = 230419.1;

	async updateActor(actorData) {
		if (actorData.type === "NPC") {
			// Fix typo in config
			if (actorData.system.move === "doulbeNear") return {"system.move": "doubleNear"};
			return {};
		}
		else {
			const updateData = {};

			// Effect cleanup: If we can't find the origin, it is outdated and will mess things up.
			updateData.effects = actorData.effects.filter(e =>
				e.origin === null || fromUuidSync(e.origin) !== null
			);

			return updateData;
		}
	}
}
