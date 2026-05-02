import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class WeaponSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			ammoClass: new fields.StringField(),
			baseWeapon: new fields.StringField(),
			damage: new fields.SchemaField({
				oneHanded: new fields.StringField(),
				twoHanded: new fields.StringField(),
			}),
			handedness: new fields.StringField({
				initial: "",
				blank: true,
				choices: ["1h", "2h"],
			}),
			range: new fields.StringField({
				initial: "close",
				choices: Object.keys(CONFIG.SHADOWDARK.RANGES),
			}),
			type: new fields.StringField({
				initial: "melee",
				choices: Object.keys(CONFIG.SHADOWDARK.WEAPON_TYPES),
			}),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	prepareBaseData() {
		super.prepareBaseData();

		// determine default handedness
		if (!this.handedness) {
			const isTwoHanded = this.hasProperty("two-handed")
				|| (this.damage.oneHanded === "" && this.damage.twoHanded !== "");
			this.handedness = isTwoHanded ? "2h" : "1h";
		}
	}

	getDamageFormula(handedness=this.handedness) {
		switch (handedness.slugify()) {
			case "2h":
				return this.damage.twoHanded;
			case "1h":
			default:
				return this.damage.oneHanded;
		}
	}

	get canBeEquipped() {
		return true;
	}

	get isFinesse() {
		return this.hasProperty("finesse");
	}

	get isRollable() {
		return true;
	}

	get isThrown() {
		return this.hasProperty("thrown");
	}

	get isVersatile() {
		return this.hasProperty("versatile");
	}

	get isWeapon() {
		return true;
	}

	get subtext() {
		const range = Handlebars.helpers.fromConfig("RANGES", this.range);
		const properties = this.propertyNames.filter(Boolean).join(", ");
		return [range, this.handedness, properties].filter(Boolean).join(", ");
	}
}
