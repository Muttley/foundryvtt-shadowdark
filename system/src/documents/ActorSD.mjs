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

			return this._abilityModifier(
				this.system.abilities[ability].base
					+ this.system.abilities[ability].bonus
			);
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

	async addToHpBase(hp) {
		const currentHpBase = this.system.attributes.hp.base;
		this.update({
			"system.attributes.hp.base": currentHpBase + hp,
		});
	}

	async buildNpcAttackDisplays(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);

		const attackOptions = {
			attackType: item.system.attackType,
			attackName: item.name,
			numAttacks: item.system.attack.num,
			attackBonus: parseInt(item.system.bonuses.attackBonus, 10),
			baseDamage: `${item.system.damage.numDice}${item.system.damage.value}`,
			bonusDamage: parseInt(item.system.bonuses.damageBonus, 10),
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
				+ parseInt(this.system.bonuses.meleeAttackBonus, 10)
				+ parseInt(item.system.bonuses.attackBonus, 10)
				+ weaponMasterBonus;

			weaponOptions.bonusDamage +=
				parseInt(this.system.bonuses.meleeDamageBonus, 10)
				+ parseInt(item.system.bonuses.damageBonus, 10);

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
					+ parseInt(this.system.bonuses.rangedAttackBonus, 10)
					+ parseInt(item.system.bonuses.attackBonus, 10)
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
				+ parseInt(this.system.bonuses.rangedAttackBonus, 10)
				+ parseInt(item.system.bonuses.attackBonus, 10)
				+ weaponMasterBonus;

			weaponOptions.bonusDamage +=
				parseInt(this.system.bonuses.rangedDamageBonus, 10)
				+ parseInt(item.system.bonuses.damageBonus, 10);

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

	calcAbilityValues(ability) {
		const value = this.system.abilities[ability].base
			+ this.system.abilities[ability].bonus;

		const labelKey = `SHADOWDARK.ability_${ability}`;

		return {
			value,
			bonus: this.system.abilities[ability].bonus,
			base: this.system.abilities[ability].base,
			modifier: this.system.abilities[ability].mod,
			label: `${game.i18n.localize(labelKey)}`,
		};
	}

	/**
	 * Checks if the item (weapon) has any combination of settings
	 * or the actor has bonuses that would mean it should have weapon
	 * mastery bonuses applied to it.
	 * @param {Item} item - Item to calculate bonus for
	 * @returns {number} bonus
	 */
	calcWeaponMasterBonus(item) {
		let bonus = 0;

		if (
			item.system.weaponMastery
			|| this.system.bonuses.weaponMastery.includes(item.system.baseWeapon)
			|| this.system.bonuses.weaponMastery.includes(item.name.slugify())
		) {
			bonus += 1 + Math.floor(this.system.level.value / 2);
		}

		return bonus;
	}

	async castSpell(itemId) {
		const item = this.items.get(itemId);

		if (!item) {
			ui.notifications.warn(
				"Item no longer exists",
				{ permanent: false }
			);
			return;
		}

		const abilityId = this.getSpellcastingAbility();

		let rollType;
		if (item.type === "Spell") {
			rollType = item.name.slugify();
		}
		else {
			rollType = item.system.spellName.slugify();
		}

		const data = {
			rollType,
			item: item,
			actor: this,
			abilityBonus: this.abilityModifier(abilityId),
			talentBonus: this.system.bonuses.spellcastingCheckBonus,
		};

		const parts = ["@abilityBonus", "@talentBonus"];

		// @todo: push to parts & for set talentBonus as sum of talents affecting spell rolls

		return item.rollSpell(parts, data);
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

	async learnSpell(itemId) {
		const item = this.items.get(itemId);

		const result = await this.rollAbility(
			"int",
			{target: CONFIG.SHADOWDARK.DEFAULTS.LEARN_SPELL_DC}
		);

		const success = result?.rolls?.main?.success ?? false;

		const messageType = success
			? "SHADOWDARK.chat.spell_learn.success"
			: "SHADOWDARK.chat.spell_learn.failure";

		const message = game.i18n.format(
			messageType,
			{
				name: this.name,
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
			speaker: ChatMessage.getSpeaker({actor: this, token: this.token}),
			type: CONST.CHAT_MESSAGE_TYPES.OTHER,
			user: game.user.id,
		});

		if (success) {
			const spell = {
				type: "Spell",
				img: item.img,
				name: item.system.spellName,
				system: {
					class: item.system.class,
					description: item.system.description,
					duration: item.system.duration,
					properties: item.system.properties,
					range: item.system.range,
					tier: item.system.tier,
				},
			};

			this.createEmbeddedDocuments("Item", [spell]);
		}

		// original scroll always lost regardless of outcome
		await this.deleteEmbeddedDocuments(
			"Item",
			[itemId]
		);
	}

	numGearSlots() {
		let gearSlots = shadowdark.defaults.GEAR_SLOTS;

		if (this.type === "Player") {
			const strength = this.system.abilities.str.base
				+ this.system.abilities.str.bonus;

			gearSlots = strength > gearSlots ? strength : gearSlots;

			// Hauler's get to add their Con modifer (if positive)
			const conModifier = this.abilityModifier("con");
			gearSlots += this.system.bonuses.hauler && conModifier > 0
				? conModifier
				: 0;

			// Add effects that modify gearslots
			gearSlots += parseInt(this.system.bonuses.gearSlots, 10);
		}

		return gearSlots;
	}

	getCalculatedAbilities() {
		const abilities = {};

		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			abilities[ability] = this.calcAbilityValues(ability);
		}

		return abilities;
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

	async isSpellcaster() {
		return CONFIG.SHADOWDARK.SPELL_CASTER_CLASSES[this.system.class] ? true : false;
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

		if (this.type === "Player") {
			this._preparePlayerData();

			if (canvas.ready && game.user.character === this) {
				game.shadowdark.effectPanel.refresh();
			}
		}
		else if (this.type === "NPC") {
			this._prepareNPCData();
		}
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

		return await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	async rollAttack(itemId) {
		const item = this.items.get(itemId);

		const data = {
			item: item,
			rollType: (item.isWeapon()) ? item.system.baseWeapon.slugify() : item.name.slugify(),
			actor: this,
		};

		const bonuses = this.system.bonuses;

		// Summarize the bonuses for the attack roll
		const parts = ["@abilityBonus", "@talentBonus"];
		data.damageParts = [];

		// Magic Item bonuses
		if (item.system.bonuses.attackBonus) {
			parts.push("@itemBonus");
			data.itemBonus = item.system.bonuses.attackBonus;
		}
		if (item.system.bonuses.damageBonus) {
			data.damageParts.push("@itemDamageBonus");
			data.itemDamageBonus = item.system.bonuses.damageBonus;
		}

		// Talents & Ability modifiers
		if (this.type === "Player") {
			if (item.system.type === "melee") {
				if (item.isFinesseWeapon()) {
					data.abilityBonus = Math.max(
						this.abilityModifier("str"),
						this.abilityModifier("dex")
					);
				}
				else {
					data.abilityBonus = this.abilityModifier("str");
				}

				data.talentBonus = bonuses.meleeAttackBonus;
				data.meleeDamageBonus = bonuses.meleeDamageBonus;
				data.damageParts.push("@meleeDamageBonus");
			}
			else {
				data.abilityBonus = this.abilityModifier("dex");

				data.talentBonus = bonuses.rangedAttackBonus;
				data.rangedDamageBonus = bonuses.rangedDamageBonus;
				data.damageParts.push("@rangedDamageBonus");
			}

			// Check Weapon Mastery & add if applicable
			data.weaponMasteryBonus = this.calcWeaponMasterBonus(item);
			data.talentBonus += data.weaponMasteryBonus;
			if (data.weaponMasteryBonus) data.damageParts.push("@weaponMasteryBonus");
		}

		return item.rollItem(parts, data);
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

		// Get the mappings
		const lightSources = await foundry.utils.fetchJsonWithTimeout(
			"systems/shadowdark/assets/mappings/map-light-sources.json"
		);

		const lightData = lightSources[
			item.system.light.template
		].light;

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
		let armorMasteryBonus = 0;

		const equippedArmor = this.items.filter(
			item => item.type === "Armor" && item.system.equipped
		);
		let nonShieldEquipped = false;
		if (equippedArmor.length > 0) {
			newArmorClass = 0;
			for (let i = 0; i < equippedArmor.length; i++) {
				const armor = equippedArmor[i];

				if (armor.isNotAShield()) {
					nonShieldEquipped = true;
				}

				// Check if armor mastery should apply to the AC
				if (
					this.system.bonuses.armorMastery.includes(armor.name.slugify())
					|| this.system.bonuses.armorMastery.includes(armor.system.baseArmor)
				) armorMasteryBonus += 1;

				newArmorClass += armor.system.ac.modifier;
				newArmorClass += armor.system.ac.base;

				const attribute = armor.system.ac.attribute;
				if (attribute) {
					newArmorClass += this.abilityModifier(attribute);
				}
			}

			// Someone with no armor but a shield equipped
			if (!nonShieldEquipped) newArmorClass += baseArmorClass;

			newArmorClass += armorMasteryBonus;
		}

		// Add AC from effects
		newArmorClass += parseInt(this.system.bonuses.acBonus, 10);

		Actor.updateDocuments([{
			_id: this._id,
			"system.attributes.ac.value": newArmorClass,
		}]);

		return newArmorClass;
	}

	async usePotion(itemId) {
		const item = this.items.get(itemId);

		renderTemplate(
			"systems/shadowdark/templates/dialog/confirm-use-potion.hbs",
			{name: item.name}
		).then(html => {
			new Dialog({
				title: "Confirm Use",
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							const potionDescription = await item.getEnrichedDescription();

							const cardData = {
								actor: this,
								item: item,
								message: game.i18n.format(
									"SHADOWDARK.chat.potion_used",
									{
										name: this.name,
										potionName: item.name,
									}
								),
								potionDescription,
							};

							let template = "systems/shadowdark/templates/chat/potion-used.hbs";

							const content = await renderTemplate(template, cardData);

							await ChatMessage.create({
								content,
								rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
							});

							await this.deleteEmbeddedDocuments(
								"Item",
								[itemId]
							);
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

	/* -------------------------------------------- */
	/*  Base Data Preparation Helpers               */
	/* -------------------------------------------- */

	_preparePlayerData() {
		this._populatePlayerModifiers();
	}

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

		options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";
		options.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;

		const result = await CONFIG.DiceSD.RollDialog(parts, data, options);

		const newHp = Number(result.rolls.main.roll.result);
		this.update({
			"system.attributes.hp.max": newHp,
			"system.attributes.hp.value": newHp,
		});
	}

	async _playerRollHP(options={}) {
		if (this.system.class === "") {
			ui.notifications.error(
				game.i18n.format("SHADOWDARK.error.general.no_character_class"),
				{permanent: false}
			);
			return;
		}

		const data = {
			rollType: "hp",
			actor: this,
		};

		options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-hp.hbs";

		const parts = [CONFIG.SHADOWDARK.CLASS_HD[this.system.class]];
		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	async _applyHpRollToMax(value) {
		const currentHpBase = this.system.attributes.hp.base;
		await this.update({
			"system.attributes.hp.base": currentHpBase + value,
		});
	}

	/** @inheritdoc */
	_initializeSource(source, options={}) {
		source = super._initializeSource(source, options);

		if (!source._id || !options.pack || game.shadowdark.moduleArt.suppressArt) {
			return source;
		}

		const uuid = `Compendium.${options.pack}.${source._id}`;

		const art = game.shadowdark.moduleArt.map.get(uuid);

		if (art?.actor || art?.token) {
			if (art.actor) source.img = art.actor;

			if (typeof art.token === "string") {
				source.prototypeToken.texture.src = art.token;
			}
			else if (art.token) {
				foundry.utils.mergeObject(source.prototypeToken, art.token);
			}
		}
		return source;
	}

	_populatePlayerModifiers() {
		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			this.system.abilities[ability].mod = this.abilityModifier(ability);
		}
	}
}
