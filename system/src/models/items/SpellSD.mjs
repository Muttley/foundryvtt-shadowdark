import * as itemfields from "../_fields/itemFields.mjs";
import { BaseItemSD } from "./_BaseItemSD.mjs";

const fields = foundry.data.fields;

export default class SpellSD extends BaseItemSD {
	static defineSchema() {
		const schema = {
			...itemfields.magic(),
			tier: new fields.NumberField({ integer: true, initial: 1}),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	static migrateData(data) {
		// migrate for NPC Spell
		if (data.dc) {
			data.tier = data.dc - 10;
		}
		return super.migrateData(data);
	}

	/**
	 * triggered after Active Effects are applied
	 * @override
	 */
	prepareDerivedData() {
		super.prepareDerivedData();

		// support for NPC spells
		this.dc = this.tier + 10;
	}

	/* ----------------------- */
	/* Getters                 */
	/* ----------------------- */

	get isRollable() {
		return true;
	}

	get isSpell() {
		return true;
	}

}
