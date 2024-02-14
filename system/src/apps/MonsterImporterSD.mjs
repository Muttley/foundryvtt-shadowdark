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
			/([+\w\s\d]?[\w\s\d]*)/,			// atk[2] matches attack name
			/(?:\(([^)]*)\))?\s*/,	// atk[3] matches attack range
			/([+-]\d*)?\s*/,		// atk[4] matches attack bonus
			/(?:\((.*)\))?/,		// atk[5] matches damage string
		].map(function(r) {
			return r.source;
		}).join(""));

		let attackObj = {
			name: this._toTitleCase(atk[2].trim()),
			type: "NPC Special Attack",
			system: {
				attack: {
					num: atk[1],
				},
				bonuses: {
					attackBonus: 0,
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
			attackObj.type = "NPC Attack";

			// split up damage string and parse # of dice, dice type, bonuses, features
			const dmgStrs = atk[5].split("+").map( x => {
				return x.trim();
			});
			// parse first object as # dice and dice type
			const diceStr = dmgStrs[0].match(/(\d*)(d\d*)?/);
			if (typeof diceStr[2] !== "undefined") {
				attackObj.system.damage = {};
				attackObj.system.damage.numDice = diceStr[1];
				attackObj.system.damage.value = diceStr[1] + diceStr[2];
			}
			else {
				attackObj.system.damage = { value: diceStr[1] };
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
				description: `<p>${featureStr[2].replaceAll(/(\d+d\d+)/gi, "[[/r $&]]")}</p>`,
				predefinedEffects: "",
			},
		};
		return featureObj;
	}

	/**
	 * Parses an NPC spell string and returns an obj
	 * @param {string} str
	 * @returns {featureObj}
	 */
	_parseSpell(str) {
		const parsedSpell = str.match([
			/(.*)/,								// stats[1] matches Spell Name
			/\([\w\s]*Spell\)\.([^.]*)?/,		// stats[2] matches potential range
			/.*DC (\d*)/,						// stats[3] matches DC
			/\. (.*)/,							// stats[4] matches Description
		].map(function(r) {
			return r.source;
		}).join(""));

		const spellObj = {
			name: parsedSpell[1],
			type: "NPC Spell",
			system: {
				dc: parsedSpell[3],
				description: `<p>${parsedSpell[4].replaceAll(/(\d+d\d+)/gi, "[[/r $&]]")}</p>`,
				range: "",
				duration: {
					type: "",
					value: -1,
				},
			},
		};

		// Take a chance at finding the range in the description
		const potentialRange = parsedSpell[2].toLowerCase();
		const descStr = (`${parsedSpell[2]}.  ${parsedSpell[4]}`).toLowerCase();

		for (const range of ["self", "far", "near", "close"]) {
			if (potentialRange.includes(range)) {
				spellObj.system.range = range;
				break;
			}
		}
		if (!spellObj.system.range) {
			for (const range of ["far", "near", "close"]) {
				if (descStr.includes(`in ${range}`) || descStr.includes(`${range} range`)) {
					spellObj.system.range = range;
					break;
				}
			}
		}
		if (!spellObj.system.range) {
			for (const word of parsedSpell[4].toLowerCase().split(" ")) {
				for (const range of ["self", "far", "near", "close"]) {
					if (word.includes(`${range}.`) || word.includes(`${range},`) || word.includes(`${range}-`)) {
						spellObj.system.range = range;
						break;
					}
				}
				if (spellObj.system.range) break;
			}
		}

		// Take a chance at finding a round duration in the description
		const roundsDuration = parsedSpell[4].match(/(\d|\dd\d) rounds?/);
		const daysDuration = parsedSpell[4].match(/(\d|\dd\d) days?/);

		if (roundsDuration !== null && typeof roundsDuration[1] !== "undefined") {
			spellObj.system.duration.type = "rounds";
			spellObj.system.duration.value = roundsDuration[1];
		}
		else if (daysDuration !== null && typeof daysDuration[1] !== "undefined") {
			spellObj.system.duration.type = "days";
			spellObj.system.duration.value = daysDuration[1];
		}
		else if (descStr.includes(" focus.")) {
			spellObj.system.duration.type = "focus";
		}

		return (spellObj);
	}

	/**
	 * Parses pasted text representing a monster and creates an NPC actor from it.
	 * @param {string} string - String data posted by user
	 * @returns {ActorSD}
	 */
	async _importMonster(monsterText) {
		// trim spaces from the end of each line:
		monsterText = monsterText.replace(/[^\S\r\n]+$/gm, "");

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

		// Parse attacks features, and spells and add to actor
		let attackArray = [];
		stats[3].split(/ and | or /).forEach( line => {
			const attackObj = this._parseAttack(line);
			// if attack is a spell, update actors details for spellcasting
			if (attackObj.name.toLowerCase() === "spell") {
				newActor.update({"system.spellcastingAttackNum": `${attackObj.system.attack.num}`});
				newActor.update({"system.spellcastingBonus": attackObj.system.bonuses.attackBonus});
			}
			else {
				attackArray.push(attackObj);
			}
		});
		await newActor.createEmbeddedDocuments("Item", attackArray);

		// Parse features and add to actor
		let featureArray = [];
		let castingAbility ="";

		features.forEach( text => {

			// Is the feature a spell?
			const spellTestStr = text.match(/\(([\w]*)?\s*Spell\)/);
			if (spellTestStr) {
				featureArray.push(this._parseSpell(text));

				// does the spell list a casting ability?
				if (typeof spellTestStr[1] !== "undefined" && CONFIG.SHADOWDARK.ABILITY_KEYS.includes(spellTestStr[1].toLowerCase())) {
					castingAbility = spellTestStr[1].toLowerCase();
				}
			}
			// Parse Feature
			else {
				const parsedFeatureObj = this._parseFeature(text);

				// Is the feature a description of a special attack?
				let isSpecialAttack = false;
				newActor.items.forEach(x => {
					if (x.type === "NPC Special Attack" && x.name === parsedFeatureObj.name) {
						x.update({"system.description": parsedFeatureObj.system.description});
						isSpecialAttack = true;
					}
				});

				// push feature to actor
				if (!isSpecialAttack) {
					featureArray.push(parsedFeatureObj);
				}
			}
		});

		await newActor.update({"system.spellcastingAbility": castingAbility});

		await newActor.createEmbeddedDocuments("Item", featureArray);
		return newActor;
	}
}
