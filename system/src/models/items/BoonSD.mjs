import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class BoonSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			boonType: new fields.StringField({
				initial: "oath",
				choices: Object.keys(CONFIG.SHADOWDARK.BOON_TYPES),
			}),
			level: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
