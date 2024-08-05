export default class ShadowdarklingImporterSD extends FormApplication {
	/**
	 * Contains an importer function to generate player actors from
	 * Shadowdarklings.net
	 */

	/** @inheritdoc */
	constructor() {
		super();

		this.importedActor ={};
		this.gear =[];
		this.spells =[];
		this.talents =[];
		this.errors = {
			actor: [],
			gear: [],
			spells: [],
			talents: [],
		};
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark"],
			width: 450,
			height: 375,
			resizable: true,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/shadowdarkling-importer.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.apps.shadowdarkling-importer.title");
		return `${title}`;
	}

	/** @inheritdoc */
	activateListeners(html) {
		super.activateListeners(html);

		window.addEventListener("paste", e => this._onPaste(e));
	}

	/** @inheritdoc */
	_onSubmit(event) {
		event.preventDefault();

		super._onSubmit(event);
	}

	/** @override */
	async _updateObject(event, data) {
		this._createActor();
	}

	/** @override */
	async getData(options) {
		const data = {
			actor: this.importedActor,
			errors: this.errors,
			gear: this.gear,
		};

		return data;
	}

	/**
	 * Handles pasting of json data
	 */
	async _onPaste(event) {
		// check if values are already loaded
		if (this.importedActor.name) return;

		let postedJson = "";
		try {
			postedJson = JSON.parse(event.clipboardData.getData("text/plain"));
		}
		catch(error) {
			ui.notifications.error("JSON not found in clipboard");
		}

		if (postedJson) {
			// load all values from json
			await this._importActor(postedJson);
		}
	}

	/**
	 * Manipulates the Spell Advantage talent so it may be used on the actor
	 * @param {string} spell - Spell name to be used for advantage
	 * @returns {ItemSD}
	 */
	async _spellCastingAdvantageTalent(spell) {
		const talent = await this._findInCompendium("Spellcasting Advantage", "shadowdark.talents");
		const modifiedTalent = talent.toObject();
		modifiedTalent.effects[0].changes[0].value = spell.slugify();
		modifiedTalent.name += ` (${spell})`;
		return modifiedTalent;
	}

	/**
	 * Manipulates the Weapon/Armor Mastery talent so it may be used on the actor
	 * @param {string} type - What type of item (armor/weapon)
	 * @param {string} choice - The actual item to be affected
	 * @returns {ItemSD}
	 */
	async _masteryTalent(type, choice) {
		const itemName = choice.split(" ").map(s => s.capitalize()).join(" ");
		const talent = await this._findInCompendium(`${type.capitalize()} Mastery`, "shadowdark.talents");
		const modifiedTalent = talent.toObject();
		modifiedTalent.effects[0].changes[0].value = choice.slugify();
		modifiedTalent.name += ` (${itemName})`;
		return modifiedTalent;
	}

	async _damageDieD12Talent(choice) {
		const itemName = choice.split(":")[0];
		const talent = await this._findInCompendium("Increased Weapon Damage Die", "shadowdark.talents");
		const modifiedTalent = talent.toObject();
		modifiedTalent.effects[0].changes[0].value = choice.split(":")[0].slugify();
		modifiedTalent.name += ` (${itemName})`;
		return modifiedTalent;
	}

	async _addTalentEffect(talent, value) {
		talent.effects[0].changes[0].value = value;
		talent.name += ` (${value})`;
		return talent;
	}

	/**
	 * Searches a compendium pack and returns the stored data if a match is found
	 * @param {string} contentName - Name of something that may exist in a compendium
	 * @param {string} packName - id of compendium pack to look inside
	 * @returns {ItemSD|string}
	 */
	async _findInCompendium(contentName, packName) {
		const pack = game.packs.get(packName);
		const itemIndex = pack.index.find(
			i => i.name.toLowerCase() === contentName.toLowerCase()
		);
		if (itemIndex) {
			return pack.getDocument(itemIndex._id);
		}
		return "";
	}

	/**
	 * Searches the compendiums for items and puts them in an array
	 * @param {JSON} json - JSON data from the Shadowdarklings.net site
	 */
	async _loadGear(json) {

		if (json.gear.length === 0) return;

		await Promise.all(json.gear.map(async item => {
			for (let i = 1; i <= item.quantity; i++) {
				let itemName = item.name;

				if (itemName.match(/flask or bottle/i)) itemName = "Flask";
				if (itemName.match(/caltrops/i)) itemName = "Caltrops";

				const foundItem = await this._findInCompendium(itemName, "shadowdark.gear");
				if (foundItem) {
					this.gear.push(foundItem);
				}
				else {
					this.errors.gear.push(itemName);
				}
			}
		}));

	}

	/**
	 * Searches the compendiums for items and puts them in an array
	 * @param {JSON} json - JSON data from the Shadowdarklings.net site
	 */
	async _loadSpells(json) {

		for (const spell of json.spellsKnown.split(/\s*,\s*/)) {
			console.log(spell);
			const foundSpell = await this._findInCompendium(spell, "shadowdark.spells");
			if (foundSpell) {
				this.spells.push(foundSpell);
			}
			else {
				this.errors.spells.push(spell);
			}
		}
	}

	async _setCharacterValue(valueStr, compendiumArray) {
		// Deity
		const deities = await shadowdark.compendiums.deities(false);
		const deity = deities.find(
			i => i.name.toLowerCase() === json.deity.toLowerCase()
		);
		importedActor.system.deity = deity?.uuid ?? "";
	}

	/**
	 * Parses JSON data from shadowdarklings and tries to create an Player actor from it.
	 * @param {JSON} json - JSON Data from the Shadowdarklings.net site
	 * @returns {ActorSD}
	 */
	async _importActor(json) {
		// set template for new actor
		this.importedActor = {
			name: json.name,
			type: "Player",
			system: {
				abilities: {
					str: {
						base: json.stats.STR,
						bonus: 0,
					},
					dex: {
						base: json.stats.DEX,
						bonus: 0,
					},
					con: {
						base: json.stats.CON,
						bonus: 0,
					},
					int: {
						base: json.stats.INT,
						bonus: 0,
					},
					wis: {
						base: json.stats.WIS,
						bonus: 0,
					},
					cha: {
						base: json.stats.CHA,
						bonus: 0,
					},
				},
				alignment: json.alignment.toLowerCase(),
				ancestry: "",
				attributes: {
					hp: {
						value: json.maxHitPoints,
						max: json.maxHitPoints,
						base: (json.ancestry === "Dwarf") ? json.maxHitPoints - 2 : json.maxHitPoints,
					},
				},
				background: "",
				class: "",
				coins: {
					gp: json.gold,
					sp: json.silver,
					cp: json.copper,
				},
				deity: "",
				languages: [],
				level: {
					value: json.level,
					xp: json.XP,
				},
				slots: json.gearSlotsTotal,
			},
		};

		// Ancestry
		if (json.ancestry) {
			const ancestries = await shadowdark.compendiums.ancestries(false);
			const ancestry = ancestries.find(
				i => i.name.toLowerCase() === json.ancestry.toLowerCase()
			);
			this.importedActor.system.ancestry = ancestry?.uuid ?? "";
			if (!ancestry) this.errors.actor.push("Ancestry:".concat(json.ancestry));
		}

		// Background
		const backgrounds = await shadowdark.compendiums.backgrounds(false);
		const background = backgrounds.find(
			i => i.name.toLowerCase() === json.background.toLowerCase()
		);
		this.importedActor.system.background = background?.uuid ?? "";
		if (!background) this.errors.actor.push("Background:".concat(json.background));

		// Class
		const classes = await shadowdark.compendiums.classes(false);
		const characterClass = classes.find(
			i => i.name.toLowerCase() === json.class.toLowerCase()
		);
		this.importedActor.system.class = characterClass?.uuid ?? "";
		if (!characterClass) this.errors.actor.push("Class:".concat(json.class));

		// Deity
		const deities = await shadowdark.compendiums.deities(false);
		const deity = deities.find(
			i => i.name.toLowerCase() === json.deity.toLowerCase()
		);
		this.importedActor.system.deity = deity?.uuid ?? "";
		if (!deity) this.errors.actor.push("Deity:".concat(json.deity));

		// Languages
		const jsonLanguages = json.languages.toLowerCase().split(", ");
		const allLanguages = await shadowdark.compendiums.languages([], false);
		for (const jsonLanguage of jsonLanguages) {
			const language = allLanguages.find(l => l.name.toLowerCase() === jsonLanguage);
			if (language) this.importedActor.system.languages.push(language.uuid);
		}

		// Load Gear
		await this._loadGear(json);
		console.log(this.gear);
		console.log(this.errors.gear);

		// Load Spells
		await this._loadSpells(json);
		console.log(this.spells);
		console.log(this.errors.spells);
		/*

		// Spells & Bonuses
		const statBonus = {
			"STR:+1": "+1 to Strength",
			"DEX:+1": "+1 to Dexterity",
			"CON:+1": "+1 to Constitution",
			"INT:+1": "+1 to Intelligence",
			"WIS:+1": "+1 to Wisdom",
			"CHA:+1": "+1 to Charisma",
			"STR:+2": "+2 to Strength",
			"DEX:+2": "+2 to Dexterity",
			"CON:+2": "+2 to Constitution",
			"INT:+2": "+2 to Intelligence",
			"WIS:+2": "+2 to Wisdom",
			"CHA:+2": "+2 to Charisma",
		};

		const supportedTalents = [
			"AdvOnCastOneSpell",
			"AdvOnInitiative",
			"ArmorMastery",
			"BackstabIncrease",
			"Grit",
			"LearnExtraSpell",
			"MakeRandomMagicItem",
			"Plus1ToCastingSpells",
			"Plus1ToHit",
			"Plus1ToHitAndDamage",
			"ReduceHerbalismDC",
			"ReducePerformDC",
			"SetWeaponTypeDamage",
			"StatBonus",
			"WeaponMastery",
			"FindRandomWand",
			"Plus1ToAttacksOrPlus1ToMagicalDabbler",
		];

		const talents = await Promise.all(json.bonuses.filter(
			b => supportedTalents.includes(b.name) || supportedTalents.includes(b.bonusName)
		).map(async bonus => {
			if (bonus.name === "LearnExtraSpell") {
				return this._findInCompendium("Learn Spell", "shadowdark.talents");
			}
			if (bonus.bonusName === "StatBonus") {
				// Keep running total of talent bonuses
				const ability = bonus.bonusTo.split(":")[0].toLowerCase();
				importedActor.system.abilities[ability].bonus +=
					parseInt(bonus.bonusTo.split("+")[1], 10);
				return this._findInCompendium(statBonus[bonus.bonusTo], "shadowdark.talents");
			}
			if (bonus.sourceCategory === "Talent" || bonus.sourceCategory === "Ability") {
				// Bard
				if (bonus.name === "FindRandomWand") {
					return this._findInCompendium("Find a Random Priest or Wizard Wand", "shadowdark.talents");
				}
				if (bonus.name === "ReducePerformDC") {
					return this._findInCompendium("-3 to Perform Effect DCs", "shadowdark.talents");
				}
				if (bonus.name === "Plus1ToAttacksOrPlus1ToMagicalDabbler") {
					if (bonus.bonusName === "Plus1ToHit") {
						return this._findInCompendium(
							"+1 to Melee and Ranged Attacks",
							"shadowdark.talents"
						);
					}
					if (bonus.bonusName === "MagicalDabbler") {
						return this._findInCompendium(
							"+1 to Magical Dabbler Rolls",
							"shadowdark.talents"
						);
					}
				}

				// Fighter
				if (bonus.name === "WeaponMastery") {
					return this._masteryTalent("weapon", bonus.bonusTo);
				}
				if (bonus.name === "Grit") {
					return this._findInCompendium(`Grit (${bonus.bonusName})`, "shadowdark.talents");
				}
				if (bonus.name === "ArmorMastery") {
					return this._masteryTalent("armor", bonus.bonusTo);
				}
				// Ranger
				if (bonus.name === "SetWeaponTypeDamage") {
					return this._damageDieD12Talent(bonus.bonusTo);
				}
				if (bonus.name === "ReduceHerbalismDC") {
					return this._findInCompendium("Herbalism Check Advantage", "shadowdark.talents");
				}
				if (bonus.name === "Plus1ToHitAndDamage") {
					if (bonus.bonusTo === "Melee attacks") {
						return this._findInCompendium("+1 to Melee Attacks and Damage", "shadowdark.talents");
					}
					if (bonus.bonusTo === "Ranged attacks") {
						return this._findInCompendium("+1 to Ranged Attacks and Damage", "shadowdark.talents");
					}
				}
				// Thief
				if (bonus.name === "BackstabIncrease") {
					return this._findInCompendium("Backstab +1 Damage Dice", "shadowdark.talents");
				}
				if (bonus.name === "AdvOnInitiative") {
					return this._findInCompendium("Initiative Advantage", "shadowdark.talents");
				}
				// Priest
				if (bonus.name === "Plus1ToHit") {
					return this._findInCompendium(`+1 to ${bonus.bonusTo}`, "shadowdark.talents");
				}
				// Wizard & Priest
				if (bonus.bonusName === "Plus1ToCastingSpells") {
					return this._findInCompendium("+1 on Spellcasting Checks", "shadowdark.talents");
				}
				if (bonus.name === "AdvOnCastOneSpell") {
					return this._spellCastingAdvantageTalent(bonus.bonusName);
				}
				// Wizard
				if (bonus.name === "MakeRandomMagicItem") {
					return this._findInCompendium("Make a Random Magic Item", "shadowdark.talents");
				}
			}
			return false;
		}));

		// Class talents
		if (json.class === "Bard") {
			const classTalentNames = [
				"Bardic Arts",
				"Magical Dabbler",
				"Perform",
				"Prolific",
			];

			for (const classTalent of classTalentNames) {
				talents.push(
					await this._findInCompendium(classTalent, "shadowdark.talents")
				);
			}
		}
		if (json.class === "Thief") {
			talents.push(
				await this._findInCompendium("Backstab", "shadowdark.talents")
			);
			talents.push(
				await this._findInCompendium("Thievery", "shadowdark.talents")
			);
		}
		if (json.class === "Fighter") {
			talents.push(
				await this._findInCompendium("Hauler", "shadowdark.talents")
			);
		}
		if (json.class === "Ranger") {
			talents.push(
				await this._findInCompendium("Herbalism", "shadowdark.talents")
			);
			talents.push(
				await this._findInCompendium("Wayfinder", "shadowdark.talents")
			);
		}
		if (json.class === "Wizard") {
			const classTalentNames = [
				"Magic Missile Advantage",
				"Learning Spells",
				"Spellcasting (Wizard)",
			];

			for (const classTalent of classTalentNames) {
				talents.push(
					await this._findInCompendium(classTalent, "shadowdark.talents")
				);
			}
		}
		if (json.class === "Priest") {
			const classTalentNames = [
				"Deity",
				"Spellcasting (Priest)",
				"Turn Undead",
			];

			for (const classTalent of classTalentNames) {
				talents.push(
					await this._findInCompendium(classTalent, "shadowdark.talents")
				);
			}
			spells.push(
				await this._findInCompendium("Turn Undead", "shadowdark.spells")
			);
		}

		// Ancestry talents
		if (json.ancestry === "Elf") {
			const farSight = json.bonuses.find(o => o.name === "FarSight");
			const bonus = (farSight.bonusTo === "RangedWeapons") ? "Farsight (Ranged)" : "Farsight (Spell)";
			talents.push(
				await this._findInCompendium(bonus, "shadowdark.talents")
			);
		}
		if (json.ancestry === "Kobold") {
			const knack = json.bonuses.find(o => o.name === "Knack");
			const bonus = (knack.bonusTo === "LuckTokenAtStartOfSession") ? "Knack (Luck)" : "Knack (Spellcasting)";
			talents.push(
				await this._findInCompendium(bonus, "shadowdark.talents")
			);
		}
		if (json.ancestry === "Half-Orc") {
			talents.push(
				await this._findInCompendium("Mighty", "shadowdark.talents")
			);
		}
		if (json.ancestry === "Halfling") {
			talents.push(
				await this._findInCompendium("Stealthy", "shadowdark.talents")
			);
		}
		if (json.ancestry === "Dwarf") {
			talents.push(
				await this._findInCompendium("Stout", "shadowdark.talents")
			);
		}
		if (json.ancestry === "Human") {
			talents.push(
				await this._findInCompendium("Ambitious", "shadowdark.talents")
			);
		}
		if (json.ancestry === "Goblin") {
			talents.push(
				await this._findInCompendium("Keen Senses", "shadowdark.talents")
			);
		}

		const classAbilities = [];
		if (json.class === "Bard") {
			const classAbilitieNames = ["Fascinate", "Inspire"];

			for (const classAbilityName of classAbilitieNames) {
				classAbilities.push(
					await this._findInCompendium(classAbilityName, "shadowdark.class-abilities")
				);
			}
		}
		if (json.class === "Ranger") {
			const classAbilitieNames = [
				"Curative",
				"Foebane",
				"Restorative",
				"Salve",
				"Stimulant",
			];

			for (const classAbilityName of classAbilitieNames) {
				classAbilities.push(
					await this._findInCompendium(classAbilityName, "shadowdark.class-abilities")
				);
			}
		}

		// Adjust the base ability values to take into account any bonuses
		// from talents
		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			importedActor.system.abilities[ability].base -=
				importedActor.system.abilities[ability].bonus;

			// These are dynamically set by the ActiveEffects, so actually
			// need to be zero
			importedActor.system.abilities[ability].bonus = 0;
		}
		*/
		console.log(this.importedActor);
		this.render(false);
	}

	async _createActor() {
		// Create the actor
		const newActor = await Actor.create(this.importedActor);

		const allItems = [
			...this.gear,
			...this.spells,
			...this.talents,
		];

		await newActor.createEmbeddedDocuments("Item", allItems);

		return newActor;
	}
}
