import { chat } from "../chat/_module.mjs";
import { ActorBaseSD } from "./_ActorBaseSD.mjs";

const fields = foundry.data.fields;

// Attributes data model ensure availability of .mod during AE applys
class attributeModel extends foundry.abstract.DataModel {
	static defineSchema() {
		return {
			value: new fields.NumberField({integer: true, initial: 10, min: 0}),
		};
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

		// Add abilities
		schema.abilities = new fields.SchemaField(
			CONFIG.SHADOWDARK.ABILITY_KEYS.reduce((obj, key) => {
				obj[key] = new fields.EmbeddedDataField(attributeModel);
				return obj;
			}, {})
		);

		return Object.assign(super.defineSchema(), schema);
	}


	static migrateData(data) {
		// migrate abilities.base to abilities.value
		for (const key of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			foundry.abstract.Document._addDataFieldMigration(
				data,
				`system.abilities.${key}.base`, // old
				`system.abilities.${key}.value`
			);
		}

		// migrate hp.base to hp.max
		if (foundry.utils.hasProperty(data, "system.attributes.hp.base")) {
			console.log("Migrated hp.base", data);
			foundry.utils.setProperty(
				data,
				"system.attributes.hp.max",
				data.system.attribues.hp.base
			);
		}


  		return super.migrateData(data);
	}

	// triggered before Active Effects are applied
	prepareBaseData() {
		super.prepareBaseData();

		this.slots = 10;

		// calculate AC value
		this.attributes.ac.value = this._calcArmorClass();

		// add spellcasting class
		this.spellcastingClasses = [];
		const castingClass = this.class?.system?.spellcasting?.class;
		if (castingClass) this.spellcastingClasses.push(castingClass);

	}

	// triggered after Active Effects are applied
	prepareDerivedData() {
		super.prepareDerivedData();

		// calculate str slot bonus wihtout overriding AEs affecting system.slots
		const slotsBonus = Math.max(0, this.abilities.str.value - 10);
		this.slots += slotsBonus;

	}

	//
	// --- Getters ---
	//

	// -----------
	// isSpellCaster
	// -----------
	get isSpellCaster() {
		return this.spellcastingClasses.length ? true : false;
	}

	// -----------
	// slotUsage
	// -----------
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

	//
	// --- Functions ---
	//

	_calcArmorClass() {
		return shadowdark.defaults.BASE_ARMOR_CLASS;
	}

	getEffectChanges(baseKey, rollData, item=null) {
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
				c.value = CONFIG.DiceSD.resolveFormula(
					c.value,
					rollData
				);
				c.priority = c.priority ?? c.mode * 10;
				changes.push(c);
			}
		}));

		return changes;
	}

	async _calcAttackBonusData(weapon, rollData) {
		if (!rollData.check) rollData.check = {};
		const rollBonuses = [];

		// Calculate Ability Bonus
		const abilityBonus = this.getAttackAbilityBonus(
			rollData.attack.type,
			weapon.system.isFinesse
		);
		if (abilityBonus) {
			rollBonuses.push({
				name: game.i18n.localize("SHADOWDARK.dialog.item_roll.ability_bonus"), // TODO Stat bonus
				mode: 2,
				value: abilityBonus,
			});
		}

		// Get AE roll bonuses and add to bonuses
		const rollBonusEffects = this.getEffectChanges(
			`roll.${rollData.attack.type}.bonus`,
			rollData,
			weapon
		);
		rollBonuses.push(...rollBonusEffects);
		const bonusFormula = CONFIG.DiceSD.formulaFromEffects("d20", rollBonuses);

		// calculate attack bonus formula
		rollData.check.bonuses = rollBonuses ?? [];
		rollData.check.formula = bonusFormula ?? "";

		// calculate attack advantage
		const rollAdvantageEffects = this.getEffectChanges(
			`roll.${rollData.attack.type}.advantage`,
			rollData,
			weapon
		);
		rollData.check.advantage = 0;
		console.log(rollAdvantageEffects);

	}

	async _calcAttackDamageData(weapon, rollData) {
		if (!rollData.damage) rollData.damage = {};
		rollData.damage.base = weapon.system.getDamageFormula(rollData.handedness);

		// TODO Get roll key die improvements
		const upgradeDamageDie = this.getEffectChanges(
			`roll.${rollData.attack.type}.upgrade-damage-die`,
			rollData,
			weapon
		);

		// TODO Get roll key extra dice
		const damageExtraDie = this.getEffectChanges(
			`roll.${rollData.attack.type}.extra-damage-die`,
			rollData,
			weapon
		);

		// Get damage formula and bonuses from Rolls keys
		const damageEffects = this.getEffectChanges(
			`roll.${rollData.attack.type}.damage`,
			rollData,
			weapon
		);

		rollData.damage.bonuses = damageEffects ?? [];

		const damageFormula = CONFIG.DiceSD.formulaFromEffects(rollData.damage.base, damageEffects);
		rollData.damage.formula = damageFormula ?? "";

		rollData.damage.advantage = 0;
	}

	async _calcAttackTalentData(rollData) {
		// hard code talents logic goes here
	}

	getAttackAbilityBonus(attackType, finesse=false) {
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

	async getAttackRollData(weapon, rollData={}) {

		// set required fields
		if (!rollData.handedness) rollData.handedness = "1H";
		if (!rollData.attack) rollData.attack = {};
		if (!rollData.attack.type) rollData.attack.type = weapon.system.type;
		if (!rollData.attack.range) rollData.attack.range = weapon.system.range;

		// calulate attack data
		await this._calcAttackBonusData(weapon, rollData);
		await this._calcAttackDamageData(weapon, rollData);
		await this._calcAttackTalentData(weapon, rollData);

		return rollData;
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

	async rollAttack(weaponId, rollData={}) {

		foundry.utils.mergeObject(rollData, this.parent.getRollData());
		rollData.actor = this.parent;

		const weapon = await fromUuid(weaponId);
		if (!weapon && weapon.system.isWeapon) {
			console.error("rollAttack: Invalid weaponId or type");
			return false;
		}
		rollData.weapon = weaponId;

		// Set target and target AC if targeting is enabled
		if (game.settings.get("shadowdark", "enableTargeting")) {
			const target = {};
			if (typeof rollData.target === "undefined") {
				const targetToken = game.user.targets.first();
				if (targetToken) target.token = targetToken;

				if (typeof rollData.target?.ac === "undefined") {
					const tokenAc = target?.actor?.system?.attributes?.ac?.value;
					if (tokenAc) target.ac = tokenAc;
				}
			}
			rollData.target = target;
		}

		// Test for available amnunition
		/*
		if (typeof rollData.ammunitionItem === "undefined") {
			const ammunition = rollData.item.availableAmmunition();
			if (ammunition && Array.isArray(ammunition) && ammunition.length > 0) {
				rollData.ammunitionItem = ammunition[0];
			}
		}*/

		// generate attack data
		await this.getAttackRollData(weapon, rollData);

		// Generate prompt form data
		const appfields = foundry.applications.fields;
		rollData.mainFormGroups = [];

		// Attack Bonus Prompt
		const attackInput = appfields.createTextInput({name: "check.bonusFormula", value: rollData.check.formula});
		const attackFormGroup = appfields.createFormGroup({
			input: attackInput,
			label: "Attack Roll", // TODO localize
			hint: CONFIG.DiceSD.createBonusToolTip(rollData.check.bonuses),
			localize: true,
		});
		rollData.mainFormGroups.push(attackFormGroup);

		// Damage Prompt
		const damageInput = appfields.createTextInput({name: "damage.bonusFormula", value: rollData.damage.formula});
		const damageFormGroup = appfields.createFormGroup({
			input: damageInput,
			label: "Damage Roll", // TODO localize
			hint: CONFIG.DiceSD.createBonusToolTip(rollData.damage.bonuses),
		});
		rollData.mainFormGroups.push(damageFormGroup);

		// call SD Player Attack hook
		await Hooks.callAll("SD-Player-Attack", rollData);

		// show roll prompt
		await CONFIG.DiceSD.rollDialog(rollData);

		// make attack and damage Rolls
		rollData.check.formula = CONFIG.DiceSD.applyAdvantage(
			rollData.check.formula,
			rollData.check.advantage
		);
		const attackRoll = await new Roll(rollData.check.formula, rollData).evaluate();

		// TODO allow for optional damage roll
		rollData.damage.formula = CONFIG.DiceSD.applyAdvantage(
			rollData.damage.formula,
			rollData.damage.advantage
		);
		const damageRoll = await new Roll(rollData.damage.formula, rollData).evaluate();

		// generate chat message
		shadowdark.chat.renderRollMessage(rollData, attackRoll, damageRoll);
	}

}
