
export const migrateWorld = async () => {
	const version = game.system.version;
	ui.notifications.info(
		game.i18n.format("SHADOWDARK.migration.begin", {version}),
		{permanent: true}
	);

	// World actors
	const actors = game.actors.map(a => [a, true])
		.concat(Array.from(game.actors.invalidDocumentIds).map(
			id => [game.actors.getInvalid(id), false]
		));

	for ( const [actor, valid] of actors ) {
		try {
			const source = valid ? actor.toObject() : game.actors.find(a => a._id === actor.id);
			const updateData = migrateActorData(source);
			if ( !foundry.utils.isEmpty(updateData) ) {
				console.log(`Migrating Actor document ${actor.name}`);
				await actor.update(updateData);
			}
		}
		catch(err) {
			err.message = `Failed Shadowdark system migration for Actor ${actor.name}: ${err.message}`;
			console.error(err);
		}
	}

	// World Compendium
	for ( let p of game.packs ) {
		if ( p.metadata.packageType !== "world" ) continue;
		if ( !["Actor"].includes(p.documentName) ) continue;
		await migrateCompendium(p);
	}

	// Set the migration as compelte
	game.settings.set("shadowdark", "systemMigrationVersion", game.system.version);
	ui.notifications.info(game.i18n.format(
		"SHADOWDARK.migration.complete", {version}
	), {permanent: true});
};

export const migrateCompendium = async pack => {
	const documentName = pack.documentName;
	if (!["Actor"].includes(documentName) ) return;

	// Unlock the pack for editing
	const wasLocked = pack.locked;
	await pack.configure({locked: false});

	// Begin by requesting service-side migration
	await pack.migrate();
	const documents = pack.getDocuments();

	// Iterate over compendium entries - apply migration functions
	for ( let doc of documents ) {
		let updateData = {};
		try {
			switch (documentName) {
				case "Actor":
					updateData = migrateActorData(doc.toObject());
					break;
			}

			// Save the entry if data was updated
			if ( foundry.utils.isEmpty(updateData) ) continue;
			await doc.update(updateData);
			console.log(`Migrated ${documentName} document ${doc.name} in Compendium ${pack.collection}`);
		}
		catch (err) {
			err.message = `Failed Shadowdark system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
			console.error(err);
		}
	}

	// Apply the original locked status for the pack
	await pack.configure({locked: wasLocked});
	console.log(`Migrated all ${documentName} documents from Compendium ${pack.collection}`);
};

export const migrateActorData = actor => {
	let updateData = {};
	updateData = _migrateHpBase(actor, updateData);

	return updateData;
};

export function _migrateHpBase(actorData, updateData) {
	const hp = actorData.system.attributes.hp;
	if ( hp && !hp.base ) {
		const max = foundry.utils.getProperty(actorData, "system.attributes.hp.max");
		const bonus = foundry.utils.getProperty(actorData, "system.attributes.hp.bonus");

		updateData["system.attributes.hp.base"] = max;
		updateData["system.attributes.hp.max"] = max + bonus;
	}
	return updateData;
}
