export default class CompendiumsSD {

	static async compendiumDocuments(type, subtype) {
		let docs = [];

		// Iterate through the Packs, adding them to the list
		for (let pack of game.packs) {
			if (pack.metadata.type !== type) continue;

			const ids = pack.index.filter(d => d.type === subtype).map(d => d._id);

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

	static async documents(type, sources=[]) {
		const noSources = sources.length === 0;

		const documents = await CompendiumsSD.compendiumDocuments("Item", type);

		if (noSources) {
			return documents;
		}
		else {
			const filteredDocuments = documents.filter(
				document => {
					const source = document.system.description.source.book;

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

	static async armor(sources=[]) {
		return CompendiumsSD.documents("Armor", sources);
	}

	static async armorProperties(sources=[]) {
		return CompendiumsSD.properties("armor", sources);
	}

	static async baseWeapons(sources=[]) {
		const documents = await CompendiumsSD.documents("Weapon", sources);

		const filteredDocuments = documents.filter(
			document => document.system.baseWeapon === ""
		);

		// re-create the collection from the filtered Items
		const filteredCollection = new Collection();
		for (let d of filteredDocuments) {
			filteredCollection.set(d.id, d);
		}

		return filteredCollection;
	}

	static async basicItems(sources=[]) {
		return CompendiumsSD.documents("Basic", sources);
	}

	static async gems(sources=[]) {
		return CompendiumsSD.talents(["Gem"], sources);
	}

	static async effects(sources=[]) {
		return CompendiumsSD.documents("Effect", sources);
	}

	static async properties(subtypes=[], sources=[]) {
		const noSubtypes = subtypes.length === 0;

		const documents = await CompendiumsSD.documents("Property", sources);

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

	static async npcAttacks(sources=[]) {
		return CompendiumsSD.talents(["NPC Attack"], sources);
	}

	static async npcFeatures(sources=[]) {
		return CompendiumsSD.documents("NPC Features", sources);
	}

	static async potions(sources=[]) {
		return CompendiumsSD.documents("Potion", sources);
	}

	static async scrolls(sources=[]) {
		return CompendiumsSD.talents(["Scroll"], sources);
	}

	static async spells(sources=[]) {
		return CompendiumsSD.talents(["Spell"], sources);
	}

	static async talents(sources=[]) {
		return CompendiumsSD.documents("Talent", sources);
	}

	static async wands(sources=[]) {
		return CompendiumsSD.documents("Wand", sources);
	}

	static async weaponProperties(sources=[]) {
		return CompendiumsSD.properties("weapon", sources);
	}

	static async weapons(sources=[]) {
		return CompendiumsSD.documents("Weapon", sources);
	}
}
