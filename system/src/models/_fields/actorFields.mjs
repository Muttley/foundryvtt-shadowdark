const fields = foundry.data.fields;

export const alignment = () => ({
	alignment: new fields.StringField({
		initial: "neutral",
		choices: Object.keys(CONFIG.SHADOWDARK.ALIGNMENTS),
	}),
});

export const level = () => ({
	level: new fields.SchemaField({
		value: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
		xp: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
	}),
});
