const fields = foundry.data.fields;

export class ActorBaseSD extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		return {
			attributes: new fields.SchemaField({
				ac: new fields.SchemaField({
					value: new fields.NumberField({integer: true, initial: 10, min: 0}),
				}),
				hp: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0, min: 0}),
					max: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				}),
			}),
			notes: new fields.HTMLField(),
		};
	}

	/* ----------------------- */
	/* Getters       */
	/* ----------------------- */

	get isPlayer() {
		return false;
	}

	get isNPC() {
		return false;
	}

	/* ----------------------- */
	/* Public Functions       */
	/* ----------------------- */

	getPhysicalItems(group=true) {
		return this._sortByUserOrder(
			this.parent.items.filter(
				i => i.system.isPhysical && !i.system.stashed
			)
		);
	}

	getSlotUsage() {
		const slots = {
			coins: 0,
			gear: 0,
			gems: 0,
			treasure: 0,
			total: 0,
		};

		// Coins. Work out how many slots all these coins are taking up.
		if (this.coins) {
			const totalCoins = this.coins.gp + this.coins.sp + this.coins.cp;
			const freeCoins = shadowdark.defaults.FREE_COIN_CARRY;
			if (totalCoins > freeCoins) {
				slots.coins = Math.ceil((totalCoins - freeCoins) / freeCoins);
			}
		}

		// Gear and treasure. Only carried gear taking into account the free carry limits.
		const freeCarrySeen = {};
		let gemCount = 0;
		for (const i of this.getPhysicalItems()) {
			// Skip if gem
			if (i.system.isGem) {
				gemCount++;
				continue;
			}

			// calculate free carry
			let freeCarry = i.system.slots.free_carry;
			if (Object.hasOwn(freeCarrySeen, i.name)) {
				freeCarry = Math.max(0, freeCarry - freeCarrySeen[i.name]);
				freeCarrySeen[i.name] += freeCarry;
			}
			else {
				freeCarrySeen[i.name] = freeCarry;
			}
			freeCarry = freeCarry * i.system.slots.slots_used;
			const totalUsed = i.system.slotsUsed - freeCarry;

			// Seperate Treasure
			if (i.system.isTreasure) {
				slots.treasure += totalUsed;
			}
			else {
				slots.gear += totalUsed;
			}
		}

		// Gems
		if (gemCount > 0) {
			slots.gems = Math.ceil(gemCount / CONFIG.SHADOWDARK.DEFAULTS.GEMS_PER_SLOT);
		}

		// Total
		slots.total = slots.gear + slots.treasure + slots.coins + slots.gems;
		return slots;
	}

	getStashedItems() {
		return this._sortByUserOrder(
			this.parent.items.filter(
				i => i.system.stashed
			)
		);
	}

	/* ----------------------- */
	/* Private Functions       */
	/* ----------------------- */

	// change the default data provided by actor.getRollData()
	_modifyRollData(rollData) {
		// calculate initiative
		let initBonus = this.abilities.dex.mod;
		initBonus += this.roll?.initiative?.bonus ?? 0;
		const initAdv = this.roll?.initiative?.advantage ?? 0;
		const fomula = `d20${shadowdark.dice.formatBonus(initBonus)}`;
		rollData.initiative = shadowdark.dice.applyAdvantage(fomula, initAdv);
	}

	_sortByUserOrder(collection) {
		return Array.from(collection ?? []).sort(
			(a, b) => (a.sort || 0) - (b.sort || 0)
		);
	}

	/**
	 * Starting at a baseValue, returns the combined total of a AE based key
	 * and any selectors present. e.g. system.[baseKey].[selector]
	 * Deterministic placeholders are resolved based on actor's rollData
	 * @param {string} baseKey The base key under system. without selectors
	 * @param {int|string} baseValue The starting value that the AE effects will modify
	 * @param {document} item optional item to use as a selector by it's name and properties
	 * @param {document} selected optional selectors to include i.e. system.[baseKey].optional
	 * @returns {rollKeyObject}
	 */
	_getActiveEffectKeys(baseKey, baseValue, item=null, selected=[]) {
		if (!baseKey.startsWith("system.")) baseKey = "system.".concat(baseKey);
		const keys = [];
		keys.push(baseKey);

		// keys that relate to items can have multiple selectors
		if (item) {
			const selectors = [];
			selectors.push("all");
			// Does item have properties?
			const properties = item.system.propertyNames;
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
		const optional = [];
		this.parent.appliedEffects.forEach(e => e.changes.forEach(c => {
			const isItem = (c.key === baseKey.concat(".this") && e.origin === item?.uuid);
			const isOptional = c.key === baseKey.concat(".optional");
			if (keys.includes(c.key) || isItem || isOptional) {
				c.name = e.name;
				c.value = shadowdark.dice.resolveFormula(c.value, this.parent.getRollData());
				c.origin = e.origin;
				c.priority = c.priority ?? c.mode * 10;

				if (isOptional) {
					optional.push(c);
					if (!selected.includes(c.name)) return;
				}

				changes.push(c);
			}
		}));

		// calculate final value based on all Active Effect changes
		let finalValue = baseValue;
		const tooltips =[];

		// Calculate add type changes
		let intParts = 0;
		let strParts = "";
		changes.filter(c => c.mode === CONST.ACTIVE_EFFECT_MODES.ADD).forEach(c => {
			if (Number(c.value)) intParts += Number(c.value);
			else strParts += ` + ${c.value}`;
			tooltips.push(shadowdark.dice.createToolTip(c.name, c.value, "+"));
		});
		if (typeof finalValue === "string" || strParts) {
			finalValue = finalValue.toString();
			if (intParts) finalValue = finalValue.concat(shadowdark.dice.formatBonus(intParts));
			if (strParts) finalValue = finalValue.concat(strParts);
		}
		else {
			finalValue += intParts;
		}

		// Calculate multiply type changes
		let multiplyBonus = 1;
		changes.filter(c => c.mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY).forEach(c => {
			multiplyBonus = multiplyBonus * c.value;
			tooltips.push(shadowdark.dice.createToolTip(c.name, c.value, "x"));
		});

		if (multiplyBonus !== 1) {
			if (typeof finalValue === "string") {
				finalValue = `(${finalValue})*${multiplyBonus}`;
			}
			else {
				finalValue = finalValue * multiplyBonus;
			}
		}

		// Calculate override type changes
		changes.filter(c => c.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE).forEach(c => {
			finalValue = c.value;
			tooltips.push(shadowdark.dice.createToolTip(c.name, c.value, "="));
		});

		return {
			value: finalValue,
			tooltips: tooltips.filter(Boolean).join(", "),
			changes,
			optional,
		};
	}

	_generateAbilityCheckConfig(ability, config={}) {
		config.mainRoll ??= {};
		config.mainRoll.label ??= game.i18n.localize("SHADOWDARK.dialog.roll");
		config.mainRoll.base ??= "d20";

		// generate check formula from ability mod and AE roll bonuses
		const modifer = this.abilities[ability].mod;
		const rollKey = this._getActiveEffectKeys(`roll.${ability}.bonus`, modifer);
		config.mainRoll.bonus ??= shadowdark.dice.formatBonus(rollKey.value);
		config.mainRoll.formula ??= `${config.mainRoll.base}${config.mainRoll.bonus}`;

		// generate tooltips
		const tooltips = [];
		if (modifer !==0) {
			tooltips.push(shadowdark.dice.createToolTip(
				game.i18n.localize("SHADOWDARK.dialog.item_roll.ability_bonus"), // TODO Stat bonus name
				modifer
			));
		}
		tooltips.push(rollKey.tooltips);
		config.mainRoll.tooltips = tooltips.filter(Boolean).join(", ");


		// calculate roll advantage
		const advRollKeyAdv = this._getActiveEffectKeys(`roll.${ability}.advantage`, 0);
		config.mainRoll.advantage ??= advRollKeyAdv.value;
		config.mainRoll.advantageTooltips = advRollKeyAdv.tooltips;
	}

	async rollAbilityCheck(abilityId, config={}) {
		const ability = abilityId.toLowerCase();
		if (!CONFIG.SHADOWDARK.ABILITY_KEYS.includes(ability)) return false;

		config.type = "ability-check";
		config.actorId = this.parent.id;
		config.title ??= game.i18n.localize("SHADOWDARK.dialog.ability_check.title");
		config.heading ??= game.i18n.localize(`SHADOWDARK.dialog.ability_check.${ability}`);

		this._generateAbilityCheckConfig(ability, config);

		// show roll prompt and end if closed
		const prompt = await shadowdark.dice.rollDialog(config);
		if (!prompt) return false;

		this._generateAbilityCheckConfig(ability, config);

		// call Stat Check hooks and cancel if any return false
		if (!await Hooks.call("SD-Stat-Check", config)) return false;

		// Prompt, evaluate and roll the check
		return await shadowdark.dice.rollFromConfig(config);
	}

}
