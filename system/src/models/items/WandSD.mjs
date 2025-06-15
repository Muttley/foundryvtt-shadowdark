import * as itemfields from "../_fields/itemFields.mjs";
import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class WandSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			...itemfields.magic(),
			...itemfields.physical(),
			magicItem: new fields.BooleanField({initial: true}),
			spellName: new fields.StringField(),
			tier: new fields.NumberField({ integer: true, initial: 1, min: 0 }),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
