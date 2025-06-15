import * as itemfields from "../_fields/itemFields.mjs";
import {ItemBaseSD} from "./ItemBaseSD.mjs";

const fields = foundry.data.fields;

export default class WeaponSD extends ItemBaseSD {
	static defineSchema() {
		const schema = {
			...itemfields.physical(),
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
			canBeEquipped: new fields.BooleanField({initial: true}),
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
}
