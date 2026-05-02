import * as itemfields from "../_fields/itemFields.mjs";
import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class NpcSpecialAttackSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.ranges(),
			attack: new fields.SchemaField({
				num: new fields.NumberField({ integer: true, initial: 1, min: 1 }),
			}),
			bonuses: new fields.SchemaField({
				attackBonus: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
