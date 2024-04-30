export default class CompendiumsSD {


	static _collectionFromArray(array) {
		const collection = new Collection();
		for (let d of array) {
			collection.set(d._id, d);
		}
		return collection;
	 }

	static async _documents(type, subtype=null, filterSources=true, fullLoad=false) {

		// get sources filters
		let sources = [];
		if (filterSources === true) {
			sources = game.settings.get("shadowdark", "sourceFilters") ?? [];
		}
		const sourcesSet = sources.length !== 0;
		// set subtype filter
		let options = {};
		if (subtype !== null) options.type = subtype;

		let docs = [];

		// Iterate through the Packs, adding them to the list
		for (let pack of game.packs) {
			if (pack.metadata.type !== type) continue;

			let documents;

			// load full contents of each document in the pack
			// Turns out, this isn't really needed for anything
			if (fullLoad) {
				if (subtype !== null) {
					documents = await pack.getDocuments(options);
				}
				else {
					documents = await pack.getDocuments();
				}
			}

			// load documents from pack index
			else {
				// generate custom index
				documents = await pack.getIndex({fields: ["system"]});

				// filter by subtype
				if (subtype !== null) {
					documents = documents.filter(d => d.type === subtype);
				}
			}

			for (const doc of documents) {
				docs.push(doc);
			}
		}

		// filter out non selected sources
		if (sourcesSet) {
			docs = docs.filter(
				d => {
					const source = d.system?.source?.title ?? "";
					return source === "" || sources.includes(source);
				}
			);
		}

		// Dedupe and sort the list alphabetically
		docs = Array.from(new Set(docs)).sort((a, b) => a.name.localeCompare(b.name));

		// return new collection
		return this._collectionFromArray(docs);
	}

	static async ancestries(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Ancestry", filterSources, fullLoad);
	}

	static async ancestryTalents(filterSources=true, fullLoad=false) {
		return CompendiumsSD.talents("ancestry", filterSources, fullLoad);
	}

	static async armor(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Armor", filterSources, fullLoad);
	}

	static async armorProperties(filterSources=true, fullLoad=false) {
		return CompendiumsSD.properties("armor", filterSources, fullLoad);
	}

	static async backgrounds(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Background", filterSources, fullLoad);
	}

	static async baseArmor(filterSources=true, fullLoad=false) {
		const documents =
			await CompendiumsSD._documents("Item", "Armor", filterSources, fullLoad);
		return this._collectionFromArray(documents.filter(document =>
			document.system.baseArmor === "" && !document.system.magicItem
		));
	}

	static async baseWeapons(filterSources=true, fullLoad=false) {
		const documents =
			await CompendiumsSD._documents("Item", "Weapon", filterSources, fullLoad);
		return this._collectionFromArray(documents.filter(document =>
			document.system.baseWeapon === "" && !document.system.magicItem
		));
	}

	static async basicItems(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Basic", filterSources, fullLoad);
	}

	static async classes(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Class", filterSources, fullLoad);
	}

	static async classTalents(filterSources=true, fullLoad=false) {
		return CompendiumsSD.talents("class", filterSources, fullLoad);
	}

	static async classTalentTables(filterSources=true, fullLoad=false) {
		const documents = await CompendiumsSD._documents("RollTable", null, filterSources, fullLoad);
		return this._collectionFromArray(documents.filter(document =>
			document.name.match(/class\s+talents/i)
		));
	}

	static async commonLanguages(filterSources=true, fullLoad=false) {
		return CompendiumsSD.languages("common", filterSources, fullLoad);
	}

	static async deities(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Deity", filterSources, fullLoad);
	}

	static async gems(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Gem", filterSources, fullLoad);
	}

	static async effects(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Effect", filterSources, fullLoad);
	}

	static async languages(subtypes=[], filterSources=true, fullLoad=false) {
		if (subtypes.length === 0) {
			return CompendiumsSD._documents("Item", "Language", filterSources, fullLoad);
		}
		else {
			const documents = await CompendiumsSD._documents("Item", "Language", filterSources, fullLoad);
			return this._collectionFromArray(documents.filter(document =>
				subtypes.includes(document.system.rarity)
			));
		}
	}

	static async levelTalents(filterSources=true, fullLoad=false) {
		return CompendiumsSD.talents("level", filterSources, fullLoad);
	}

	static async npcAttacks(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "NPC Attack", filterSources, fullLoad);
	}

	static async npcFeatures(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "NPC Features", filterSources, fullLoad);
	}

	static async potions(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Potion", filterSources, fullLoad);
	}

	static async properties(subtypes=[], filterSources=true, fullLoad=false) {
		if (subtypes.length === 0) {
			return CompendiumsSD._documents("Item", "Property", filterSources, fullLoad);
		}
		else {
			const documents = await CompendiumsSD._documents("Item", "Property", filterSources, fullLoad);
			return this._collectionFromArray(documents.filter(document =>
				subtypes.includes(document.system.itemType)
			));
		}
	}

	static async rareLanguages(filterSources=true, fullLoad=false) {
		return CompendiumsSD.languages("rare", filterSources, fullLoad);
	}

	static async rollTables(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("RollTable", null, filterSources, fullLoad);
	}

	static async scrolls(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Scroll", filterSources, fullLoad);
	}

	static async sources() {
		const sources = [];

		for (const source of Object.keys(shadowdark.config.OFFICIAL_SOURCES)) {
			sources.push({
				uuid: source,
				name: shadowdark.config.OFFICIAL_SOURCES[source],
			});
		}

		for (const module of game.modules) {
			if (!module.active) continue;

			const moduleSources = module.flags?.shadowdark?.sources ?? {};

			for (const moduleSource of Object.keys(moduleSources)) {

				sources.push({
					uuid: moduleSource,
					name: game.i18n.localize(
						moduleSources[moduleSource]
					),
				});
			}
		}

		return sources.sort((a, b) => a.name.localeCompare(b.name));
	}

	static async spellcastingClasses(filterSources=true, fullLoad=false) {
		const documents = await CompendiumsSD._documents("Item", "Class", filterSources, fullLoad);
		return this._collectionFromArray(documents.filter(document =>
			document.system.spellcasting.ability !== ""
			&& document.system.spellcasting.class !== "NONE"
		));
	}

	static async spells(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Spell", filterSources, fullLoad);
	}

	static async talents(subtypes=[], filterSources=true, fullLoad=false) {
		if (subtypes.length === 0) {
			return CompendiumsSD._documents("Item", "Talent", filterSources, fullLoad);
		}
		else {
			const documents = await CompendiumsSD._documents("Item", "Talent", filterSources, fullLoad);
			return this._collectionFromArray(documents.filter(document =>
				subtypes.includes(document.system.talentClass)
			));
		}
	}

	static async wands(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Wand", filterSources, fullLoad);
	}

	static async weaponProperties(filterSources=true, fullLoad=false) {
		return CompendiumsSD.properties("weapon", filterSources, fullLoad);
	}

	static async weapons(filterSources=true, fullLoad=false) {
		return CompendiumsSD._documents("Item", "Weapon", filterSources, fullLoad);
	}
}
