export default class ActorSD extends Actor {

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


	async _applyHpRollToMax(value) {
		const currentHpBase = this.system.attributes.hp.base;
		await this.update({
			"system.attributes.hp.base": currentHpBase + value,
		});
	}


	async _getItemFromUuid(uuid) {
		if (uuid !== "") {
			return await fromUuid(uuid);
		}
		else {
			return null;
		}
	}

	async _learnSpell(item) {
		const characterClass = await this.getClass();

		const spellcastingAttribute =
			characterClass?.system?.spellcasting?.ability ?? "int";

		const result = await this.rollAbility(
			spellcastingAttribute,
			{ target: CONFIG.SHADOWDARK.DEFAULTS.LEARN_SPELL_DC }
		);

		// Player cancelled the roll
		if (result === null) return;

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

		const messageStyles = shadowdark.utils.getMessageStyles();

		await ChatMessage.create({
			title,
			content,
			flags: { "core.canPopout": true },
			flavor: title,
			speaker: ChatMessage.getSpeaker({ actor: this, token: this.token }),
			type: messageStyles.OTHER,
			user: game.user.id,
		});

		if (success) {
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

			this.createEmbeddedDocuments("Item", [spell]);
		}

		// original scroll always lost regardless of outcome
		await this.deleteEmbeddedDocuments(
			"Item",
			[item._id]
		);
	}


	async _npcRollHP(options={}) {
		const data = {
			rollType: "hp",
			actor: this,
			conBonus: this.system.abilities.con.mod,
		};

		const parts = [`max(1, ${this.system.level.value}d8 + @conBonus)`];

		options.fastForward = true;
		options.chatMessage = true;

		options.title = game.i18n.localize("SHADOWDARK.dialog.hp_roll.title");
		options.flavor = options.title;
		options.speaker = ChatMessage.getSpeaker({ actor: this });
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/roll-card.hbs";
		options.rollMode = CONST.DICE_ROLL_MODES.PRIVATE;

		const result = await CONFIG.DiceSD.RollDialog(parts, data, options);

		const newHp = Number(result.rolls.main.roll._total);
		await this.update({
			"system.attributes.hp.max": newHp,
			"system.attributes.hp.value": newHp,
		});
	}


	async _playerRollHP(options={}) {
		const characterClass = await this.getClass();

		if (!characterClass) {
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

		const parts = [characterClass.system.hitPoints];

		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}


	_populatePlayerModifiers() {
		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			this.system.abilities[ability].mod = this.abilityModifier(ability);
		}
	}


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

	_prepareNPCData() {}


	_preparePlayerData() {
		this._populatePlayerModifiers();
	}


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
		for (const language of await this.languageItems()) {
			if (language.uuid === item.uuid) {
				languageFound = true;
				break;
			}
		}

		if (!languageFound) {
			const currentLanguages = this.system.languages;
			currentLanguages.push(item.uuid);
			this.update({"system.languages": currentLanguages});
		}
	}


	async addToHpBase(hp) {
		const currentHpBase = this.system.attributes.hp.base;
		this.update({
			"system.attributes.hp.base": currentHpBase + hp,
		});
	}


	ammunitionItems(key) {
		return this.items.filter(i => {
			if (key) {
				return i.system.isAmmunition
					&& i.system.quantity > 0
					&& i.name.slugify() === key;
			}
			else {
				return i.system.isAmmunition && i.system.quantity > 0;
			}
		});
	}

	/**
	 * Applies the given number to the Actor or Token's HP value.
	 * The multiplier is a convenience feature to apply healing
	 *  or true multiples of a damage value.
	 *  * 1 => damage as rolled
	 *  * 0.5 => half damage (resistance)
	 *  * -1 => healing
	 *
	 * @param {number} damageAmount
	 * @param {number} multiplier
	 */
	async applyDamage(damageAmount, multiplier) {
		const maxHpValue = this.system.attributes.hp.max;
		const currentHpValue = this.system.attributes.hp.value;
		const amountToApply = Math.floor(parseInt(damageAmount) * multiplier);

		// Ensures that we don't go above Max or below Zero
		const newHpValue = Math.clamped(currentHpValue - amountToApply, 0, maxHpValue);

		this.update({
			"system.attributes.hp.value": newHpValue,
		});
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
			// numAttacks: item.system.attack.num,
			attackBonus: parseInt(item.system.bonuses.attackBonus, 10),
			baseDamage: item.system.damage.value,
			bonusDamage: parseInt(item.system.bonuses.damageBonus, 10),
			itemId,
			special: item.system.damage.special,
			ranges: item.system.ranges.map(s => game.i18n.localize(
				CONFIG.SHADOWDARK.RANGES[s])).join("/"),
		};

		attackOptions.numAttacks = await TextEditor.enrichHTML(
			item.system.attack.num,
			{
				async: true,
			}
		);

		return await renderTemplate(
			"systems/shadowdark/templates/partials/npc-attack.hbs",
			attackOptions
		);
	}

	async buildNpcSpecialDisplays(itemId) {
		const item = this.getEmbeddedDocument("Item", itemId);

		const description = await TextEditor.enrichHTML(
			jQuery(item.system.description).text(),
			{
				async: true,
			}
		);

		const attackOptions = {
			attackName: item.name,
			// numAttacks: item.system.attack.num,
			attackBonus: item.system.bonuses.attackBonus,
			itemId,
			ranges: item.system.ranges.map(s => game.i18n.localize(
				CONFIG.SHADOWDARK.RANGES[s])).join("/"),
			description,
		};

		attackOptions.numAttacks = await TextEditor.enrichHTML(
			item.system.attack.num,
			{
				async: true,
			}
		);

		return await renderTemplate(
			"systems/shadowdark/templates/partials/npc-special-attack.hbs",
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

		const baseAttackBonus = await item.isFinesseWeapon()
			? Math.max(meleeAttack, rangedAttack)
			: this.attackBonus(item.system.type);

		const weaponOptions = {
			weaponId: itemId,
			weaponName: item.name,
			handedness: "",
			attackBonus: 0,
			attackRange: "",
			baseDamage: "",
			bonusDamage: 0,
			extraDamageDice: "",
			properties: await item.propertiesDisplay(),
			meleeAttackBonus: this.system.bonuses.meleeAttackBonus,
			rangedAttackBonus: this.system.bonuses.rangedAttackBonus,
		};

		await this.getExtraDamageDiceForWeapon(item, weaponOptions);

		const weaponDisplays = {melee: [], ranged: []};

		const weaponMasterBonus = this.calcWeaponMasterBonus(item);
		weaponOptions.bonusDamage = weaponMasterBonus;

		// Find out if the user has a modified damage die
		let oneHanded = item.system.damage.oneHanded ?? false;
		let twoHanded = item.system.damage.twoHanded ?? false;

		// Improve the base damage die if this weapon has the relevant property
		for (const property of this.system.bonuses.weaponDamageDieImprovementByProperty) {
			if (await item.hasProperty(property)) {
				oneHanded = shadowdark.utils.getNextDieInList(
					oneHanded,
					shadowdark.config.DAMAGE_DICE
				);

				twoHanded = shadowdark.utils.getNextDieInList(
					twoHanded,
					shadowdark.config.DAMAGE_DICE
				);
			}
		}

		if (this.system.bonuses.weaponDamageDieD12.some(t =>
			[item.name.slugify(), item.system.baseWeapon.slugify()].includes(t)
		)) {
			oneHanded = oneHanded ? "d12" : false;
			twoHanded = twoHanded ? "d12" : false;
		}

		if (item.system.type === "melee") {
			weaponOptions.attackBonus =	baseAttackBonus
				+ parseInt(this.system.bonuses.meleeAttackBonus, 10)
				+ parseInt(item.system.bonuses.attackBonus, 10)
				+ weaponMasterBonus;

			weaponOptions.bonusDamage +=
				parseInt(this.system.bonuses.meleeDamageBonus, 10)
				+ parseInt(item.system.bonuses.damageBonus, 10);

			weaponOptions.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT.close;

			if (oneHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];
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
			// if thrown build range attack option
			if (await item.hasProperty("thrown")) {

				const thrownBaseBonus = Math.max(meleeAttack, rangedAttack);

				weaponOptions.attackBonus = thrownBaseBonus
					+ parseInt(this.system.bonuses.rangedAttackBonus, 10)
					+ parseInt(item.system.bonuses.attackBonus, 10)
					+ weaponMasterBonus;

				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];

				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");
				weaponOptions.attackRange = CONFIG.SHADOWDARK.RANGES_SHORT[
					item.system.range
				];

				weaponOptions.bonusDamage += parseInt(this.system.bonuses.rangedDamageBonus, 10);

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

			if (oneHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];
				weaponOptions.handedness = game.i18n.localize("SHADOWDARK.item.weapon_damage.oneHanded_short");

				weaponDisplays.ranged.push({
					display: await this.buildWeaponDisplay(weaponOptions),
					itemId,
				});
			}
			if (twoHanded) {
				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[twoHanded];
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
		const total = this.system.abilities[ability].base
			+ this.system.abilities[ability].bonus;

		const labelKey = `SHADOWDARK.ability_${ability}`;

		return {
			total,
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


	async canBackstab() {
		const backstab = this.items.find(i => {
			return i.type === "Talent"
				&& i.name === "Backstab";
		});

		return backstab ? true : false;
	}


	async canUseMagicItems() {
		const characterClass = await this.getClass();

		const spellcastingClass =
			characterClass?.system?.spellcasting?.ability ?? "";

		return characterClass && spellcastingClass !== ""
			? true
			: false;
	}


	async castSpell(itemId, options={}) {
		const item = this.items.get(itemId);

		if (!item) {
			ui.notifications.warn(
				"Item no longer exists",
				{ permanent: false }
			);
			return;
		}

		const abilityId = await this.getSpellcastingAbility();

		if (abilityId === "") {
			ui.notifications.error(
				game.i18n.format("SHADOWDARK.error.spells.no_spellcasting_ability_set"),
				{permanent: false}
			);
			return;
		}

		let rollType;
		if (item.type === "Spell") {
			rollType = item.name.slugify();
		}
		else {
			rollType = item.system.spellName.slugify();
		}

		const characterClass = await this.getClass();

		const data = {
			rollType,
			item: item,
			actor: this,
			abilityBonus: this.abilityModifier(abilityId),
			baseDifficulty: characterClass?.system?.spellcasting?.baseDifficulty ?? 10,
			talentBonus: this.system.bonuses.spellcastingCheckBonus,
		};

		const parts = ["1d20", "@abilityBonus", "@talentBonus"];

		// TODO: push to parts & for set talentBonus as sum of talents affecting
		// spell rolls

		return item.rollSpell(parts, data, options);
	}

	async castNPCSpell(itemId, options={}) {
		const item = this.items.get(itemId);

		const abilityBonus = this.system.spellcastingBonus;

		const rollType = item.name.slugify();

		const data = {
			rollType,
			item: item,
			actor: this,
			abilityBonus: abilityBonus,
		};

		const parts = ["1d20", "@abilityBonus"];

		options.isNPC = true;

		return item.rollSpell(parts, data, options);
	}

	async changeLightSettings(lightData) {
		const token = this.getCanvasToken();
		if (token) await token.document.update({light: lightData});

		// Update the prototype as well
		await Actor.updateDocuments([{
			"_id": this._id,
			"prototypeToken.light": lightData,
		}]);
	}


	async getActiveLightSources() {
		const items = this.items.filter(
			item => item.isActiveLight()
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


	async getAncestry() {
		const uuid = this.system.ancestry ?? "";
		return await this._getItemFromUuid(uuid);
	}


	async getArmorClass() {
		const dexModifier = this.abilityModifier("dex");

		let baseArmorClass = shadowdark.defaults.BASE_ARMOR_CLASS;
		baseArmorClass += dexModifier;

		for (const attribute of this.system.bonuses?.acBonusFromAttribute ?? []) {
			const attributeBonus = this.abilityModifier(attribute);
			baseArmorClass += attributeBonus > 0 ? attributeBonus : 0;
		}

		let newArmorClass = baseArmorClass;
		let shieldBonus = 0;

		const acOverride = this.system.attributes.ac?.override ?? null;
		if (Number.isInteger(acOverride)) {
			// AC is being overridden by an effect so we just use that value
			// and ignore everything else
			newArmorClass = acOverride;
		}
		else {
			let armorMasteryBonus = 0;

			const equippedArmorItems = this.items.filter(
				item => item.type === "Armor" && item.system.equipped
			);
			const equippedArmor = [];
			const equippedShields = [];

			for (const item of equippedArmorItems) {
				if (await item.isAShield()) {
					equippedShields.push(item);
				}
				else {
					equippedArmor.push(item);
				}
			}

			if (equippedShields.length > 0) {
				const firstShield = equippedShields[0];
				shieldBonus = firstShield.system.ac.modifier;

				armorMasteryBonus = this.system.bonuses.armorMastery.filter(
					a => a === firstShield.name.slugify()
							|| a === firstShield.system.baseArmor
				).length;
			}

			if (equippedArmor.length > 0) {
				newArmorClass = 0;

				let bestAttributeBonus = null;
				let baseArmorClassApplied = false;

				for (const armor of equippedArmor) {

					// Check if armor mastery should apply to the AC.  Multiple
					// mastery levels should stack
					//
					const masteryLevels = this.system.bonuses.armorMastery.filter(
						a => a === armor.name.slugify()
							|| a === armor.system.baseArmor
					);
					armorMasteryBonus += masteryLevels.length;

					if (armor.system.ac.base > 0) baseArmorClassApplied = true;

					newArmorClass += armor.system.ac.base;
					newArmorClass += armor.system.ac.modifier;

					const attribute = armor.system.ac.attribute;
					if (attribute) {
						const attributeBonus = this.abilityModifier(attribute);
						if (bestAttributeBonus === null) {
							bestAttributeBonus = attributeBonus;
						}
						else {
							bestAttributeBonus =
								attributeBonus > bestAttributeBonus
									? attributeBonus
									: bestAttributeBonus;
						}
					}
				}

				if (!baseArmorClassApplied) {
					// None of the armor we're wearing has a base value, only
					// bonuses so we will use the default base class of
					// 10+DEX to allow for unarmored characters wearing Bracers
					// of defense (as an example)
					//
					newArmorClass += baseArmorClass;
				}

				newArmorClass += bestAttributeBonus;
				newArmorClass += armorMasteryBonus;
				newArmorClass += shieldBonus;
			}
			else if (shieldBonus <= 0) {
				newArmorClass += this.system.bonuses.unarmoredAcBonus ?? 0;
			}
			else {
				newArmorClass += shieldBonus;
			}

			// Add AC from bonus effects
			newArmorClass += parseInt(this.system.bonuses.acBonus, 10);
		}

		this.update({"system.attributes.ac.value": newArmorClass});

		return this.system.attributes.ac.value;
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


	async getClass() {
		const uuid = this.system.class ?? "";
		return await this._getItemFromUuid(uuid);
	}


	async getPatron() {
		const uuid = this.system.patron ?? "";
		return await this._getItemFromUuid(uuid);
	}


	async getDeity() {
		const uuid = this.system.deity ?? "";
		return await this._getItemFromUuid(uuid);
	}


	getRollData() {
		if (this.type === "Light") return;

		const rollData = super.getRollData();

		rollData.initiativeBonus = this.abilityModifier("dex");

		rollData.initiativeFormula = "1d20";
		if (this.system.bonuses?.advantage?.includes("initiative")) {
			rollData.initiativeFormula = "2d20kh1";
		}

		return rollData;
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
				await this._getItemFromUuid(spellClass)
			);
		}

		const spellcasterClasses =
			await shadowdark.compendiums.spellcastingBaseClasses();

		for (const bonusClass of this.system.bonuses.spellcastingClasses ?? []) {
			playerSpellClasses.push(
				spellcasterClasses.find(c => c.name.slugify() === bonusClass)
			);
		}

		return playerSpellClasses.sort((a, b) => a.name.localeCompare(b.name));
	}


	async getSpellcastingAbility() {
		const characterClass = await this.getClass();

		return characterClass?.system?.spellcasting?.ability ?? "";
	}

	async getTitle() {
		const characterClass = await this.getClass();

		if (characterClass && this.system.alignment !== "") {
			const titles = characterClass.system.titles ?? [];
			const level = this.system.level?.value ?? 0;

			for (const title of titles) {
				if (level >= title.from && level <= title.to) {
					return title[this.system.alignment];
				}
			}
		}
		else {
			return "";
		}
	}

	async hasActiveLightSources() {
		return this.getActiveLightSources.length > 0;
	}


	hasAdvantage(data) {
		if (this.type === "Player") {
			return this.system.bonuses.advantage.includes(data.rollType);
		}
		return false;
	}


	async hasNoActiveLightSources() {
		return this.getActiveLightSources.length <= 0;
	}


	async isClaimedByUser() {
		// Check that the Actor is claimed by a User
		return game.users.find(user => user.character?.id === this.id)
			? true
			: false;
	}


	async isSpellCaster() {
		const characterClass = await this.getClass();

		const spellcastingClass =
			characterClass?.system?.spellcasting?.class ?? "__not_spellcaster__";

		const isSpellcastingClass =
			characterClass && spellcastingClass !== "__not_spellcaster__";

		const hasBonusSpellcastingClasses =
			(this.system.bonuses.spellcastingClasses ?? []).length > 0;

		return isSpellcastingClass || hasBonusSpellcastingClasses
			? true
			: false;
	}


	async languageItems() {
		const languageItems = [];

		for (const uuid of this.system.languages ?? []) {
			languageItems.push(await fromUuid(uuid));
		}

		return languageItems.sort((a, b) => a.name.localeCompare(b.name));
	}


	async learnSpell(itemId) {
		const item = this.items.get(itemId);

		const correctSpellClass = item.system.class.includes(
			this.system.class
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


	async openSpellBook() {
		const playerSpellcasterClasses = await this.getSpellcasterClasses();

		const openChosenSpellbook = classUuid => {
			new shadowdark.apps.SpellBookSD(
				classUuid,
				this.id
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
	prepareDerivedData() {
		// if (this.type === "Player") {
		// 	this.updateArmorClass();
		// }
	}


	async rollAbility(abilityId, options={}) {
		const parts = ["1d20", "@abilityBonus"];

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


	async rollAttack(itemId, options={}) {
		const item = this.items.get(itemId);

		const ammunition = item.availableAmmunition();

		let ammunitionItem = undefined;
		if (ammunition && Array.isArray(ammunition) && ammunition.length > 0) {
			ammunitionItem = ammunition[0];
		}

		const data = {
			actor: this,
			ammunitionItem,
			item: item,
			rollType: (item.isWeapon()) ? item.system.baseWeapon.slugify() : item.name.slugify(),
			usesAmmunition: item.usesAmmunition,
		};

		const bonuses = this.system.bonuses;

		// Summarize the bonuses for the attack roll
		const parts = ["1d20", "@itemBonus", "@abilityBonus", "@talentBonus"];
		data.damageParts = [];

		// Check damage multiplier
		const damageMultiplier = Math.max(
			parseInt(data.item.system.bonuses?.damageMultiplier, 10),
			parseInt(data.actor.system.bonuses?.damageMultiplier, 10),
			1);


		// Magic Item bonuses
		if (item.system.bonuses.attackBonus) {
			data.itemBonus = item.system.bonuses.attackBonus;
		}
		if (item.system.bonuses.damageBonus) {
			data.damageParts.push("@itemDamageBonus");
			data.itemDamageBonus = item.system.bonuses.damageBonus * damageMultiplier;
		}

		/* Attach Special Ability if part of the attack.
			Created in `data.itemSpecial` field.
			Can be used in the rendering template or further automation.
		*/
		if (item.system.damage?.special) {
			const itemSpecial = data.actor.items.find(
				e => e.name === item.system.damage.special
					&& e.type === "NPC Feature"
			);

			if (itemSpecial) {
				data.itemSpecial = itemSpecial;
			}
		}

		// Talents & Ability modifiers
		if (this.type === "Player") {

			// Check to see if we have any extra dice that need to be added to
			// the damage rolls due to effects
			//
			await this.getExtraDamageDiceForWeapon(item, data);

			data.canBackstab = await this.canBackstab();

			// Use set options for type of attack or assume item type
			data.attackType = options.attackType ?? item.system.type;

			if (data.attackType === "melee") {
				if (await item.isFinesseWeapon()) {
					data.abilityBonus = Math.max(
						this.abilityModifier("str"),
						this.abilityModifier("dex")
					);
				}
				else {
					data.abilityBonus = this.abilityModifier("str");
				}

				data.talentBonus = bonuses.meleeAttackBonus;
				data.meleeDamageBonus = bonuses.meleeDamageBonus * damageMultiplier;
				data.damageParts.push("@meleeDamageBonus");
			}
			else {
				// if thrown item used as range, use highest modifier.
				if (await item.isThrownWeapon()) {
					data.abilityBonus = Math.max(
						this.abilityModifier("str"),
						this.abilityModifier("dex")
					);
				}
				else {
					data.abilityBonus = this.abilityModifier("dex");
				}

				data.talentBonus = bonuses.rangedAttackBonus;
				data.rangedDamageBonus = bonuses.rangedDamageBonus * damageMultiplier;
				data.damageParts.push("@rangedDamageBonus");
			}

			// Check Weapon Mastery & add if applicable
			const weaponMasterBonus = this.calcWeaponMasterBonus(item);
			data.talentBonus += weaponMasterBonus;
			data.weaponMasteryBonus = weaponMasterBonus * damageMultiplier;
			if (data.weaponMasteryBonus) data.damageParts.push("@weaponMasteryBonus");
		}

		if (data.usesAmmunition && !data.ammunitionItem) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.item.errors.no_available_ammunition"),
				{ permanent: false }
			);
		}

		return item.rollItem(parts, data, options);
	}


	async getExtraDamageDiceForWeapon(item, data) {
		const extraDamageDiceBonuses = this.system.bonuses.weaponDamageExtraDieByProperty ?? [];

		for (const extraBonusDice of extraDamageDiceBonuses) {
			const [die, property] = extraBonusDice.split("|");

			if (await item.hasProperty(property)) {
				data.extraDamageDice = die;

				if (data.damageParts) {
					data.damageParts.push("@extraDamageDice");
				}
				break;
			}
		}

		// If the attack has extra damage die due to an effect, then also
		// check to see if that damage die should be improved from its
		// base type
		//
		if (data.extraDamageDice) {
			const extraDiceImprovements =
				this.system.bonuses.weaponDamageExtraDieImprovementByProperty ?? [];

			for (const property of extraDiceImprovements) {
				if (await item.hasProperty(property)) {
					data.extraDamageDice = shadowdark.utils.getNextDieInList(
						data.extraDamageDice,
						shadowdark.config.DAMAGE_DICE
					);
				}
			}
		}
	}

	async rollHP(options={}) {
		if (this.type === "Player") {
			this._playerRollHP(options);
		}
		else if (this.type === "NPC") {
			this._npcRollHP(options);
		}
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
			"_id": this._id,
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
			"_id": this._id,
			"system.coins": coins,
		}]);
	}


	async toggleLight(active, itemId) {
		if (active) {
			await this.turnLightOn(itemId);
		}
		else {
			await this.turnLightOff();
		}
	}


	async turnLightOff() {
		const noLight = {
			dim: 0,
			bright: 0,
		};

		await this.changeLightSettings(noLight);
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

		await this.changeLightSettings(lightData);
	}

	async useAbility(itemId, options={}) {
		const item = this.items.get(itemId);
		const abilityDescription = await TextEditor.enrichHTML(
			item.system.description,
			{
				secrets: this.isOwner,
				async: true,
				relativeTo: this,
			}
		);
		// Default message values
		let title = "";
		let message = "";
		let success = true;

		// NPC features - no title or checks required
		if (item.type === "NPC Feature") {
			message = `${abilityDescription}`;
		}
		else {
			title = game.i18n.localize("SHADOWDARK.chat.use_ability.title");

			// does ability use on a roll check?
			if (typeof item.system.ability !== "undefined") {
				options = foundry.utils.mergeObject({target: item.system.dc}, options);
				const result = await this.rollAbility(
					item.system.ability,
					options
				);

				success = result?.rolls?.main?.success ?? false;
			}

			// does ability have limited uses?
			if (item.system.limitedUses) {
				if (item.system.uses.available > 0) {
					item.update({
						"system.uses.available": item.system.uses.available - 1,
					});
				}
				else {
					success = false;
					ui.notifications.error(
						game.i18n.format("SHADOWDARK.error.class_ability.no-uses-remaining"),
						{permanent: false}
					);
				}
			}

			const messageType = success
				? "SHADOWDARK.chat.use_ability.success"
				: "SHADOWDARK.chat.use_ability.failure";

			message = game.i18n.format(
				messageType,
				{
					name: this.name,
					ability: item.name,
				}
			);

			if (success) {
				message = `<p>${message}</p>${abilityDescription}`;
			}
		}

		// construct and create chat message
		const cardData = {
			actor: this,
			item: item,
			message,
		};

		let template = "systems/shadowdark/templates/chat/use-ability.hbs";

		const content = await renderTemplate(template, cardData);

		const messageStyles = shadowdark.utils.getMessageStyles();

		await ChatMessage.create({
			title,
			content,
			flags: { "core.canPopout": true },
			flavor: title,
			speaker: ChatMessage.getSpeaker({actor: this, token: this.token}),
			type: messageStyles.OTHER,
			user: game.user.id,
		});

		if (!success && item.system.loseOnFailure) {
			item.update({"system.lost": true});
		}
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

}
