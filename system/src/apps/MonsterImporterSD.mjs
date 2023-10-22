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
		const statBlock = parsedText[3].replace(/(\r\n|\n|\r)/gm, " ");
		const abilities = parsedText[4].split(/\n\s*\n/).map(x => x.replace(/(\r\n|\n|\r)/gm, " "));

		const stats = statBlock.match([
			/.*AC (\d*)/,		// stats[1] matches AC
			/.*HP (\d*)/,		// stats[2] matches HP
			/.*ATK (.*),/,		// stats[3] matches unparsed ATK
			/.*MV (.*),/,		// stats[4] matches unparsed MV
			/.*S ([-+]\d*),/,	// stats[5] matches STR
			/.*D ([-+]\d*),/,	// stats[6] matches DEX
			/.*C ([-+]\d*),/,	// stats[7] matches CON
			/.*I ([-+]\d*),/,	// stats[8] matches INT
			/.*W ([-+]\d*),/,	// stats[9] matches WIS
			/.*Ch ([-+]\d*),/,	// stats[10] matches CHA
			/.*AL (\w),/,		// stats[11] matches AL (single letter)
			/.*LV (\d*)/,		// stats[12] matches LV
		].map(function(r) {
			return r.source;
		}).join(""));

		const alignments = {L: "Lawful", N: "Neutral", C: "Chaotic"};

		// TODO: implement movement distances and type
		// const movement = stats[4].split("(");

		// TODO: Implement attacks

		// TODO: Implement features

		// create a blank monster template
		const importedActor = {
			name: titleName,
			type: "NPC",
			system: {
				alignment: alignments[stats[11].toUpperCase()],
				attributes: {
					ac: {
						value: stats[1],
					},
					hp: {
						max: stats[2],
						value: stats[2],
						hd: 0,
					},
				},
				level: {
					value: stats[12],
				},
				notes: `<p><i>${flavorText}</i></p><p>${statBlock}</p><p>${abilities}</p>`,
				abilities: {
					str: {
						mod: parseInt(stats[5]),
					},
					int: {
						mod: parseInt(stats[8]),
					},
					dex: {
						mod: parseInt(stats[6]),
					},
					wis: {
						mod: parseInt(stats[9]),
					},
					con: {
						mod: parseInt(stats[7]),
					},
					cha: {
						mod: parseInt(stats[10]),
					},
				},
				darkAdapted: true,
				move: "near",
				moveNote: "",
				spellcastingAbility: "",
			},
		};

		// Create the actor
		const newActor = await Actor.create(importedActor);
		return newActor;
	}
}
