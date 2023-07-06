
export async function cacheForeignDocuments() {

	async function getForeignDocuments(type, subtype) {
		let docs = [];

		// / Iterate through the Packs, adding them to the list
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

	// Base document lists
	CONFIG.SHADOWDARK.TALENT_DOCUMENTS = await getForeignDocuments("Item", "Talent");

	// Filtered document lists
	CONFIG.SHADOWDARK.ANCESTRY_TALENT_DOCUMENTS = CONFIG.SHADOWDARK.TALENT_DOCUMENTS.filter(
		talent => talent.system.talentClass === "ancestry"
	);
	CONFIG.SHADOWDARK.CLASS_TALENT_DOCUMENTS = CONFIG.SHADOWDARK.TALENT_DOCUMENTS.filter(
		talent => talent.system.talentClass === "class"
	);
	CONFIG.SHADOWDARK.LEVEL_TALENT_DOCUMENTS = CONFIG.SHADOWDARK.TALENT_DOCUMENTS.filter(
		talent => talent.system.talentClass === "level"
	);

}
