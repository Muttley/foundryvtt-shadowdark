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
		return str.replace(/\w\S*/g, m =>  m.charAt(0).toUpperCase() + m.substr(1).toLowerCase());
	}

	_toCamelCase(str) {
		return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
	}

	_parseMovement(str) {
		let move ={
			type: "",
			notes: "",
		};
		let parsedMove = str.match(/([\s\w]*)(?:\(([\s\w]*)\))?/);
		move.type = this._toCamelCase(parsedMove[1].trim());

		// if there are () in the move string copy to notes
		if (typeof parsedMove[2] !== "undefined") {
			move.notes = parsedMove[2];
		}

		// makes sure the string is a valid move type
		if (!(move.type in CONFIG.SHADOWDARK.NPC_MOVES)) {
			move.type = "";
		}
		return move;
	}

	_parseAttack(str) {
		const atk = str.match([
			/(\d*)\s*/,				// atk[1] matches # of attacks
			/([\w\s\d]*)/,			// atk[2] matches attack name
			/(?:\(([^)]*)\))?\s*/,	// atk[3] matches attack range
			/([+-]\d* )?\s*/,		// atk[4] matches attack bonus
			/(?:\((.*)\))?/,		// atk[5] matches damage string
		].map(function(r) {
			return r.source;
		}).join(""));
		console.log(atk);
		let attackObj = {
			name: atk[2],
			type: "NPC Attack",
			system: {
				attack: {
					num: atk[1],
				},
				attackType: "special",
				bonuses: {
					attackBonus: 0,
				},
			},
		};
		console.log(attackObj);

		// Attack is a phyical attack
		if (typeof atk[5] !== "undefined") {
			attackObj.system.attackType = "physical";
			if (typeof atk[4] !== "undefined") {
				attackObj.system.bonuses.attackBonus = parseInt(atk[4]);
			}
		}
		console.log(attackObj);
		return attackObj;
	}

	/**
	 * Parses pasted text representing a monster's stat block and creates an NPC actor from it.
	 * @param {string} string - String data posted by user
	 * @returns {ActorSD}
	 */
	async _importMonster(monsterText) {

		// parse monster text into 4 main parts:
		const parsedText = monsterText.match([
			/(.*)\n/,							// parsedText[1] matches Title
			/([\S\s]*)\n/,						// parsedText[2] matches flavor Text
			/(AC \d*[\S\s]*LV \d*)(?:\n|$)/,	// parsedText[3] matches Stat Block
			/([\S\s]*)?/,						// parsedText[4] matches features
		].map(function(r) {
			return r.source;
		}).join(""));

		// set 4 main variables, removing newlines
		const titleName = this._toTitleCase(parsedText[1]);
		const flavorText = parsedText[2].replace(/(\r\n|\n|\r)/gm, " ");
		const statBlock = parsedText[3].replace(/(\r\n|\n|\r)/gm, " ");
		let features = "";
		if (typeof parsedText[4] !== "undefined") {
			features = parsedText[4].split(/\n\s*\n/).map( x => x.replace(/(\r\n|\n|\r)/gm, " "));
		}

		// parse out main stat block
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

		// build parse complex outputs
		const alignments = {L: "lawful", N: "neutral", C: "chaotic"};
		const movement = this._parseMovement(stats[4]);

		// create the monster template
		let actorObj = {
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
				notes: `<p><i>${flavorText}</i></p><br><p>${statBlock}</p><br><p>${features}</p>`, // TODO clean this up with a full template
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
				move: movement.type,
				moveNote: movement.notes,
				spellcastingAbility: "",
			},
		};

		// Create the NPC actor
		const newActor = await Actor.create(actorObj);

		// Parse attacks
		let attackArray = [];
		stats[3].split(/ and | or /).forEach( line => {
			console.log(line);
			attackArray.push(this._parseAttack(line));
		});
		console.log(attackArray);
		// TODO: Implement features

		// Add attacks and features
		await newActor.createEmbeddedDocuments("Item", attackArray);
		return newActor;
	}
}
