import * as itemfields from "../_fields/itemFields.mjs";
import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class NpcSpellSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			...itemfields.magic(),
			dc: new fields.NumberField({ integer: true, initial: 10, min: 0 }),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
