import { ActorBaseSD } from "./_ActorBaseSD.mjs";
import * as actorFields from "./_fields/actorFields.mjs";

const fields = foundry.data.fields;

// Attributes data model ensure availability of .mod during AE applys
class attributeModel extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			value: new fields.NumberField({integer: true, initial: 10, min: 0}),
		};
	}

	static migrateData(data) {
		// migrate system.abilities.base to system.abilities.value
		foundry.abstract.Document._addDataFieldMigration(data, "base", "value");
		return super.migrateData(data);
	}

	get mod() {
		return Math.min(4, Math.max(-4, Math.floor((this.value-10)/2)));
	}
}

export default class PlayerSD extends ActorBaseSD {
	static defineSchema() {

		const schema = {
			...actorFields.alignment(),
			...actorFields.level(),
			ancestry: new fields.DocumentUUIDField(),
			background: new fields.DocumentUUIDField(),
			class: new fields.DocumentUUIDField(),
			coins: new fields.SchemaField({
				gp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				sp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				cp: new fields.NumberField({ integer: true, initial: 0, min: 0}),
			}),
			deity: new fields.DocumentUUIDField(),
			languages: new fields.ArrayField(new fields.DocumentUUIDField()),
			luck: new fields.SchemaField({
				remaining: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				available: new fields.BooleanField({initial: false}),
			}),
			patron: new fields.DocumentUUIDField(),
			renown: new fields.NumberField({ integer: true, initial: 0}),
			slots: new fields.NumberField({ integer: true, initial: 10, min: 10}),
		};

		// Add abilities as additional data model
		schema.abilities = new fields.SchemaField(
			CONFIG.SHADOWDARK.ABILITY_KEYS.reduce((obj, key) => {
				obj[key] = new fields.EmbeddedDataField(attributeModel);
				return obj;
			}, {})
		);

		return Object.assign(super.defineSchema(), schema);
	}

	/**
	 * migrates legacy data
	 * @override
	 */
	static migrateData(data) {
		// migrate hp.base to hp.max
		if (data.attributes.hp.base) {
			data.attributes.hp.max = data.attributes.hp.base;
		}
		return super.migrateData(data);
	}

	rollConfigGenerators = {
		check: this._generateStatCheckConfig.bind(this),
		ability: this._generateAbilityConfig.bind(this),
		spell: this._generateSpellConfig.bind(this),
		attack: this._generateAttackConfig.bind(this),
	};

	/**
	 * // triggered before Active Effects are applied
	 * @override
	 */
	prepareBaseData() {
		super.prepareBaseData();
		this.slots = 10;

		// initilize spellcasting class
		this.spellcasting = {
			classes: [], // allows the use of innate spells and items of class
			allowAllItems: false, // allows the use of all spell items regardless of class
			itemAbility: "", // override the ability used for spell items. Default is the spell's class ability.
		};

	}

	/**
	 * triggered after Active Effects are applied
	 * @override
	 */
	prepareDerivedData() {
		super.prepareDerivedData();

		// calculate AC
		const ac = this._calcArmorClass();
		this.attributes.ac.value = ac.value;
		this.attributes.ac.tooltips = ac.tooltips;

		// calculate str slot bonus wihtout overriding AEs affecting system.slots
		const slotsBonus = Math.max(0, this.abilities.str.value - 10);
		this.slots += slotsBonus;

		// dedup and sort spellcasting
		this.spellcasting.classes = [...new Set(this.spellcasting.classes)].sort();

		// ensures allowAllItems is boolean. Any set value is converted to true
		this.spellcasting.allowAllItems = !!this.spellcasting.allowAllItems;

		// check that itemAbility is set correctly
		const itemAbility = this.spellcasting.itemAbility;
		if (itemAbility && !CONFIG.SHADOWDARK.ABILITY_KEYS.includes(itemAbility)) {
			this.spellcasting.itemAbility = "";
		}

	}

	/* ----------------------- */
	/* Getters                 */
	/* ----------------------- */

	get canUseMagicItems() {
		return (this.isSpellCaster || this.spellcasting.allowAllItems);
	}

	get hasLuckToken() {
		return game.settings.get("shadowdark", "usePulpMode")
			? this.luck.remaining > 0
			: this.luck.available;
	}

	get isPC() {
		return true;
	}

	get isSpellCaster() {
		return this.spellcasting.classes.length > 0;
	}

	get slotUsage() {
		const slots = {
			coins: 0,
			gear: 0,
			gems: 0,
			treasure: 0,
			total: 0,
		};

		// Coins. Work out how many slots all these coins are taking up.
		const totalCoins = this.coins.gp + this.coins.sp + this.coins.cp;
		const freeCoins = shadowdark.defaults.FREE_COIN_CARRY;
		if (totalCoins > freeCoins) {
			slots.coins = Math.ceil((totalCoins - freeCoins) / freeCoins);
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

	/* ----------------------- */
	/* Private Functions       */
	/* ----------------------- */

	/**
	 * Calculates effective AC based on equiped armor items
	 * @returns {value, tooltips}
	 */
	_calcArmorClass() {
		let baseAC = shadowdark.defaults.BASE_ARMOR_CLASS + (this.abilities?.dex?.mod ?? 0);
		const armors = this.parent.items.filter(i => i.system.isArmor && i.system.equipped);
		let unarmored = true;
		const tooltips = [];

		// MAIN ARMOR ITEMS
		// compare main armor items and select the one with best total AC with applied AEs
		let bestArmor = {
			name: "Base",
			ac: baseAC,
			tooltips: [],
		};
		// TODO improve in v4.1 by removing static mod from main armor items.
		// Ideally, only allow 1 main armor should be allowed to be set.
		armors.filter(armor => armor.system?.ac?.base).forEach(armor => {
			unarmored = false;
			const armorBaseAC = armor.system?.ac?.base ?? 0;
			const armorabilityMod = this.abilities[armor.system.ac.attribute]?.mod ?? 0;
			const armorstaticMod = armor.system?.ac?.modifier ?? 0;
			const armorAC = armorBaseAC + armorabilityMod + armorstaticMod;
			const totalAC = this._getActiveEffectKeys("attributes.ac", armorAC, armor);
			if (totalAC.value > bestArmor.ac) {
				bestArmor.name = armor.name;
				bestArmor.ac = totalAC.value;
				bestArmor.tooltips = [];
				bestArmor.tooltips.push(shadowdark.dice.createToolTip(armor.name, armorAC, ""));
				bestArmor.tooltips.push(totalAC.tooltips);
			}
		});

		// BONUS ARMOR ITEMS
		// get armor value from armor bonus items, ie Shields and matching item AEs
		let bonusArmor = {
			ac: 0,
			tooltips: [],
		};
		// TODO improve this filtering in v4.1
		armors.filter(armor => !armor.system?.ac?.base).forEach(armor => {
			unarmored = false;
			const itemACMod = Number(armor.system?.ac?.modifier ?? 0);
			const bonuses = this._getActiveEffectKeys("attributes.ac", itemACMod, armor);
			bonusArmor.ac += bonuses.value;
			if (bonuses.value !==0) {
				bonusArmor.tooltips.push(shadowdark.dice.createToolTip(armor.name, itemACMod));
			}
			bonusArmor.tooltips.push(bonuses.tooltips);
		});

		// Determine total AC from Armor
		let totalArmorAC = 0;
		if (unarmored) {
			const unarmoredBonues = this._getActiveEffectKeys("attributes.ac.unarmored", baseAC);
			totalArmorAC = unarmoredBonues.value;
			tooltips.push(shadowdark.dice.createToolTip("Unarmored", baseAC, ""));
			tooltips.push(unarmoredBonues.tooltips);
		}
		else {
			totalArmorAC = bestArmor.ac + bonusArmor.ac;
			tooltips.push(...bestArmor.tooltips);
			tooltips.push(...bonusArmor.tooltips);
		}

		// return final AC values applying remaining AEs
		const finalAC = this._getActiveEffectKeys("attributes.ac.value", totalArmorAC);
		tooltips.push(finalAC.tooltips);

		return {
			value: finalAC.value,
			tooltips: tooltips.filter(Boolean).join(", "),
		};
	}

	_calcAttackMainConfig(weapon, config) {
		shadowdark.dice.initializeD20Check(config);
		config.mainRoll.label ??= game.i18n.localize("SHADOWDARK.roll.attack");

		// Calculate Attack Bonus from Ability mod & AE bonuses
		const abilityBonus = this._getAttackAbilityModifier(
			config.attack.type,
			weapon.system.isFinesse
		);
		const attackRollKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.bonus`,
			abilityBonus.modifier,
			weapon,
			config
		);
		config.mainRoll.bonus = shadowdark.dice.formatBonus(attackRollKey.value);
		config.mainRoll.formula = `${config.mainRoll.base}${config.mainRoll.bonus}`;

		const critTooltips = this._calcCriticalConfig(weapon, config, config.attack.type);

		// calculate attack advantage
		const rollKeyAdv = this._getActiveEffectKeys(
			`roll.${config.attack.type}.advantage`,
			0,
			weapon,
			config
		);
		config.mainRoll.advantage = rollKeyAdv.value;

		// generate tooltips
		const tooltips = [];
		tooltips.push(abilityBonus.tooltip);
		tooltips.push(attackRollKey.tooltips);
		tooltips.push(...critTooltips);
		tooltips.push(rollKeyAdv.tooltips);
		config.mainRoll.tooltips = tooltips.filter(Boolean).join(", ");

	}

	// Common to both weapon and spell attacks.
	_calcCriticalConfig(item, config, key) {

		const critSuccess = this._getActiveEffectKeys(
			`roll.${key}.critical-success`, 20, item, config
		);
		const critFailure = this._getActiveEffectKeys(
			`roll.${key}.critical-failure`, 1, item, config
		);
		const critMultiplier = this._getActiveEffectKeys(
			`roll.${key}.critical-multiplier`, 2, item, config
		);

		config.mainRoll.criticalSuccessAt = critSuccess.value;
		config.mainRoll.criticalFailureAt = critFailure.value;

		if (critMultiplier.value !== 2) {
			config.damageRoll ??= {};
			config.damageRoll.criticalMultiplier = critMultiplier.value;
		}

		return [critSuccess.tooltips, critFailure.tooltips, critMultiplier.tooltips];
	}

	/**
	 * Add a damage roll to rollConfig object based on item details and AEs
	 * @param {*} item a valid weapon or spell item
	 * @param {*} config existing roll data object
	 * @param {*} key Rollkey base
	 * @param {*} base base damage formula
	 */
	_calcDamageConfig(item, config, key, base=1) {

		config.damageRoll ??= {};
		config.damageRoll.label = game.i18n.localize("SHADOWDARK.roll.damage");
		config.damageRoll.base = base;

		// Get roll key die improvements
		const damageDieRollKey = this._getActiveEffectKeys(
			`roll.${key}.upgrade-damage-die`,
			0,
			item,
			config
		);
		if (damageDieRollKey.value) {
			config.damageRoll.base = shadowdark.dice.upgradeDie(
				config.damageRoll.base,
				damageDieRollKey.value
			);
		}

		// Get roll key extra dice
		let baseDamageValue = config.damageRoll.base;
		const extraDieRollKey = this._getActiveEffectKeys(
			`roll.${key}.extra-damage-die`,
			0,
			item,
			config
		);
		if (extraDieRollKey.value) {
			const baseDie = baseDamageValue.match(/^[dD](\d*)/)[1];
			baseDamageValue += ` + ${extraDieRollKey.value}d${baseDie}`;
		}

		// Get damage formula and bonuses from Rolls keys
		const damageRollKey = this._getActiveEffectKeys(
			`roll.${key}.damage`,
			baseDamageValue,
			item,
			config
		);

		config.damageRoll.formula = shadowdark.dice.resolveFormula(
			damageRollKey.value, this.parent.getRollData()
		);

		// generate tooltips
		const tooltips = [];
		tooltips.push(damageRollKey.tooltips);
		tooltips.push(damageDieRollKey.tooltips);
		tooltips.push(extraDieRollKey.tooltips);
		config.damageRoll.tooltips = tooltips.filter(Boolean).join(", ");

	}

	_calcAttackExtraConfig(weapon, config) {
		// any hard coded logic can go here
	}

	async _generateAbilityConfig(config) {
		const ability = await fromUuid(config.itemUuid);
		if (!ability) return;
		config.type = "ability";

		config.descriptions = [];
		config.descriptions.push(ability.system.description);

		// roll required?
		if (ability.system.ability) {
			shadowdark.dice.initializeD20Check(config);
			config.mainRoll.label ??= game.i18n.localize("SHADOWDARK.roll.special_ability");
			config.mainRoll.dc ??= ability.system.dc;


			// generate check formula from ability mod and AE roll bonuses
			const modifier = this.abilities[ability.system.ability].mod;
			const rollKey = this._getActiveEffectKeys("roll.ability.bonus", modifier, ability, config);
			config.mainRoll.bonus = shadowdark.dice.formatBonus(rollKey.value);
			config.mainRoll.formula = `${config.mainRoll.base}${config.mainRoll.bonus}`;

			// calculate attack advantage
			const abilityAdvKey = this._getActiveEffectKeys(
				"system.roll.ability.advantage",
				0,
				ability,
				config
			);
			config.mainRoll.advantage = abilityAdvKey.value;

			// generate tooltips
			const tooltips = [];
			if (modifier !==0) {
				tooltips.push(shadowdark.dice.createToolTip(
					game.i18n.localize("SHADOWDARK.dialog.item_roll.ability_bonus"), // TODO Stat bonus name
					modifier
				));
			}
			tooltips.push(rollKey.tooltips);
			tooltips.push(abilityAdvKey.tooltips);
			config.mainRoll.tooltips = tooltips.filter(Boolean).join(", ");
		}
		else {
			config.skipPrompt = true;
		}

		return config;
	}

	async _generateAttackConfig(config={}) {
		const weapon = await fromUuid(config.itemUuid);
		if (!weapon?.system.isWeapon) return;
		config.type = "attack";

		// set required fields
		config.attack ??= {};
		config.attack.handedness ??= weapon.system.handedness;
		config.attack.type ??= weapon.system.type;
		config.attack.range ??= weapon.system.range;

		config.descriptions = [];
		config.descriptions.push(weapon.system?.description);

		// calulate attack config
		this._calcAttackMainConfig(weapon, config);
		this._calcDamageConfig(weapon,
			config,
			config.attack.type,
			weapon.system.getDamageFormula(config.attack.handedness));
		this._calcAttackExtraConfig(weapon, config);

		return config;
	}

	async _generateSpellConfig(config={}) {
		const spell = await fromUuid(config.cast?.spellUuid);
		if (!spell?.system.isSpell) return;
		config.type = "spell";

		config.cast ??= {};
		config.cast.spellUuid = spell.uuid;
		config.cast.focus ??= false;
		config.cast.ability ??= "int";
		config.cast.range = spell.system.range;
		config.cast.duration = spell.system?.duration;
		config.cast.damageType = spell.system?.damageType;

		// Does the spell need a damage roll?
		let formula = spell.system?.formula?.trim();
		if (formula && spell.system.damageType !== "none") {
			this._calcDamageConfig(spell, config, "spell", formula);
			if (config.cast.damageType === "healing") {
				config.damageRoll.label = game.i18n.localize("SHADOWDARK.roll.healing");
			}
		}

		config.descriptions = [];
		config.descriptions.push(spell.system?.description);

		shadowdark.dice.initializeD20Check(config);
		config.mainRoll.label = game.i18n.localize("SHADOWDARK.roll.spell_cast");
		config.mainRoll.dc = spell.system?.dc;

		const spellRollKey = this._getActiveEffectKeys(
			"system.roll.spell.bonus",
			this.abilities[config.cast.ability].mod,
			spell,
			config
		);

		config.mainRoll.bonus = shadowdark.dice.formatBonus(spellRollKey.value);
		config.mainRoll.formula = `${config.mainRoll.base}${config.mainRoll.bonus}`;

		// calculate spell advantage
		const spellAdvKey = this._getActiveEffectKeys(
			"system.roll.spell.advantage",
			0,
			spell,
			config
		);
		config.mainRoll.advantage = spellAdvKey.value;

		// calculate spell crit modifiers
		const critTooltips = this._calcCriticalConfig(spell, config, "spell");

		// generate tooltips
		const tooltips = [];
		tooltips.push(spellRollKey.tooltips);
		tooltips.push(...critTooltips);
		tooltips.push(spellAdvKey.tooltips);
		config.mainRoll.tooltips = tooltips.filter(Boolean).join(", ");
	}

	_getAttackAbilityModifier(attackType, finesse=false) {
		const str = this._getAbilityModifier("str");
		const dex = this._getAbilityModifier("dex");
		switch (attackType) {
			case "melee":
				return (finesse && (dex.modifier > str.modifier))? dex : str;
			case "ranged":
				return dex;
			default:
				throw new Error(`Unknown attack type ${attackType}`);
		}
	}

	async _getSpellcastingAbility(spellUuid, item=false) {

		// Ability override in place, ie Bard
		if (item && this.spellcasting.itemAbility) {
			return this.spellcasting.itemAbility;
		}

		// get spell object
		const spellObj = await fromUuid(spellUuid);
		if (!spellObj) {
			ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.spells.spell_not_found")
			);
			return "";
		}

		// has allowItems set?
		const allowAllItems = (item && this.spellcasting.allowAllItems);

		// get all spell classes from the spell
		const spellClassObjects = await Promise.all(
			(spellObj.system.class ?? []).map(uuid => fromUuid(uuid))
		);
		let spellClasses = spellClassObjects
			.filter(Boolean)
			.filter(c => c.system.isCastingClass)
			.map(c => ({ name: c.name.slugify(), ability: c.system.spellcasting.ability }));

		if (spellClasses.length === 0) {
			ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.spells.no_class_selected")
			);
			return "";
		}

		if (!allowAllItems) {
			// compare with PC spell classes and return the best matching class by ability mod
			spellClasses = spellClasses.filter(c => this.spellcasting.classes.includes(c.name));

			if (spellClasses.length === 0) return "";
			if (spellClasses.length === 1) return spellClasses[0].ability;
		}

		let bestMatch = spellClasses[0];
		for (const spellClass of spellClasses) {
			const matchMod = this.abilities[spellClass.ability]?.mod ?? -99;
			const bestMod = this.abilities[bestMatch.ability]?.mod ?? -99;
			if (matchMod > bestMod) bestMatch = spellClass;
		}
		return bestMatch.ability;

	}

	async _learnSpell(item) {

		const linkedSpell = await fromUuid(item.system?.spellUuid);
		if (!linkedSpell) {
			return ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.spells.spell_not_found")
			);
		}

		const characterClass = await this.getClass();

		const spellcastingAttribute =
			characterClass?.system?.spellcasting?.ability ?? "int";

		const checkRoll = await this.rollStatCheck(
			spellcastingAttribute,
			{ mainRoll: {dc: CONFIG.SHADOWDARK.DEFAULTS.LEARN_SPELL_DC} }
		);

		// Player cancelled the roll
		if (checkRoll === false) return;
		const messageType = checkRoll.success
			? "SHADOWDARK.chat.spell_learn.success"
			: "SHADOWDARK.chat.spell_learn.failure";

		const message = game.i18n.format(
			messageType,
			{
				name: this.parent.name,
				spellName: linkedSpell?.name,
			}
		);

		const cardData = {
			actor: this,
			item: item,
			message,
		};

		let template = "systems/shadowdark/templates/chat/spell-learn.hbs";

		const content = await foundry.applications.handlebars.renderTemplate(
			template, cardData
		);

		const title = game.i18n.localize("SHADOWDARK.chat.spell_learn.title");

		await ChatMessage.create({
			title,
			content,
			flags: { "core.canPopout": true },
			flavor: title,
			speaker: ChatMessage.getSpeaker({ actor: this, token: this.token }),
			type: CONST.CHAT_MESSAGE_STYLES.OTHER,
			user: game.user.id,
		});

		if (checkRoll.success && linkedSpell) {
			this.parent.createEmbeddedDocuments("Item", [linkedSpell.toObject()]);
		}

		// original scroll always lost regardless of outcome
		await this.parent.deleteEmbeddedDocuments(
			"Item",
			[item._id]
		);
	}

	/* ----------------------- */
	/* Public Functions       */
	/* ----------------------- */

	async addAncestry(item) {
		this.update({"system.ancestry": item.uuid});
	}

	async addBackground(item) {
		this.update({"system.background": item.uuid});
	}

	async addClass(item) {
		this.update({"system.class": item.uuid});
	}

	async addDeity(item) {
		this.update({"system.deity": item.uuid});
	}

	async addLanguage(item) {
		let languageFound = false;
		for (const language of await this.getLanguageItems()) {
			if (language.uuid === item.uuid) {
				languageFound = true;
				break;
			}
		}

		if (!languageFound) {
			const currentLanguages = this.languages;
			currentLanguages.push(item.uuid);
			this.update({"system.languages": currentLanguages});
		}
	}

	async addPatron(item) {
		const myClass = await this.getClass();

		if (myClass && myClass.system.patron.required) {
			this.update({"system.patron": item.uuid});
		}
		else {
			ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.patron.no_supported_class")
			);
		}
	}

	async castSpell(spellUuid, config={}) {

		const spell = await fromUuid(spellUuid);
		if (!spell) {
			return ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.spells.spell_not_found")
			);
		}

		config.actorId = this.parent.id;
		config.itemUuid ??= spellUuid;

		const triggeringItem = config.itemUuid
			? await fromUuid(config.itemUuid)
			: null;

		// Check for broken wand
		if (triggeringItem?.system?.isWand && triggeringItem?.system?.broken) {
			return ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.wand.broken")
			);
		}

		// Check for spell lost
		const wandLost = triggeringItem?.system?.spells?.find(s => s.uuid === spellUuid)?.lost;
		if (spell.system.lost || wandLost) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.error.spells.lost")
			);
		}

		// test if actor can cast
		let canCast = this.isSpellCaster;
		if (!triggeringItem?.system?.isSpell && this.spellcasting.allowAllItems) {
			canCast = true;
		}
		if (!canCast) {
			return ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.spells.not_a_spellcaster")
			);
		}

		// get casting ability
		const castingAbility = await this._getSpellcastingAbility(
			spellUuid,
			triggeringItem !== null
		);
		if (castingAbility === "") {
			return ui.notifications.error(
				game.i18n.format("SHADOWDARK.error.spells.unable_to_cast_spell")
			);
		}
		config.cast ??= {};
		config.cast.ability = castingAbility;
		config.cast.spellUuid = spellUuid;

		shadowdark.dice.setRollTarget(config);

		await this.rollConfigGenerators.spell?.(config);

		if (!await shadowdark.dice.rollDialog(config)) return false;

		// Call player cast spell hooks and cancel if any return false
		if (!await Hooks.call("SD-Player-Spell", config)) return false;

		const roll = await shadowdark.dice.rollFromConfig(config);

		// After cast actions
		if (triggeringItem?.system?.isSpell && !roll.success) {
			if (!config.cast.focus) {
				triggeringItem.update({"system.lost": true});
			}
		}
		else if (triggeringItem?.system.isScroll) {
			triggeringItem.delete();
		}
		else if (triggeringItem?.system.isWand) {
			if (!roll.success) {
				triggeringItem.system.setSpellLost(spellUuid, true, roll.criticalFailure);
			}
		}

		return roll.success;
	}

	async getAncestry() {
		if (!this.ancestry) return null;
		return await shadowdark.utils.getFromUuid(this.ancestry);
	}

	async getAttacks() {
		const weapons = this.parent.items.filter(i => i.system.isWeapon && i.system.equipped);
		const attacks = {};

		// get attacks from weapons
		for (const weapon of weapons) {

			const attackData = {itemUuid: weapon.uuid};
			await this.rollConfigGenerators.attack?.(attackData);

			const type = attackData?.attack?.type ?? "none";
			if (!attacks[type]) attacks[type] = [];

			if (attackData.itemUuid) attackData.item = await fromUuid(attackData.itemUuid);

			attacks[type].push(attackData);

			// if thrown then add a range attack
			if (weapon.system.isThrown) {
				const ranged = "ranged";
				const rangedAttackData = {itemUuid: weapon.uuid, attack: {type: ranged}};
				await this.rollConfigGenerators.attack?.(rangedAttackData);

				if (!attacks[ranged]) attacks[ranged] = [];
				if (rangedAttackData.itemUuid) {
					rangedAttackData.item = await fromUuid(rangedAttackData.itemUuid);
				}
				attacks[ranged].push(rangedAttackData);
			}

		}
		return attacks;
	}

	async getClass() {
		if (!this.class) return null;
		return await shadowdark.utils.getFromUuid(this.class);
	}

	getClassAbilities() {
		const sortedAbilityItems = this.parent.items.filter(
			i => i.type === "Class Ability"
		).sort((a, b) => a.name - b.name);

		const groupedAbilityItems = Object.groupBy(
			sortedAbilityItems,
			item => (item.system.group !== "")
				? item.system.group
				: game.i18n.localize("SHADOWDARK.sheet.abilities.ungrouped.label")
		);

		const classAbilities = [];
		const groupKeys = Object.keys(groupedAbilityItems).sort((a, b) => a.localeCompare(b));
		for (const key of groupKeys) {
			classAbilities.push({
				name: key,
				abilities: groupedAbilityItems[key],
			});
		}

		return classAbilities;
	}

	async getDeity() {
		if (!this.deity) return null;
		return await shadowdark.utils.getFromUuid(this.deity);
	}

	async getEquippedShields() {
		return this.parent.items.filter(
			i => i.type === "Armor" && i.system.isAShield && i.system.equipped
		);
	}

	async getLanguageItems() {
		const languageItems = [];
		for (const uuid of this.languages ?? []) {
			languageItems.push(await shadowdark.utils.getFromUuid(uuid));
		}
		return languageItems.sort((a, b) => a.name.localeCompare(b.name));
	}

	async getPatron() {
		if (!this.patron) return null;
		return await shadowdark.utils.getFromUuid(this.patron);
	}

	getTalents(grouped=true) {
		const groupedTalents = {
			ancestry: {
				label: game.i18n.localize("SHADOWDARK.talent.class.ancestry"),
				items: [],
			},
			class: {
				label: game.i18n.localize("SHADOWDARK.talent.class.class"),
				items: [],
			},
			level: {
				label: game.i18n.localize("SHADOWDARK.talent.class.level"),
				items: [],
			},
		};

		const talentItems = this.parent.items.filter(i => i.type === "Talent");
		if (grouped === false) {
			return talentItems;
		}
		else {
			talentItems.forEach(i => {
				const talentClass = i.system.talentClass;
				const section = talentClass !== "patronBoon" ? talentClass : "level";
				groupedTalents[section].items.push(i);
			});
			return groupedTalents;
		}
	}

	async getTitle() {
		const characterClass = await this.getClass();

		if (characterClass && this.alignment !== "") {
			const titles = characterClass.system.titles ?? [];
			const level = this.level?.value ?? 0;

			for (const title of titles) {
				if (level >= title.from && level <= title.to) {
					return title[this.alignment];
				}
			}
		}
		else {
			return "";
		}
	}

	async learnSpell(itemId) {
		const item = this.parent.items.get(itemId);

		const linkedSpell = await fromUuid(item.system.spellUuid);

		const spellClass = linkedSpell?.system?.class ?? [];
		const correctSpellClass = spellClass.includes(this.class);

		if (!correctSpellClass) {
			renderTemplate(
				"systems/shadowdark/templates/dialog/confirm-learn-spell.hbs",
				{
					name: item.name,
					correctSpellClass,
				}
			).then(html => {
				new Dialog({
					title: `${game.i18n.localize("SHADOWDARK.dialog.scroll.wrong_class_confirm")}`,
					content: html,
					buttons: {
						Yes: {
							icon: "<i class=\"fa fa-check\"></i>",
							label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
							callback: async () => {
								this._learnSpell(item);
							},
						},
						Cancel: {
							icon: "<i class=\"fa fa-times\"></i>",
							label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
						},
					},
					default: "Yes",
				}).render(true);
			});
		}
		else {
			await this._learnSpell(item);
		}
	}

	async openSpellBook() {
		const castingClasses =
			await shadowdark.utils.resolveSpellClasses(
				this.spellcasting.classes
			);

		const openChosenSpellbook = classUuid => {
			new shadowdark.apps.SpellBookSD(
				classUuid,
				this.parent.id
			).render(true);
		};

		if (castingClasses.length <= 0) {
			return ui.notifications.error(
				game.i18n.localize("SHADOWDARK.item.errors.no_spellcasting_classes"),
				{ permanent: false }
			);
		}
		else if (castingClasses.length === 1) {
			return openChosenSpellbook(castingClasses[0].uuid);
		}
		else {
			return foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/dialog/choose-spellbook.hbs",
				{classes: castingClasses}
			).then(html => {
				const dialog = new Dialog({
					title: game.i18n.localize("SHADOWDARK.dialog.spellbook.open_which_class.title"),
					content: html,
					buttons: {},
					render: html => {
						html.find("[data-action='open-class-spellbook']").click(
							event => {
								event.preventDefault();
								openChosenSpellbook(event.currentTarget.dataset.uuid);
								dialog.close();
							}
						);
					},
				}).render(true);
			});
		}
	}

	async rollAttack(weaponUuid, config={}) {

		config.actorId = this.parent.id;
		config.itemUuid = weaponUuid;

		const weapon = await fromUuid(weaponUuid);
		if (!weapon || !weapon.system.isWeapon) {
			console.error("rollAttack: Invalid weaponId or type");
			return false;
		}

		shadowdark.dice.setRollTarget(config);

		config.heading = `Attacking with ${weapon.name}`;

		if (weapon.usesAmmunition) {
			const ammunition = weapon.actor.ammunitionItems();
			if (ammunition && Array.isArray(ammunition) && ammunition.length > 0) {
				const defaultAmmunition = weapon.actor.ammunitionItems(weapon.system.ammoClass);

				config.attack ??= {};
				config.attack.ammunitionOptions = ammunition.map(a => a.uuid);
				if (defaultAmmunition?.length > 0) {
					config.attack.defaultAmmunitionUuid = defaultAmmunition[0].uuid;
				}
			}
			else {
				return ui.notifications.error(
					game.i18n.localize("SHADOWDARK.item.errors.no_available_ammunition"),
					{ permanent: false }
				);
			}
		}

		// generates attack data based on the weapon and actor
		await this.rollConfigGenerators.attack?.(config);

		// show roll prompt and cancelled if closed
		if (!await shadowdark.dice.rollDialog(config)) return false;

		// Call player attack hooks and cancel if any return false
		if (!await Hooks.call("SD-Player-Attack", config)) return false;

		// test for ammunition
		if (weapon.usesAmmunition) {
			if (!config.attack.selectedAmmunition) {
				// Try to find ammo if none is selected
				const defaultAmmo = weapon.actor.ammunitionItems(weapon.system.ammoClass);
				if (defaultAmmo?.length > 0) {
					config.attack.selectedAmmunition = defaultAmmo[0].uuid;
				}
			}
			// error out if no ammo is found
			const selectedAmmoItem = config.attack.selectedAmmunition
				? await fromUuid(config.attack.selectedAmmunition)
				: null;
			if (!selectedAmmoItem || selectedAmmoItem.system.quantity <= 0) {
				return ui.notifications.error(game.i18n.localize("SHADOWDARK.item.errors.no_available_ammunition"));
			}
		}

		if (weapon.usesAmmunition && config.attack.selectedAmmunition) {
			const item = await fromUuid(config.attack.selectedAmmunition);
			await item.reduceAmmunition(1);
		}

		// Roll the attack and post to chat
		const roll = await shadowdark.dice.rollFromConfig(config);

		return roll.success;

	}

	async sellAllGems() {
		const items = this.parent.items.filter(item => item.type === "Gem");
		return this.sellAllItems(items);
	}

	async sellAllItems(items) {
		const coins = this.coins;

		const soldItems = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			coins.gp += item.system.cost.gp;
			coins.sp += item.system.cost.sp;
			coins.cp += item.system.cost.cp;

			soldItems.push(item._id);
		}

		await this.parent.deleteEmbeddedDocuments(
			"Item",
			soldItems
		);

 		this.parent.update({"system.coins": coins});
	}

	async sellAllTreasure() {
		const items = this.parent.items.filter(item => item.type === "Treasure");
		return this.sellAllItems(items);
	}


	async sellItemById(itemId) {
		const item = this.parent.getEmbeddedDocument("Item", itemId);
		const coins = this.coins;

		coins.gp += item.system.cost.gp;
		coins.sp += item.system.cost.sp;
		coins.cp += item.system.cost.cp;

		await this.parent.deleteEmbeddedDocuments(
			"Item",
			[itemId]
		);

		this.parent.update({"system.coins": coins});
	}

	async useAbility(abilityUuid, config={}) {
		const ability = await fromUuid(abilityUuid);
		if (!ability) {
			return ui.notifications.error(
				game.i18n.localize("SHADOWDARK.error.general.item_uuid_not_found")
			);
		}
		if (ability.system.lost === true) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.error.class_ability.lost")
			);
		}

		config.actorId = this.parent.id;
		config.itemUuid = abilityUuid;
		await this.rollConfigGenerators.ability?.(config);

		if (!await shadowdark.dice.rollDialog(config)) return false;

		// Call player classAbility hooks and cancel if any return false
		if (!await Hooks.call("SD-Player-classAbility", config)) return false;

		// If the ability has limited uses, deduct
		if (ability.system.limitedUses) {
			if (ability.system.uses.available <= 0) {
				return ui.notifications.warn(
					game.i18n.format("SHADOWDARK.error.class_ability.no-uses-remaining"),
					{permanent: false}
				);
			}
			else {
				const newUsesAvailable = ability.system.uses.available - 1;

				await ability.update({
					"system.uses.available": Math.max(0, newUsesAvailable),
				});
			}
		}

		// Post to chat and roll if needed
		if (config.mainRoll) {
			const roll = await shadowdark.dice.rollFromConfig(config);

			// lost on failure
			if (!roll.success && ability.system.loseOnFailure) {
				await ability.update({"system.lost": true});
			}
		}
		else {
			const chatData = await shadowdark.chat.renderRollMessage(config);
			await ChatMessage.create(chatData);
		}
	}

	async useLuckToken(postToChat=false) {
		let update = null;
		if (game.settings.get("shadowdark", "usePulpMode")) {
			if (this.luck.remaining > 0) {
				update = {"system.luck.remaining": this.luck.remaining-1};
			}
		}
		else if (this.luck.available) {
			update = {"system.luck.available": false};
		}

		if (update) {
			await this.parent.update(update);
			if (postToChat) {
				await ChatMessage.create({
					content: game.i18n.format(
						"SHADOWDARK.chat.luck_token.used", { name: this.parent.name }
					),
					speaker: ChatMessage.getSpeaker(
						{ actor: this.parent, token: this.parent.token }
					),
					user: game.user.id,
				});
			}
			return true;
		}
		else {
			return false;
		}
	}

}
