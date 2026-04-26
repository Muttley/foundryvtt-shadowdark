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
			identification: new fields.SchemaField({
				description: new fields.StringField({initial: ""}),
				identified: new fields.BooleanField({initial: true}),
				name: new fields.StringField({initial: ""}),
			}),
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

	get isIdentified() {
		return this.identification.identified;
	}

	/**
	 * Toggles the identified state of this item. When identified, swaps the item
	 * name and description with the ones stored in identified.
	 * When unidentified, disables all Active Effects.
	 * @returns {Promise<boolean>} The new identified state.
	 */
	async toggleIdentified() {
		const newState = !this.isIdentified;

		// If it's blank give a default type-specific value to make things
		// easier for GMs making things undentified on the fly
		//
		const newName = this.identification.name !== ""
			? this.identification.name
			: game.i18n.format("SHADOWDARK.item.magic_item.unidentifiedName", {type: this.parent.type});

		const updateData = {
			name: newName,
			system: {
				description: this.identification.description,
				identification: {
					identified: newState,
					name: this.parent.name,
					description: this.description,
				},
			},
		};

		await this.parent.update(updateData);

		// update effects
		await Promise.all(
			this.parent.effects.map(e =>
				e.update({disabled: !newState})
			)
		);

		return newState;
	}

}
