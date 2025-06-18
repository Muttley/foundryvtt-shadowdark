import * as itemfields from "../_fields/itemFields.mjs";
import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class WandSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.magic(),
			magicItem: new fields.BooleanField({initial: true}),
			spellName: new fields.StringField(),
			tier: new fields.NumberField({ integer: true, initial: 1, min: 0 }),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	get isRollable() {
		return true;
	}
}
