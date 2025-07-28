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

	/*
	 --- Private Functions ---
	*/

	_calcArmorClass() {
		// TODO finish this calculation
		return shadowdark.defaults.BASE_ARMOR_CLASS;
	}

	_calcAttackBonusData(weapon, options) {
		options.check ??= {};
		const rollBonuses = [];
		let rollBonus = 0;

		// Calculate Ability Bonus
		const abilityBonus = this._getAttackAbilityBonus(
			options.attack.type,
			weapon.system.isFinesse
		);
		if (abilityBonus) {
			rollBonus += abilityBonus;
			rollBonuses.push({
				name: game.i18n.localize("SHADOWDARK.dialog.item_roll.ability_bonus"), // TODO Stat bonus
				value: abilityBonus,
			});
		}

		// Get AE roll bonuses and add to bonuses
		const rollBonusKey = this.getRollKey(
			`roll.${options.attack.type}.bonus`,
			0,
			weapon
		);
		rollBonuses.push(...rollBonusKey.changes);
		rollBonus += rollBonusKey.value;

		// calculate attack bonus formula
		options.check.bonuses = rollBonuses ?? [];
		const rollBonusStr = `${rollBonus > 0 ? "+" : ""}${rollBonus}`;
		options.check.formula = `d20 ${rollBonusStr}`;

		// calculate attack advantage
		const rollKeyAdv = this.getRollKey(
			`roll.${options.attack.type}.advantage`,
			0,
			weapon
		);
		options.check.advantage = rollKeyAdv.value;
		// TODO display advantage changes
	}

	/*
	_calcAttackDamageData
	*/
	_calcAttackDamageData(weapon, options) {
		options.damage ??= {};
		options.damage.base ??= weapon.system.getDamageFormula(options.attack.handedness);
		options.damage.bonuses = [];

		// Get roll key die improvements
		const rollKeyDamageDie = this.getRollKey(
			`roll.${options.attack.type}.upgrade-damage-die`,
			0,
			weapon
		);
		if (rollKeyDamageDie.value) {
			// TODO updgrade damagedie
		}


		// Get roll key extra dice
		const rollKeyExtraDie = this.getRollKey(
			`roll.${options.attack.type}.extra-damage-die`,
			0,
			weapon
		);
		if (rollKeyExtraDie.value) {
			const baseDie = options.damage.base.match(/^[dD](\d*)/)[1];
			options.damage.base += ` +${rollKeyExtraDie.value}${baseDie}`;
			options.damage.bonuses.push(...rollKeyExtraDie.changes);
		}

		// Get damage formula and bonuses from Rolls keys
		const rollKeyDamage = this.getRollKey(
			`roll.${options.attack.type}.damage`,
			options.damage.base,
			weapon
		);

		options.damage.bonuses.push(...rollKeyDamage.changes);
		options.damage.formula = rollKeyDamage.value;
		options.damage.advantage = 0;
	}

	_calcAttackTalentData(options) {
		// hard code talents logic goes here
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

	async getclass() {
		if (!this.class) return null;
		return await fromUuid(this.class);
	}

	getAttackData(weapon, options={}) {

		// set required fields
		options.attack ??= {};
		options.attack.handedness ??= "1H";
		options.attack.type ??= weapon.system.type;
		options.attack.range ??= weapon.system.range;

		// calulate attack data
		this._calcAttackBonusData(weapon, options);
		this._calcAttackDamageData(weapon, options);
		this._calcAttackTalentData(weapon, options);

		return options;
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

	async rollAttack(weaponId, options={}) {

		options.actor = this.parent;

		const weapon = await fromUuid(weaponId);
		if (!weapon && weapon.system.isWeapon) {
			console.error("rollAttack: Invalid weaponId or type");
			return false;
		}
		options.weapon = weaponId;

		// Set target and target AC if targeting is enabled
		if (game.settings.get("shadowdark", "enableTargeting")) {
			const target = {};
			if (typeof options.target === "undefined") {
				const targetToken = game.user.targets.first();
				if (targetToken) target.token = targetToken;

				if (typeof options.target?.ac === "undefined") {
					const tokenAc = target?.actor?.system?.attributes?.ac?.value;
					if (tokenAc) target.ac = tokenAc;
				}
			}
			options.target = target;
		}

		// Test for available amnunition
		/*
		if (typeof rollData.ammunitionItem === "undefined") {
			const ammunition = rollData.item.availableAmmunition();
			if (ammunition && Array.isArray(ammunition) && ammunition.length > 0) {
				rollData.ammunitionItem = ammunition[0];
			}
		}*/

		// generate attack data options
		this.getAttackData(weapon, options);

		// Generate prompt form data
		const appfields = foundry.applications.fields;
		options.mainFormGroups = [];

		// Attack Bonus Prompt
		const attackInput = appfields.createTextInput({name: "check.bonusFormula", value: options.check.formula});
		const attackFormGroup = appfields.createFormGroup({
			input: attackInput,
			label: "Attack Roll", // TODO localize
			hint: CONFIG.DiceSD.createBonusToolTip(options.check.bonuses),
			localize: true,
		});
		options.mainFormGroups.push(attackFormGroup);

		// Damage Prompt
		const damageInput = appfields.createTextInput({name: "damage.bonusFormula", value: options.damage.formula});
		const damageFormGroup = appfields.createFormGroup({
			input: damageInput,
			label: "Damage Roll", // TODO localize
			hint: CONFIG.DiceSD.createBonusToolTip(options.damage.bonuses),
		});
		options.mainFormGroups.push(damageFormGroup);

		// call SD Player Attack hook
		await Hooks.callAll("SD-Player-Attack", options);

		// show roll prompt
		await CONFIG.DiceSD.rollDialog(options);

		// make attack and damage Rolls
		options.check.formula = CONFIG.DiceSD.applyAdvantage(
			options.check.formula,
			options.check.advantage
		);
		const attackRoll = await new Roll(
			options.check.formula,
			this.parent.getRolldata()
		).evaluate();

		// TODO allow for optional damage roll
		options.damage.formula = CONFIG.DiceSD.applyAdvantage(
			options.damage.formula,
			options.damage.advantage
		);
		const damageRoll = await new Roll(
			options.damage.formula,
			this.parent.getRolldata()
		).evaluate();

		// generate chat message
		shadowdark.chat.renderRollMessage(options, attackRoll, damageRoll);
	}

}
