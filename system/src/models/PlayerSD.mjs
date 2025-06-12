import { ActorBaseSD } from "./SDBase.mjs";
import {bonuses} from "./_fields/bonuses.mjs";

const fields = foundry.data.fields;

export default class PlayerSD extends ActorBaseSD {
	static defineSchema() {

		const schema = {
			bonuses: bonuses(),
			ancestry: new fields.DocumentUUIDField(),
			attributes: new fields.SchemaField({
				hp: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0, min: 0}),
					max: new fields.NumberField({ integer: true, initial: 0, min: 0}),
					base: new fields.NumberField({ integer: true, initial: 0, min: 0}),
					bonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				}),
				ac: new fields.SchemaField({
					value: new fields.NumberField({integer: true, initial: 10, min: 0}),
				}),
			}),
			background: new fields.DocumentUUIDField(),
			class: new fields.DocumentUUIDField(),
			coins: new fields.SchemaField({
				gp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				sp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				cp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
			}),
			deity: new fields.DocumentUUIDField(),
			languages: new fields.ArrayField(new fields.DocumentUUIDField()),
			luck: new fields.SchemaField({
				remaining: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				available: new fields.BooleanField({initial: false}),
			}),
			patron: new fields.DocumentUUIDField(),
			slots: new fields.NumberField({ integer: true, initial: 10, min: 10}),
		};

		// Add abilities
		schema.abilities = new fields.SchemaField(
			CONFIG.SHADOWDARK.ABILITY_KEYS.reduce((obj, key) => {
				obj[key] = new fields.SchemaField({
					base: new fields.NumberField({integer: true, initial: 10}),
					bonus: new fields.NumberField({integer: true, initial: 0}),
				});
				return obj;
			}, {})
		);

		return Object.assign(super.defineSchema(), schema);
	}

	// triggered before Active Effects are applied
	prepareBaseData() {
		super.prepareBaseData();

		// calculate ability mods and totals
		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			const total = this.abilities[ability].base + this.abilities[ability].bonus;
			this.abilities[ability].total = total;
			this.abilities[ability].mod = Math.min(4, Math.max(-4, Math.floor((total-10)/2)));
		}

		// TODO calculate AC here
	}

	// triggered after Active Effects are applied
	prepareDerivedData() {
		super.prepareBaseData();
	}
}
