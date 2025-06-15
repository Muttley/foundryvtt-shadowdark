import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class LanguageSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			rarity: new fields.StringField({
				initial: "common",
				choices: Object.keys(CONFIG.SHADOWDARK.LANGUAGE_RARITY),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
