const fields = foundry.data.fields;

export const bonuses = () =>
	new fields.SchemaField({
		acBonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		acBonusFromAttribute: new fields.ArrayField(new fields.StringField()),
		advantage: new fields.ArrayField(new fields.StringField()),
		armorMastery: new fields.ArrayField(new fields.StringField()),
		backstabDie: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		critical: new fields.SchemaField({
			successThreshold: new fields.NumberField({ integer: true, initial: 20, min: 0}),
			failureThreshold: new fields.NumberField({ integer: true, initial: 1, min: 0}),
			multiplier: new fields.NumberField({ integer: true, initial: 2, min: 1}),
		}),
		damageMultiplier: new fields.NumberField({ integer: true, initial: 1, min: 1}),
		gearSlots: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		hauler: new fields.BooleanField({initial: false}),
		lightSource: new fields.StringField(),
		meleeAttackBonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		meleeDamageBonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		rangedAttackBonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		rangedDamageBonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		spellcastingCheckBonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		spellcastingClasses: new fields.ArrayField(new fields.StringField()),
		stoneSkinTalent: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		unarmoredAcBonus: new fields.NumberField({ integer: true, initial: 0, min: 0}),
		weaponDamageDieD12: new fields.ArrayField(new fields.StringField()),
		weaponDamageDieImprovementByProperty: new fields.ArrayField(new fields.StringField()),
		weaponDamageExtraDieByProperty: new fields.ArrayField(new fields.StringField()),
		weaponDamageExtraDieImprovementByProperty: new fields.ArrayField(new fields.StringField()),
		weaponMastery: new fields.ArrayField(new fields.StringField()),
	});
