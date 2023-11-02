export default class ActorSD extends Actor {

	backgroundItems = {};


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


	async _npcRollHP(options={}) {
		const data = {
			rollType: "hp",
			actor: this,
			conBonus: Math.max(1, this.system.abilities.con.mod),
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
		if (!this.backgroundItems.class) {
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

		const parts = [this.backgroundItems.class.system.hitPoints];

		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}


	async _populateBackgroundItems() {
		this.backgroundItems.ancestry = await this.getAncestry();
		this.backgroundItems.class = await this.getClass();
		this.backgroundItems.deity = await this.getDeity();

		this.backgroundItems.title = "";
		if (this.backgroundItems.class && this.system.alignment !== "") {
			const titles = this.backgroundItems.class.system.titles ?? [];
			const level = this.system.level?.value ?? 0;

			for (const title of titles) {
				if (level >= title.from && level <= title.to) {
					this.backgroundItems.title = title[this.system.alignment];
					break;
				}
			}
		}
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
		this._populateBackgroundItems();
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
			numAttacks: item.system.attack.num,
			attackBonus: parseInt(item.system.bonuses.attackBonus, 10),
			baseDamage: `${item.system.damage.numDice}${item.system.damage.value}`,
			bonusDamage: parseInt(item.system.bonuses.damageBonus, 10),
			special: item.system.damage.special,
			ranges: item.system.ranges.map(s => game.i18n.localize(
				CONFIG.SHADOWDARK.RANGES[s])).join("/"),
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

		const baseAttackBonus = await item.isFinesseWeapon()
			? Math.max(meleeAttack, rangedAttack)
			: this.attackBonus(item.system.type);

		const weaponOptions = {
			weaponName: item.name,
			handedness: "",
			attackBonus: 0,
			attackRange: "",
			baseDamage: "",
			bonusDamage: 0,
			properties: await item.propertiesDisplay(),
			meleeAttackBonus: this.system.bonuses.meleeAttackBonus,
			rangedAttackBonus: this.system.bonuses.rangedAttackBonus,
		};

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
			if (await item.hasProperty("thrown")) {
				weaponOptions.attackBonus = baseAttackBonus
					+ parseInt(this.system.bonuses.rangedAttackBonus, 10)
					+ parseInt(item.system.bonuses.attackBonus, 10)
					+ weaponMasterBonus;

				weaponOptions.baseDamage = CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE[oneHanded];

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


	async canBackstab() {
		const backstab = this.items.find(i => {
			return i.type === "Talent"
				&& i.name === "Backstab";
		});

		return backstab ? true : false;
	}


	async canUseMagicItems() {
		const characterClass = this.backgroundItems.class;
		const spellcastingClass =
			characterClass?.system?.spellcasting?.ability ?? "";

		return characterClass && spellcastingClass !== ""
			? true
			: false;
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

		const data = {
			rollType,
			item: item,
			actor: this,
			abilityBonus: this.abilityModifier(abilityId),
			talentBonus: this.system.bonuses.spellcastingCheckBonus,
		};

		const parts = ["1d20", "@abilityBonus", "@talentBonus"];

		// TODO: push to parts & for set talentBonus as sum of talents affecting
		// spell rolls

		return item.rollSpell(parts, data);
	}


	async changeLightSettings(lightData) {
		const token = this.getCanvasToken();
		if (token) await token.document.update({light: lightData});

		// Update the prototype as well
		await Actor.updateDocuments([{
			_id: this._id,
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
		const ac = await this.updateArmorClass();
		return ac;
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


	getSpellcastingAbility() {
		const characterClass = this.backgroundItems.class;

		return characterClass?.system?.spellcasting?.ability ?? "";
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


	async isSpellcaster() {
		const characterClass = this.backgroundItems.class;
		const spellcastingClass =
			characterClass?.system?.spellcasting?.class ?? "__not_spellcaster__";

		return characterClass && spellcastingClass !== "__not_spellcaster__"
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


	async rollAttack(itemId) {
		const item = this.items.get(itemId);

		const data = {
			item: item,
			rollType: (item.isWeapon()) ? item.system.baseWeapon.slugify() : item.name.slugify(),
			actor: this,
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
		if (item.system.damage.special) {
			const itemSpecial = data.actor.items.find(
				e => e.name === item.system.damage.special
			);

			if (itemSpecial) {
				data.itemSpecial = itemSpecial;
			}
		}

		// Talents & Ability modifiers
		if (this.type === "Player") {

			if (item.system.type === "melee") {
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

				data.canBackstab = await this.canBackstab();
			}
			else {
				data.abilityBonus = this.abilityModifier("dex");

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


	async updateArmor(updatedItem) {
		// updatedItem is the item that has had its "equipped" field toggled
		// on/off.
		if (updatedItem.system.equipped) {
			// First we need to disable any already equipped armor
			const isAShield = await updatedItem.isAShield();

			const armorToUnequip = [];

			for (const item of this.items) {
				if (!item.system.equipped) continue;
				if (item.type !== "Armor") continue;
				if (item._id === updatedItem._id) continue;

				// Only unequip a shield if the newly equipped item is a shield
				// as well.
				if (isAShield && await item.isAShield()) {
					armorToUnequip.push({
						_id: item._id,
						"system.equipped": false,
					});
				}
				else if (await item.isNotAShield() && !isAShield) {
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

		for (const attribute of this.system.bonuses?.acBonusFromAttribute ?? []) {
			const attributeBonus = this.abilityModifier(attribute);
			baseArmorClass += attributeBonus > 0 ? attributeBonus : 0;
		}

		let newArmorClass = baseArmorClass;
		let armorMasteryBonus = 0;

		const acOverride = this.system.attributes.ac?.override ?? null;
		if (Number.isInteger(acOverride)) {
			// AC is being overridden by an effect so we just use that value
			// and ignore everything else
			newArmorClass = acOverride;
		}
		else {
			const equippedArmor = this.items.filter(
				item => item.type === "Armor" && item.system.equipped
			);
			let nonShieldEquipped = false;
			if (equippedArmor.length > 0) {
				newArmorClass = 0;
				for (let i = 0; i < equippedArmor.length; i++) {
					const armor = equippedArmor[i];

					if (await armor.isNotAShield()) {
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
			else {
				newArmorClass += this.system.bonuses.unarmoredAcBonus ?? 0;
			}

			// Add AC from bonus effects
			newArmorClass += parseInt(this.system.bonuses.acBonus, 10);
		}

		this.updateSource({"system.attributes.ac.value": newArmorClass});

		return newArmorClass;
	}


	async useAbility(itemId) {
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

		// NPC features currently don't have checks
		if (item.type !== "NPC Feature") {
			// does player ability use on a roll check?
			if (item.system.ability !== "") {
				const result = await this.rollAbility(
					item.system.ability,
					{target: item.system.dc}
				);

				success = result?.rolls?.main?.success ?? false;
			}
			// does player ability have limited uses?
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
			title = game.i18n.localize("SHADOWDARK.chat.use_ability.title");
		}
		else {
			message = `${abilityDescription}`;
		}

		const cardData = {
			actor: this,
			item: item,
			message,
		};

		let template = "systems/shadowdark/templates/chat/use-ability.hbs";

		const content = await renderTemplate(template, cardData);

		await ChatMessage.create({
			title,
			content,
			flags: { "core.canPopout": true },
			flavor: title,
			speaker: ChatMessage.getSpeaker({actor: this, token: this.token}),
			type: CONST.CHAT_MESSAGE_TYPES.OTHER,
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
