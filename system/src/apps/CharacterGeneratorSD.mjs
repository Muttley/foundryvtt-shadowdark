export default class CharacterGeneratorSD extends FormApplication {
	/**
	 * Contains functions for building Shadowdark characters
	 */
	constructor() {
		super();
		this.firstrun = true;
		this.formData = {};
		this.formData.classTalents = [];
		this.formData.level0class = {};
		this.formData.classHP = 1;

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
					value: 1,
					xp: 0,
				},
				abilities: {
					str: {
						base: 10,
						mod: 0,
					},
					dex: {
						base: 10,
						mod: 0,
					},
					con: {
						base: 10,
						mod: 0,
					},
					int: {
						base: 10,
						mod: 0,
					},
					wis: {
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

		// TODO move this somewhere proper
		this.loadingDialog = new Dialog({
			title: "Character Generator",
			content: "<center>Searching Distant Lands...<br><img src='systems/shadowdark/assets/logo/arcane-library-logo.webp' class='fa-spin' style='border-width:0px;width:50px;height:50px;'></img></center>",
			buttons: {},
		},
		{
			height: 125,
			width: 250,
		});
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

	}

	/** @inheritdoc */
	async _updateObject(event, data) {
		// expand incoming data for compatibility with formData
	    let expandedData = foundry.utils.expandObject(data);
		console.log(expandedData);

		// covert incoming stat data from string to int
		CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
			let baseInt = parseInt(expandedData.actor.system.abilities[x].base);
			expandedData.actor.system.abilities[x].base = baseInt;
		});

		// merge incoming data into the main formData object
		this.formData = mergeObject(this.formData, expandedData);

		if (event.target.name === "actor.system.class") {
			await this._loadClass(event.target.value);
			this._randomizeHP();
		}

		this._calculateModifiers();
		this.render();
	}

	/** @override */
	async getData(options) {

		if (this.firstrun) {
			this.firstrun = false;

			// Put up a loading screen as compendium searching can take a while
			this.loadingDialog.render(true);

			// Initialize Alignment
			this.formData.alignments = CONFIG.SHADOWDARK.ALIGNMENTS;


			// setup ability range as 3-18
			this.formData.statRange = [];
			for (let i =3; i<19; i++) {
				this.formData.statRange.push(i);
			}

			// set all player ability scores to 10
			CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
				this.formData.actor.system.abilities[x] = { base: "10", mod: "0"};
			});

			// load all relevent data from compendiums
			this.formData.ancestries = await shadowdark.compendiums.ancestries();
			this.formData.deities = await shadowdark.compendiums.deities();
			this.formData.backgrounds = await shadowdark.compendiums.backgrounds();
			this.formData.languages = await shadowdark.compendiums.languages();
			this.formData.classes = await shadowdark.compendiums.classes();

			// find the level 0 class
			this.formData.classes.forEach( classObj => {
				if (classObj.name.toLocaleLowerCase().includes("level 0")) {
					this.formData.level0class = classObj;
					this.formData.actor.system.class = classObj.uuid;
					this.formData.classes.delete(classObj._id);
				}
			});

			// loading is finished, pull down the loading screen
			this.loadingDialog.close();
		}

		// format talents

		return this.formData;
	}

	async _randomizeHandler(event) {
		console.log(event.target.name);
		const eventStr = event.target.name;
		let tempInt = 0;

		// randomize ancestry
		if (eventStr === "randomize-ancestry" || eventStr === "randomize-all") {
			tempInt = this._getRandom(this.formData.ancestries.size);
			this.formData.actor.system.ancestry = [...this.formData.ancestries][tempInt].uuid;
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
		if (eventStr === "randomize-class" || eventStr === "randomize-all") {
			tempInt = this._getRandom(this.formData.classes.size);
			let classID = [...this.formData.classes][tempInt].uuid;
			this.formData.actor.system.class = classID;
			await this._loadClass(classID);
		}

		// randomize language
		if (eventStr === "randomize-language" || eventStr === "randomize-all") {
			console.log(this.formData.languages);
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
			const testNames = ["Hilda Fadhili", "Koumvisk", "Trurcon", "Seldrin", "Aldwin"];
			this.formData.actor.name = testNames[this._getRandom(5)];
		}

		// Roll HP
		if (eventStr === "randomize-hp" || eventStr === "randomize-all") {
			this._randomizeHP();
		}

		// Roll starting gold
		if (eventStr === "randomize-gold" || eventStr === "randomize-all") {
			let startingGold = this._roll("2d6")*5;
			this.formData.actor.system.coins.gp = startingGold;
		}

		// update all changes
		this.render();
	}

	// loads linked class items when class is selected
	async _loadClass(classUuID) {
		// grab static talents from class item
		let classObj =  await fromUuid(classUuID);
		let talentData = [];
		if (classObj.system.talents) {
			for (const talent of classObj.system.talents) {
				let talentObj = await fromUuid(talent);
				talentData.push(talentObj);
			}
		}
		this.formData.classTalents = talentData;

		// load hit dice information for randomizing HP
		if (classObj.system.hitPoints) {
			this.formData.classHP = classObj.system.hitPoints;
		}
		else {
			this.formData.classHP = 1;
		}
	}

	_randomizeHP() {
		const classID = this.formData.actor.system.class;
		let classObj = {};
		if (classID === this.formData.level0class.uuid) {
			classObj = this.formData.level0class;
		}
		else {
			classObj = this.formData.classes.find(x => x.uuid === classID);
		}
		if (classObj.system.hitPoints !== "") {
			const rollValue = this._roll(classObj.system.hitPoints);
			this.formData.actor.system.attributes.hp.base = rollValue;
		}
		else {
			this.formData.actor.system.attributes.hp.base = 1;
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


	async _createCharacter() {

		// Check for Name
		if (this.formData.actor.name === "" ) {
			ui.notifications.info( game.i18n.localize("SHADOWDARK.apps.character-generator.error.name"));
		}

		// adjust level for level 0 characters
		if (this.formData.actor.system.class === this.formData.level0class.uuid) {
			this.formData.actor.system.level.value = 0;
		}

		// Calculate HP
		let hpConMod = this.formData.actor.system.abilities.con.mod;
		let hpBase = this.formData.actor.system.attributes.hp.base;
		// set minimum 1 HP
		if ((hpBase + hpConMod) >= 1) {
			this.formData.actor.system.attributes.hp.base = hpBase + hpConMod;
			this.formData.actor.system.attributes.hp.value = hpBase + hpConMod;
		}
		else {
			this.formData.actor.system.attributes.hp.base = 1;
			this.formData.actor.system.attributes.hp.value = 1;
		}

		// Create the new player character
		console.log(this.formData);
		try {
			const newActor = await Actor.create(this.formData.actor);
			ui.notifications.info(`Created Character: ${newActor.name}`);

			// gather all items that need to be added.

			// push talents to new character and abilities to character
			await newActor.createEmbeddedDocuments("Item", this.formData.classTalents);
		}
		catch(error) {
			ui.notifications.error(
				game.i18n.format("SHADOWDARK.apps.character-generator.error.create", {error: error})
			);
		}
		this.close();

	}
}
