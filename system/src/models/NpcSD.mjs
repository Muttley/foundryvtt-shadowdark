import { ActorBaseSD } from "./SDBase.mjs";

const fields = foundry.data.fields;

export default class NpcSD extends ActorBaseSD {
	static defineSchema() {
		const schema = super.defineSchema();

		schema.attributes = new fields.SchemaField({
			ac: new fields.SchemaField({
				value: new fields.NumberField({integer: true, initial: 10, min: 0}),
			}),
			hp: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				max: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				hd: new fields.NumberField({ integer: true, initial: 0, min: 0}),
			}),
		});
		schema.darkAdapted = new fields.BooleanField({initial: false});
		schema.move = new fields.StringField({
			initial: "near",
			choices: Object.keys(CONFIG.SHADOWDARK.NPC_MOVES),
		});
		schema.moveNote = new fields.StringField();
		schema.spellcastingAbility = new fields.StringField();
		schema.spellcastingBonus = new fields.NumberField({ integer: true, initial: 0, min: 0});
		schema.spellcastingAttackNum = new fields.NumberField({ integer: true, initial: 0, min: 0});

		schema.abilities = new fields.SchemaField(
			CONFIG.SHADOWDARK.ABILITY_KEYS.reduce((obj, key) => {
				obj[key] = new fields.SchemaField({
					mod: new fields.NumberField({integer: true, initial: 0}),
				});
				return obj;
			}, {})
		);

		return Object.assign(super.defineSchema(), schema);
	}

}
