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
	 * Builds a Foundry Weapon item object from parsed data and a base weapon.
	 * @param {string} name - Item name
	 * @param {string} description - HTML description
	 * @param {object} bonusHint - { value, text, isMithral }
	 * @param {object} baseWeapon - Base weapon from compendium
	 * @returns {object}
	 */
	_buildWeaponObj(name, description, bonusHint, baseWeapon) {
		return {
			...baseWeapon,
			name,
			type: "Weapon",
			system: {
				...baseWeapon.system,
				description,
				magicItem: true,
				baseWeapon: baseWeapon.name.slugify(),
			},
		};
	}

	/**
	 * Builds an Active Effect data object from a predefined effect config.
	 * Uses CONFIG.SHADOWDARK.PREDEFINED_EFFECTS for names, icons, and keys.
	 * @param {string} key - Predefined effect key (e.g. "weaponAttackBonus")
	 * @param {number} value - The effect value
	 * @returns {object}
	 */
	_buildPredefinedEffect(key, value) {
		const data = CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[key];
		const effectMode = foundry.utils.getProperty(
			CONST.ACTIVE_EFFECT_MODES,
			data.mode.split(".")[2]
		);
		return {
			name: game.i18n.localize(
				`SHADOWDARK.item.effect.predefined_effect.${key}`
			),
			img: data.img,
			changes: [{
				key: data.effectKey,
				value,
				mode: effectMode,
			}],
			disabled: false,
			transfer: data.transfer ?? true,
		};
	}

	/**
	 * Builds a Foundry Armor item object from parsed data and a base armor.
	 * @param {string} name - Item name
	 * @param {string} description - HTML description
	 * @param {object} bonusHint - { value, text, isMithral }
	 * @param {object} baseArmor - Base armor from compendium
	 * @returns {object}
	 */
	_buildArmorObj(name, description, bonusHint, baseArmor) {
		return {
			...baseArmor,
			name,
			type: "Armor",
			system: {
				...baseArmor.system,
				ac: {
					...baseArmor.system.ac,
					modifier: bonusHint.value,
				},
				properties: bonusHint.isMithral
					? [] : baseArmor.system.properties,
				description,
				magicItem: true,
				baseArmor: baseArmor.name.slugify(),
			},
		};
	}

	/**
	 * Parses pasted text representing an item and creates an Item from it.
	 * @param {string} itemText - String data posted by user
	 * @returns {Item}
	 */
	async _importItem(itemText) {
		const { name, description, bonusHint } =
			this._parseItem(itemText);

		// Resolve weapon/armor type from compendiums if bonus hint present
		if (bonusHint) {
			const weapons =
				(await shadowdark.compendiums.baseWeapons()).contents;
			const matchedWeapon = weapons.find(
				weapon => bonusHint.text.toLowerCase()
					.includes(weapon.name.toLowerCase())
			);
			if (matchedWeapon) {
				const newWeapon = await Item.create(
					this._buildWeaponObj(
						name, description, bonusHint, matchedWeapon
					)
				);
				await newWeapon.createEmbeddedDocuments(
					"ActiveEffect", [
						this._buildPredefinedEffect(
							"weaponAttackBonus", bonusHint.value
						),
						this._buildPredefinedEffect(
							"weaponDamageBonus", bonusHint.value
						),
					]
				);
				return newWeapon;
			}

			const armor =
				(await shadowdark.compendiums.baseArmor()).contents;
			const matchedArmor = armor.find(
				piece => bonusHint.text.toLowerCase()
					.includes(piece.name.toLowerCase())
			);
			if (matchedArmor) {
				return Item.create(
					this._buildArmorObj(
						name, description, bonusHint, matchedArmor
					)
				);
			}
		}

		// Default: Basic magic item
		return Item.create({
			name,
			type: "Basic",
			system: {
				description,
				magicItem: true,
			},
		});
	}
}
