export default class CharacterGeneratorSD extends FormApplication {
	/**
	 * Contains functions for building Shadowdark characters
	 */
	constructor(actorUid=null) {
		super();

		loadTemplates({
			"cg-details": "systems/shadowdark/templates/apps/partials/cg-details.hbs",
			"cg-language-choice": "systems/shadowdark/templates/apps/partials/cg-language-choice.hbs",
		});

		this.firstrun = true;
		this.ancestry = null;
		this.class = null;

		this.formData = {};
		this.formData.editing = false;
		this.formData.level0 = true;
		this.formData.level0Class = {};
		this.formData.classHP = "1";
		this.formData.armor = ["All armor"];
		this.formData.weapons =["All weapons"];
		this.formData.ancestryTalents = {
			fixed: [],
			choice: [],
			selection: [],
		};
		this.formData.classTalents = {
			fixed: [],
			choice: [],
			selection: [],
		};

		// TODO replace with the rolltable for this. Rolltable data needs fixing first.
		this.gearTable = [
			{name: "Torch", uuid: "Compendium.shadowdark.gear.Item.z3xc7HGysC4ZCU8e"},
			{name: "Dagger", uuid: "Compendium.shadowdark.gear.Item.C3mc5OlKPSJNMrng"},
			{name: "Pole", uuid: "Compendium.shadowdark.gear.Item.15X5GTX96y339EKY"},
			{name: "Shortbow and 5 arrows", uuid: "Compendium.shadowdark.gear.Item.UfHAWj5weH111Bea"},
			{name: "Rope, 60'", uuid: "Compendium.shadowdark.gear.Item.6ZRwVHFlh5QiyZWC"},
			{name: "Oil, Flask", uuid: "Compendium.shadowdark.gear.Item.80bCpXdZcj0Cz1fE"},
			{name: "Crowbar", uuid: "Compendium.shadowdark.gear.Item.GbO6CggW71qMkgrG"},
			{name: "Iron Spikes (10)", uuid: "Compendium.shadowdark.gear.Item.EPndk3DPOEOSvbga"},
			{name: "Flint and Steel", uuid: "Compendium.shadowdark.gear.Item.ERprfuTIFRFEix9G"},
			{name: "Grappling Hook", uuid: "Compendium.shadowdark.gear.Item.fqsLWV46NWH0L53l"},
			{name: "Club", uuid: "Compendium.shadowdark.gear.Item.JM2XN855QYNhgtre"},
			{name: "Caltrops (one bag)", uuid: "Compendium.shadowdark.gear.Item.SzpjMuJrhF5nMJ7H"},
		];
		this.formData.gearSelected = [];

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
				coins: {
					gp: 0,
					sp: 0,
					cp: 0,
				},
			},
		};

		if (actorUid) {
			this.formData.editing = true;
			this.actorUid = actorUid;
		}

	}

	/** @inheritdoc */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["character-generator"],
			width: 836,
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

		html.find("[data-action='edit-languages']").click(
			event => this._editLanguage()
		);

		html.find("[data-action='select-language']").click(
			event => this._selectLanguage($(event.currentTarget).data("uuid"), $(event.currentTarget).data("key"))
		);

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
		this.formData = mergeObject(this.formData, expandedData);

		// if stats were changed, calculate new modifiers
		if (event.target.id === "stat") {
			this._calculateModifiers();
		}

		switch (event.target.name) {
			// if class data was changed, load new data and roll hp
			case "actor.system.class":
				await this._loadClass(event.target.value);
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

	diceSound() {
		const sounds = [CONFIG.sounds.dice];
		const src = sounds[0];
		AudioHelper.play({src});
	}

	async _randomizeHandler(event) {
		const eventStr = event.target.name;
		let tempInt = 0;

		// randomize ancestry
		if (eventStr === "randomize-ancestry" || eventStr === "randomize-all") {
			// generate an array of ancestries values adding duplicates based on weights
			const ancestryArray = [];
			this.formData.ancestries.forEach(a => {
				for (let i = 0; i < (a?.system.randomWeight || 1); i++) {
					ancestryArray.push(a.uuid);
				}
			});
			// select random array value and load the ancestry
			tempInt = this._getRandom(ancestryArray.length);
			let ancestryID = ancestryArray[tempInt];
			this.formData.actor.system.ancestry = ancestryID;
			await this._loadAncestry(ancestryID, true);
		}

		// randomize background
		if (eventStr === "randomize-background" || eventStr === "randomize-all") {
			tempInt = this._getRandom(this.formData.backgrounds.size);
			this.formData.actor.system.background = [...this.formData.backgrounds][tempInt].uuid;
		}

		// randomize deities
		if (eventStr === "randomize-deity" || eventStr === "randomize-all") {
			tempInt = this._getRandom(this.formData.deities.size);
			this.formData.actor.system.deity = [...this.formData.deities][tempInt].uuid;
		}

		// randomize alignment
		if (eventStr === "randomize-alignment" || eventStr === "randomize-all") {
			switch (this._roll("d6")) {
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

		// randomize class
		if (!this.formData.level0 && (eventStr === "randomize-class" || eventStr === "randomize-all")) {
			tempInt = this._getRandom(this.formData.classes.size);
			let classID = [...this.formData.classes][tempInt].uuid;
			this.formData.actor.system.class = classID;
			await this._loadClass(classID, true);
		}

		// randomize stats
		if (eventStr === "randomize-stats" || eventStr === "randomize-all") {
			CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
				this.formData.actor.system.abilities[x].base = this._roll("3d6");
			});
			this._calculateModifiers();
		}

		// randomize name
		if (eventStr === "randomize-name" || eventStr === "randomize-all") {
			await this._randomizeName();
		}

		// Roll starting gold
		if (eventStr === "randomize-gold" || eventStr === "randomize-all") {
			let startingGold = this._roll("2d6")*5;
			this.formData.actor.system.coins.gp = startingGold;
		}

		// Roll starting gear
		if (eventStr === "randomize-gear" || eventStr === "randomize-all") {
			this._randomizeGear();
		}

		this.diceSound();

		// update all changes
		this.render();
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
				let fDesc = this._formatDescription(talentObj.system.description);
				talentObj.formattedDescription = fDesc;
				talentData.push(talentObj);
			}
		}

		// sort and save fixed talents
		this.formData.classTalents.fixed = talentData.sort(
			(a, b) => a.name < b.name ? -1 : 1);

		talentData = [];

		// grab choice talents from class item
		if (classObj.system.talentChoices) {
			for (const talent of classObj.system.talentChoices) {
				let talentObj = await fromUuid(talent);
				let fDesc = this._formatDescription(talentObj.system.description);
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
			weaponData.push(fromUuidSync(weapon).name);
		}
		this.formData.weapons = weaponData;

		this.class = classObj;
		await this._loadLanguages(randomize);

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
					let fDesc = this._formatDescription(talentObj.system.description);
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

	async _loadLanguages(randomize) {
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

	async _randomizeName() {
		// Looks up the name table from the ancestry and rolls a random name
		if (!this.ancestry) return ui.notifications.warn(
			game.i18n.localize("SHADOWDARK.apps.character-generator.error.no_ancestry_for_name"),
			{permanent: false}
		);

		const table = await fromUuid(this.ancestry.system.nameTable);
		if (table) {
			const result = await table.draw({displayChat: false});
			this.formData.actor.name = result.results[0].text;
		}
		else {
			this.formData.actor.name = `Unnamed ${this.ancestry.name}`;
		}
	}

	_randomizeGear() {
		this.formData.gearSelected = [];
		let tempGearTable = [...this.gearTable];
		let gearCount = this._roll("d4");
		// get an item from the temp table, then remove that item to prevent duplicates
		for (let i = 0; i < gearCount; i++) {
			let randomIndex = this._getRandom(12-i);
			let gearItem = tempGearTable[randomIndex];
			this.formData.gearSelected.push(gearItem);
			tempGearTable.splice(randomIndex, 1);
		}
	}

	_getRandom(max) {
		return Math.floor(Math.random() * max);
	}

	_roll(formula) {
		let roll = new Roll(formula).evaluate({async: false});
		return roll._total;
	}

	_calculateModifiers() {
		CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
			let baseInt = this.formData.actor.system.abilities[x].base;
			this.formData.actor.system.abilities[x].mod = Math.floor((baseInt - 10)/2);
		});
	}

	_removeParagraphs(value) {
		return value.replace(/(<p[^>]+?>|<p>|<\/p>)/img, "");
	}

	_formatDescription(text) {

		const description = TextEditor.enrichHTML(
			jQuery(text.replace(/<p><\/p>/g, " ")).text(),
			{
				async: false,
				cache: false,
			}
		);
		return description;
	}

	_addAncestryTalent(uuid) {
		let talentObj = this.formData.ancestryTalents.choice.find(x => x.uuid === uuid);
		this.formData.ancestryTalents.selection.push(talentObj);
	}

	_clearAncestryTalents() {
		this.formData.ancestryTalents.selection = [];
		this.render();
	}

	_addClassTalent(uuid) {
		let talentObj = this.formData.classTalents.choice.find(x => x.uuid === uuid);
		this.formData.classTalents.selection.push(talentObj);
	}

	_clearClassTalents() {
		this.formData.classTalents.selection = [];
		this.render();
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

	static async createActorFromData(characterData, characterItems, userId, level0) {
		if (!shadowdark.utils.canCreateCharacter()) return;

		const newActor = await Actor.create(characterData);

		if (!newActor) {
			return ui.notifications.error(
				game.i18n.format("SHADOWDARK.apps.character-generator.error.create", {error: error})
			);
		}

		await newActor.createEmbeddedDocuments("Item", characterItems);

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
			if (level0) {
				newActor.sheet.render(true);
			}
			else {
				new shadowdark.apps.LevelUpSD(newActor.id).render(true);
			}

			return ui.notifications.info(
				game.i18n.localize("SHADOWDARK.apps.character-generator.success"),
				{permanent: false}
			);
		}
	}

	async _createCharacter() {

		const allItems = [];

		// load all talents and promp player to choose effects
		const allTalents = [
			...this.formData.ancestryTalents.fixed,
			...this.formData.ancestryTalents.selection,
			...this.formData.classTalents.fixed,
			...this.formData.classTalents.selection,
		];

		for (const talentItem of allTalents) {
			allItems.push(await shadowdark.utils.createItemWithEffect(talentItem));
		}

		// Check for Name
		if (this.formData.actor.name === "" ) {
			ui.notifications.error( game.i18n.localize("SHADOWDARK.apps.character-generator.error.name"));
			return;
		}

		// make changes only for level 0 characters
		if (this.formData.level0) {
			this.formData.actor.system.coins.gp = 0;

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

	async _updateCharacter() {

		let actorRef = game.actors.get(this.actorUid);

		// set class, languages and starting gold
		await actorRef.update({
			system: {
				class: this.formData.actor.system.class,
				languages: this.formData.actor.system.languages,
				coins: {gp: this.formData.actor.system.coins.gp},
			} });

		// add class talents
		const allItems = [
			...this.formData.classTalents.fixed,
			...this.formData.classTalents.selection,
		];
		await actorRef.createEmbeddedDocuments("Item", allItems);

		// go to level up screen
		new shadowdark.apps.LevelUpSD(this.actorUid).render(true);
		this.close();
	}
}
