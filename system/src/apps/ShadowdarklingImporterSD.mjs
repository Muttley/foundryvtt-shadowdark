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
			classes: ["shadowdark", "shadowdarkling-importer"],
			width: 450,
			height: 550,
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
		const itemUuid = this.itemMapping?.[type.toLowerCase()]?.[itemName];
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
		this.errors.push({
			type: type,
			name: itemName,
		});
	}

	/**
	 * finds matching spells by category and class
	 */
	async _findSpell(spell) {
		// check all item compendiums for a match
		for (let pack of game.packs) {
			if (pack.metadata.type !== "Item") continue;

			// get class id
			const classObj = this.classList.find(c =>
				c.name.toLowerCase() === spell.sourceName.toLowerCase()
			);

			const itemIndex = pack.index.find( s => (
				(s.name.toLowerCase() === spell.bonusName.toLowerCase())
				&& (s.type === "Spell")
				&& (s.system.class.includes(classObj?.uuid))
			));
			if (itemIndex) {
				return pack.getDocument(itemIndex._id);
			}
		}

		// report error if still not found
		this.errors.push({
			type: "Spell",
			name: spell.bonusName,
		});
	}

	/**
	 * finds corresponding talents from bonus data
	 */
	async _findTalent(bonus) {

		// match bonus to talent in the mapping table trying different patterns as
		// data from shadowdarklings is not consistant
		let patternStr = "";
		let valueAttribute = "";
		let foundTalent = null;

		// Pattern 1: bonusName_bonusTo
		if (this.itemMapping.bonus?.[`${bonus.bonusName}_${bonus.bonusTo}`]) {
			patternStr = `${bonus.bonusName}_${bonus.bonusTo}`;
		}
		// Pattern 2: bonusName
		else if (this.itemMapping.bonus?.[`${bonus.bonusName}`]) {
			patternStr = bonus.bonusName;
			valueAttribute = "bonusTo";
		}
		// Pattern 3: bonusTo_bonusName
		else if (this.itemMapping.bonus?.[`${bonus.bonusTo}_${bonus.bonusName}`]) {
			patternStr = `${bonus.bonusTo}_${bonus.bonusName}`;
		}
		// Pattern 4: bonusTo
		else if (this.itemMapping.bonus?.[`${bonus.bonusTo}`]) {
			patternStr = bonus.bonusTo;
			valueAttribute = "bonusName";
		}
		else {
			// try a search
		}

		// if found, try to load talent from lookup table
		if (patternStr) {
			foundTalent = await fromUuid(this.itemMapping.bonus?.[patternStr]);
		}

		if (foundTalent) {
			foundTalent = foundTalent.toObject();

			// set level gained for level talents
			if (foundTalent.system.talentClass === "level") foundTalent.system.level = bonus.gainedAtLevel;

			// if talent requires a choice, copy selection from bonus
			if (foundTalent.effects[0]?.changes[0].value === "REPLACEME") {
				// covert to title case
				let value = bonus[valueAttribute].replace(/\b\w/g, s => s.toUpperCase());
				foundTalent.name += ` (${value})`;
				// covert to lower case with dashes
				foundTalent.effects[0].changes[0].value =
					value.replace(/\s+/g, "-").toLowerCase();
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
			this.errors.push({
				type: "Talent",
				name: bonus.name,
			});
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

		// checks for missing sources
		const gameSources = await shadowdark.compendiums.sources();
		for (const [key, value] of Object.entries(this.itemMapping.requiredSources)) {
			if (json.activeSources.includes(key)) {
				if (gameSources.find(x => x.uuid === value)) {
					console.log(value);
				}
				else {
					this.errors.push({
						type: "Source",
						name: value,
					});
				}
			}
		}

		// Load Ancestry
		const ancestry = await this._findItem(json.ancestry, "Ancestry");
		this.importedActor.system.ancestry = ancestry?.uuid ?? "";

		// Load Background
		const background = await this._findItem(json.background, "Background");
		this.importedActor.system.background = background?.uuid ?? "";

		// Load Deity
		const deity = await this._findItem(json.deity, "Deity");
		this.importedActor.system.deity = deity?.uuid ?? "";

		// Load Languages
		for (const language of json.languages.split(/\s*,\s*/)) {
			const foundLanguage = await this._findItem(language, "Language");
			if (foundLanguage) this.importedActor.system.languages.push(foundLanguage.uuid);
		}

		// Load Class
		this.classList = await shadowdark.compendiums.classes(false);
		const classObj = this.classList.find(c =>
			c.name.toLowerCase() === json.class.toLowerCase()
		);
		this.importedActor.system.class = classObj?.uuid ?? "";

		// Load fixed ancestry talents
		if (ancestry) {
			for (const talentUuid of ancestry.system.talents) {
				let talentObj = await fromUuid(talentUuid);
				talentObj = talentObj.toObject();
				if (talentObj && !(talentObj.effects[0]?.changes[0].value === "REPLACEME")) {
					this.talents.push(talentObj);
				}
			}
		}

		// Load fixed class talents
		if (classObj) {
			for (const talentUuid of classObj.system.talents) {
				let talentObj = await fromUuid(talentUuid);
				talentObj = talentObj.toObject();
				if (talentObj && !(talentObj.effects[0]?.changes[0].value === "REPLACEME")) {
					this.talents.push(talentObj);
				}
			}
		}

		// Load Gear
		for (const item of json.gear) {
			// type converstion for basic items
			if (item.type === "sundry") item.type = "basic";

			// coin already included in total
			if (item.name === "Coins") continue;

			// find a load items
			for (let i = 1; i <= item.quantity; i++) {
				const foundItem = await this._findItem(item.name, item.type);
				if (foundItem) this.gear.push(foundItem);
			}
		}

		// Load Treasure
		for (const treasure of json.treasures) {
			const treasureObj = {
				name: treasure.name,
				type: "Basic",
				system: {
					description: `<p>${treasure.desc}</p>`,
					cost: {
						[treasure.currency]: treasure.cost,
					},
					slots: {
						slots_used: treasure.slots,
					},
					treasure: true,
				},
			};
			this.gear.push(treasureObj);
		}

		// magic items (not implemented)
		for (const item of json.magicItems) {
			this.errors.push({
				type: "Magic Item",
				name: item.name,
			});
		}

		// Load Bonuses / talents & Spells
		for (const bonus of json.bonuses) {

			// skip lanuages and specials grants
			if (/^ExtraLanguage:/.test(bonus.name)) continue;
			if (/^ExtraLanguageManual:/.test(bonus.name)) continue;
			if (/^GrantSpecialTalent:/.test(bonus.name)) continue;

			// skip talent if on the ignore list
			if (this.itemMapping.ignoreTalents.includes(bonus.name)) continue;

			// fix format on ranger damage die
			if (bonus.name === "SetWeaponTypeDamage") {
				bonus.bonusTo = bonus.bonusTo.split(":")[0];
			}

			// find matching spell and load
			if (/^Spell:/.test(bonus.name)) {
				const spell = await this._findSpell(bonus);
				if (spell) this.spells.push(spell);
				continue;
			}

			// find matching talent and load
			const talent = await this._findTalent(bonus);
			if (talent) {
				this.talents.push(talent);
			}
		}
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
}
