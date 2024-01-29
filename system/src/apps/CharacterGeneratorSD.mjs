export default class CharacterGeneratorSD extends FormApplication {
	/**
	 * Contains functions for building Shadowdark characters
	 */

	/** @inheritdoc */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["character-generator"],
			width: 600,
			resizable: true,
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

	/** @inheritdoc */
	async _updateObject(event, formData) {
		event.preventDefault();
		ui.notifications.info("C.Gen Updated");

	}

	/** @inheritdoc */
	_onSubmit(event, formData) {
		event.preventDefault();
		ui.notifications.info("C.Gen Sumbitted");
		super._onSubmit(event);
	}

	/** @override */
	async getData(options) {
		let data = {};
		data.ancestry = await shadowdark.compendiums.ancestries();
		data.diaties = await shadowdark.compendiums.deities();
		data.backgrounds = await shadowdark.compendiums.backgrounds();
		data.languages = await shadowdark.compendiums.languages();
		data.classes = await shadowdark.compendiums.classes();

		return data;
	}

	async _buildCharacter(characterFormData) {
		// construct the player template
		let actorObj = {
			name: "",
			type: "Player",
			img: "icons/svg/mystery-man.svg",
			system: {
				alignment: "neutral",
				attributes: {
					ac: {
						value: 10,
					},
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
						bonus: 0,
					},
					int: {
						base: 10,
						bonus: 0,
					},
					dex: {
						base: 10,
						bonus: 0,
					},
					wis: {
						base: 10,
						bonus: 0,
					},
					con: {
						base: 10,
						bonus: 0,
					},
					cha: {
						base: 10,
						bonus: 0,
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
		// Create the New Player Character
		const newActor = await Actor.create(actorObj);

		// newActor.update({"system.spellcastingAttackNum": `${attackObj.system.attack.num}`});

		let talentArray = [];

		// add new talent to array
		talentArray.push(talentObj);

		// push talents to new character
		await newActor.createEmbeddedDocuments("Item", talentArray);

		// Parse features and add to actor

		return newActor;
	}
}
