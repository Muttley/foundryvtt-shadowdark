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

	static async _documents(type, subtype, sources=[]) {
		const noSources = sources.length === 0;

		const documents = await CompendiumsSD._compendiumDocuments(type, subtype);

		if (noSources) {
			return documents;
		}
		else {
			const filteredDocuments = documents.filter(
				document => {
					const source = document.system.source.title;

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

	static async ancestries(sources=[]) {
		return CompendiumsSD._documents("Item", "Ancestry", sources);
	}

	static async ancestryTalents(sources=[]) {
		return CompendiumsSD.talents("ancestry", sources);
	}

	static async armor(sources=[]) {
		return CompendiumsSD._documents("Item", "Armor", sources);
	}

	static async armorProperties(sources=[]) {
		return CompendiumsSD.properties("armor", sources);
	}

	static async backgrounds(sources=[]) {
		return CompendiumsSD._documents("Item", "Background", sources);
	}

	static async baseArmor(sources=[]) {
		const documents = await CompendiumsSD._documents("Item", "Armor", sources);

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

	static async baseWeapons(sources=[]) {
		const documents = await CompendiumsSD._documents("Item", "Weapon", sources);

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

	static async basicItems(sources=[]) {
		return CompendiumsSD._documents("Item", "Basic", sources);
	}

	static async classes(sources=[]) {
		return CompendiumsSD._documents("Item", "Class", sources);
	}

	static async classTalents(sources=[]) {
		return CompendiumsSD.talents("class", sources);
	}

	static async classTalentTables(sources=[]) {
		const documents =
			await CompendiumsSD._documents("RollTable", null, sources);

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

	static async commonLanguages(sources=[]) {
		return CompendiumsSD.languages("common", sources);
	}

	static async deities(sources=[]) {
		return CompendiumsSD._documents("Item", "Deity", sources);
	}

	static async gems(sources=[]) {
		return CompendiumsSD._documents("Item", "Gem", sources);
	}

	static async effects(sources=[]) {
		return CompendiumsSD._documents("Item", "Effect", sources);
	}

	static async languages(subtypes=[], sources=[]) {
		const noSubtypes = subtypes.length === 0;

		const documents = await CompendiumsSD._documents("Item", "Language", sources);

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

	static async levelTalents(sources=[]) {
		return CompendiumsSD.talents("level", sources);
	}

	static async npcAttacks(sources=[]) {
		return CompendiumsSD._documents("Item", "NPC Attack", sources);
	}

	static async npcFeatures(sources=[]) {
		return CompendiumsSD._documents("Item", "NPC Features", sources);
	}

	static async potions(sources=[]) {
		return CompendiumsSD._documents("Item", "Potion", sources);
	}

	static async properties(subtypes=[], sources=[]) {
		const noSubtypes = subtypes.length === 0;

		const documents = await CompendiumsSD._documents("Item", "Property", sources);

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

	static async rareLanguages(sources=[]) {
		return CompendiumsSD.languages("rare", sources);
	}

	static async rollTables(sources=[]) {
		return CompendiumsSD._documents("RollTable", null, sources);
	}

	static async scrolls(sources=[]) {
		return CompendiumsSD._documents("Item", "Scroll", sources);
	}

	static async spellcastingClasses(sources=[]) {
		const documents = await CompendiumsSD._documents("Item", "Class", sources);

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

	static async spells(sources=[]) {
		return CompendiumsSD._documents("Item", "Spell", sources);
	}

	static async talents(subtypes=[], sources=[]) {
		const noSubtypes = subtypes.length === 0;

		const documents = await CompendiumsSD._documents("Item", "Talent", sources);

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

	static async wands(sources=[]) {
		return CompendiumsSD._documents("Item", "Wand", sources);
	}

	static async weaponProperties(sources=[]) {
		return CompendiumsSD.properties("weapon", sources);
	}

	static async weapons(sources=[]) {
		return CompendiumsSD._documents("Item", "Weapon", sources);
	}
}
