export default class CharacterGeneratorSD extends FormApplication {
	/**
	 * Contains functions for building Shadowdark characters
	 */
	constructor() {
		super();
		this.firstrun = true;
		this.formData = {};
		this.formData.items = {};
		this.formData.level0class = {};

		// Setup a default actor template
		this.formData.actor = {
			name: "",
			type: "Player",
			system: {
				attributes: {
					hp: {
						max: 0,
						value: 0,
						base: 0,
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
			width: 700,
			resizable: true,
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

		html.find("[data-action='randomize-stats']").click(
			event => this._randomizeStats(event)
		);

		html.find("[data-action='randomize-name']").click(
			event => this._randomizeName(event)
		);

		html.find("[data-action='create-character']").click(
			event => this._createCharacter(event)
		);

	}

	/** @inheritdoc */
	async _updateObject(event, data) {
		// expand incoming data for compatibility with formData
	    let expandedData = foundry.utils.expandObject(data);
		console.log("update", event.target);
		console.log(data);
		if (event.target.name === "actor.system.class") {
			await this._handleClassEvent(event.target.value);
		}

		// covert incoming stat data from string to int
		CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
			let baseInt = parseInt(expandedData.actor.system.abilities[x].base);
			expandedData.actor.system.abilities[x].base = baseInt;
		});

		// merge incoming data into the main formData object
		this.formData = mergeObject(this.formData, expandedData);

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
			this.formData.ancestry = await shadowdark.compendiums.ancestries();
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
		return this.formData;
	}

	async _handleClassEvent(classUuID) {
		// grab static talents from class item
		let classTalents =  await fromUuid(classUuID);
		let talentData = [];
		if (classTalents.system.talents) {
			for (const talent of classTalents.system.talents) {
				let talentObj = await fromUuid(talent);
				talentData.push(talentObj);
			}
		}
		this.formData.items.classtalents = talentData;
	}

	_randomizeName() {
		this.formData.actor.name = "Hilda Fadhili";
		this.render();
	}

	_randomizeStats() {
		CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
			this.formData.actor.system.abilities[x].base = this._roll3d6();
		});
		this._calculateModifiers();
		this.render();
	}

	_roll3d6() {
		let roll = new Roll("3d6").evaluate({async: false});
		return roll._total;
	}

	_calculateModifiers() {
		CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
			let baseInt = this.formData.actor.system.abilities[x].base;
			this.formData.actor.system.abilities[x].mod = Math.floor((baseInt - 10)/2);
		});
	}

	async _createCharacter() {

		// adjust level for level 0 characters
		if (this.formData.actor.system.class === this.formData.level0class.uuid) {
			this.formData.actor.system.level.value = 0;
		}

		// Create the new player character
		console.log(this.formData);
		try {
			const newActor = await Actor.create(this.formData.actor);

			// gather all items that need to be added.
			console.log(this.formData.items.classtalents);

			// push talents to new character and abilities to character
			await newActor.createEmbeddedDocuments("Item", this.formData.items.classtalents);
			ui.notifications.info(`Created Character: ${newActor.name}`);
		}
		catch(error) {
			ui.notifications.error(`Failed to create player character ${error}`);
		}


	}
}
