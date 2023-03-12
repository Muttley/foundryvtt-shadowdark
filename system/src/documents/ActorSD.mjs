export default class ActorSD extends Actor {

	/* -------------------------------------------- */
	/*  Methods                                     */
	/* -------------------------------------------- */

	abilityModifier(ability) {
		return this._abilityModifier(this.system.abilities[ability].value);
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

	async getArmorClass() {
		return await this.updateArmorClass();
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

	async rollAbility(abilityId, options={}) {
		const bonus = this.abilityModifier(abilityId);
		const parts = ["@bonus"];
		const title = game.i18n.localize(`SHADOWDARK.dialog.AbilityCheck.${abilityId}`);
		const ability = CONFIG.SHADOWDARK.ABILITIES_LONG[abilityId];
		const data = { bonus, ability };
		const speaker = ChatMessage.getSpeaker({ actor: this });

		await CONFIG.Dice.D20RollSD.d20Roll({
			parts,
			data,
			title,
			speaker,
			template: "systems/shadowdark/templates/dialog/roll-ability-check-dialog.hbs",
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
