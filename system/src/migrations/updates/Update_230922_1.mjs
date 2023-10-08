import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_230922_1 extends UpdateBaseSD {
	static version = 230922.1;

	async updateActor(actorData) {
		if (actorData.type !== "Player") return;

		return {"system.-=title": null};
	}
}
