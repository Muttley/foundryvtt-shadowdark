import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class ArmorSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			ac: new fields.SchemaField({
				attribute: new fields.StringField({
					initial: "dex",
					choices: Object.keys(CONFIG.SHADOWDARK.ARMOR_BONUS_ATTRIBUTES),
				}),
				base: new fields.NumberField({ integer: true, initial: 0}),
				modifier: new fields.NumberField({ integer: true, initial: 0}),
			}),
			baseArmor: new fields.StringField(),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	get canBeEquipped() {
		return true;
	}

	get isArmor() {
		return true;
	}

	get isAShield() {
		return this.hasProperty("shield");
	}

}
