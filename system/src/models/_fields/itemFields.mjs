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
		hasBeenUsed: new fields.BooleanField({initial: false}),
		isSource: new fields.BooleanField({initial: false}),
		longevityMins: new fields.NumberField({ integer: true, initial: 60, min: 0}),
		remainingSecs: new fields.NumberField({ integer: true, initial: 3600, min: 0}),
		template: new fields.StringField({
			initial: "torch",
			choices: Object.keys(CONFIG.SHADOWDARK.LIGHT_SETTING_NAMES),
		}),
	}),
});

export const magic = () => ({
	class: new fields.ArrayField(new fields.DocumentUUIDField()),
	duration: new fields.SchemaField({
		type: new fields.StringField({
			initial: "rounds",
			choices: Object.keys(CONFIG.SHADOWDARK.SPELL_DURATIONS),
		}),
		value: new fields.StringField({inital: "1"}),
	}),
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
