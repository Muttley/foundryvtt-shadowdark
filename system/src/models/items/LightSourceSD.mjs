import * as itemfields from "../_fields/itemFields.mjs";
import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class LightSourceSD extends PhysicalItemSD {
	static defineSchema() {
		const lightData = foundry.data.LightData.defineSchema();

		const schema = {
			...itemfields.lightSource(),
			lightData: new fields.SchemaField({
				...lightData,
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	get isPhysical() {
		return true;
	}
}
