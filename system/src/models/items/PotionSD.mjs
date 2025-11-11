import * as itemfields from "../_fields/itemFields.mjs";
import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class PotionSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.magic(),
			magicItem: new fields.BooleanField({initial: true}),
			spellName: new fields.StringField(),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
