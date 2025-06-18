import * as itemfields from "../_fields/itemFields.mjs";
import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class NpcSpellSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.magic(),
			dc: new fields.NumberField({ integer: true, initial: 10, min: 0 }),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
