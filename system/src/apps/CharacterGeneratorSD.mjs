export default class CharacterGeneratorSD extends FormApplication {

	LEVEL_ZERO_GEAR_TABLE_UUID = "Compendium.shadowdark.rollable-tables.RollTable.WKVfMaGkoXe3DGub";

	/**
	 * Contains functions for building Shadowdark characters
	 */
	constructor(actorUid=null) {
		super();

		this.firstrun = true;

		this.ancestry = null;
		this.class = null;
		this.patron = null;

		this.formData = {
			ancestryTalents: {
				choice: [],
				fixed: [],
				selection: [],
			},
			armor: ["All armor"],
			classDesc: "",
			classHP: "1",
			classTalents: {
				choice: [],
				fixed: [],
				selection: [],
			},
			classAbilities: [],
			editing: false,
			gearSelected: [],
			level0: true,
			level0Class: {},
			patron: {
				formattedDescription: "",
				name: "",
				choose: false,
				required: false,
			},
			startingSpells: [],
			weapons: ["All weapons"],
		};

		// Setup a default actor template
		this.formData.actor = {
			name: "",
			type: "Player",
			system: {
				attributes: {
					hp: {
						base: 1,
						value: 1,
					},
				},
				level: {
					value: 0,
					xp: 0,
				},
				abilities: {
					str: {
						base: 10,
						mod: 0,
					},
					int: {
						base: 10,
						mod: 0,
					},
					dex: {
						base: 10,
						mod: 0,
					},
					wis: {
						base: 10,
						mod: 0,
					},
					con: {
						base: 10,
						mod: 0,
					},
					cha: {
						base: 10,
						mod: 0,
					},
				},
				ancestry: "",
				background: "",
				alignment: "neutral",
				deity: "",
				class: "",
				languages: [],
				patron: "",
				coins: {
					gp: 0,
					sp: 0,
					cp: 0,
				},
				showLevelUp: true,
			},
		};

		if (actorUid) {
			this.formData.editing = true;
			this.actorUid = actorUid;
		}

	}


	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "character-generator"],
			width: 850,
			resizable: false,
			closeOnSubmit: false,
			submitOnChange: true,
		});
	}


	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/character-generator.hbs";
	}


	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.apps.character-generator.title");
		return `${title}`;
	}


	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-action='cg-click']").click(
			event => this._randomizeHandler(event)
		);

		html.find("[data-action='create-character']").click(
			event => this._createCharacter(event)
		);

		html.find("[data-action='update-character']").click(
			event => this._updateCharacter(event)
		);

		html.find("[data-action='clear-ancestry-talents']").click(
			event => this._clearAncestryTalents(event)
		);

		html.find("[data-action='clear-class-talents']").click(
			event => this._clearClassTalents(event)
		);

		html.find("[data-action='clear-patron']").click(
			event => this._clearPatron(event)
		);

		html.find("[data-action='edit-languages']").click(
			event => this._editLanguage()
		);

		html.find("[data-action='select-language']").click(
			event => this._selectLanguage($(event.currentTarget).data("uuid"), $(event.currentTarget).data("key"))
		);

	}


	static async createActorFromData(characterData, characterItems, userId, level0) {
		if (!shadowdark.utils.canCreateCharacter()) return;

		const newActor = await Actor.create(characterData);

		if (!newActor) {
			return ui.notifications.error(
				game.i18n.format("SHADOWDARK.apps.character-generator.error.create", {error: error})
			);
		}

		await newActor.createEmbeddedDocuments("Item", characterItems);

		let maxHP = newActor.system.attributes.hp.base + newActor.system.attributes.hp.bonus;
		let newHP = maxHP;

		await newActor.update({
			"system.attributes.hp.max": maxHP,
			"system.attributes.hp.value": newHP,
		});

		if (userId !== game.userId) {
			const ownership = newActor.ownership;
			ownership[userId] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

			await newActor.update({ownership});

			const user = game.users.get(userId);

			if (user && !user.character) {
				// User doesn't have a character assigned, so assign this new
				// one they just created
				user.update({character: newActor.id});
			}

			game.socket.emit("system.shadowdark", {
				type: "openNewCharacter",
				payload: {actorId: newActor.id, userId, level0},
			});
		}
		else {

			newActor.sheet.render(true);

			return ui.notifications.info(
				game.i18n.localize("SHADOWDARK.apps.character-generator.success"),
				{permanent: false}
			);
		}
	}


	/** @override */
	async getData(options) {
		if (this.firstrun) {
			this.firstrun = false;

			// Put up a loading screen as compendium searching can take a while
			const loadingDialog = new shadowdark.apps.LoadingSD().render(true);

			// Initialize Alignment
			this.formData.alignments = CONFIG.SHADOWDARK.ALIGNMENTS;

			// setup ability range as 3-18
			this.formData.statRange = [];
			for (let i =3; i<19; i++) {
				this.formData.statRange.push(i);
			}

			// set all player ability scores to 10
			CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
				this.formData.actor.system.abilities[x] = { base: 10, mod: 0};
			});

			// load all relevent data from compendiums
			this.formData.ancestries = await shadowdark.compendiums.ancestries();
			this.formData.deities = await shadowdark.compendiums.deities();
			this.formData.backgrounds = await shadowdark.compendiums.backgrounds();
			this.formData.classes = await shadowdark.compendiums.classes();
			this.formData.patrons = await shadowdark.compendiums.patrons();

			for (const deity of this.formData.deities) {
				const alignment = deity.system.alignment === "" ? "?" : deity.system.alignment;
				deity.displayName = `${deity.name} (${alignment})`;
			}

			for (const patron of this.formData.patrons) {
				let fDesc = await this._formatDescription(patron.system.description);
				patron.formattedDescription = fDesc;
			}

			// load all languages in lookup table
			let languages = await shadowdark.compendiums.languages();
			this.formData.languages = {};
			languages.forEach(x => {
				this.formData.languages[x.uuid] = x.name;
			});

			this.formData.commonLanguages = [];
			let common = await shadowdark.compendiums.commonLanguages();
			common.forEach(x => {
				this.formData.commonLanguages.push(x.uuid);
			});

			this.formData.rareLanguages = [];
			let rare = await shadowdark.compendiums.rareLanguages();
			rare.forEach(x => {
				this.formData.rareLanguages.push(x.uuid);
			});

			// find the level 0 class
			this.formData.classes.forEach( classObj => {
				if (classObj.name.toLocaleLowerCase().includes("level 0")) {
					this.formData.level0Class = classObj;
					this.formData.actor.system.class = classObj.uuid;
					this.formData.classes.delete(classObj._id);
				}
			});

			// load info for an exiting actor
			if (this.formData.editing) {

				this.formData.actor = await game.actors.get(this.actorUid).toObject();
				this.formData.editing = true;
				this.formData.level0 = false;
				this.formData.actor.system.class = "";
				await this._loadAncestry(this.formData.actor.system.ancestry, true);
			}

			// loading is finished, pull down the loading screen
			loadingDialog.close({force: true});
		}

		// format talents
		return this.formData;
	}


	_addAncestryTalent(uuid) {
		let talentObj = this.formData.ancestryTalents.choice.find(x => x.uuid === uuid);
		this.formData.ancestryTalents.selection.push(talentObj);
	}


	_addClassTalent(uuid) {
		let talentObj = this.formData.classTalents.choice.find(x => x.uuid === uuid);
		this.formData.classTalents.selection.push(talentObj);
	}


	_calculateModifiers() {
		CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
			let baseInt = this.formData.actor.system.abilities[x].base;
			this.formData.actor.system.abilities[x].mod = Math.floor((baseInt - 10)/2);
		});
	}


	_clearAncestryTalents() {
		this.formData.ancestryTalents.selection = [];
		this.render();
	}


	_clearClassTalents() {
		this.formData.classTalents.selection = [];
		this.render();
	}


	_clearPatron() {
		this.patron = null;
		this.formData.actor.system.patron = null;

		this.formData.patron.choose = false;
		this.formData.patron.required = false;
		this.formData.patron.name = "";
		this.formData.patron.formattedDescription = "";

		if (this.class.system.patron.required) {
			this.formData.patron.choose = true;
			this.formData.patron.required = true;
		}

		this.render();
	}


	async _createCharacter() {

		// sets initial totals on all stats
		for (const key of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			this.formData.actor.system.abilities[key].total =
				this.formData.actor.system.abilities[key].base;
		}

		const allItems = [];

		// load all talents and promp player to choose effects
		const allTalents = [
			...this.formData.ancestryTalents.fixed,
			...this.formData.ancestryTalents.selection,
			...this.formData.classTalents.fixed,
			...this.formData.classTalents.selection,
		];

		// add class abilities
		for (const classAbilityItem of this.formData.classAbilities) {
			allItems.push(await fromUuid(classAbilityItem.uuid));
		}

		// add starting spells
		for (const spellItem of this.formData.startingSpells) {
			allItems.push(await fromUuid(spellItem.uuid));
		}

		// load talents with selection of options
		for (const talentItem of allTalents) {
			allItems.push(await shadowdark.effects.createItemWithEffect(talentItem));
		}

		// Check for Name
		if (this.formData.actor.name === "" ) {
			ui.notifications.error( game.i18n.localize("SHADOWDARK.apps.character-generator.error.name"));
			return;
		}

		// make changes only for level 0 characters
		if (this.formData.level0) {
			this.formData.actor.system.coins.gp = 0;
			this.formData.actor.system.showLevelUp = false;

			// add gear to the items list
			for (const item of this.formData.gearSelected) {
				allItems.push(await fromUuid(item.uuid));
				// add arrows for the shortbow option
				if (item.name === "Shortbow and 5 arrows") {
					let arrows = await fromUuid("Compendium.shadowdark.gear.Item.XXwA9ZWajYEDmcea");
					let fiveArrows = {...arrows};
					fiveArrows.system.quantity = 5;
					allItems.push(fiveArrows);
				}
			}
		}

		// Calculate initial HP
		let hpConMod = this.formData.actor.system.abilities.con.mod;
		if (hpConMod < 1) hpConMod = 1;
		this.formData.actor.system.attributes.hp.base = hpConMod;
		this.formData.actor.system.attributes.hp.value = hpConMod;

		// add auditlog data
		const itemNames = [];
		allItems.forEach(x => itemNames.push(x.name));
		let auditLog = {};
		auditLog[0] = {
			startingStats: this.formData.actor.system.abilities,
			baseHP: this.formData.actor.system.attributes.hp.base,
			itemsGained: itemNames,
		};
		this.formData.actor.system.auditLog = auditLog;

		// Create the new player character
		//
		if (shadowdark.utils.canCreateCharacter()) {
			CharacterGeneratorSD.createActorFromData(
				this.formData.actor,
				allItems,
				game.userId,
				this.formData.level0
			);
		}
		else {
			game.socket.emit("system.shadowdark", {
				type: "createCharacter",
				payload: {
					characterData: this.formData.actor,
					characterItems: allItems,
					userId: game.userId,
					level0: this.formData.level0,
				},
			});
		}

		this.close();
	}


	_editLanguage() {
		if (this.formData.langData.edit === false) {
			this.formData.langData.edit = true;
		}
		else {
			this.formData.langData.edit = false;
		}
		this.render();
	}


	async _formatDescription(text) {
		return await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			jQuery(text.replace(/<p><\/p>/g, " ")).text(),
			{
				async: false,
				cache: false,
			}
		);
	}


	async _getClassObject(uuid) {
		// find the class object from uuid including looking at level0
		let classObj = {};
		if (uuid === this.formData.level0Class.uuid) {
			classObj = this.formData.level0Class;
		}
		else {
			classObj = await fromUuid(uuid);
		}
		return classObj ?? {};
	}


	_getRandom(max) {
		return Math.floor(Math.random() * max);
	}


	_getRandomizationTasks(eventStr) {
		const randomizationTasks = {
			"randomize-alignment": false,
			"randomize-ancestry": false,
			"randomize-background": false,
			"randomize-class": false,
			"randomize-deity": false,
			"randomize-gear": false,
			"randomize-gold": false,
			"randomize-name": false,
			"randomize-stats": false,
		};

		if (eventStr === "randomize-all") {
			Object.keys(randomizationTasks).forEach(
				key => randomizationTasks[key] = true
			);
		}
		else {
			randomizationTasks[eventStr] = true;
		}

		return randomizationTasks;
	}


	async _loadAncestry(uuid, randomize) {
		// grab static talents from ancestry item
		let ancestryObj = await fromUuid(uuid);

		this.formData.ancestryTalents.selection = [];
		this.formData.ancestryTalents.fixed = [];
		this.formData.ancestryTalents.choice = [];

		if (ancestryObj) {
			let talentData = [];

			if (ancestryObj.system.talents) {
				for (const talent of ancestryObj.system.talents) {
					let talentObj = await fromUuid(talent);
					let fDesc = await this._formatDescription(talentObj.system.description);
					talentObj.formattedDescription = fDesc;
					talentData.push(talentObj);
				}
			}

			// fixed talent choice
			if (talentData.length <= ancestryObj.system.talentChoiceCount) {
				this.formData.ancestryTalents.fixed = talentData;
			}
			// multiple talent options.
			else {
				this.formData.ancestryTalents.choice = talentData;
				if (randomize) {
					let tempInt = this._getRandom(talentData.length);
					this.formData.ancestryTalents.selection.push(talentData[tempInt]);
				}
			}
		}

		this.ancestry = ancestryObj;
		await this._loadLanguages(randomize);
	}


	/**
	 * loads linked class items when class is selected
	 * @param {string} Uuid
	 */
	async _loadClass(UuID, randomize) {
		// find the class object
		let classObj = await this._getClassObject(UuID);

		let talentData = [];

		// grab fixed talents from class item
		if (classObj.system.talents) {
			for (const talent of classObj.system.talents) {
				let talentObj = await fromUuid(talent);
				let fDesc = await this._formatDescription(talentObj.system.description);
				talentObj.formattedDescription = fDesc;
				talentData.push(talentObj);
			}
		}

		// sort and save fixed talents
		this.formData.classTalents.fixed = talentData.sort(
			(a, b) => a.name < b.name ? -1 : 1);

		talentData = [];

		// grab starting class abilities from class item
		let classAbilityData = [];

		if (classObj.system.classAbilities) {
			for (const ability of classObj.system.classAbilities) {
				let abilityObj = await fromUuid(ability);
				let fDesc = await this._formatDescription(abilityObj.system.description);
				abilityObj.formattedDescription = fDesc;
				classAbilityData.push(abilityObj);
			}
		}

		if (classObj.system.classAbilityChoices) {
			for (const ability of classObj.system.classAbilityChoices) {
				let classAbilityObj = await fromUuid(ability);
				let fDesc = await this._formatDescription(classAbilityObj.system.description);
				classAbilityObj.formattedDescription = fDesc;
				classAbilityData.push(classAbilityObj);
			}
		}
		this.formData.classAbilities = classAbilityData;

		// grab starting spells (e.g. turn undead) from class item
		let spellData = [];

		if (classObj.system.startingSpells) {
			for (const spell of classObj.system.startingSpells) {
				let spellObj = await fromUuid(spell);
				let fDesc = await this._formatDescription(spellObj.system.description);
				spellObj.formattedDescription = fDesc;
				spellData.push(spellObj);
			}
		}
		this.formData.startingSpells = spellData;

		// grab choice talents from class item
		if (classObj.system.talentChoices) {
			for (const talent of classObj.system.talentChoices) {
				let talentObj = await fromUuid(talent);
				let fDesc = await this._formatDescription(talentObj.system.description);
				talentObj.formattedDescription = fDesc;
				talentData.push(talentObj);
			}
		}
		this.formData.classTalents.choice = talentData;
		this.formData.classTalents.selection = [];

		if (randomize && (talentData.length > 0)) {
			let tempInt = this._getRandom(talentData.length);
			this.formData.classTalents.selection.push(talentData[tempInt]);
		}

		// load hit dice information and randomize HP
		if (classObj.system.hitPoints) {
			this.formData.classHP = classObj.system.hitPoints;
		}
		else {
			this.formData.classHP = "1";
		}

		// get armor details
		let armorData = [];
		if (classObj.system.allArmor === true) {
			armorData = ["All armor"];
		}
		for (const armor of classObj.system.armor) {
			armorData.push(fromUuidSync(armor).name);
		}
		this.formData.armor = armorData;

		// get weapon details
		let weaponData = [];
		switch (true) {
			case classObj.system.allWeapons:
			case (classObj.system.allMeleeWeapons && classObj.system.allRangedWeapons):
				weaponData = ["All weapons"];
				break;
			case classObj.system.allMeleeWeapons:
				weaponData = ["All Melee Weapons"];
				break;
			case classObj.system.allRangedWeapons:
				weaponData = ["All Ranged Weapons"];
				break;
		}
		for (const weapon of classObj.system.weapons) {
			const weaponItem = await fromUuid(weapon);

			if (weaponItem) {
				weaponData.push(weaponItem.name);
			}
		}
		this.formData.weapons = weaponData.sort((a, b) => a.localeCompare(b));

		this.class = classObj;
		this.formData.classDesc = await this._formatDescription(classObj.system.description);
		await this._loadLanguages();

		this.patron = null;
		this.formData.patron.choose = false;
		this.formData.patron.required = false;
		this.formData.actor.system.patron = null;
		this.formData.patron.name = "";

		if (this.class.system.patron.required) {
			this.formData.patron.choose = true;
			this.formData.patron.required = true;

			if (randomize) await this._randomizePatron();
		}

		if (this.class.system.alignment !== "") {
			this.formData.actor.system.alignment = this.class.system.alignment;
		}
	}


	async _loadLanguages() {
		let langData = {
			fixed: [],
			togglable: false,
			edit: false,
			ancestry: {
				selected: [],
				Unselected: [],
				select: 0,
				full: false,
			},
			class: {
				selected: [],
				Unselected: [],
				select: 0,
				full: false,
			},
			common: {
				selected: [],
				Unselected: [],
				select: 0,
				full: false,
			},
			rare: {
				selected: [],
				Unselected: [],
				select: 0,
				full: false,
			},
		};

		// set formData form the ancestry object if it exists
		if (this.ancestry?.system?.languages) {
			langData.fixed = this.ancestry.system.languages.fixed;
			langData.ancestry.select = this.ancestry.system.languages.select;
			langData.common.select += this.ancestry.system.languages.common;
			langData.rare.select += this.ancestry.system.languages.rare;
		}

		// set formData form the class object if it exists
		if (this.class?.system?.languages) {
			// combine both fixed arrays into a set to de-dupe
			langData.fixed = [...new Set([
				...langData.fixed,
				...this.class.system.languages.fixed,
			])];
			langData.class.select = this.class.system.languages.select;
			langData.common.select += this.class.system.languages.common;
			langData.rare.select += this.class.system.languages.rare;
		}

		this.formData.langData = langData;
		this._updateLangData();

		// randomly select languages and if there are options to edit
		if (this.formData.langData.class.select > 0) {
			this.formData.langData.togglable = true;
			this._setRandomLanguage("class", this.formData.langData.class.select);
		}
		if (this.formData.langData.ancestry.select > 0) {
			this.formData.langData.togglable = true;
			this._setRandomLanguage("ancestry", this.formData.langData.ancestry.select);
		}
		if (this.formData.langData.common.select > 0) {
			this.formData.langData.togglable = true;
			this._setRandomLanguage("common", this.formData.langData.common.select);
		}
		if (this.formData.langData.rare.select > 0) {
			this.formData.langData.togglable = true;
			this._setRandomLanguage("rare", this.formData.langData.rare.select);
		}
	}


	async _loadPatron(UuID) {
		this.patron = await this._getClassObject(UuID);

		this.formData.patron.choose = false;
		this.formData.patron.name = this.patron.name;
		this.formData.patron.required = true;

		let fDesc = await this._formatDescription(this.patron.system.description);
		this.formData.patron.formattedDescription = fDesc;

	}


	async _randomizeAlignment() {
		switch (await this._roll("d6")) {
			case 1:
			case 2:
			case 3:
				this.formData.actor.system.alignment = "lawful";
				break;
			case 4:
			case 5:
				this.formData.actor.system.alignment = "neutral";
				break;
			default:
				this.formData.actor.system.alignment = "chaotic";
		}
	}


	async _randomizeAncestry() {
		// generate an array of ancestries values adding duplicates based on
		// weights
		const ancestryArray = [];
		this.formData.ancestries.forEach(a => {
			for (let i = 0; i < (a?.system.randomWeight || 1); i++) {
				ancestryArray.push(a.uuid);
			}
		});
		// select random array value and load the ancestry
		let tempInt = this._getRandom(ancestryArray.length);
		let ancestryID = ancestryArray[tempInt];
		this.formData.actor.system.ancestry = ancestryID;
		await this._loadAncestry(ancestryID, true);
	}


	_randomizeBackground() {
		let tempInt = this._getRandom(this.formData.backgrounds.size);
		this.formData.actor.system.background = [...this.formData.backgrounds][tempInt].uuid;
	}


	async _randomizeClass() {
		if (this.formData.level0) return;

		let tempInt = this._getRandom(this.formData.classes.size);
		let classID = [...this.formData.classes][tempInt].uuid;
		this.formData.actor.system.class = classID;
		await this._loadClass(classID, true);
	}


	_randomizeDeity() {
		let tempInt = this._getRandom(this.formData.deities.size);
		this.formData.actor.system.deity = [...this.formData.deities][tempInt].uuid;
	}


	async _randomizeGear() {
		const table = await fromUuid(this.LEVEL_ZERO_GEAR_TABLE_UUID);

		if (!table) return;

		try {
			const draw = await table.draw({displayChat: false});

			this.formData.gearSelected = (
				await shadowdark.utils.getItemsFromRollResults(draw.results)
			).sort((a, b) => a.name.localeCompare(b.name));
		}
		catch(error) {
			shadowdark.error(error);
		}
	}


	async _randomizeGold() {
		let startingGold = await this._roll("2d6") * 5;
		this.formData.actor.system.coins.gp = startingGold;
	}


	async _randomizeHandler(event) {
		const eventStr = event.target.name;

		const randomizationTasks = this._getRandomizationTasks(eventStr);

		if (randomizationTasks["randomize-alignment"]) await this._randomizeAlignment();
		if (randomizationTasks["randomize-ancestry"]) await this._randomizeAncestry();
		if (randomizationTasks["randomize-background"]) this._randomizeBackground();
		if (randomizationTasks["randomize-class"]) await this._randomizeClass();
		if (randomizationTasks["randomize-deity"]) this._randomizeDeity();
		if (randomizationTasks["randomize-gear"]) await this._randomizeGear();
		if (randomizationTasks["randomize-gold"]) await this._randomizeGold();
		if (randomizationTasks["randomize-name"]) await this._randomizeName();
		if (randomizationTasks["randomize-stats"]) await this._randomizeStats();

		shadowdark.utils.diceSound();

		this.render();
	}


	async _randomizeName() {
		// Looks up the name table from the ancestry and rolls a random name
		if (!this.ancestry) return ui.notifications.warn(
			game.i18n.localize("SHADOWDARK.apps.character-generator.error.no_ancestry_for_name"),
			{permanent: false}
		);

		const table = await fromUuid(this.ancestry.system.nameTable);
		if (table) {
			const result = await table.draw({displayChat: false});
			// regex to remove all html tags when the names are edited by the table editor
			this.formData.actor.name = result.results[0].text.replace(/<\/?[^>]*>/g, "");
		}
		else {
			this.formData.actor.name = `Unnamed ${this.ancestry.name}`;
		}
	}


	async _randomizePatron() {
		const tempInt = this._getRandom(this.formData.patrons.size);
		const patronUuid = [...this.formData.patrons][tempInt].uuid;

		this.formData.actor.system.patron = patronUuid;
		await this._loadPatron(patronUuid, true);
	}


	_removeParagraphs(value) {
		return value.replace(/(<p[^>]+?>|<p>|<\/p>)/img, "");
	}


	async _randomizeStats() {
		for (const key of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			this.formData.actor.system.abilities[key].base = await this._roll("3d6");
		}
		this._calculateModifiers();
	}


	async _roll(formula) {
		let roll = await new Roll(formula).evaluate();
		return roll._total;
	}


	_selectLanguage(uuid, key) {
		// remove selected uuid if already in array
		if (this.formData.langData[key].selected.includes(uuid)) {
			this.formData.langData[key].selected = this.formData.langData[key].selected.filter(
				i => i !== uuid);
			this.formData.langData[key].full = false;
		}
		// add uuid to array
		else {
			this.formData.langData[key].selected.push(uuid);
			if (this.formData.langData[key].selected.length >= this.formData.langData[key].select) {
				this.formData.langData[key].full = true;
			}
		}

		this._updateLangData();
		this.render();
	}


	_setRandomLanguage(key, count) {
		for (let i = 0; i < count; i++) {
			let randomInt = this._getRandom(this.formData.langData[key].unselected.length);
			this.formData.langData[key].selected.push(
				this.formData.langData[key].unselected[randomInt]
			);
			this._updateLangData();
		}
		this.formData.langData[key].full = true;
	}


	async _updateCharacter() {
		let actorRef = game.actors.get(this.actorUid);

		// set class, languages and starting gold
		await actorRef.update({
			system: {
				class: this.formData.actor.system.class,
				languages: this.formData.actor.system.languages,
				coins: {gp: this.formData.actor.system.coins.gp},
				showLevelUp: true,
			} });


		// Add class talents and promp player to choose effects
		const allTalents = [
			...this.formData.classTalents.fixed,
			...this.formData.classTalents.selection,
		];

		// Add class abilities
		const allClassAbilities = [
			...this.formData.classAbilities,
		];

		// Add starting spells (priest)
		const allStartingSpells = [
			...this.formData.startingSpells,
		];

		// load talents and abilities with selection of options
		const allItems = [];
		for (const talentItem of allTalents) {
			allItems.push(await shadowdark.effects.createItemWithEffect(talentItem));
		}
		for (const classAbilityItem of allClassAbilities) {
			allItems.push(await fromUuid(classAbilityItem.uuid));
		}
		for (const spell of allStartingSpells) {
			allItems.push(await fromUuid(spell.uuid));
		}

		await actorRef.createEmbeddedDocuments("Item", allItems);

		// open actor sheet
		actorRef.sheet.render(true);
		this.close();
	}


	_updateLangData() {
		// adjust selected languages
		// TODO figure out how to sort this
		this.formData.actor.system.languages = [
			...this.formData.langData.fixed,
			...this.formData.langData.ancestry.selected,
			...this.formData.langData.class.selected,
			...this.formData.langData.common.selected,
			...this.formData.langData.rare.selected,
		];

		// adjust ancestry choices
		if (this.ancestry?.system?.languages) {
			this.formData.langData.ancestry.unselected =
			this.ancestry.system.languages.selectOptions.filter(
				x => !this.formData.actor.system.languages.includes(x));
		}

		// adjust class choices
		if (this.class?.system?.languages) {
			this.formData.langData.class.unselected =
			this.class.system.languages.selectOptions.filter(
				x => !this.formData.actor.system.languages.includes(x));
		}

		// adjust Common choices
		this.formData.langData.common.unselected = this.formData.commonLanguages.filter(
			x => !this.formData.actor.system.languages.includes(x));

		// adjust Rares choices
		this.formData.langData.rare.unselected = this.formData.rareLanguages.filter(
			x => !this.formData.actor.system.languages.includes(x));
	}


	/** @inheritdoc */
	async _updateObject(event, data) {
		// expand incoming data for compatibility with formData
	    let expandedData = foundry.utils.expandObject(data);

		// covert incoming stat data from string to int
		if (expandedData.actor.system.abilities) {
			CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
				let baseInt = parseInt(expandedData.actor.system.abilities[x].base);
				expandedData.actor.system.abilities[x].base = baseInt;
			});
		}

		expandedData.level0 = (data.level0 === "true");

		// merge incoming data into the main formData object
		this.formData = foundry.utils.mergeObject(this.formData, expandedData);

		// if stats were changed, calculate new modifiers
		if (event.target.id === "stat") {
			this._calculateModifiers();
		}

		switch (event.target.name) {
			// if class data was changed, load new data and roll hp
			case "actor.system.class":
				await this._loadClass(event.target.value);
				break;

			case "actor.system.patron":
				await this._loadPatron(event.target.value);
				break;

			// if ancestry data was changed, load new data
			case "actor.system.ancestry":
				await this._loadAncestry(event.target.value);
				break;

			// if ancestry talents where choosen, load new data
			case "ancestryTalents.selected":
				this._addAncestryTalent(event.target.value);
				break;

			// if class talents where choosen, load new data
			case "classTalents.selected":
				this._addClassTalent(event.target.value);
				break;

			case "level0":
				if (this.formData.level0) {
					this.formData.actor.system.class = this.formData.level0Class.uuid;
					this._loadClass(this.formData.level0Class.uuid);
				}
				break;
		}

		this.render();
	}
}
