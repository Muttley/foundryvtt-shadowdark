import ImporterSD from "./ImporterSD.mjs";

export default class MonsterImporterSD extends ImporterSD {
	/**
	 * Contains an importer function to import monster stat blocks
	 */

	static DEFAULT_OPTIONS = {
		id: "sd-monster-importer",
		window: {
			title: "SHADOWDARK.apps.monster-importer.title",
		},
	};

	static PARTS = {
		form: {
			template: "systems/shadowdark/templates/apps/monster-importer.hbs",
		},
	};

	static IMPORTER_CONFIG = {
		textField: "monsterText",
		sidebarTab: "actors",
		errorMessage: "Failed to fully parse the monster stat block.",
	};

	/** @override */
	async _import(monsterText) {
		return this._importMonster(monsterText);
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
	 * Parses a stat block string into individual fields.
	 * Splits on ", " and identifies each field by its key prefix.
	 * Missing fields get empty string defaults instead of crashing.
	 * @param {string} statBlock - Stat block with newlines already collapsed
	 * @returns {object} { ac, hp, atk, mv, str, dex, con, int, wis, cha, al, lv }
	 */
	_parseStatBlock(statBlock) {
		const stats = {
			ac: null, hp: null, atk: null, mv: null,
			str: null, dex: null, con: null, int: null, wis: null, cha: null,
			al: null, lv: null,
		};
		const errors = [];

		const keyMap = {
			AC: "ac", HP: "hp", ATK: "atk", MV: "mv",
			S: "str", D: "dex", C: "con", I: "int", W: "wis", Ch: "cha",
			AL: "al", LV: "lv",
		};

		// Split on ", " and match each chunk to a known key
		for (const chunk of statBlock.split(", ")) {
			const [key, ...rest] = chunk.trim().split(" ");
			const field = keyMap[key];

			// Unknown key — report it
			if (!field) {
				errors.push(`Unknown stat field: "${chunk.trim()}"`);
				continue;
			}

			let value = rest.join(" ");
			// AC may include armor type in parens — extract just the number
			if (field === "ac") {
				const acMatch = value.match(/^(\d+)/);
				value = acMatch ? acMatch[1] : value;
			}
			stats[field] = value;
		}

		stats.errors = errors;
		return stats;
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
			name: atk[2].trim().titleCase(),
			type: "NPC Special Attack",
			system: {
				attack: {
					num: parseInt(atk[1]) || 1,
				},
				ranges: [],
				bonuses: {
					attackBonus: 0,
					damageBonus: 0,
					critical: {
						failureThreshold: 1,
						multiplier: 2,
						successThreshold: 20,
					},
				},
			},
		};

		// Validate Attack ranges and add
		if (typeof atk[3] !== "undefined") {
			atk[3].split(/\/|,/).forEach( x => {
				let range = this._toCamelCase(x);
				if (range in CONFIG.SHADOWDARK.RANGES) {
					attackObj.system.ranges.push(range);
				}
			});
		}

		// Add Hit bonus if any
		if (typeof atk[4] !== "undefined") {
			attackObj.system.bonuses.attackBonus = parseInt(atk[4]);
		}

		// Attack is a physical attack if damage exists
		if (typeof atk[5] !== "undefined") {
			attackObj.system.attackType = "physical";
			attackObj.type = "NPC Attack";

			// split up damage string and parse # of dice, dice type, bonuses, features
			const dmgStrs = atk[5].split("+").map( x => {
				return x.trim();
			});
			// parse first object as # dice and dice type
			const diceStr = dmgStrs[0].match(/(\d*)(d\d*)?/);
			// TODO: special should not need to be set here, the sheet
			// should handle missing/undefined special gracefully
			if (typeof diceStr[2] !== "undefined") {
				attackObj.system.damage = {
					numDice: parseInt(diceStr[1]),
					value: diceStr[1] + diceStr[2],
					special: "",
				};
			}
			else {
				attackObj.system.damage = { value: diceStr[1], special: "" };
			}

			// parse remaining string parts for +dmg or feature
			for (let i = 1; i < dmgStrs.length; i++) {
				if (parseInt(dmgStrs[i])) {
					attackObj.system.bonuses.damageBonus = parseInt(dmgStrs[i]);
				}
				else {
					attackObj.system.damage.special = dmgStrs[i].titleCase();
				}
			}
		}

		// Default physical attacks without explicit range to close
		if (attackObj.type === "NPC Attack" && attackObj.system.ranges.length === 0) {
			attackObj.system.ranges.push("close");
		}

		return attackObj;
	}

	/**
	 * Splits raw features text into individual feature strings.
	 * A new feature starts when a line begins with a capitalized word
	 * followed by ". " (e.g. "Backstab. ") or after a blank line.
	 * @param {string} text - Raw features text (may contain newlines)
	 * @returns {string[]}
	 */
	_parseFeatures(text) {
		const features = [];
		let current = "";
		for (const line of text.split(/\r?\n/)) {
			const isBlank = line.trim() === "";
			const isFeatureStart = /^[A-Z][a-z].*\.\s/.test(line);

			// Boundary reached — save the current feature
			if ((isBlank || isFeatureStart) && current.trim()) {
				features.push(current.trim());
				current = "";
			}
			// Append non-blank lines to the current feature
			if (!isBlank) {
				current += (current ? " " : "") + line;
			}
		}
		// Don't forget the last feature
		if (current.trim()) {
			features.push(current.trim());
		}
		return features;
	}

	/**
	 * Parses an NPC feature string and returns an obj
	 * @param {string} str
	 * @returns {featureObj}
	 */
	_parseFeature(str) {
		const featureStr = str.match(/([^.]*)\.(?:\s*)?(.*)/);
		const featureObj = {
			name: featureStr[1].titleCase(),
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
			type: "Spell",
			system: {
				tier: parsedSpell[3] - 10,
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

	 // Formats statblocks with standard look and feel
	_generateNotesText = (statBlock, flavorText, features) => `
	<p><i>${flavorText}</i></p>
	<p></p>
	<p>${statBlock.replace(/AC|HP|ATK|MV|S|D|Ch|C|I|W|AL|LV/g, "<strong>$&</strong>")}</p><p></p>
	${features
		.map(feat => feat.replace(/([^.]*)/, "<strong>$1</strong>"))
		.map(feat => `<p>${feat}</p><p></p>`)
		.join("")}`;

	/**
	 * Parses pasted text into structured data without creating any documents.
	 * @param {string} monsterText - Raw pasted monster text
	 * @returns {object} { actorObj, attackArray, featureArray, castingAbility }
	 */
	_parseMonster(monsterText) {
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
		const titleName = parsedText[1].titleCase();
		const flavorText = parsedText[2].replace(/(\r\n|\n|\r)/gm, " ");
		const statBlock = parsedText[3].replace(/(\r\n|\n|\r)/gm, " ");
		const featuresText = parsedText[4];

		const features = typeof featuresText !== "undefined"
			? this._parseFeatures(featuresText)
			: [];

		// parse out main stat block field by field
		const stats = this._parseStatBlock(statBlock);

		// build parse complex outputs
		const alignments = {L: "lawful", N: "neutral", C: "chaotic"};
		const movement = stats.mv ? this._parseMovement(stats.mv) : { type: "", notes: "" };
		const notesText = this._generateNotesText(statBlock, flavorText, features);

		// create the monster template
		let actorObj = {
			name: titleName,
			img: "systems/shadowdark/assets/tokens/cowled_token_red.webp",
			type: "NPC",
			system: {
				alignment: (stats.al && alignments[stats.al.toUpperCase()]) || "",
				attributes: {
					ac: {
						value: stats.ac,
					},
					hp: {
						max: stats.hp,
						value: stats.hp,
						hd: 0,
					},
				},
				level: {
					value: stats.lv,
				},
				notes: notesText,
				abilities: {
					str: {
						mod: parseInt(stats.str) || 0,
					},
					int: {
						mod: parseInt(stats.int) || 0,
					},
					dex: {
						mod: parseInt(stats.dex) || 0,
					},
					wis: {
						mod: parseInt(stats.wis) || 0,
					},
					con: {
						mod: parseInt(stats.con) || 0,
					},
					cha: {
						mod: parseInt(stats.cha) || 0,
					},
				},
				darkAdapted: true,
				move: movement.type,
				moveNote: movement.notes,
				spellcastingAbility: "",
			},
		};

		// Parse attacks
		let attackArray = [];
		let spellcasting = null;
		if (stats.atk) stats.atk.split(/ and | or /).forEach( line => {
			const attackObj = this._parseAttack(line);
			// if attack is a spell, store spellcasting details
			if (attackObj.name.toLowerCase() === "spell") {
				spellcasting = {
					attacks: `${attackObj.system.attack.num}`,
					bonus: attackObj.system.bonuses.attackBonus,
				};
			}
			else {
				attackArray.push(attackObj);
			}
		});

		// Parse features and spells
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
				featureArray.push(this._parseFeature(text));
			}
		});

		return { actorObj, attackArray, featureArray, castingAbility, spellcasting };
	}

	/**
	 * Parses pasted text representing a monster and creates an NPC actor from it.
	 * @param {string} monsterText - String data posted by user
	 * @returns {ActorSD}
	 */
	async _importMonster(monsterText) {
		const { actorObj, attackArray, featureArray, castingAbility, spellcasting } =
			this._parseMonster(monsterText);

		// Create the NPC actor
		const newActor = await Actor.create(actorObj);

		// Set spellcasting details if this NPC has spell attacks
		if (spellcasting) {
			newActor.update({"system.spellcasting.attacks": spellcasting.attacks});
			newActor.update({"system.spellcasting.bonus": spellcasting.bonus});
		}

		await newActor.createEmbeddedDocuments("Item", attackArray);

		// Merge feature descriptions into matching special attacks
		const finalFeatures = [];
		featureArray.forEach(feat => {
			let isSpecialAttack = false;
			newActor.items.forEach(x => {
				if (x.type === "NPC Special Attack" && x.name === feat.name) {
					x.update({"system.description": feat.system.description});
					isSpecialAttack = true;
				}
			});
			if (!isSpecialAttack) {
				finalFeatures.push(feat);
			}
		});

		await newActor.update({"system.spellcastingAbility": castingAbility});

		await newActor.createEmbeddedDocuments("Item", finalFeatures);
		return newActor;
	}
}
