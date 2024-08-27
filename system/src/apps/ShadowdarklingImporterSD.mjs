export default class ShadowdarklingImporterSD extends FormApplication {
	/**
	 * Contains an importer function to generate player actors from
	 * Shadowdarklings.net. Primary matching is done with a mapping
	 * file, or failing that, a full compendium scan and match attempt.
	 */

	/** @inheritdoc */
	constructor() {
		super();

		this.importedActor ={};
		this.itemMapping = {};
		this.gear =[];
		this.spells =[];
		this.talents =[];
		this.errors = [];
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark"],
			width: 450,
			height: 375,
			resizable: true,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/shadowdarkling-importer.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.apps.shadowdarkling-importer.title");
		return `${title}`;
	}

	/** @inheritdoc */
	activateListeners(html) {
		super.activateListeners(html);
		window.addEventListener("paste", e => this._onPaste(e));
	}

	/** @inheritdoc */
	_onSubmit(event) {
		event.preventDefault();

		super._onSubmit(event);
	}

	/** @override */
	async _updateObject(event, data) {
		this._createActor();
	}

	/** @override */
	async getData(options) {
		const data = {
			actor: this.importedActor,
			errors: this.errors,
			gear: this.gear,
		};

		return data;
	}

	/**
	 * Handles pasting of json data
	 */
	async _onPaste(event) {
		// check if values are already loaded
		if (this.importedActor.name) return;

		let postedJson = "";
		try {
			postedJson = JSON.parse(event.clipboardData.getData("text/plain"));
		}
		catch(error) {
			ui.notifications.error("JSON not found in clipboard");
		}

		if (postedJson) {
			// load all values from json
			await this._importActor(postedJson);
		}
	}

	/**
	 * finds matching items by category
	 */
	async _findItem(itemName, type) {
		// first check the mapping file for the item
		const itemUuid = this.itemMapping?.[type]?.[itemName];
		if (itemUuid) {
			const item = await fromUuid(itemUuid);
			if (item) return item;
		}

		// check all item compendiums for a match
		for (let pack of game.packs) {
			if (pack.metadata.type !== "Item") continue;

			const itemIndex = pack.index.find( i => (
				(i.name.toLowerCase() === itemName.toLowerCase())
				&& (i.type.toLowerCase() === type.toLowerCase())
			));
			if (itemIndex) {
				return pack.getDocument(itemIndex._id);
			}
		}

		// report error if still not found
		const errorMsg = {
			type: type,
			name: itemName,
		};
		this.errors.push(errorMsg);
	}

	/**
	 * finds corresponding talents from bonus data
	 */
	async _findTalent(bonus) {

		// match bonus to talent in the mapping table trying different patterns as
		// data from shadowdarklings is not consistant
		let patternStr = "";
		let valueAttribute = "";

		// Pattern 1: bonusName_bonusTo
		if (this.itemMapping.Bonus?.[`${bonus.bonusName}_${bonus.bonusTo}`]) {
			patternStr = `${bonus.bonusName}_${bonus.bonusTo}`;
		}
		// Pattern 2: bonusName
		else if (this.itemMapping.Bonus?.[`${bonus.bonusName}`]) {
			patternStr = bonus.bonusName;
			valueAttribute = "bonusTo";
		}
		// Pattern 3: bonusTo_bonusName
		else if (this.itemMapping.Bonus?.[`${bonus.bonusTo}_${bonus.bonusName}`]) {
			patternStr = `${bonus.bonusTo}_${bonus.bonusName}`;
		}
		// Pattern 4: bonusTo
		else if (this.itemMapping.Bonus?.[`${bonus.bonusTo}`]) {
			patternStr = bonus.bonusTo;
			valueAttribute = "bonusName";
		}
		else {
			// try a search
		}

		// if found, load talent from lookup table
		if (patternStr) {
			let foundTalent = await fromUuid(this.itemMapping.Bonus?.[patternStr]);
			foundTalent = foundTalent.toObject();
			if (foundTalent.system.talentClass === "level") foundTalent.system.level = bonus.gainedAtLevel;

			// if talent requires a choice, copy selection from bonus
			if (foundTalent.effects[0]?.changes[0].value === "REPLACEME") {
				let value = bonus[valueAttribute];
				foundTalent.effects[0].changes[0].value = value;
				foundTalent.name += ` (${value})`;
			}

			// if talent is a boon, list patron
			if (bonus.sourceCategory === "Boon") {
				foundTalent.name += ` [${bonus.boonPatron}]`;
			}
			// if talent is a blacklotus talent, lable is
			if (bonus.sourceCategory.split("_")[0] === "BlackLotusTalent") {
				foundTalent.name += " [BlackLotus]";
			}

			return foundTalent;
		}
		// if nothing found, report error
		else {
			const errorMsg = {
				type: "Talent",
				name: bonus.name,
			};
			this.errors.push(errorMsg);
		}
	}

	/**
	 * Parses JSON data from shadowdarklings and tries to create an Player actor from it.
	 * @param {JSON} json - JSON Data from the Shadowdarklings.net site
	 * @returns {ActorSD}
	 */
	async _importActor(json) {
		// set template for new actor
		this.importedActor = {
			name: json.name,
			type: "Player",
			system: {
				abilities: {
					str: {
						base: json.rolledStats.STR,
						bonus: 0,
					},
					dex: {
						base: json.rolledStats.DEX,
						bonus: 0,
					},
					con: {
						base: json.rolledStats.CON,
						bonus: 0,
					},
					int: {
						base: json.rolledStats.INT,
						bonus: 0,
					},
					wis: {
						base: json.rolledStats.WIS,
						bonus: 0,
					},
					cha: {
						base: json.rolledStats.CHA,
						bonus: 0,
					},
				},
				alignment: json.alignment.toLowerCase(),
				ancestry: "",
				attributes: {
					hp: {
						value: json.maxHitPoints,
						max: json.maxHitPoints,
						base: (json.ancestry === "Dwarf") ? json.maxHitPoints - 2 : json.maxHitPoints,
					},
				},
				background: "",
				class: "",
				coins: {
					gp: json.gold,
					sp: json.silver,
					cp: json.copper,
				},
				deity: "",
				languages: [],
				level: {
					value: json.level,
					xp: json.XP,
				},
				slots: json.gearSlotsTotal,
			},
		};

		// Load the mapping file
		this.itemMapping = await foundry.utils.fetchJsonWithTimeout(
			"systems/shadowdark/assets/mappings/map-shadowdarkling.json"
		);

		// Load Ancestry
		const ancestry = await this._findItem(json.ancestry, "Ancestry");
		this.importedActor.system.ancestry = ancestry?.uuid ?? "";

		// Load Background
		const background = await this._findItem(json.background, "Background");
		this.importedActor.system.background = background?.uuid ?? "";

		// Load Class
		const classObj = await this._findItem(json.class, "Class");
		this.importedActor.system.class = classObj?.uuid ?? "";

		// Load Deity
		const deity = await this._findItem(json.deity, "Deity");
		this.importedActor.system.deity = deity?.uuid ?? "";

		// Load Languages
		for (const language of json.languages.split(/\s*,\s*/)) {
			const foundLanguage = await this._findItem(language, "Language");
			if (foundLanguage) this.importedActor.system.languages.push(foundLanguage.uuid);
		}

		// Load Gear
		for (const item of json.gear) {
			for (let i = 1; i <= item.quantity; i++) {
				let itemName = item.name;

				// type converstion for basic items
				if (item.type === "sundry") item.type = "Basic";

				const foundItem = await this._findItem(itemName, item.type);
				if (foundItem) this.gear.push(foundItem);
			}
		}

		// Load Spells
		if (json.spellsKnown !== "None") {
			for (const spellName of json.spellsKnown.split(/\s*,\s*/)) {
				const foundSpell = await this._findItem(spellName, "Spell");
				if (foundSpell) this.spells.push(foundSpell);
			}
		}

		// load fixed ancestry talents
		if (ancestry) {
			for (const talentUuid of ancestry.system.talents) {
				let talentObj = await fromUuid(talentUuid);
				talentObj = talentObj.toObject();
				if (talentObj && !(talentObj.effects[0]?.changes[0].value === "REPLACEME")) {
					this.talents.push(talentObj);
				}
			}
		}

		// load fixed class talents
		if (classObj) {
			for (const talentUuid of classObj.system.talents) {
				let talentObj = await fromUuid(talentUuid);
				talentObj = talentObj.toObject();
				if (talentObj && !(talentObj.effects[0]?.changes[0].value === "REPLACEME")) {
					this.talents.push(talentObj);
				}
			}
		}

		// Load Bonuses / talents
		for (const bonus of json.bonuses) {
			// == start special cases ==

			// skip spells, lanuages and specials
			if (/^Spell:/.test(bonus.name)) continue;
			if (/^ExtraLanguage:/.test(bonus.name)) continue;
			if (/^GrantSpecialTalent:/.test(bonus.name)) continue;

			// talents to skip
			const skipTalents = [
				"GainRandomBoon",
				"RollTwoBoonsAndKeepOne",
				"ChooseWarlockTalentOrPatronBoon",
				"PlusTwoWISCHAOrPlus1SpellCasting",
				"GainTwoBlackLotusTalents",
			];
			if (skipTalents.includes(bonus.name)) continue;

			// fix format on ranger damage die
			if (bonus.name === "SetWeaponTypeDamage") {
				bonus.bonusTo = bonus.bonusTo.split(":")[0];
			}

			// == end special cases ==

			// find matching talent
			const talent = await this._findTalent(bonus);
			if (talent) {
				this.talents.push(talent);
			}
		}

		console.log("=================");
		console.log(this.importedActor);
		console.log(this.gear);
		console.log(this.spells);
		console.log(this.talents);
		this.render(false);
	}

	async _createActor() {
		// Create the actor
		const newActor = await Actor.create(this.importedActor);

		const allItems = [
			...this.gear,
			...this.spells,
			...this.talents,
		];

		await newActor.createEmbeddedDocuments("Item", allItems);

		return newActor;
	}

	/**
	 * Manipulates the Spell Advantage talent so it may be used on the actor
	 * @param {string} spell - Spell name to be used for advantage
	 * @returns {ItemSD}
	 */
	async _spellCastingAdvantageTalent(spell) {
		const talent = await this._findInCompendium("Spellcasting Advantage", "shadowdark.talents");
		const modifiedTalent = talent.toObject();
		modifiedTalent.effects[0].changes[0].value = spell.slugify();
		modifiedTalent.name += ` (${spell})`;
		return modifiedTalent;
	}

	/**
	 * Manipulates the Weapon/Armor Mastery talent so it may be used on the actor
	 * @param {string} type - What type of item (armor/weapon)
	 * @param {string} choice - The actual item to be affected
	 * @returns {ItemSD}
	 */
	async _masteryTalent(type, choice) {
		const itemName = choice.split(" ").map(s => s.capitalize()).join(" ");
		const talent = await this._findInCompendium(`${type.capitalize()} Mastery`, "shadowdark.talents");
		const modifiedTalent = talent.toObject();
		modifiedTalent.effects[0].changes[0].value = choice.slugify();
		modifiedTalent.name += ` (${itemName})`;
		return modifiedTalent;
	}

	async _damageDieD12Talent(choice) {
		const itemName = choice.split(":")[0];
		const talent = await this._findInCompendium("Increased Weapon Damage Die", "shadowdark.talents");
		const modifiedTalent = talent.toObject();
		modifiedTalent.effects[0].changes[0].value = choice.split(":")[0].slugify();
		modifiedTalent.name += ` (${itemName})`;
		return modifiedTalent;
	}
}
