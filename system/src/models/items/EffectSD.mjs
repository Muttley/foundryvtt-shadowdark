import * as itemfields from "../_fields/itemFields.mjs";
import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class EffectSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			duration: new fields.SchemaField({
				type: new fields.StringField({
					initial: "rounds",
					choices: Object.keys(CONFIG.SHADOWDARK.EFFECT_DURATIONS),
				}),
				value: new fields.NumberField({ integer: true, initial: 1}),
			}),
			...itemfields.lightSource(),
			category: new fields.StringField({
				initial: "effect",
				choices: Object.keys(CONFIG.SHADOWDARK.EFFECT_CATEGORIES),
			}),
			effectPanel: new fields.SchemaField({
				show: new fields.BooleanField({initial: true}),
			}),
			start: new fields.SchemaField({
				combatTime: new fields.NumberField(),
				value: new fields.NumberField({initial: 0}),
			}),
			tokenIcon: new fields.SchemaField({
				show: new fields.BooleanField({initial: true}),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
