export default class MonsterImporterSD extends FormApplication {
	/**
	 * Contains an importer function to import monster stat blocks
	 */

	/** @inheritdoc */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["monster-importer"],
			width: 300,
			resizable: false,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/monster-importer.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.apps.monster-importer.title");
		return `${title}`;
	}

	/** @inheritdoc */
	_updateObject(event, formData) {
		event.preventDefault();

		try {
			return this._importMonster(formData.monsterText);
		}
		catch(error) {
			ui.notifications.error(`Couldn't parse the monster stat block. ${error}, ${formData}`);
		}
	}

	/** @inheritdoc */
	_onSubmit(event) {
		event.preventDefault();
		super._onSubmit(event);
	}

	_toTitleCase(str) {
		return str.replace(
		  /\w\S*/g,
		  function(txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		  }
		);
	  }

	/**
	 * Parses pasted text representing a monster's stat block and creates an NPC actor from it.
	 * @param {string} string - String data posted by user
	 * @returns {ActorSD}
	 */
	async _importMonster(monsterText) {

		// parse monster text into 4 main parts, Title
		const parsedText = monsterText.match(/(.*)\n([\S\s]*)\n(AC \d*[\S\s]*LV \d*)\n([\S\s]*)/);
		const titleName = this._toTitleCase(parsedText[1]);
		const flavorText = parsedText[2].replace(/(\r\n|\n|\r)/gm, " ");
		const stats = parsedText[3].replace(/(\r\n|\n|\r)/gm, " ");
		const abilities = parsedText[4].split(/\n\s*\n/).map(x => x.replace(/(\r\n|\n|\r)/gm, " "));


		// create a blank monster template
		const importedActor = {
			name: titleName,
			type: "NPC",
			system: {
				alignment: "neutral",
				attributes: {
					ac: {
						value: 10,
					},
					hp: {
						max: 0,
						value: 0,
						hd: 0,
					},
				},
				level: {
					value: 1,
				},
				notes: `<p><i>${flavorText}</i></p><p>${stats}</p><p>${abilities}</p>`,
				abilities: {
					str: {
						mod: 0,
					},
					int: {
						mod: 0,
					},
					dex: {
						mod: 0,
					},
					wis: {
						mod: 0,
					},
					con: {
						mod: 0,
					},
					cha: {
						mod: 0,
					},
				},
				darkAdapted: true,
				move: "near",
				moveNote: "",
				spellcastingAbility: "",
			},
		};


		// Add ability mod values
		importedActor.system.abilities.str.mod = 0;
		importedActor.system.abilities.dex.mod = 0;
		importedActor.system.abilities.con.mod = 0;
		importedActor.system.abilities.int.mod = 0;
		importedActor.system.abilities.wis.mod = 0;
		importedActor.system.abilities.cha.mod = 0;


		// Create the actor
		const newActor = await Actor.create(importedActor);
		return newActor;
	}
}
