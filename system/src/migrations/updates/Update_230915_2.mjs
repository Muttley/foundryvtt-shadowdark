import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_230915_2 extends UpdateBaseSD {

	static version = 230915.2;

	async updateActor(actorData) {
		if (actorData.type !== "Player") return;

		const languages = game.packs.get("shadowdark.languages").index.contents;

		const languageLut = {};
		for (const language of languages) {
			const key = language.name.slugify();
			languageLut[key] = language.uuid;
		}

		const newLanguages = [];

		for (const language of actorData.system.languages ?? []) {
			const languageUuid = languageLut[language] ?? null;

			if (languageUuid) {
				newLanguages.push(languageUuid);
			}
		}

		const updateData = {
			"system.languages": newLanguages,
		};

		return updateData;
	}
}
