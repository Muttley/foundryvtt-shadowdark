import { ActorBaseSD } from "./SDBase.mjs";

const fields = foundry.data.fields;

export default class VehicleSD extends ActorBaseSD {
	static defineSchema() {

		const schema = {
			attributes: new fields.SchemaField({
				hp: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0, min: 0}),
					max: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				}),
				ac: new fields.SchemaField({
					value: new fields.NumberField({integer: true, initial: 10, min: 0}),
				}),
				speed: new fields.NumberField({ integer: true, initial: 2, min: 0}),
				slotsPerHp: new fields.NumberField({ integer: true, initial: 10, min: 0}),
				slotsPerPassenger: new fields.NumberField({ integer: true, initial: 10, min: 0}),
			}),
			coins: new fields.SchemaField({
				gp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				sp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				cp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
			}),
			slots: new fields.NumberField({ integer: true, initial: 10, min: 10}),
			passengers: new fields.NumberField({ integer: true, initial: 0, min: 10}),
			properties: new fields.ArrayField(new fields.DocumentUUIDField()),
		};

		return Object.assign(super.defineSchema(), schema);
	}
}
