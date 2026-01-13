import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class AmmunitionSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			baseAmmunition: new fields.StringField(),
			isAmmunition: new fields.BooleanField({initial: true}),
			quantity: new fields.NumberField({ integer: true, initial: 20, min: 0}),
			slots: new fields.SchemaField({
				free_carry: new fields.NumberField({ integer: true, initial: 0}),
				per_slot: new fields.NumberField({ integer: true, initial: 20}),
				slots_used: new fields.NumberField({ integer: true, initial: 1}),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
