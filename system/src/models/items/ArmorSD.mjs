import * as itemfields from "../_fields/itemFields.mjs";
import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class ArmorSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			...itemfields.physical(),
			ac: new fields.SchemaField({
				attribute: new fields.StringField({
					initial: "dex",
					choices: Object.keys(CONFIG.SHADOWDARK.ARMOR_BONUS_ATTRIBUTES),
				}),
				base: new fields.NumberField({ integer: true, initial: 0}),
				modifier: new fields.NumberField({ integer: true, initial: 0}),
			}),
			baseArmor: new fields.StringField(),
			canBeEquipped: new fields.BooleanField({initial: true}),
			properties: new fields.ArrayField(new fields.DocumentUUIDField()),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
