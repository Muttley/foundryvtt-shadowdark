import * as itemfields from "../_fields/itemFields.mjs";
import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class BasicSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			...itemfields.lightSource(),
			...itemfields.physical(),
			scroll: new fields.BooleanField({initial: false}),
			treasure: new fields.BooleanField({initial: false}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
