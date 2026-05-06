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
		const parsedMove = str.match(/([\s\w]*)(?:\(([\s\w]*)\))?/);
		if (!parsedMove) {
			throw new Error(`Unrecognized MV format: "${str}"`);
		}

		const type = this._toCamelCase(parsedMove[1].trim());
		if (!(type in CONFIG.SHADOWDARK.NPC_MOVES)) {
			throw new Error(`Unrecognized movement type: "${parsedMove[1].trim()}"`);
		}

		return {
			type,
			notes: parsedMove[2] ?? "",
		};
	}

	/**
	 * Parses and validates a stat block string into individual fields.
	 * @param {string} statBlock - Stat block with newlines already collapsed
	 * @returns {object} Stats keyed by short codes (AC, HP, ATK, MV, S, D, C, I, W, Ch, AL, LV)
	 * @throws {Error} With .details array listing missing, unknown, or invalid fields
	 */
	_parseStatBlock(statBlock) {
		const FIELDS = {
			AC: "int", HP: "int", ATK: "str", MV: "str",
			S: "int", D: "int", C: "int", I: "int", W: "int", Ch: "int",
			AL: "str", LV: "int",
		};

		const stats = Object.fromEntries(Object.keys(FIELDS).map(k => [k, null]));
		const errors = [];

		for (const chunk of statBlock.split(", ")) {
			const [key, ...rest] = chunk.trim().split(" ");
			let value = rest.join(" ");

			if (!(key in FIELDS)) {
				errors.push(`Unknown field: "${chunk.trim()}"`);
				continue;
			}

			// AC may include armor type in parens — extract just the number
			if (key === "AC") {
				const acMatch = value.match(/^(\d+)/);
				value = acMatch ? acMatch[1] : value;
			}

			if (FIELDS[key] === "int" && isNaN(parseInt(value))) {
				errors.push(`Invalid ${key}: "${value}"`);
				stats[key] = value;
				continue;
			}

			stats[key] = value;
		}

		// Check for missing fields
		for (const key of Object.keys(FIELDS)) {
			if (stats[key] === null) {
				errors.push(`Missing: ${key}`);
			}
		}

		if (stats.AL && !["L", "N", "C"].includes(stats.AL.toUpperCase())) {
			errors.push(`Invalid AL: "${stats.AL}" (expected L, N, or C)`);
		}

		if (errors.length > 0) {
			const error = new Error("Stat block validation failed");
			error.details = errors;
			throw error;
		}

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

		if (!atk || !atk[2]?.trim()) {
			throw new Error(`Could not parse attack: "${str.trim()}"`);
		}

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
			const features = [];
			for (let i = 1; i < dmgStrs.length; i++) {
				if (parseInt(dmgStrs[i])) {
					attackObj.system.bonuses.damageBonus = parseInt(dmgStrs[i]);
				}
				else {
					features.push(dmgStrs[i].titleCase());
				}
			}
			if (features.length) {
				attackObj.system.damage.special = features.join(", ");
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
		if (!featureStr) {
			throw new Error(`Could not parse feature: "${str.substring(0, 40)}"`);
		}
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

		if (!parsedSpell) {
			throw new Error(`Could not parse spell: "${str.substring(0, 40)}"`);
		}

		const spellObj = {
			name: parsedSpell[1],
			type: "Spell",
			system: {
				tier: parsedSpell[3] - 10,
				description: `<p>${parsedSpell[4].replaceAll(/(\d+d\d+)/gi, "[[/r $&]]")}</p>`,
				range: "",
				duration: {
					type: "instant",
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
	 * Parses an ATK field into attack items and spellcasting info.
	 * @param {string} atkStr - e.g. "2 claw +7 (1d12) or 1 spell +2"
	 * @returns {{ attackArray: object[], spellcasting: object|null }}
	 * @throws {Error} With .details array listing parse failures
	 */
	_parseAttacks(atkStr) {
		const attackArray = [];
		let spellcasting = null;
		const errors = [];

		for (const line of atkStr.split(/ and | or /)) {
			try {
				const atk = this._parseAttack(line);
				if (atk.name.toLowerCase() === "spell") {
					spellcasting = {
						attacks: `${atk.system.attack.num}`,
						bonus: atk.system.bonuses.attackBonus,
					};
				}
				else {
					attackArray.push(atk);
				}
			}
			catch(e) {
				errors.push(`Failed to parse attack: "${line.trim()}"`);
			}
		}

		if (errors.length > 0) {
			const error = new Error("Attack parsing failed");
			error.details = errors;
			throw error;
		}

		return { attackArray, spellcasting };
	}

	/**
	 * Parses feature strings into feature/spell items and casting ability.
	 * @param {string[]} features - Individual feature strings from _parseFeatures
	 * @returns {{ featureArray: object[], castingAbility: string }}
	 * @throws {Error} With .details array listing parse failures
	 */
	_parseFeaturesAndSpells(features) {
		const featureArray = [];
		let castingAbility = "";
		const errors = [];

		for (const text of features) {
			const spellMatch = text.match(/\(([\w]*)?\s*Spell\)/);
			if (spellMatch) {
				try {
					featureArray.push(this._parseSpell(text));
					if (spellMatch[1]
						&& CONFIG.SHADOWDARK.ABILITY_KEYS.includes(
							spellMatch[1].toLowerCase()
						)) {
						castingAbility = spellMatch[1].toLowerCase();
					}
				}
				catch(e) {
					errors.push(`Failed to parse spell: "${text.substring(0, 40)}..."`);
				}
			}
			else {
				try {
					featureArray.push(this._parseFeature(text));
				}
				catch(e) {
					errors.push(`Failed to parse feature: "${text.substring(0, 40)}..."`);
				}
			}
		}

		if (errors.length > 0) {
			const error = new Error("Feature parsing failed");
			error.details = errors;
			throw error;
		}

		return { featureArray, castingAbility };
	}

	/**
	 * Builds a Foundry actor data object from validated parsed data.
	 */
	_buildActorObj(titleName, stats, statBlock, flavorText, features) {
		const alignments = {L: "lawful", N: "neutral", C: "chaotic"};
		const movement = this._parseMovement(stats.MV);
		const notesText = this._generateNotesText(statBlock, flavorText, features);

		return {
			name: titleName,
			img: "systems/shadowdark/assets/tokens/cowled_token_red.webp",
			type: "NPC",
			system: {
				alignment: alignments[stats.AL.toUpperCase()],
				attributes: {
					ac: { value: stats.AC },
					hp: { max: stats.HP, value: stats.HP, hd: 0 },
				},
				level: { value: stats.LV },
				notes: notesText,
				abilities: {
					str: { mod: parseInt(stats.S) },
					int: { mod: parseInt(stats.I) },
					dex: { mod: parseInt(stats.D) },
					wis: { mod: parseInt(stats.W) },
					con: { mod: parseInt(stats.C) },
					cha: { mod: parseInt(stats.Ch) },
				},
				darkAdapted: true,
				move: movement.type,
				moveNote: movement.notes,
				spellcastingAbility: "",
			},
		};
	}

	/**
	 * Parses pasted text into structured data without creating any documents.
	 * Collects errors from all parsing stages and throws once with the full list.
	 * @param {string} monsterText - Raw pasted monster text
	 * @returns {object} { actorObj, attackArray, featureArray, castingAbility, spellcasting }
	 * @throws {Error} With .details array listing all parse failures
	 */
	_parseMonster(monsterText) {
		monsterText = monsterText.replace(/[^\S\r\n]+$/gm, "");

		const parsedText = monsterText.match([
			/(.*)\n/,							// parsedText[1] matches Title
			/([\S\s]*)\n/,						// parsedText[2] matches flavor Text
			/(AC \d*[\S\s]*LV \d*)(?:\n|$)/,	// parsedText[3] matches Stat Block
			/([\S\s]*)?/,						// parsedText[4] matches features
		].map(function(r) {
			return r.source;
		}).join(""));

		if (!parsedText) {
			const error = new Error("Import validation failed");
			error.details = [
				"Could not parse stat block. Expected format: "
				+ "Name, description, stat block (AC ... LV), "
				+ "then optional features.",
			];
			throw error;
		}

		const titleName = parsedText[1].titleCase();
		const flavorText = parsedText[2].replace(/(\r\n|\n|\r)/gm, " ");
		const statBlock = parsedText[3].replace(/(\r\n|\n|\r)/gm, " ");
		const featuresText = parsedText[4];
		const features = typeof featuresText !== "undefined"
			? this._parseFeatures(featuresText) : [];

		// Collect errors from all parsing stages
		const errors = [];

		let stats = null;
		try {
			stats = this._parseStatBlock(statBlock);
		}
		catch(e) {
			errors.push(...e.details);
		}

		let attackArray = [];
		let spellcasting = null;
		if (stats?.ATK) {
			try {
				({ attackArray, spellcasting } = this._parseAttacks(stats.ATK));
			}
			catch(e) {
				errors.push(...e.details);
			}
		}

		let featureArray = [];
		let castingAbility = "";
		try {
			({ featureArray, castingAbility } = this._parseFeaturesAndSpells(features));
		}
		catch(e) {
			errors.push(...e.details);
		}

		if (errors.length > 0) {
			const error = new Error("Import validation failed");
			error.details = errors;
			throw error;
		}

		const actorObj = this._buildActorObj(
			titleName, stats, statBlock, flavorText, features
		);
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
