import * as itemfields from "../_fields/itemFields.mjs";
import {ItemBaseSD} from "./ItemBaseSD.mjs";

export default class GemSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			...itemfields.physical(),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
