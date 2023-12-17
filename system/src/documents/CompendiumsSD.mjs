export default class CompendiumsSD {

	static async _compendiumDocuments(type, subtype=null) {
		let docs = [];

		// Iterate through the Packs, adding them to the list
		for (let pack of game.packs) {
			if (pack.metadata.type !== type) continue;

			let ids;

			if (subtype !== null) {
				ids = pack.index.filter(d => d.type === subtype).map(d => d._id);
			}
			else {
				ids = pack.index.map(d => d._id);
			}

			for (const id of ids) {
				const doc = await pack.getDocument(id);

				if (doc) docs.push(doc);
			}
		}

		// Dedupe and sort the list alphabetically
		docs = Array.from(new Set(docs)).sort((a, b) => a.name.localeCompare(b.name));

		const collection = new Collection();

		for (let d of docs) {
			collection.set(d.id, d);
		}

		return collection;
	}

	static async _documents(type, subtype, filterSources=true) {
		let sources = [];

		if (filterSources === true) {
			sources = game.settings.get("shadowdark", "sourceFilters") ?? [];
		}

		const noSources = sources.length === 0;

		const documents = await CompendiumsSD._compendiumDocuments(type, subtype);

		if (noSources) {
			return documents;
		}
		else {
			const filteredDocuments = documents.filter(
				document => {
					const source = document.system?.source?.title ?? "";

					return source === "" || sources.includes(source);
				}
			);

			// re-create the collection from the filtered Items
			const filteredCollection = new Collection();
			for (let d of filteredDocuments) {
				filteredCollection.set(d.id, d);
			}

			return filteredCollection;
		}
	}

	static async ancestries(filterSources=true) {
		return CompendiumsSD._documents("Item", "Ancestry", filterSources);
	}

	static async ancestryTalents(filterSources=true) {
		return CompendiumsSD.talents("ancestry", filterSources);
	}

	static async armor(filterSources=true) {
		return CompendiumsSD._documents("Item", "Armor", filterSources);
	}

	static async armorProperties(filterSources=true) {
		return CompendiumsSD.properties("armor", filterSources);
	}

	static async backgrounds(filterSources=true) {
		return CompendiumsSD._documents("Item", "Background", filterSources);
	}

	static async baseArmor(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Armor", filterSources);

		const filteredDocuments = documents.filter(
			document => document.system.baseArmor === ""
				&& !document.system.magicItem
		);

		// re-create the collection from the filtered Items
		const filteredCollection = new Collection();
		for (let d of filteredDocuments) {
			filteredCollection.set(d.id, d);
		}

		return filteredCollection;
	}

	static async baseWeapons(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Weapon", filterSources);

		const filteredDocuments = documents.filter(
			document => document.system.baseWeapon === ""
				&& !document.system.magicItem
		);

		// re-create the collection from the filtered Items
		const filteredCollection = new Collection();
		for (let d of filteredDocuments) {
			filteredCollection.set(d.id, d);
		}

		return filteredCollection;
	}

	static async basicItems(filterSources=true) {
		return CompendiumsSD._documents("Item", "Basic", filterSources);
	}

	static async classes(filterSources=true) {
		return CompendiumsSD._documents("Item", "Class", filterSources);
	}

	static async classTalents(filterSources=true) {
		return CompendiumsSD.talents("class", filterSources);
	}

	static async classTalentTables(filterSources=true) {
		const documents =
			await CompendiumsSD._documents("RollTable", null, filterSources);

		const filteredDocuments = documents.filter(
			document => document.name.match(/class\s+talents/i)
		);

		// re-create the collection from the filtered Items
		const filteredCollection = new Collection();
		for (let d of filteredDocuments) {
			filteredCollection.set(d.id, d);
		}

		return filteredCollection;
	}

	static async commonLanguages(filterSources=true) {
		return CompendiumsSD.languages("common", filterSources);
	}

	static async deities(filterSources=true) {
		return CompendiumsSD._documents("Item", "Deity", filterSources);
	}

	static async gems(filterSources=true) {
		return CompendiumsSD._documents("Item", "Gem", filterSources);
	}

	static async effects(filterSources=true) {
		return CompendiumsSD._documents("Item", "Effect", filterSources);
	}

	static async languages(subtypes=[], filterSources=true) {
		const noSubtypes = subtypes.length === 0;

		const documents = await CompendiumsSD._documents("Item", "Language", filterSources);

		if (noSubtypes) {
			return documents;
		}
		else {
			const filteredDocuments = documents.filter(
				document => subtypes.includes(document.system.rarity)
			);

			// re-create the collection from the filtered Items
			const filteredCollection = new Collection();
			for (let d of filteredDocuments) {
				filteredCollection.set(d.id, d);
			}

			return filteredCollection;
		}
	}

	static async levelTalents(filterSources=true) {
		return CompendiumsSD.talents("level", filterSources);
	}

	static async npcAttacks(filterSources=true) {
		return CompendiumsSD._documents("Item", "NPC Attack", filterSources);
	}

	static async npcFeatures(filterSources=true) {
		return CompendiumsSD._documents("Item", "NPC Features", filterSources);
	}

	static async potions(filterSources=true) {
		return CompendiumsSD._documents("Item", "Potion", filterSources);
	}

	static async properties(subtypes=[], filterSources=true) {
		const noSubtypes = subtypes.length === 0;

		const documents = await CompendiumsSD._documents("Item", "Property", filterSources);

		if (noSubtypes) {
			return documents;
		}
		else {
			const filteredDocuments = documents.filter(
				document => subtypes.includes(document.system.itemType)
			);

			// re-create the collection from the filtered Items
			const filteredCollection = new Collection();
			for (let d of filteredDocuments) {
				filteredCollection.set(d.id, d);
			}

			return filteredCollection;
		}
	}

	static async rareLanguages(filterSources=true) {
		return CompendiumsSD.languages("rare", filterSources);
	}

	static async rollTables(filterSources=true) {
		return CompendiumsSD._documents("RollTable", null, filterSources);
	}

	static async scrolls(filterSources=true) {
		return CompendiumsSD._documents("Item", "Scroll", filterSources);
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

	static async spellcastingClasses(filterSources=true) {
		const documents = await CompendiumsSD._documents("Item", "Class", filterSources);

		const filteredDocuments = documents.filter(
			document => document.system.spellcasting.ability !== ""
				&& document.system.spellcasting.class !== "NONE"
		);

		// re-create the collection from the filtered Items
		const filteredCollection = new Collection();
		for (let d of filteredDocuments) {
			filteredCollection.set(d.id, d);
		}

		return filteredCollection;
	}

	static async spells(filterSources=true) {
		return CompendiumsSD._documents("Item", "Spell", filterSources);
	}

	static async talents(subtypes=[], filterSources=true) {
		const noSubtypes = subtypes.length === 0;

		const documents = await CompendiumsSD._documents("Item", "Talent", filterSources);

		if (noSubtypes) {
			return documents;
		}
		else {
			const filteredDocuments = documents.filter(
				document => subtypes.includes(document.system.talentClass)
			);

			// re-create the collection from the filtered Items
			const filteredCollection = new Collection();
			for (let d of filteredDocuments) {
				filteredCollection.set(d.id, d);
			}

			return filteredCollection;
		}
	}

	static async wands(filterSources=true) {
		return CompendiumsSD._documents("Item", "Wand", filterSources);
	}

	static async weaponProperties(filterSources=true) {
		return CompendiumsSD.properties("weapon", filterSources);
	}

	static async weapons(filterSources=true) {
		return CompendiumsSD._documents("Item", "Weapon", filterSources);
	}
}
