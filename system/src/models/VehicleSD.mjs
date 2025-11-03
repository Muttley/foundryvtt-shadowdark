import { ActorBaseSD } from "./SDBase.mjs";

const { ArrayField, DocumentUUIDField, NumberField, SchemaField } =
	foundry.data.fields;

export default class VehicleSD extends ActorBaseSD {
	static defineSchema() {
		const schema = {
			attributes: new SchemaField({
				hp: new SchemaField({
					value: new NumberField({ integer: true, initial: 0, min: 0 }),
					max: new NumberField({ integer: true, initial: 0, min: 0 }),
				}),
				ac: new SchemaField({
					value: new NumberField({ integer: true, initial: 10, min: 0 }),
				}),
				speed: new NumberField({ integer: true, initial: 2, min: 0 }),
				slotsPerHp: new NumberField({ integer: true, initial: 10, min: 0 }),
				slotsPerPassenger: new NumberField({
					integer: true,
					initial: 10,
					min: 0,
				}),
			}),
			coins: new SchemaField({
				gp: new NumberField({ integer: true, initial: 0, min: 0 }),
				sp: new NumberField({ integer: true, initial: 0, min: 0 }),
				cp: new NumberField({ integer: true, initial: 0, min: 0 }),
			}),
			slots: new NumberField({ integer: true, initial: 0, min: 0 }),
			passengers: new NumberField({ integer: true, initial: 0, min: 0 }),
			properties: new ArrayField(new DocumentUUIDField()),
		};

		return Object.assign(ActorBaseSD.defineSchema(), schema);
	}
}
