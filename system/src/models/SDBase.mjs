const fields = foundry.data.fields;

export class ActorBaseSD extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		return {
			alignment: new fields.StringField({
				initial: "neutral",
				choices: Object.keys(CONFIG.SHADOWDARK.ALIGNMENTS),
			}),
			level: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
				xp: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
			}),
			notes: new fields.HTMLField(),
		};
	}

}
