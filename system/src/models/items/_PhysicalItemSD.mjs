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
			identification: new fields.SchemaField({
				identified: new fields.BooleanField({initial: false}),
				identifiedName: new fields.StringField({initial: () => game.i18n.localize("SHADOWDARK.item.magic_item.identifiedName")}),
				identifiedDescription: new fields.StringField({initial: ""}),
				unidentifiedName: new fields.StringField({initial: () => game.i18n.localize("SHADOWDARK.item.magic_item.unidentifiedName")}),
			}),
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

	get hasMultiple() {
		return this.isAmmunition || this.slots.per_slot > 1;
	}

	get isPhysical() {
		return true;
	}

	get isRollable() {
		return false;
	}

	get slotsUsed() {
		const perSlot = this.slots.per_slot;
		const quantity = this.quantity;
		const slotsUsed = this.slots.slots_used;
		return Math.ceil(quantity / perSlot) * slotsUsed;
	}

}
