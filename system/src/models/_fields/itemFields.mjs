const fields = foundry.data.fields;

export const languageChoices = () => ({
	languages: new fields.SchemaField({
		common: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		rare: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		select: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		selectOptions: new fields.ArrayField(new fields.StringField()),
		fixed: new fields.ArrayField(new fields.StringField()),
	}),
});

export const lightSource = () => ({
	light: new fields.SchemaField({
		active: new fields.BooleanField({initial: false}),
		animation: new fields.StringField({blank: true, initial: "torch"}),
		autoActivate: new fields.BooleanField({initial: false}),
		bright: new fields.NumberField({initial: 5, min: 0}),
		color: new fields.ColorField({initial: "#d1c846"}),
		dim: new fields.NumberField({initial: 30, min: 0}),
		hasBeenUsed: new fields.BooleanField({initial: false}),
		isSource: new fields.BooleanField({initial: false}),
		longevityMins: new fields.NumberField({ integer: true, initial: 60, min: 0}),
		remainingSecs: new fields.NumberField({ integer: true, initial: 3600, min: 0}),
		// Retained temporarily so existing documents can be migrated.
		template: new fields.StringField({blank: true, initial: ""}),
	}),
});

export const magic = () => ({
	class: new fields.ArrayField(new fields.DocumentUUIDField()),
	damageType: new fields.StringField({
    	initial: "none",
		choices: Object.keys(CONFIG.SHADOWDARK.SPELL_DAMAGE_TYPES),
	}),
	duration: new fields.SchemaField({
		type: new fields.StringField({
			initial: "rounds",
			choices: Object.keys(CONFIG.SHADOWDARK.SPELL_DURATIONS),
		}),
		value: new fields.StringField({inital: "1"}),
	}),
	formula: new fields.StringField(),
	range: new fields.StringField({
		initial: "near",
    	choices: Object.keys(CONFIG.SHADOWDARK.SPELL_RANGES),
	}),
	lost: new fields.BooleanField({initial: false}),
});

export const ranges = () => ({
	ranges: new fields.ArrayField(
		new fields.StringField({
			initial: "close",
			choices: Object.keys(CONFIG.SHADOWDARK.RANGES),
		})
	),
});
