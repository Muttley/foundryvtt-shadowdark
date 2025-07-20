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

	attackBonus(attackType) {
		switch (attackType) {
			case "melee":
				return this.abilities.str.mod;
			case "ranged":
				return this.abilities.dex.mod;
			default:
				throw new Error(`Unknown attack type ${attackType}`);
		}
	}

	_modifyRollData(rollData) {
		// calculate initiative
		let initBonus = this.abilities.dex.mod;
		initBonus += this.roll?.initiative?.bonus ?? 0;
		const initAdv = this.roll?.initiative?.advantage ?? 0;
		rollData.initiative = CONFIG.DiceSD.applyAdvantage(`d20 +${initBonus}`, initAdv);
	}

	_sortByUserOrder(collection) {
		return Array.from(collection ?? []).sort(
			(a, b) => (a.sort || 0) - (b.sort || 0)
		);
	}

	getRollKey(baseKey, baseValue, item=null) {
		if (!baseKey.startsWith("system.")) baseKey = "system.".concat(baseKey);
		const keys = [];
		keys.push(baseKey);

		// keys that relate to items can have multiple selectors
		if (item) {
			const selectors = [];
			selectors.push("all");
			// Does item have properties?
			const properties = item.system.getPropertyNames();
			if (properties.length > 0) selectors.push(...properties);
			// is item armor?
			if (item.system?.baseArmor) selectors.push(item.system.baseArmor);
			// is item a weapon?
			if (item.system?.baseWeapon) selectors.push(item.system.baseWeapon);
			// add name of item
			selectors.push(item.name);

			// generate full keys list
			selectors.forEach(s => {
				keys.push(`${baseKey}.${s.slugify()}`);
			});
		}

		// get data from all matching keys
		const changes = [];
		this.parent.appliedEffects.forEach(e => e.changes.forEach(c => {
			const isItem = (c.key === baseKey.concat(".this") && e.origin === item?.uuid);
			if (keys.includes(c.key) || isItem) {
				c.name = e.name;
				c.origin = e.origin;
				c.value = CONFIG.DiceSD.resolveFormula(c.value, this.parent.getRollData());
				c.priority = c.priority ?? c.mode * 10;
				changes.push(c);
			}
		}));

		// calculate final value based on all Active Effect changes
		let value = baseValue;

		// Calculate add type changes
		let intParts = 0;
		let strParts = "";
		changes.filter(c => c.mode === CONST.ACTIVE_EFFECT_MODES.ADD).forEach(c => {
			if (Number(c.value)) intParts += Number(c.value);
			else strParts += ` + ${c.value}`;
		});
		if (typeof value === "string" || strParts) {
			value = value.toString();
			if (intParts) value = value.concat(` +${intParts}`);
			if (strParts) value = value.concat(strParts);
		}
		else {
			value += intParts;
		}

		// Calculate multiply type changes
		let multiplyBonus = 1;
		changes.filter(c => c.mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY).forEach(c => {
			multiplyBonus = multiplyBonus * c.value;
		});

		if (multiplyBonus !== 1) {
			if (typeof value === "string") {
				value = `(${value})*${multiplyBonus}`;
			}
			else {
				value = value * multiplyBonus;
			}
		}

		// Calculate override type changes
		changes.filter(c => c.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE).forEach(c => {
			value = c.value;
		});

		return {value, changes};
	}

	async rollCheck(abilityId, options={}) {
		const ability = abilityId.toLowerCase();
		if (!CONFIG.SHADOWDARK.ABILITY_KEYS.includes(ability)) return;

		options.actor = this.parent;
		options.check ??= {};

		let bonus = 0;
		const bonuses = [];

		const modifer = this.abilities[abilityId].mod;
		if (modifer) {
			bonus += modifer;
			bonuses.push({
				name: game.i18n.localize("SHADOWDARK.dialog.item_roll.ability_bonus"), // TODO Stat bonus
				value: modifer,
			});
		}

		// Get AE roll bonuses
		const bonusKey = this.getRollKey(`roll.${ability}.bonus`, 0);
		bonuses.push(...bonusKey.changes);
		bonus += bonusKey.value;

		// calculate check bonus formula
		options.check.bonuses = bonuses ?? [];
		const bonusStr = `${bonus > 0 ? "+" : ""}${bonus}`;
		options.check.formula = `d20 ${bonusStr}`;


		// calculate roll advantage
		const rollKeyAdv = this.getRollKey(`roll.${ability}.advantage`, 0);
		options.check.advantage = rollKeyAdv.value;

		// Generate prompt form data
		const appfields = foundry.applications.fields;
		options.mainFormGroups = [];

		// Check Bonus Prompt
		const formulaInput = appfields.createTextInput({name: "check.formula", value: options.check.formula});
		const checkFormGroup = appfields.createFormGroup({
			input: formulaInput,
			label: game.i18n.localize(`SHADOWDARK.dialog.ability_check.${ability}`),
			hint: CONFIG.DiceSD.createBonusToolTip(options.check.bonuses),
			localize: true,
		});
		options.mainFormGroups.push(checkFormGroup);

		// call SD Actor Stat Check hook
		await Hooks.callAll("SD-Stat-Check", options);

		// show roll prompt
		await CONFIG.DiceSD.rollDialog(options);

		// apply advantage and roll the check
		options.check.formula = CONFIG.DiceSD.applyAdvantage(
			options.check.formula,
			options.check.advantage
		);
		const checkRoll = await new Roll(
			options.check.formula,
			this.parent.getRollData()
		).evaluate();

		// generate chat message
		shadowdark.chat.renderRollMessage(options, checkRoll);
	}

}
