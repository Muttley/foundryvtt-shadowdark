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

export const physical = () => ({
	broken: new fields.BooleanField({initial: false}),
	canBeEquipped: new fields.BooleanField({initial: false}),
	cost: new fields.SchemaField({
		cp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		gp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		sp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
	}),
	equipped: new fields.BooleanField({initial: false}),
	isAmmunition: new fields.BooleanField({initial: false}),
	isPhysical: new fields.BooleanField({initial: true}),
	magicItem: new fields.BooleanField({initial: false}),
	quantity: new fields.NumberField({ integer: true, initial: 1, min: 0}),
	slots: new fields.SchemaField({
		free_carry: new fields.NumberField({ integer: true, initial: 0}),
		per_slot: new fields.NumberField({ integer: true, initial: 1}),
		slots_used: new fields.NumberField({ integer: true, initial: 1}),
	}),
	stashed: new fields.BooleanField({initial: false}),
});

export const ranges = () => ({
	ranges: new fields.ArrayField(
		new fields.StringField({
			initial: "close",
			choices: Object.keys(CONFIG.SHADOWDARK.RANGES),
		})
	),
});
