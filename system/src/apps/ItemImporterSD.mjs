import ImporterSD from "./ImporterSD.mjs";

export default class ItemImporterSD extends ImporterSD {
	/**
	 * Contains an importer function to import item stat blocks
	 */

	static DEFAULT_OPTIONS = {
		id: "sd-item-importer",
		window: {
			title: "SHADOWDARK.apps.item-importer.title",
		},
	};

	static PARTS = {
		form: {
			template: "systems/shadowdark/templates/apps/item-importer.hbs",
		},
	};

	static IMPORTER_CONFIG = {
		textField: "itemText",
		sidebarTab: "items",
		errorMessage: "Failed to fully parse the item stat block.",
	};

	static TRAIT_KEYWORDS = ["Bonus", "Benefit", "Curse", "Personality"];

	/**
	 * Tests if a line starts a trait section (case-insensitive).
	 * @param {string} line
	 * @returns {boolean}
	 */
	_isTraitStart(line) {
		const lower = line.toLowerCase();
		return ItemImporterSD.TRAIT_KEYWORDS.some(
			keyword => lower.startsWith(`${keyword.toLowerCase()}. `)
		);
	}

	/**
	 * Consumes all-caps lines from the front of the array as the item name.
	 * All-caps = has at least one uppercase letter and no lowercase letters.
	 * @param {string[]} lines - Mutated: consumed lines are removed
	 * @returns {string|null} Title-cased name, or null if no all-caps lines found
	 */
	_parseName(lines) {
		const parts = [];
		while (lines.length > 0 && /[A-Z]/.test(lines[0]) && !/[a-z]/.test(lines[0])) {
			parts.push(lines.shift());
		}
		if (parts.length === 0) return null;
		return parts.join(" ").titleCase();
	}

	/**
	 * Consumes lines until a trait boundary, returning joined flavor text.
	 * @param {string[]} lines - Mutated: consumed lines are removed
	 * @returns {string}
	 */
	_parseFlavorText(lines) {
		const parts = [];
		while (lines.length > 0 && !this._isTraitStart(lines[0])) {
			parts.push(lines.shift());
		}
		return parts.join(" ");
	}

	/**
	 * Parses remaining lines into trait objects, grouping multi-line traits.
	 * Type is normalized to canonical title-case from TRAIT_KEYWORDS.
	 * @param {string[]} lines
	 * @returns {{ type: string, text: string }[]}
	 */
	_parseTraits(lines) {
		const traits = [];
		let current = null;

		for (const line of lines) {
			if (this._isTraitStart(line)) {
				if (current) traits.push(current);
				const dotIndex = line.indexOf(".");
				const rawType = line.substring(0, dotIndex);
				const type = ItemImporterSD.TRAIT_KEYWORDS.find(
					keyword => keyword.toLowerCase() === rawType.toLowerCase()
				) ?? rawType;
				current = {
					type,
					text: line.substring(dotIndex + 1).trim(),
				};
			}
			else if (current) {
				current.text += ` ${line}`;
			}
		}
		if (current) traits.push(current);

		return traits;
	}

	/**
	 * Extracts bonus hint from the Bonus trait if present.
	 * @param {{ type: string, text: string }[]} traits
	 * @returns {{ value: number, text: string, isMithral: boolean }|null}
	 */
	_parseBonusHint(traits) {
		const bonus = traits.find(trait => trait.type.toLowerCase() === "bonus");
		if (!bonus) return null;

		const match = bonus.text.match(/^\+(\d+)/);
		if (!match) return null;

		return {
			value: parseInt(match[1], 10),
			text: bonus.text,
			isMithral: /mithral/i.test(bonus.text),
		};
	}

	/**
	 * Builds HTML description from flavor text and traits.
	 * @param {string} flavorText
	 * @param {{ type: string, text: string }[]} traits
	 * @returns {string}
	 */
	_buildDescription(flavorText, traits) {
		const parts = [];
		if (flavorText) {
			parts.push(`<p><em>${flavorText}</em></p>`);
		}
		for (const trait of traits) {
			parts.push(`<p><strong>${trait.type}.</strong> ${trait.text}</p>`);
		}
		return parts.join("");
	}

	/**
	 * Parses item text into structured data without creating any documents.
	 * Collects errors from all parsing stages and throws once with the full list.
	 * @param {string} itemText - Raw pasted item text
	 * @returns {object} { name, flavorText, traits, bonusHint, description }
	 * @throws {Error} With .details array listing all parse failures
	 */
	_parseItem(itemText) {
		const lines = itemText.split(/\r?\n/)
			.map(line => line.trim())
			.filter(line => line.length > 0);

		if (lines.length === 0) {
			const error = new Error("Import validation failed");
			error.details = ["Input is empty"];
			throw error;
		}

		const errors = [];

		const name = this._parseName(lines);
		if (!name) {
			errors.push("Could not parse item name (expected all-caps line at start)");
		}

		const flavorText = this._parseFlavorText(lines);
		const traits = this._parseTraits(lines);
		const bonusHint = this._parseBonusHint(traits);
		const description = this._buildDescription(flavorText, traits);

		if (errors.length > 0) {
			const error = new Error("Import validation failed");
			error.details = errors;
			throw error;
		}

		return { name, flavorText, traits, bonusHint, description };
	}

	/** @override */
	async _import(itemText) {
		return this._importItem(itemText);
	}

	/**
	 * Parses pasted text representing an item and creates an Item from it.
	 * @param {string} itemText - String data posted by user
	 * @returns {Item}
	 */
	async _importItem(itemText) {
		console.log(itemText);

		// parse item text into 3 main parts:
		const parsedText = itemText.match([
			/(.*)\n/,			// parsedText[1] matches title
			/([A-Z].*?[a-z]+?[\S\s]+?)/,	// parsedText[2] matches flavor text
			/(Bonus\.[\S\s]*|Benefit\.[\S\s]*|Curse\.[\S\s]*|Personality\.[\S\s]*)/,
			// parsedText[3] matches bonus, benefit, curse, and personality
		].map(function(r) {
			return r.source;
		}).join(""));

		let data = {}; // data object to be passed to the final item creator

		// set main variables, removing newlines
		data.name = parsedText[1].titleCase().replaceAll(/(\r\n|\n|\r)/gm, " ").trim().split(/[\s\t\n]+/).join(" ");
		const flavorText = parsedText[2].replaceAll(/(\r\n|\n|\r)/gm, " ").trim().split(/[\s\t\n]+/).join(" ");

		let features = [];
		const parsedFeatures = parsedText[3].replaceAll(/(\r\n|\n|\r)/gm, " ").trim().split(/[\s\t\n]+/).join(" ");

		const parsedBonus = parsedFeatures.trim().match([
			/Bonus\.\s(.*?)/,
			/(Benefit\.|Curse\.|Personality\.|$)/,
		].map(function(r) {
			return r.source;
		}).join(""));

		// gather base weapons and armor from compendium
		const weapons = (await shadowdark.compendiums.baseWeapons()).contents;
		const armor = (await shadowdark.compendiums.baseArmor()).contents;

		// parse "Bonus" field to see if item is a magic armor or weapon
		if (parsedBonus?.length > 1) {
			features.push(`<strong>Bonus.</strong> ${parsedBonus[1]}`);
			if (parsedBonus[1].charAt(0) === "+") {
				if (weapons.every(w => {
					if (parsedBonus[1].toLowerCase().includes(w.name.toLowerCase())) {
						if (/\d/.test(parsedBonus[1].charAt(1))) {
							data.attackBonus = parsedBonus[1].charAt(1);
							data.damageBonus = parsedBonus[1].charAt(1);
						}
						data.type = "Weapon";
						data.baseWeapon = w;
						return false;
					}
					return true;
				})) {
					armor.every(a => {
						if (parsedBonus[1].toLowerCase().includes(a.name.toLowerCase())) {
							if (/\d/.test(parsedBonus[1].charAt(1))) {
								data.acModifier = parsedBonus[1].charAt(1);
							}
							data.armorProperties = parsedBonus[1].toLowerCase().includes("mithral")
								? [] : a.system.properties; // Remove properties from mithral armor
							data.type = "Armor";
							data.baseArmor = a;
							return false;
						}
						return true;
					});
				}
			}
		}

		const parsedBenefit = parsedFeatures.trim().match([
			/Benefit\.\s(.*?)/,
			/(Curse\.|Personality\.|$)/,
		].map(function(r) {
			return r.source;
		}).join(""));
		if (parsedBenefit?.length > 1) features.push(`<strong>Benefit.</strong> ${parsedBenefit[1]}`);

		const parsedCurse = parsedFeatures.trim().match([
			/Curse\.\s(.*?)/,
			/(Personality\.|$)/,
		].map(function(r) {
			return r.source;
		}).join(""));
		if (parsedCurse?.length > 1) features.push(`<strong>Curse.</strong> ${parsedCurse[1]}`);

		const parsedPersonality = parsedFeatures.trim().match([
			/Personality\.\s(.*)/,
		].map(function(r) {
			return r.source;
		}).join(""));
		if (parsedPersonality?.length > 1) features.push(`<strong>Personality.</strong> ${parsedPersonality[1]}`);

		// HTML description
		data.description = `
			<p><em>${flavorText}</em></p><p></p><p>${features.join("</p><p></p><p>")}</p>`;
		console.log(data);

		// create the item template
		let itemObj;
		switch (data.type) {
			case "Weapon":
				itemObj = {
					...data.baseWeapon,
					name: data.name,
					type: data.type,
					system: {
						...data.baseWeapon.system,
						attackBonus: data.attackBonus,
						damageBonus: data.damageBonus,
						bonuses: {
							...data.baseWeapon.system.bonuses,
							attackBonus: data.attackBonus,
							damageBonus: data.damageBonus,
						},
						damage: {
							...data.baseWeapon.system.damage,
							bonus: data.damageBonus,
						},
						description: data.description,
						magicItem: true,
						baseWeapon: data.baseWeapon.name.slugify(),
					},
				};
				break;
			case "Armor":
				itemObj = {
					...data.baseArmor,
					name: data.name,
					type: data.type,
					system: {
						...data.baseArmor.system,
						ac: {
							...data.baseArmor.system.ac,
							modifier: data.acModifier,
						},
						properties: data.armorProperties,
						description: data.description,
						magicItem: true,
						baseArmor: data.baseArmor.name.slugify(),

					},
				};
				break;
			default:
				itemObj = {
					name: data.name,
					type: "Basic",
					system: {
						description: data.description,
						magicItem: true,
					},
				};
				break;
		}

		// Create the item object
		const newItem = await Item.create(itemObj);

		console.log(newItem);
		return newItem;
	}
}
