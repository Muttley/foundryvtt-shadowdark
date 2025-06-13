import * as itemfields from "../_fields/itemFields.mjs";
import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class NpcAttackSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			...itemfields.ranges(),
			attack: new fields.SchemaField({
				num: new fields.NumberField({ integer: true, initial: 1, min: 1 }),
			}),
			bonuses: new fields.SchemaField({
				attackBonus: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
				critical: new fields.SchemaField({
					failureThreshold: new fields.NumberField({ integer: true, initial: 1}),
					multiplier: new fields.NumberField({ integer: true, initial: 2}),
					successThreshold: new fields.NumberField({ integer: true, initial: 20}),
				}),
				damageBonus: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
			}),
			damage: new fields.SchemaField({
				numDice: new fields.NumberField({ integer: true, initial: 1, min: 1 }),
				special: new fields.StringField(),
				value: new fields.StringField(),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
