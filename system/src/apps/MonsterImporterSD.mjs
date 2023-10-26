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
	async _updateObject(event, formData) {
		event.preventDefault();
		try {
			let newNPC = await this._importMonster(formData.monsterText);
			ui.notifications.info(`Successfully Created: ${newNPC.name} [${newNPC._id}]`);
			ui.sidebar.activateTab("actors");
			return;
		}
		catch(error) {
			ui.notifications.error(`Failed to fully parse the monster stat block. ${error}`);
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

	/**
	 * Parses an NPC movement string and returns an obj listing the movement type and range
	 * @param {string} str
	 * @returns {moveObj}
	 */
	_parseMovement(str) {
		let moveObj ={
			type: "",
			notes: "",
		};
		let parsedMove = str.match(/([\s\w]*)(?:\(([\s\w]*)\))?/);
		moveObj.type = this._toCamelCase(parsedMove[1].trim());

		// makes sure the string is a valid move type
		if (!(moveObj.type in CONFIG.SHADOWDARK.NPC_MOVES)) {
			moveObj.type = "";
		}

		// if there are () in the move string copy to move notes
		if (typeof parsedMove[2] !== "undefined") {
			moveObj.notes = parsedMove[2];
		}

		return moveObj;
	}

	/**
	 * Parses an NPC attack string and returns an item obj representing that attack
	 * @param {string} str
	 * @returns {attackObj}
	 */
	_parseAttack(str) {
		const atk = str.match([
			/(\d*)\s*/,				// atk[1] matches # of attacks
			/([\w\s\d]*)/,			// atk[2] matches attack name
			/(?:\(([^)]*)\))?\s*/,	// atk[3] matches attack range
			/([+-]\d*)?\s*/,		// atk[4] matches attack bonus
			/(?:\((.*)\))?/,		// atk[5] matches damage string
		].map(function(r) {
			return r.source;
		}).join(""));

		let attackObj = {
			name: atk[2].trim(),
			type: "NPC Attack",
			system: {
				attack: {
					num: atk[1],
				},
				attackType: "special",
				bonuses: {
					attackBonus: 0,
					damageBonus: 0,
				},
				damage: {
					numDice: 0,
					value: "",
					special: "",
				},
			},
		};

		// Validate Attack ranges and add
		if (typeof atk[3] !== "undefined") {
			let rangeArray = [];
			atk[3].split(/\/|,/).forEach( x => {
				let range = this._toCamelCase(x);
				if (range in CONFIG.SHADOWDARK.RANGES) {
					rangeArray.push(range);
				}
			});
			attackObj.system.ranges = rangeArray;
		}

		// Add Hit bonus if any
		if (typeof atk[4] !== "undefined") {
			attackObj.system.bonuses.attackBonus = parseInt(atk[4]);
		}

		// Attack is a phyical attack if damage exists
		if (typeof atk[5] !== "undefined") {
			attackObj.system.attackType = "physical";

			// split up damage string and parse # of dice, dice type, bonuses, features
			const dmgStrs = atk[5].split("+").map( x => {
				return x.trim();
			});
			// parse first object as # dice and dice type
			const diceStr = dmgStrs[0].match(/(\d*)(d\d*)?/);
			if (typeof diceStr[2] !== "undefined") {
				attackObj.system.damage.numDice = diceStr[1];
				attackObj.system.damage.value = diceStr[2];
			}
			else {
				// TODO no way to set static damage: attackObj.system.damage.value = diceStr[1]
			}

			// parse remaining string parts for +dmg or feature
			for (let i = 1; i < dmgStrs.length; i++) {
				if (parseInt(dmgStrs[i])) {
					attackObj.system.bonuses.damageBonus = parseInt(dmgStrs[i]);
				}
				else {
					attackObj.system.damage.special = this._toTitleCase(dmgStrs[i]);
				}
			}
		}

		return attackObj;
	}

	/**
	 * Parses an NPC feature string and returns an obj
	 * @param {string} str
	 * @returns {featureObj}
	 */
	_parseFeature(str) {
		const featureStr = str.match(/([^.]*)\.(?:\s*)?(.*)/);
		const featureObj = {
			name: this._toTitleCase(featureStr[1]),
			type: "NPC Feature",
			system: {
				description: `<p>${featureStr[2]}</p>`,
				predefinedEffects: "",
			},
		};
		return featureObj;
	}

	/**
	 * Parses pasted text representing a monster and creates an NPC actor from it.
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
		let features = [];
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
		const notesText = `
			<p><i>${flavorText}</i></p><br>
			<p>${statBlock}</p><br>
			<p>${features.join("<br><br>")}</p>`;

		// create the monster template
		let actorObj = {
			name: titleName,
			img: "systems/shadowdark/assets/tokens/cowled_token.webp",
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
				notes: notesText,
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

		// Parse attacks and add to actor
		let attackArray = [];
		stats[3].split(/ and | or /).forEach( line => {
			attackArray.push(this._parseAttack(line));
		});
		await newActor.createEmbeddedDocuments("Item", attackArray);

		// Parse features and add to actor
		let featureArray = [];
		features.forEach( text => {
			featureArray.push(this._parseFeature(text));
		});
		await newActor.createEmbeddedDocuments("Item", featureArray);

		return newActor;
	}
}
