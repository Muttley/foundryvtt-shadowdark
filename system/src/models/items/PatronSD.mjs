import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class PatronSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			boonTable: new fields.DocumentUUIDField(),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
