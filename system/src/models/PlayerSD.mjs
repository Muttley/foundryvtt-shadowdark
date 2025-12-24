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

	/**
	 * // triggered before Active Effects are applied
	 * @override
	 */
	prepareBaseData() {
		super.prepareBaseData();
		this.slots = 10;

		// add spellcasting class
		this.spellcastingClasses = [];
		const castingClass = this.class?.system?.spellcasting?.class;
		if (castingClass) this.spellcastingClasses.push(castingClass);

	}

	/**
	 * triggered after Active Effects are applied
	 * @override
	 */
	prepareDerivedData() {
		super.prepareDerivedData();

		this.attributes.ac.value = this._calcBaseArmorClass().value;

		// calculate str slot bonus wihtout overriding AEs affecting system.slots
		const slotsBonus = Math.max(0, this.abilities.str.value - 10);
		this.slots += slotsBonus;

	}

	/* ----------------------- */
	/* Getters                 */
	/* ----------------------- */

	get isPlayer() {
		return true;
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
	 * Prepare a PointMovementSource for the document
	 * @param {ElevatedPoint} origin        The origin of the source
	 * @returns {value, bonuses}
	 */

	_calcBaseArmorClass() {
		let baseAC = shadowdark.defaults.BASE_ARMOR_CLASS;
		let modAC = 0;
		let aeBonuses = 0;
		let bestArmor = null;

		// apply armor mod from best item equiped
		const armors = this.parent.items.filter(i => i.system.isArmor && i.system.equipped);
		armors.forEach(armor => {
			if (armor.system?.ac?.base) {
				const abilityMod = this.abilities[armor.system.ac.attribute]?.mod ?? 0;
				const ac = (armor.system.ac.base ?? 0) + abilityMod;
				if (ac > baseAC) {
					baseAC = ac;
					bestArmor = armor;
				}
			}
			modAC += Number(armor.system?.ac?.modifier);
		});

		// get the correct AE bonuses to apply.
		if (bestArmor) {
			aeBonuses = this._getActiveEffectKeys("attributes.ac", 0, bestArmor);
		}
		else {
			aeBonuses = this._getActiveEffectKeys("attributes.ac.unarmored", 0);
		}

		return {
			value: baseAC + modAC + Number(aeBonuses.value),
			tooltips: aeBonuses.tooltips,
		};
	}

	_calcAttackMainConfig(weapon, config) {
		config.mainRoll ??= {};
		config.mainRoll.type = "Attack";
		config.mainRoll.base ??= "d20";
		config.mainRoll.label ??= game.i18n.localize("SHADOWDARK.roll.attack");
		// Calculate Attack Bonus from Ability mod & AE bonuses
		const abilityBonus = this._getAttackAbilityBonus(
			config.attack.type,
			weapon.system.isFinesse
		);
		const attackRollKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.bonus`,
			abilityBonus,
			weapon,
			config
		);
		config.mainRoll.bonus ??= shadowdark.dice.formatBonus(attackRollKey.value);
		config.mainRoll.formula ??= `${config.mainRoll.base}${config.mainRoll.bonus}`;

		// attack critical threshold
		const critThresholdKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.critical-success`,
			20,
			weapon,
			config
		);
		config.mainRoll.criticalSuccessAt = critThresholdKey.value;

		// attack failure threshold
		const failThresholdKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.critical-failure`,
			1,
			weapon,
			config
		);
		config.mainRoll.criticalFailureAt = failThresholdKey.value;

		// critical Multiplier
		const critMultiplierKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.critical-multiplier`,
			2,
			weapon,
			config
		);
		config.mainRoll.criticalMultiplier = critMultiplierKey.value;

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
		tooltips.push(shadowdark.dice.createToolTip(
			game.i18n.localize("SHADOWDARK.dialog.item_roll.ability_bonus"),
			abilityBonus
		));
		tooltips.push(attackRollKey.tooltips);
		tooltips.push(critThresholdKey.tooltips);
		tooltips.push(failThresholdKey.tooltips);
		tooltips.push(critMultiplierKey.tooltips);
		tooltips.push(rollKeyAdv.tooltips);
		config.mainRoll.tooltips = tooltips.filter(Boolean).join(", ");

	}

	/**
	 * add damage deatils to data based on weapon details and AEs
	 * @param {*} weapon a valid weapon item
	 * @param {*} config existing roll data object
	 */
	_calcAttackDamageConfig(weapon, config) {
		config.damageRoll ??= {};
		config.damageRoll.label = game.i18n.localize("SHADOWDARK.roll.damage");
		config.damageRoll.base = weapon.system.getDamageFormula(config.attack.handedness);

		// Get roll key die improvements
		const damageDieRollKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.upgrade-damage-die`,
			0,
			weapon,
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
			`roll.${config.attack.type}.extra-damage-die`,
			0,
			weapon,
			config
		);
		if (extraDieRollKey.value) {
			const baseDie = baseDamageValue.match(/^[dD](\d*)/)[1];
			baseDamageValue += ` +${extraDieRollKey.value}d${baseDie}`;
		}

		// Get damage formula and bonuses from Rolls keys
		const damageRollKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.damage`,
			baseDamageValue,
			weapon,
			config
		);
		config.damageRoll.formula = damageRollKey.value;

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

	_generateAbilityConfig(ability, config={}) {
		if (!ability) return; // TODO error message
		config.itemUuid = ability.uuid;

		config.descriptions = [];
		config.descriptions.push(ability.system.description);

		// roll required?
		if (ability.system.ability) {
			config.situational = [];
			config.mainRoll ??= {};
			config.mainRoll.type = "Ability";
			config.mainRoll.base ??= "d20";
			config.mainRoll.label ??= game.i18n.localize("SHADOWDARK.roll.special_ability");
			config.mainRoll.dc ??= ability.system.dc;


			// generate check formula from ability mod and AE roll bonuses
			const modifer = this.abilities[ability.system.ability].mod;
			const rollKey = this._getActiveEffectKeys("roll.ability.bonus", modifer, ability, config);
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
			if (modifer !==0) {
				tooltips.push(shadowdark.dice.createToolTip(
					game.i18n.localize("SHADOWDARK.dialog.item_roll.ability_bonus"), // TODO Stat bonus name
					modifer
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

	_generateAttackConfig(weapon, config={}) {
		if (!weapon.system.isWeapon) return;
		config.itemUuid = weapon.uuid;

		// set required fields
		config.attack ??= {};
		config.attack.handedness ??= weapon.system.handedness;
		config.attack.type ??= weapon.system.type;
		config.attack.range ??= weapon.system.range;

		config.situational = [];
		config.descriptions = [];
		config.descriptions.push(weapon.system?.description);

		// calulate attack config
		this._calcAttackMainConfig(weapon, config);
		this._calcAttackDamageConfig(weapon, config);
		this._calcAttackExtraConfig(weapon, config);

		return config;
	}

	_generateSpellConfig(spell, config={}) {
		if (!spell.system.isSpell) return;
		config.itemUuid = spell.uuid;

		config.cast ??= {};
		config.cast.focus ??= false;
		config.cast.ability ??= "int";
		config.cast.range = spell.system.range;
		config.cast.duration = spell.system?.duration;

		config.descriptions = [];
		config.descriptions.push(spell.system?.description);

		config.situational = [];
		config.mainRoll ??= {};
		config.mainRoll.type = "Spell";
		config.mainRoll.base ??= "d20";
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

		// generate tooltips
		const tooltips = [];
		tooltips.push(spellRollKey.tooltips);
		tooltips.push(spellAdvKey.tooltips);
		config.mainRoll.tooltips = tooltips.filter(Boolean).join(", ");
	}

	_getAttackAbilityBonus(attackType, finesse=false) {
		const str = this.abilities.str.mod;
		const dex = this.abilities.dex.mod;
		switch (attackType) {
			case "melee":
				return (finesse) ? Math.max(str, dex) : str;
			case "ranged":
				return dex;
			default:
				throw new Error(`Unknown attack type ${attackType}`);
		}
	}

	async _getSpellcastingAbility(item) {
		if (item.type !== "Spell") {
			// Always use our class spellcasting ability if we have one for
			// Wands and Scrolls, etc.  If you don't have a spellcasting
			// ability then you can't use these items
			const actorClass = await this.getClass();
			return actorClass?.system?.spellcasting?.ability ?? "";
		}

		const usableSpellcasterClasses = [];
		for (const classUuid of item?.system?.class ?? []) {
			const spellClass = await fromUuid(classUuid);
			const myClasses = await this.getSpellcasterClasses();
			const foundClass = myClasses.find(
				c => c.name.toLowerCase() === spellClass.name.toLowerCase()
			);
			if (foundClass) usableSpellcasterClasses.push(spellClass);
		}

		let chosenAbility = "";
		let bestAbilityModifier = 0;
		if (usableSpellcasterClasses.length > 0) {
			// If the spell can be cast by this actor, choose the best ability
			// to use that is supported by the specific spell
			//
			for (const casterClass of usableSpellcasterClasses) {
				const ability = casterClass?.system?.spellcasting?.ability ?? "";

				if (chosenAbility === "") {
					chosenAbility = ability;
					bestAbilityModifier = this.abilities[ability].mod;
				}
				else {
					const modifier = this.abilities[ability].mod;
					if (modifier > bestAbilityModifier) {
						chosenAbility = ability;
						bestAbilityModifier = modifier;
					}
				}
			}

		}

		return chosenAbility;
	}

	async _learnSpell(item) {
		const characterClass = await this.getClass();

		const spellcastingAttribute =
			characterClass?.system?.spellcasting?.ability ?? "int";

		const checkRoll = await this.rollAbilityCheck(
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
				spellName: item.system.spellName,
			}
		);

		const cardData = {
			actor: this,
			item: item,
			message,
		};

		let template = "systems/shadowdark/templates/chat/spell-learn.hbs";

		const content = await renderTemplate(template, cardData);

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

		if (checkRoll.success) {
			const spell = {
				type: "Spell",
				img: item.system.spellImg,
				name: item.system.spellName,
				system: {
					class: item.system.class,
					description: item.system.description,
					duration: item.system.duration,
					range: item.system.range,
					tier: item.system.tier,
				},
			};

			this.parent.createEmbeddedDocuments("Item", [spell]);
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
			ui.notifications.warn(
				"Error: Item no longer exists or is not a spell",
				{ permanent: false }
			);
			return;
		}

		config.actorId = this.parent.id;
		config.itemUuid = spellUuid;

		// get casting ability
		const castingAbility = await this._getSpellcastingAbility(spell);
		if (castingAbility === "") {
			return ui.notifications.error(
				game.i18n.format("SHADOWDARK.error.spells.unable_to_cast_spell"),
				{permanent: false}
			);
		}
		config.cast ??= {};
		config.cast.ability = castingAbility;

		shadowdark.dice.setRollTarget(config);

		this._generateSpellConfig(spell, config);

		if (!await shadowdark.dice.rollDialog(
			config,
			() => this._generateSpellConfig(spell, config)
		)) return false;

		// Call player cast spell hooks and cancel if any return false
		if (!await Hooks.call("SD-Player-Spell", config)) return false;

		const roll = shadowdark.dice.rollFromConfig(config);
		return roll.success;
	}

	async getAncestry() {
		if (!this.ancestry) return null;
		return await shadowdark.utils.getFromUuid(this.ancestry);
	}

	getAttacks() {
		const weapons = this.parent.items.filter(i => i.system.isWeapon && i.system.equipped);
		const attacks = {};

		// get attacks from weapons
		for (const weapon of weapons) {

			const attackData = this._generateAttackConfig(weapon);

			const type = attackData?.attack?.type ?? "none";
			if (!attacks[type]) attacks[type] = [];

			if (attackData.itemUuid) attackData.item = fromUuidSync(attackData.itemUuid);

			attacks[type].push(attackData);

			// if thrown then add a range attack
			if (weapon.system.isThrown) {
				const ranged = "ranged";
				const rangedAttackData = this._generateAttackConfig(
					weapon,
					{attack: {type: ranged}}
				);

				if (!attacks[ranged]) attacks[ranged] = [];
				if (rangedAttackData.itemUuid) {
					rangedAttackData.item = fromUuidSync(rangedAttackData.itemUuid);
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

	async getSpellcasterClasses() {
		const actorClass = await this.getClass();

		const playerSpellClasses = [];

		let spellClass = actorClass.system.spellcasting.class;
		if (spellClass === "") {
			playerSpellClasses.push(actorClass);
		}
		else if (spellClass !== "__not_spellcaster__") {
			playerSpellClasses.push(
				await this.shadowdark.utils.getFromUuid(spellClass)
			);
		}

		const spellcasterClasses =
			await shadowdark.compendiums.spellcastingBaseClasses();

		// De-duplicate any bonus classes the Actor has
		const bonusClasses = [
			...new Set(
				this.bonuses?.spellcastingClasses ?? []
			),
		];

		for (const bonusClass of bonusClasses) {
			playerSpellClasses.push(
				spellcasterClasses.find(c => c.name.slugify() === bonusClass)
			);
		}

		return playerSpellClasses.sort((a, b) => a.name.localeCompare(b.name));
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

	async isSpellCaster() {
		const characterClass = await this.getClass();

		const spellcastingClass =
			characterClass?.system?.spellcasting?.class ?? "__not_spellcaster__";

		const isSpellcastingClass =
			characterClass && spellcastingClass !== "__not_spellcaster__";

		const hasBonusSpellcastingClasses =
			(this.bonuses?.spellcastingClasses ?? []).length > 0;

		return isSpellcastingClass || hasBonusSpellcastingClasses
			? true
			: false;
	}

	async learnSpell(itemId) {
		const item = this.parent.items.get(itemId);

		const correctSpellClass = item.system.class.includes(
			this.class
		);

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
		const playerSpellcasterClasses = await this.getSpellcasterClasses();

		const openChosenSpellbook = classUuid => {
			new shadowdark.apps.SpellBookSD(
				classUuid,
				this.parent.id
			).render(true);
		};

		if (playerSpellcasterClasses.length <= 0) {
			return ui.notifications.error(
				game.i18n.localize("SHADOWDARK.item.errors.no_spellcasting_classes"),
				{ permanent: false }
			);
		}
		else if (playerSpellcasterClasses.length === 1) {
			return openChosenSpellbook(playerSpellcasterClasses[0].uuid);
		}
		else {
			return renderTemplate(
				"systems/shadowdark/templates/dialog/choose-spellbook.hbs",
				{classes: playerSpellcasterClasses}
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

		config.type = "player-attack";
		config.actorId = this.parent.id;

		const weapon = await fromUuid(weaponUuid);
		if (!weapon && weapon.system.isWeapon) {
			console.error("rollAttack: Invalid weaponId or type");
			return false;
		}

		shadowdark.dice.setRollTarget(config);

		config.heading = `Attacking with ${weapon.name}`;

		// TODO Test for available amnunition
		/*
		if (typeof rollData.ammunitionItem === "undefined") {
			const ammunition = rollData.item.availableAmmunition();
			if (ammunition && Array.isArray(ammunition) && ammunition.length > 0) {
				rollData.ammunitionItem = ammunition[0];
			}
		}*/

		// generates attack data based on the weapon and actor
		this._generateAttackConfig(weapon, config);

		// show roll prompt and cancelled if closed
		if (!await shadowdark.dice.rollDialog(config,
			() => this._generateAttackConfig(weapon, config)
		)) return false;

		// Call player attack hooks and cancel if any return false
		if (!await Hooks.call("SD-Player-Attack", config)) return false;

		// Roll the attack and post to chat
		const roll = await shadowdark.dice.rollFromConfig(config);

		// TODO decrement ammo

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
		config.actorId = this.parent.id;

		this._generateAbilityConfig(ability, config);

		if (!await shadowdark.dice.rollDialog(config,
			() => this._generateAbilityConfig(ability, config)
		)) return false;

		// Call player classAbility hooks and cancel if any return false
		if (!await Hooks.call("SD-Player-classAbility", config)) return false;

		// If the ability has limited uses, deduct
		if (ability.system.limitedUses) {
			if (ability.system.uses.available <= 0) {
				return ui.notifications.error(
					game.i18n.format("SHADOWDARK.error.class_ability.no-uses-remaining"),
					{permanent: false}
				);
			}
			else {
				const newUsesAvailable = ability.system.uses.available - 1;

				ability.update({
					"system.uses.available": Math.max(0, newUsesAvailable),
				});
			}
		}

		// Post to chat and roll if needed
		if (config.mainRoll) {
			const roll = await shadowdark.dice.rollFromConfig(config);

			// lost on failure
			if (!roll.success && ability.system.loseOnFailure) {
				ability.update({"system.lost": true});
			}
		}
		else {
			const chatData = await shadowdark.chat.renderRollMessage(config);
			await ChatMessage.create(chatData);
		}
	}

}
