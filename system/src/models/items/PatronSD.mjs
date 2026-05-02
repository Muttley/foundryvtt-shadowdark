import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class PatronSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			boonTable: new fields.DocumentUUIDField(),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
