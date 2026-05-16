import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class ArmorSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			ac: new fields.SchemaField({
				attribute: new fields.StringField({
					initial: "dex",
					blank: true,
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

	get subtext() {
		const base = this.ac.base;
		const mod = this.ac.modifier ? Number(this.ac.modifier).signedString() : "";
		const ac = base || mod ? `AC ${base}${mod}` : "";
		const attr = this.ac.attribute.titleCase();
		const properties = this.propertyNames.filter(Boolean).map(p => p.titleCase()).join(", ");
		return [ac, attr, properties].filter(Boolean).join(" • ");
	}

}
