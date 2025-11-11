import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class TalentSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			level: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
			talentClass: new fields.StringField({
				initial: "level",
				choices: Object.keys(CONFIG.SHADOWDARK.TALENT_CLASSES),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
