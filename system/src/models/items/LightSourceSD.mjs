import * as itemfields from "../_fields/itemFields.mjs";
import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class LightSourceSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.lightSource(),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	get isPhysical() {
		return true;
	}
}
