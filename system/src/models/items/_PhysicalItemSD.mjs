import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export class PhysicalItemSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			broken: new fields.BooleanField({initial: false}),
			cost: new fields.SchemaField({
				cp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				gp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				sp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
			}),
			equipped: new fields.BooleanField({initial: false}),
			isAmmunition: new fields.BooleanField({initial: false}),
			magicItem: new fields.BooleanField({initial: false}),
			quantity: new fields.NumberField({ integer: true, initial: 1, min: 0}),
			slots: new fields.SchemaField({
				free_carry: new fields.NumberField({ integer: true, initial: 0}),
				per_slot: new fields.NumberField({ integer: true, initial: 1}),
				slots_used: new fields.NumberField({ integer: true, initial: 1}),
			}),
			stashed: new fields.BooleanField({initial: false}),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	get canBeEquipped() {
		return false;
	}

	get isPhysical() {
		return true;
	}

	get isRollable() {
		return false;
	}

}
