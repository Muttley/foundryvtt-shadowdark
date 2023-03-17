export default class ActorSD extends Actor {

	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Some sensible token defaults for Actors
		const prototypeToken = {
			actorLink: false,
			disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
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

	async buildWeaponDisplay(options) {
		return await renderTemplate(
			"systems/shadowdark/templates/partials/weapon-attack.hbs",
			options
		);
	}

	async buildWeaponDisplays(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);
		const baseAttackBonus = this.attackBonus(item.system.type);
		const options = {
			weaponName: item.name,
			handedness: "",
			attackBonus: 0,
			attackRange: "",
			baseDamage: "",
			bonusDamage: 0,
			properties: item.propertiesDisplay(),
			meleeAttackBonus: this.system.bonuses.meleeAttackBonus,
			rangeAttackBonus: this.system.bonuses.rangeAttackBonus,
		};

		// TODO Add weapon master talent bonus

		const weaponDisplays = {melee: [], ranged: []};

		if (item.system.type === "melee") {
			options.attackBonus =
				baseAttackBonus + this.system.bonuses.meleeAttackBonus;

			options.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT.close;

			if (item.system.damage.oneHanded) {
				options.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.oneHanded
				];
				options.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");

				weaponDisplays.melee.push({
					display: await this.buildWeaponDisplay(options),
					itemId,
				});
			}
			if (item.system.damage.twoHanded) {
				options.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.twoHanded
				];
				options.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short");

				weaponDisplays.melee.push({
					display: await this.buildWeaponDisplay(options),
					itemId,
				});
			}
			if (item.hasProperty("thrown")) {
				options.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.oneHanded
				];
				options.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");
				options.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT[
					item.system.range
				];

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(options),
					itemId,
				});
			}
		}
		else if (item.system.type === "ranged") {
			options.attackBonus =
				baseAttackBonus + this.system.bonuses.rangeAttackBonus;

			options.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT[
				item.system.range
			];

			if (item.system.damage.oneHanded) {
				options.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.oneHanded
				];
				options.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(options),
					itemId,
				});
			}
			if (item.system.damage.twoHanded) {
				options.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[
					item.system.damage.twoHanded
				];
				options.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.twoHanded_short");

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(options),
					itemId,
				});
			}
		}

		return weaponDisplays;
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
		let gearSlots = CONFIG.SHADOWDARK.DEFAULTS.GEAR_SLOTS;

		if (this.type === "Player") {
			const strength = this.system.abilities.str.value;
			gearSlots = strength > gearSlots ? strength : gearSlots;
		}

		return gearSlots;
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
			abilityBonus,
			ability,
			actor: this,
		};

		options.title = game.i18n.localize(`SHADOWDARK.dialog.ability_check.${abilityId}`);
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-ability-check-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/ability-card.hbs";

		await CONFIG.DiceSD.RollD20Dialog(parts, data, options);
	}

	/* -------------------------------------------- */
	/*  Selling Methods                             */
	/* -------------------------------------------- */

	async getActiveLightSources() {
		const items = this.items.filter(
			item => item.type === "Basic"
		).filter(
			item => item.system.light.isSource && item.system.light.active
		);

		return items;
	}

	async hasNoActiveLightSources() {
		return this.getActiveLightSources.length <= 0;
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

		let baseArmorClass = CONFIG.SHADOWDARK.DEFAULTS.BASE_ARMOR_CLASS;
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
}
