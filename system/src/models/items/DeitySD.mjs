import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class DeitySD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			alignment: new fields.StringField({
				initial: "neutral",
				choices: Object.keys(CONFIG.SHADOWDARK.ALIGNMENTS),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
