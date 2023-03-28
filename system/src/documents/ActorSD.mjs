export default class ActorSD extends Actor {

	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Some sensible token defaults for Actors
		const prototypeToken = {
			actorLink: false,
			sight: {
				enabled: false,
			},
		};

		if (data.type === "Player") {
			prototypeToken.sight.enabled = true;
			prototypeToken.actorLink = true;
		}

		this.updateSource({prototypeToken});
	}

	/* -------------------------------------------- */
	/*  Methods                                     */
	/* -------------------------------------------- */

	abilityModifier(ability) {
		if (this.type === "Player") {
			return this._abilityModifier(this.system.abilities[ability].value);
		}
		else {
			return this.system.abilities[ability].mod;
		}
	}

	attackBonus(attackType) {
		switch (attackType) {
			case "melee":
				return this.abilityModifier("str");
			case "ranged":
				return this.abilityModifier("dex");
			default:
				throw new Error(`Unknown attack type ${attackType}`);
		}
	}

	async buildNpcAttackDisplays(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);

		const attackOptions = {
			attackType: item.system.attackType,
			attackName: item.name,
			numAttacks: item.system.attack.num,
			attackBonus: item.system.attack.bonus,
			baseDamage: `${item.system.damage.numDice}${item.system.damage.value}`,
			bonusDamage: item.system.damage.bonus,
			special: item.system.damage.special,
			ranges: item.system.ranges.join("/"),
		};

		return await renderTemplate(
			"systems/shadowdark/templates/partials/npc-attack.hbs",
			attackOptions
		);
	}

	async buildWeaponDisplay(options) {
		return await renderTemplate(
			"systems/shadowdark/templates/partials/weapon-attack.hbs",
			options
		);
	}

	async buildWeaponDisplays(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);

		const meleeAttack = this.attackBonus("melee");
		const rangedAttack = this.attackBonus("ranged");

		const baseAttackBonus = item.isFinesseWeapon()
			? Math.max(meleeAttack, rangedAttack)
			: this.attackBonus(item.system.type);

		const weaponOptions = {
			weaponName: item.name,
			handedness: "",
			attackBonus: 0,
			attackRange: "",
			baseDamage: "",
			bonusDamage: 0,
			properties: item.propertiesDisplay(),
			meleeAttackBonus: this.system.bonuses.meleeAttackBonus,
			rangedAttackBonus: this.system.bonuses.rangedAttackBonus,
		};

		const weaponDisplays = {melee: [], ranged: []};

		const weaponMasterBonus = this.calcWeaponMasterBonus(item);
		weaponOptions.bonusDamage = weaponMasterBonus;

		if (item.system.type === "melee") {
			weaponOptions.attackBonus =	baseAttackBonus
				+ this.system.bonuses.meleeAttackBonus
				+ weaponMasterBonus;

			weaponOptions.bonusDamage += this.system.bonuses.meleeDamageBonus;

			weaponOptions.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT.close;

			if (item.system.damage.oneHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.oneHanded
				];
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");

				weaponDisplays.melee.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					itemId,
				});
			}
			if (item.system.damage.twoHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.twoHanded
				];
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short");

				weaponDisplays.melee.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					itemId,
				});
			}
			if (item.hasProperty("thrown")) {
				weaponOptions.attackBonus = baseAttackBonus
					+ this.system.bonuses.rangedAttackBonus
					+ weaponMasterBonus;

				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.oneHanded
				];
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");
				weaponOptions.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT[
					item.system.range
				];

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					itemId,
				});
			}
		}
		else if (item.system.type === "ranged") {
			weaponOptions.attackBonus = baseAttackBonus
				+ this.system.bonuses.rangedAttackBonus
				+ weaponMasterBonus;

			weaponOptions.bonusDamage += this.system.bonuses.rangeDamageBonus;

			weaponOptions.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT[
				item.system.range
			];

			if (item.system.damage.oneHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.oneHanded
				];
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					itemId,
				});
			}
			if (item.system.damage.twoHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.twoHanded
				];
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short");

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					itemId,
				});
			}
		}

		return weaponDisplays;
	}

	calcWeaponMasterBonus(item) {
		let bonus = 0;

		if (this.system.bonuses.weaponMastery.find(
			mastery => mastery === item.name.slugify()
		)) {
			bonus += 1 + Math.floor(this.system.level.value / 2);
		}

		return bonus;
	}

	async changeLightSettings(lightData) {
		const token = this.getCanvasToken();
		if (token) token.document.update({light: lightData});

		// Update the prototype as well
		Actor.updateDocuments([{
			_id: this._id,
			"prototypeToken.light": lightData,
		}]);
	}

	async getArmorClass() {
		return await this.updateArmorClass();
	}

	async isClaimedByUser() {
		// Check that the Actor is claimed by a User
		return game.users.find(user => user.character?.id === this.id)
			? true
			: false;
	}

	numGearSlots() {
		let gearSlots = shadowdark.defaults.GEAR_SLOTS;

		if (this.type === "Player") {
			const strength = this.system.abilities.str.value;
			gearSlots = strength > gearSlots ? strength : gearSlots;

			// Hauler's get to add their Con modifer (if positive)
			const conModifier = this.abilityModifier("con");
			gearSlots += this.system.bonuses.hauler && conModifier > 0
				? conModifier
				: 0;
		}

		return gearSlots;
	}

	getCanvasToken() {
		const ownedTokens = canvas.tokens.ownedTokens;
		return ownedTokens.find(
			token => token.document.actorId === this._id
		);
	}

	getRollData() {
		const rollData = super.getRollData();

		rollData.initiativeBonus = this.abilityModifier("dex");

		rollData.initiativeFormula = "1d20";
		if (this.system.bonuses?.advantage?.includes("initiative")) {
			rollData.initiativeFormula = "2d20kh1";
		}

		return rollData;
	}

	getSpellcastingAbility() {
		return this.system.spellcastingAbility;
	}

	hasAdvantage(data) {
		if (this.type === "Player") {
			return this.system.bonuses.advantage.includes(data.rollType);
		}
		return false;
	}

	/** @inheritDoc */
	prepareBaseData() {
		switch (this.type) {
			case "Player":
				return this._preparePlayerData();
			case "NPC":
				return this._prepareNPCData();
		}
	}

	/** @inheritDoc */
	prepareData() {
		super.prepareData();
	}

	/** @inheritDoc */
	prepareDerivedData() {}

	/* -------------------------------------------- */
	/*  Roll Methods                                */
	/* -------------------------------------------- */

	async rollAbility(abilityId, options={}) {
		const parts = ["@abilityBonus"];

		const abilityBonus = this.abilityModifier(abilityId);
		const ability = CONFIG.SHADOWDARK.ABILITIES_LONG[abilityId];
		const data = {
			rollType: "ability",
			abilityBonus,
			ability,
			actor: this,
		};

		options.title = game.i18n.localize(`SHADOWDARK.dialog.ability_check.${abilityId}`);
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-ability-check-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/ability-card.hbs";

		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	async rollHP(options={}) {
		if (this.type === "Player") {
			this._playerRollHP(options);
		}
		else if (this.type === "NPC") {
			this._npcRollHP(options);
		}
	}

	async getActiveLightSources() {
		const items = this.items.filter(
			item => item.type === "Basic"
		).filter(
			item => item.system.light.isSource && item.system.light.active
		).sort((a, b) => {
			const a_name = a.name.toLowerCase();
			const b_name = b.name.toLowerCase();
			if (a_name < b_name) {
				return -1;
			}
			if (a_name > b_name) {
				return 1;
			}
			return 0;
		});

		return items;
	}

	async hasActiveLightSources() {
		return this.getActiveLightSources.length > 0;
	}

	async hasNoActiveLightSources() {
		return this.getActiveLightSources.length <= 0;
	}

	async yourLightExpired(itemId) {
		this.turnLightOff(itemId);

		const item = this.items.get(itemId);

		const cardData = {
			img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
			actor: this,
			message: game.i18n.format(
				"SHADOWDARK.chat.light_source.expired",
				{
					name: this.name,
					lightSource: item.name,
				}
			),
		};

		let template = "systems/shadowdark/templates/chat/lightsource-toggle-gm.hbs";

		const content = await renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

	async yourLightWentOut(itemId) {
		this.toggleLight(false, itemId);

		const item = this.items.get(itemId);

		const cardData = {
			img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
			actor: this,
			message: game.i18n.format(
				"SHADOWDARK.chat.light_source.went_out",
				{
					name: this.name,
					lightSource: item.name,
				}
			),
		};

		let template = "systems/shadowdark/templates/chat/lightsource-toggle-gm.hbs";

		const content = await renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

	async sellAllGems() {
		const items = this.items.filter(item => item.type === "Gem");
		return this.sellAllItems(items);
	}

	async sellAllItems(items) {
		const coins = this.system.coins;

		const soldItems = [];
		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			coins.gp += item.system.cost.gp;
			coins.sp += item.system.cost.sp;
			coins.cp += item.system.cost.cp;

			soldItems.push(item._id);
		}

		await this.deleteEmbeddedDocuments(
			"Item",
			soldItems
		);

		Actor.updateDocuments([{
			_id: this._id,
			"system.coins": coins,
		}]);
	}

	async sellItemById(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);
		const coins = this.system.coins;

		coins.gp += item.system.cost.gp;
		coins.sp += item.system.cost.sp;
		coins.cp += item.system.cost.cp;

		await this.deleteEmbeddedDocuments(
			"Item",
			[itemId]
		);

		Actor.updateDocuments([{
			_id: this._id,
			"system.coins": coins,
		}]);
	}

	async toggleLight(active, itemId) {
		if (active) {
			this.turnLightOn(itemId);
		}
		else {
			this.turnLightOff();
		}
	}

	async turnLightOff() {
		const noLight = {
			dim: 0,
			bright: 0,
		};

		this.changeLightSettings(noLight);
	}

	async turnLightOn(itemId) {
		const item = this.items.get(itemId);

		const lightData = CONFIG.SHADOWDARK.LIGHT_SETTINGS[
			item.system.light.template
		];

		this.changeLightSettings(lightData);
	}

	async updateArmor(updatedItem) {
		// updatedItem is the item that has had its "equipped" field toggled
		// on/off.
		if (updatedItem.system.equipped) {
			// First we need to disable any already equipped armor
			const isAShield = updatedItem.isAShield();

			const armorToUnequip = [];

			for (const item of this.items) {
				if (!item.system.equipped) continue;
				if (item.type !== "Armor") continue;
				if (item._id === updatedItem._id) continue;

				// Only unequip a shield if the newly equipped item is a shield
				// as well.
				if (isAShield && item.isAShield()) {
					armorToUnequip.push({
						_id: item._id,
						"system.equipped": false,
					});
				}
				else if (item.isNotAShield() && !isAShield) {
					armorToUnequip.push({
						_id: item._id,
						"system.equipped": false,
					});
				}
			}

			if (armorToUnequip.length > 0) {
				await this.updateEmbeddedDocuments("Item", armorToUnequip);
			}
		}

		this.updateArmorClass();
	}

	async updateArmorClass() {
		const dexModifier = this.abilityModifier("dex");

		let baseArmorClass = shadowdark.defaults.BASE_ARMOR_CLASS;
		baseArmorClass += dexModifier;

		let newArmorClass = baseArmorClass;

		const equippedArmor = this.items.filter(
			item => item.type === "Armor" && item.system.equipped
		);
		let nonShieldEquipped = false;
		if (equippedArmor.length > 0) {
			newArmorClass = 0;
			for (let i = 0; i < equippedArmor.length; i++) {
				const armor = equippedArmor[i];

				if (armor.isNotAShield()) nonShieldEquipped = true;

				newArmorClass += armor.system.ac.modifier;
				newArmorClass += armor.system.ac.base;

				const attribute = armor.system.ac.attribute;
				if (attribute) {
					newArmorClass += this.abilityModifier(attribute);
				}
			}

			// Someone with no armor but a shield equipped
			if (!nonShieldEquipped) newArmorClass += baseArmorClass;
		}

		Actor.updateDocuments([{
			_id: this._id,
			"system.attributes.ac.value": newArmorClass,
		}]);

		return newArmorClass;
	}

	/* -------------------------------------------- */
	/*  Base Data Preparation Helpers               */
	/* -------------------------------------------- */

	_preparePlayerData() {}

	_prepareNPCData() {}

	/* -------------------------------------------- */
	/*  Internal Helpers                            */
	/* -------------------------------------------- */

	_abilityModifier(abilityScore) {
		if (abilityScore >= 1 && abilityScore <= 3) return -4;
		if (abilityScore >= 4 && abilityScore <= 5) return -3;
		if (abilityScore >= 6 && abilityScore <= 7) return -2;
		if (abilityScore >= 8 && abilityScore <= 9) return -1;
		if (abilityScore >= 10 && abilityScore <= 11) return 0;
		if (abilityScore >= 12 && abilityScore <= 13) return 1;
		if (abilityScore >= 14 && abilityScore <= 15) return 2;
		if (abilityScore >= 16 && abilityScore <= 17) return 3;
		if (abilityScore >= 18) return 4;
	}

	async _npcRollHP(options={}) {
		const data = {
			rollType: "hp",
			actor: this,
		};

		const parts = [`${this.system.level.value}d8`];

		options.fastForward = true;
		options.chatMessage = true;

		options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";

		const result = await CONFIG.DiceSD.RollDialog(parts, data, options);

		const newHp = Number(result.rolls.main.roll.result);
		this.update({
			"system.attributes.hp.max": newHp,
			"system.attributes.hp.value": newHp,
		});
	}

	async _playerRollHP(options={}) {
		const data = {
			rollType: "hp",
			actor: this,
		};

		options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";

		// Record original HP for the chatcard later
		const originalHpMax = this.system.attributes.hp.max;
		let hpRollLevels = this.system.flags.hpRollLevels;
		const newHpRollLevels = [];

		// If no HP rolls have been made, roll them all up to the player level
		for (let lvl = 1; lvl <= this.system.level.value; lvl++) {
			// Skip if this level already has been rolled
			if ( hpRollLevels.length > 0 && hpRollLevels.find(o => o.level === lvl)) {
				continue;
			}

			// Roll the dice
			options.title = game.i18n.format("SHADOWDARK.dialog.hp_roll.per_level", {level: lvl});
			const parts = [CONFIG.SHADOWDARK.CLASS_HD[this.system.class]];
			const result = await CONFIG.DiceSD.RollDialog(parts, data, options);
			if (!result) return;

			// Parse and augment the roll
			let additionalHP = parseInt(result.rolls.main.roll.result, 10);

			if ( lvl === 1 ) {
				additionalHP += this.abilityModifier("con");
				additionalHP = Math.max(1, additionalHP);
			}

			// Record data of the roll
			newHpRollLevels.push(
				{
					level: lvl,
					hp: additionalHP,
					chatCardData: (lvl === 1)
						? game.i18n.format(
							"SHADOWDARK.dialog.hp_roll.roll_level_1",
							{hp: additionalHP}
						)
						: game.i18n.format(
							"SHADOWDARK.dialog.hp_roll.roll_per_level",
							{level: lvl, hp: additionalHP}
						),
				}
			);
		}

		// Allow to roll HD if there is no new levels to roll HP for
		if (newHpRollLevels.length === 0) {
			const parts = [CONFIG.SHADOWDARK.CLASS_HD[this.system.class]];
			const result = await CONFIG.DiceSD.RollDialog(parts, data, options);
			return result;
		}

		// Concatenate arrays and sum the total HP
		hpRollLevels = [...hpRollLevels, ...newHpRollLevels];
		let sumHP = hpRollLevels.reduce((a, b) => a + b.hp, 0);

		// Update the actor
		await this.update({
			"system.attributes.hp.base": sumHP,
			"system.flags.hpRollLevels": hpRollLevels,
		});

		// Create chatcard for displaying the result of the roll, as well as the new total
		const resultOptions = {
			chatCardTemplate: "systems/shadowdark/templates/chat/roll-hp-diff.hbs",
			title: game.i18n.localize("SHADOWDARK.dialog.hp_roll.summary"),
			speaker: ChatMessage.getSpeaker({ actor: this }),
			results: newHpRollLevels,
			total: game.i18n.format("SHADOWDARK.dialog.hp_roll.sum_total", {total: this.system.attributes.hp.base + this.system.attributes.hp.bonus}),
			previous: game.i18n.format("SHADOWDARK.dialog.hp_roll.previous_hp", {hp: originalHpMax}),
			actor: this,
		};

		const chatCardContent = await renderTemplate(resultOptions.chatCardTemplate, resultOptions);
		ChatMessage.create({
			speaker: resultOptions.speaker,
			content: chatCardContent,
		});
	}
}
