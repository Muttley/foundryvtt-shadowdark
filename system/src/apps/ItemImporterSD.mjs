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
	 * Patterns that map trait text to predefined Active Effects.
	 * Each entry has a regex pattern, a predefined effect key, and
	 * optionally a fixed value (otherwise extracted from capture group 1).
	 */
	static BENEFIT_EFFECT_PATTERNS = [
		{
			pattern: /\+(?<value>\d+)\s+bonus\s+to\s+(?:your\s+)?armor\s+class/i,
			effect: "acBonus",
		},
		{
			pattern: /Strength\s+stat\s+becomes\s+(?<value>\d+)/i,
			effect: "permanentAbilityStr",
		},
		{
			pattern: /Dexterity\s+stat\s+becomes\s+(?<value>\d+)/i,
			effect: "permanentAbilityDex",
		},
		{
			pattern: /Constitution\s+stat\s+becomes\s+(?<value>\d+)/i,
			effect: "permanentAbilityCon",
		},
		{
			pattern: /Intelligence\s+stat\s+becomes\s+(?<value>\d+)/i,
			effect: "permanentAbilityInt",
		},
		{
			pattern: /Wisdom\s+stat\s+becomes\s+(?<value>\d+)/i,
			effect: "permanentAbilityWis",
		},
		{
			pattern: /Charisma\s+stat\s+becomes\s+(?<value>\d+)/i,
			effect: "permanentAbilityCha",
		},
	];

	/**
	 * Tests if a line starts a trait section (case-insensitive).
	 * @param {string} line
	 * @returns {boolean}
	 *
	 * For example, it matches "Bonus. " or "Personality. ".
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
	 *
	 * For example:
	 * BRACERS OF
	 * ARMOR
	 */
	_parseName(lines) {
		const parts = [];
		// Consume lines until end of CAPS, see docstring
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
	 * Helper that parses a trait-start line into type and text.
	 * Splits at the first period, normalizes type to canonical
	 * title-case from TRAIT_KEYWORDS (e.g. "BENEFIT" → "Benefit").
	 * @param {string} line - A line where _isTraitStart() returned true
	 * @returns {{ type: string, text: string }}
	 */
	_parseTraitStart(line) {
		const dotIndex = line.indexOf(".");
		const rawType = line.substring(0, dotIndex);
		const traitText = line.substring(dotIndex + 1).trim();

		const type = ItemImporterSD.TRAIT_KEYWORDS.find(
			keyword => keyword.toLowerCase() === rawType.toLowerCase()
		) ?? rawType;

		return { type, text: traitText };
	}

	/**
	 * Groups remaining lines into trait objects. A new trait starts
	 * at each _isTraitStart() boundary; continuation lines are joined.
	 * @param {string[]} lines - Lines after name and flavor text
	 * @returns {{ type: string, text: string }[]}
	 */
	_parseTraits(lines) {
		const traits = [];
		let current = null;

		for (const line of lines) {
			if (this._isTraitStart(line)) {
				if (current) traits.push(current);
				current = this._parseTraitStart(line);
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
		};
	}

	/**
	 * Scans trait text against BENEFIT_EFFECT_PATTERNS and returns
	 * matched predefined effects with their values.
	 * @param {{ type: string, text: string }[]} traits
	 * @returns {{ effect: string, value: number }[]}
	 */
	_matchBenefitEffects(traits) {
		const matched = [];
		for (const trait of traits) {
			for (const entry of ItemImporterSD.BENEFIT_EFFECT_PATTERNS) {
				const match = trait.text.match(entry.pattern);
				if (match) {
					const value = parseInt(match.groups.value, 10);
					matched.push({ effect: entry.effect, value });
				}
			}
		}
		return matched;
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
	 * Normalises OpenShadowdark format by uppercasing the first line so the
	 * CRB parser can detect it as an all-caps name.
	 * @param {string[]} lines - Mutated in place
	 */
	_normalizeOpenShadowdark(lines) {
		lines[0] = lines[0].toUpperCase();
	}

	/**
	 * Parses item text into structured data without creating any documents.
	 * Supports CRB format (all-caps name, no blank lines) and OpenShadowdark
	 * format (title-case name, blank line after title). Collects errors from
	 * all parsing stages and throws once with the full list.
	 * @param {string} itemText - Raw pasted item text
	 * @returns {object} { name, flavorText, traits, bonusHint, benefitEffects, description }
	 * @throws {Error} With .details array listing all parse failures
	 */
	_parseItem(itemText) {
		// Fix PDF copy-paste hyphenation: "diamond-\ncut" → "diamond-cut"
		const dehyphenated = itemText.replace(/- *\n/g, "-");
		const lines = dehyphenated.split(/\r?\n/)
			.map(line => line.trim())
			.filter(line => line.length > 0);

		if (lines.length === 0) {
			const error = new Error("Import validation failed");
			error.details = ["Input is empty"];
			throw error;
		}

		// OpenShadowdark format: title-case first line followed by a blank line.
		// Normalise by uppercasing the first line so the CRB parser handles the rest.
		const isOpenShadowdark = /[a-z]/.test(lines[0])
			&& /^[^\n]*\n\s*\n/.test(dehyphenated.trimStart());

		if (isOpenShadowdark) {
			this._normalizeOpenShadowdark(lines);
		}

		const errors = [];

		const name = this._parseName(lines);
		if (!name) {
			errors.push("Could not parse item name (expected all-caps line at start)");
		}

		const flavorText = this._parseFlavorText(lines);
		const traits = this._parseTraits(lines);
		const bonusHint = this._parseBonusHint(traits);
		const benefitEffects = this._matchBenefitEffects(traits);
		const description = this._buildDescription(flavorText, traits);

		if (errors.length > 0) {
			const error = new Error("Import validation failed");
			error.details = errors;
			throw error;
		}

		return { name, flavorText, traits, bonusHint, benefitEffects, description };
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
	 * Mithral items have their armor properties stripped.
	 * @param {string} name - Item name
	 * @param {string} description - HTML description
	 * @param {object} bonusHint - { value, text }
	 * @param {object} baseArmor - Base armor from compendium
	 * @returns {object}
	 */
	_buildArmorObj(name, description, bonusHint, baseArmor) {
		const isMithral = /mithral/i.test(bonusHint.text);
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
				properties: isMithral
					? [] : baseArmor.system.properties,
				description,
				magicItem: true,
				baseArmor: baseArmor.name.slugify(),
			},
		};
	}

	/**
	 * Resolves item type and builds the item data object.
	 * Checks bonus hint against compendium weapons/armor.
	 * @param {object} parsed - Output from _parseItem()
	 * @returns {object} { itemObj, effects }
	 */
	async _resolveItemType(parsed) {
		const { name, description, bonusHint, benefitEffects } = parsed;
		const effects = [];

		// Bonus trait with +N: check compendium weapons, then armor
		if (bonusHint) {
			const weapons =
				(await shadowdark.compendiums.baseWeapons()).contents;
			const matchedWeapon = weapons.find(
				weapon => bonusHint.text.toLowerCase()
					.includes(weapon.name.toLowerCase())
			);
			if (matchedWeapon) {
				effects.push(
					this._buildPredefinedEffect(
						"weaponAttackBonus", bonusHint.value
					),
					this._buildPredefinedEffect(
						"weaponDamageBonus", bonusHint.value
					)
				);
				// Weapon may also have benefit effects (e.g. Armor of the Oni)
				for (const be of benefitEffects) {
					effects.push(
						this._buildPredefinedEffect(be.effect, be.value)
					);
				}
				return {
					itemObj: this._buildWeaponObj(
						name, description, bonusHint, matchedWeapon
					),
					effects,
				};
			}

			const armor =
				(await shadowdark.compendiums.baseArmor()).contents;
			const matchedArmor = armor.find(
				piece => bonusHint.text.toLowerCase()
					.includes(piece.name.toLowerCase())
			);
			if (matchedArmor) {
				for (const be of benefitEffects) {
					effects.push(
						this._buildPredefinedEffect(be.effect, be.value)
					);
				}
				return {
					itemObj: this._buildArmorObj(
						name, description, bonusHint, matchedArmor
					),
					effects,
				};
			}

			// +N bonus but no matching weapon or armor
			const error = new Error("Import validation failed");
			error.details = [
				"Bonus has a +N modifier but no matching weapon"
				+ " or armor was found in the compendium.",
			];
			throw error;
		}

		// Benefit-based AC bonus: create as Armor with base 0.
		// Use modifier field only for static bonuses — no AE, to avoid doubling.
		// No ability attribute: bonus armor items don't add an ability mod.
		const acEffect = benefitEffects.find(
			be => be.effect === "acBonus"
		);
		if (acEffect) {
			for (const be of benefitEffects) {
				if (be.effect === "acBonus") continue;
				effects.push(
					this._buildPredefinedEffect(be.effect, be.value)
				);
			}
			return {
				itemObj: {
					name,
					type: "Armor",
					system: {
						ac: { attribute: "", base: 0, modifier: acEffect.value },
						baseArmor: "",
						properties: [],
						description,
						magicItem: true,
					},
				},
				effects,
			};
		}

		// Build benefit effects for Basic items too
		for (const be of benefitEffects) {
			effects.push(
				this._buildPredefinedEffect(be.effect, be.value)
			);
		}

		// Default: Basic magic item
		return {
			itemObj: {
				name,
				type: "Basic",
				system: { description, magicItem: true },
			},
			effects,
		};
	}

	/**
	 * Parses pasted text representing an item and creates an Item from it.
	 * @param {string} itemText - String data posted by user
	 * @returns {Item}
	 */
	async _importItem(itemText) {
		const parsed = this._parseItem(itemText);
		const { itemObj, effects } = await this._resolveItemType(parsed);

		const newItem = await Item.create(itemObj);

		if (effects.length > 0) {
			await newItem.createEmbeddedDocuments(
				"ActiveEffect", effects
			);
		}

		return newItem;
	}
}
