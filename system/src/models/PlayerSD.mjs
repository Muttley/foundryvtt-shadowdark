import { ActorBaseSD } from "./_ActorBaseSD.mjs";

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
			ancestry: new fields.DocumentUUIDField(),
			attributes: new fields.SchemaField({
				hp: new fields.SchemaField({
					value: new fields.NumberField({ integer: true, initial: 0, min: 0}),
					max: new fields.NumberField({ integer: true, initial: 0, min: 0}),
				}),
				ac: new fields.SchemaField({
					value: new fields.NumberField({integer: true, initial: 10, min: 0}),
				}),
			}),
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
			slots: new fields.NumberField({ integer: true, initial: 10, min: 10}),
			spellcastingClass: new fields.ArrayField(new fields.StringField()),
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

	get isSpellCaster() {
		return this.spellcastingClasses.length ? true : false;
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

	_calcAttackCheckConfig(config) {
		if (!config.item) return;
		const weapon = config.item;
		config.check ??= {};
		config.check.base ??= "d20";
		config.check.label ??= "Attack"; // TODO localize
		// Calculate Attack Bonus from Ability mod & AE bonuses
		const abilityBonus = this._getAttackAbilityBonus(
			config.attack.type,
			weapon.system.isFinesse
		);
		const attackRollKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.bonus`,
			abilityBonus,
			weapon
		);
		config.check.bonus ??= `${attackRollKey.value > 0 ? "+" : ""}${attackRollKey.value}`;
		config.check.formula ??= `${config.check.base} ${config.check.bonus}`;

		// generate tooltips
		const tooltips = [];
		tooltips.push(shadowdark.dice.createToolTip(
			game.i18n.localize("SHADOWDARK.dialog.item_roll.ability_bonus"),
			abilityBonus
		));
		tooltips.push(attackRollKey.tooltips);
		config.check.tooltips = tooltips.filter(Boolean).join(", ");

		// calculate attack advantage
		const rollKeyAdv = this._getActiveEffectKeys(
			`roll.${config.attack.type}.advantage`,
			0,
			weapon
		);
		config.check.advantage ??= rollKeyAdv.value;
		config.check.advantageTooltips = rollKeyAdv.tooltips;
	}

	/**
	 * add damage deatils to data based on weapon details and AEs
	 * @param {*} weapon a valid weapon item
	 * @param {*} config existing roll data object
	 */
	_calcAttackDamageConfig(config) {
		if (!config.item) return;
		const weapon = config.item;
		config.damage ??= {};
		config.damage.label = "Damage"; // TODO localize
		config.damage.base ??= weapon.system.getDamageFormula(config.attack.handedness);

		const tooltips = [];

		// Get roll key die improvements
		const damageDieRollKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.upgrade-damage-die`,
			0,
			weapon
		);
		if (damageDieRollKey.value) {
			// TODO updgrade damagedie
			tooltips.push(damageDieRollKey.tooltips);
		}

		// Get roll key extra dice
		let baseDamageValue = config.damage.base;
		const extraDieRollKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.extra-damage-die`,
			0,
			weapon
		);
		if (extraDieRollKey.value) {
			const baseDie = baseDamageValue.match(/^[dD](\d*)/)[1];
			baseDamageValue += ` +${extraDieRollKey.value}${baseDie}`;
			tooltips.push(extraDieRollKey.tooltips);
		}


		// Get damage formula and bonuses from Rolls keys
		const damageRollKey = this._getActiveEffectKeys(
			`roll.${config.attack.type}.damage`,
			baseDamageValue,
			weapon
		);
		config.damage.formula = damageRollKey.value;

		// generate tooltips
		tooltips.push(damageRollKey.tooltips);
		config.damage.tooltips = tooltips.filter(Boolean).join(", ");

		// TODO damage advantage
	}

	_calcAttackExtraConfig(config) {
		// any hard coded logic can go here
	}

	_generateAttackConfig(weapon, config={}) {
		if (!weapon.system.isWeapon) return;
		config.item = weapon;

		// set required fields
		config.attack ??= {};
		config.attack.handedness ??= weapon.system.handedness;
		config.attack.type ??= weapon.system.type;
		config.attack.range ??= weapon.system.range;

		// calulate attack config
		this._calcAttackCheckConfig(config);
		this._calcAttackDamageConfig(config);
		this._calcAttackExtraConfig(config);

		return config;
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

	/* ----------------------- */
	/* Public Functions       */
	/* ----------------------- */

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
			attacks[type].push(attackData);

			// if thrown then add a range attack
			if (weapon.system.isThrown) {
				const ranged = "ranged";
				const rangedAttackData = this._generateAttackConfig(
					weapon,
					{attack: {type: ranged}}
				);

				if (!attacks[ranged]) attacks[ranged] = [];
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

	getPhysicalItems() {
		return this._sortByUserOrder(
			this.parent.items.filter(
				i => i.system.isPhysical && !i.system.stashed
			)
		);
	}

	getStashedItems() {
		return this._sortByUserOrder(
			this.parent.items.filter(
				i => i.system.stashed
			)
		);
	}

	async rollAttack(weaponUuid, data={}) {

		data.type = "player-attack";
		data.actor = this.parent;

		const weapon = await fromUuid(weaponUuid);
		if (!weapon && weapon.system.isWeapon) {
			console.error("rollAttack: Invalid weaponId or type");
			return false;
		}

		shadowdark.dice.setRollTarget(data);

		// TODO Test for available amnunition
		/*
		if (typeof rollData.ammunitionItem === "undefined") {
			const ammunition = rollData.item.availableAmmunition();
			if (ammunition && Array.isArray(ammunition) && ammunition.length > 0) {
				rollData.ammunitionItem = ammunition[0];
			}
		}*/

		// generates attack data based on the weapon and actor
		this._generateAttackConfig(weapon, data);

		// show roll prompt and cancelled if closed
		if (!await shadowdark.dice.rollDialog(data)) return false;

		// regenerate attack data based on new potential dialog inputs
		this._generateAttackConfig(weapon, data);

		// Call player attack hooks and cancel if any return false
		if (!await Hooks.call("SD-Player-Attack", data)) return false;

		// Roll the attack and post to chat
		if (!await shadowdark.dice.resolveRolls(data)) return false;

		// TODO decrement ammo

	}

}
