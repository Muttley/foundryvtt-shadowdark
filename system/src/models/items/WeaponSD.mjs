import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class WeaponSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			ammoClass: new fields.StringField(),
			baseWeapon: new fields.StringField(),
			bonuses: new fields.SchemaField({
				attackBonus: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
				critical: new fields.SchemaField({
					failureThreshold: new fields.NumberField({ integer: true, initial: 1}),
					multiplier: new fields.NumberField({ integer: true, initial: 2}),
					successThreshold: new fields.NumberField({ integer: true, initial: 20}),
				}),
				damageBonus: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
				damageMultiplier: new fields.NumberField({ initial: 1, min: 1 }),
			}),
			damage: new fields.SchemaField({
				numDice: new fields.NumberField({ integer: true, initial: 1, min: 1 }),
				oneHanded: new fields.StringField(),
				twoHanded: new fields.StringField(),
			}),
			properties: new fields.ArrayField(new fields.DocumentUUIDField()),
			range: new fields.StringField({
				initial: "close",
				choices: Object.keys(CONFIG.SHADOWDARK.RANGES),
			}),
			type: new fields.StringField({
				initial: "melee",
				choices: Object.keys(CONFIG.SHADOWDARK.WEAPON_TYPES),
			}),
			weaponMastery: new fields.BooleanField({initial: false}),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	getDamageFormula(handedness) {
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

	get isTwoHanded() {
		return this.hasProperty("two-handed")
			|| (this.damage.oneHanded === "" && this.damage.twoHanded !== "");
	}

	get isVersatile() {
		return this.hasProperty("versatile");
	}

	get isWeapon() {
		return true;
	}
}
