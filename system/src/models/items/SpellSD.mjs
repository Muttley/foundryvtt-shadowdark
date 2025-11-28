import * as itemfields from "../_fields/itemFields.mjs";
import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class SpellSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.magic(),
			tier: new fields.NumberField({ integer: true, initial: 1, min: 0 }),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	get isRollable() {
		return true;
	}

	get isSpell() {
		return true;
	}
}
