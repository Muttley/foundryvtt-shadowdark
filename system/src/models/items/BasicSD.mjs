import * as itemfields from "../_fields/itemFields.mjs";
import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class BasicSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.lightSource(),
			scroll: new fields.BooleanField({initial: false}),
			treasure: new fields.BooleanField({initial: false}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
