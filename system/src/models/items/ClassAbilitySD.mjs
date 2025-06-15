import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class ClassAbilitySD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			ability: new fields.StringField({
				initial: "",
				choices: CONFIG.SHADOWDARK.ABILITY_KEYS,
				blank: true,
			}),
			group: new fields.StringField(),
			dc: new fields.NumberField({ integer: true, initial: 10, min: 0 }),
			limitedUses: new fields.BooleanField({initial: false}),
			loseOnFailure: new fields.BooleanField({initial: true}),
			lost: new fields.BooleanField({initial: false}),
			uses: new fields.SchemaField({
				available: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
				max: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
