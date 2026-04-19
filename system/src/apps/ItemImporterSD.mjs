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

	/** @override */
	async _import(itemText) {
		return this._importItem(itemText);
	}

	/**
	 * Parses pasted text representing a item and creates an item from it.
	 * @param {string} string - String data posted by user
	 * @returns {ActorSD}
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
