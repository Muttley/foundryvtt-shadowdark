export default class CharacterGeneratorSD extends FormApplication {
	/**
	 * Contains functions for building Shadowdark characters
	 */
	constructor() {
		super();
		this.firstrun = true;
		this.formData = {};

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
				class: "",
				coins: {
					gp: 0,
					sp: 0,
					cp: 0,
				},
				deity: "",
				languages: [],
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
			width: 600,
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

		html.find("[data-action='randomize-abilities']").click(
			event => this._randomizeAbilities(event)
		);

		html.find("[data-action='create-character']").click(
			event => this._createCharacter(event)
		);

		html.on("click", "[random_stats]", this._randomizeAbilities.bind(this));
	}

	/** @inheritdoc */
	async _updateObject(event, data) {
	    let expandedData = foundry.utils.expandObject(data);
		console.log(expandedData);
		this._loadClassTalents(expandedData.actor.system.class);

		// covert incoming stat data to int
		CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
			let baseInt = parseInt(expandedData.actor.system.abilities[x].base);
			expandedData.actor.system.abilities[x].base = baseInt;
		});

		this.formData = mergeObject(this.formData, expandedData);
		 console.log(this.formData);
	}

	/** @override */
	async getData(options) {

		if (this.firstrun) {
			console.log("getdata (first run)");
			this.loadingDialog.render(true);
			this.firstrun = false;

			// setup ability range as 3-18
			this.formData.statRange = [];
			for (let i =3; i<19; i++) {
				this.formData.statRange.push(i);
			}

			// set all player ability scores to 10
			CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
				this.formData.actor.system.abilities[x] = { base: "10", mod: "0"};
				console.log(x);
				console.log(this.formData);
			});

			this.formData.ancestry = await shadowdark.compendiums.ancestries();
			this.formData.diaties = await shadowdark.compendiums.deities();
			this.formData.backgrounds = await shadowdark.compendiums.backgrounds();
			this.formData.languages = await shadowdark.compendiums.languages();
			this.formData.classes = await shadowdark.compendiums.classes();
			this.formData.items = {};
			this.formData.talents = {};
			this.loadingDialog.close();
			console.log(this.formData);
		}
		console.log(this.formData);
		return this.formData;
	}

	_loadClassTalents(classID) {
		let classTalents =  fromUuidSync(classID).system.talents;
		let talentData = {};

		classTalents.forEach( talent => {
			let talentObj = fromUuidSync(talent);
			// talentObj.html = `@UUID[${talent}]{${talentObj.name}}`;
			console.log(talentObj);
			talentData[talent] = talentObj;
		});
		this.formData.talents = talentData;
	}

	_getRandomName() {
		return "Hilda Fadhili";
	}

	_randomizeAbilities() {
		CONFIG.SHADOWDARK.ABILITY_KEYS.forEach(x => {
			this.formData.actor.system.abilities[x].base = this._roll3d6();
		});
		this.render();
	}

	_roll3d6() {
		let roll = new Roll("3d6").evaluate({async: false});
		return roll._total;
	}


	async _createCharacter() {

		// Create the New Player Character
		console.log(this.formData.actor);
		await Actor.create(this.formData.actor);

		// push talents to new character
		// await newActor.createEmbeddedDocuments("Item", talentArray);

	}
}
