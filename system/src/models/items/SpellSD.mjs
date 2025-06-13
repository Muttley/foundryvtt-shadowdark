import * as itemfields from "../_fields/itemFields.mjs";
import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class SpellSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			...itemfields.magic(),
			tier: new fields.NumberField({ integer: true, initial: 1, min: 0 }),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
