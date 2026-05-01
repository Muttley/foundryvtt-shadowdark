import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class PropertySD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			itemType: new fields.StringField({
				initial: "armor",
				choices: Object.keys(CONFIG.SHADOWDARK.PROPERTY_TYPES),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
