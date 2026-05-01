import * as itemfields from "../_fields/itemFields.mjs";
import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class AncestrySD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.languageChoices(),
			talents: new fields.ArrayField(new fields.DocumentUUIDField()),
			talentChoiceCount: new fields.NumberField({ integer: true, initial: 1, min: 0}),
			nameTable: new fields.DocumentUUIDField(),
			randomWeight: new fields.NumberField({ integer: true, initial: 1, min: 1}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
