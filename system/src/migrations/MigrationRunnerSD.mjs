import * as migrations from "./updates/_module.mjs";

export default class MigrationRunnerSD {
	allMigrations;

	currentMigrationTask;

	latestVersion = 0;

	constructor() {
		const unsortedMigrations = [];

		for (const migration in migrations) {
			const migrationVersion = migrations[migration].version;

			this.latestVersion = migrationVersion > this.latestVersion
				? migrationVersion
				: this.latestVersion;

			if (migrationVersion > this.currentVersion) {
				unsortedMigrations.push(new migrations[migration]());
			}
		}

		this.allMigrations = unsortedMigrations.sort((a, b) => {
			return a.version - b.version;
		});
	}

	get currentVersion() {
		return game.settings.get("shadowdark", "schemaVersion");
	}

	async migrateCompendium(pack) {
		const documentName = pack.documentName;

		if (!["Actor", "Item"].includes(documentName)) return;

		// Unlock the pack for editing
		const wasLocked = pack.locked;
		await pack.configure({locked: false});

		// Begin by requesting service-side migration
		await pack.migrate();
		const documents = pack.getDocuments();

		// Iterate over compendium entries - apply migration functions
		for (let doc of documents) {
			let updateData = {};
			try {
				const objectData = doc.toObject();
				switch (documentName) {
					case "Actor":
						updateData = this.currentMigrationTask.updateActor(objectData);
						break;
					case "Item":
						updateData = this.currentMigrationTask.updateItem(objectData);
						break;
				}

				// Save the entry if data was updated
				if (foundry.utils.isEmpty(updateData)) continue;
				await doc.update(updateData);
				console.log(`Migrated ${documentName} document '${doc.name}' in Compendium '${pack.collection}'`);
			}
			catch(err) {
				err.message = `Failed Shadowdark system migration for document '${doc.name}' in pack '${pack.collection}': ${err.message}`;
				console.error(err);
			}
		}

		// Apply the original locked status for the pack
		await pack.configure({locked: wasLocked});

		console.log(`Migrated all '${documentName}' documents from Compendium '${pack.collection}'`);
	}

	async migrateWorldCompendiums() {
		for (let pack of game.packs) {
			if (pack.metadata.packageType !== "world") continue;
			if (!["Actor"].includes(pack.documentName)) continue;

			await migrateCompendium(pack);
		}
	}

	async migrateWorldActors() {
		// World actors
		const actors = game.actors.map(a => [a, true])
			.concat(Array.from(game.actors.invalidDocumentIds).map(
				id => [game.actors.getInvalid(id), false]
			));

		for (const [actor, valid] of actors) {
			try {
				const source = valid
					? actor.toObject()
					: game.actors.find(a => a._id === actor.id);

				const updateData = await this.currentMigrationTask.updateActor(source);

				if (!foundry.utils.isEmpty(updateData)) {
					console.log(`Migrating Actor document '${actor.name}'`);
					await actor.update(updateData);
				}
			}
			catch(err) {
				err.message = `Failed Shadowdark system migration for Actor '${actor.name}': ${err.message}`;
				console.error(err);
			}
		}
	}

	async migrateWorldItems() {
		// World actors
		const items = game.items.map(a => [a, true])
			.concat(Array.from(game.items.invalidDocumentIds).map(
				id => [game.items.getInvalid(id), false]
			));

		for (const [item, valid] of items) {
			try {
				const source = valid
					? item.toObject()
					: game.items.find(a => a._id === item.id);

				const updateData = this.currentMigrationTask.updateItem(source);

				if (!foundry.utils.isEmpty(updateData)) {
					console.log(`Migrating Item document '${item.name}'`);
					item.update(updateData);
				}
			}
			catch(err) {
				err.message = `Failed Shadowdark system migration for Item '${item.name}': ${err.message}`;
				console.error(err);
			}
		}
	}

	async migrateWorld() {
		const version = this.currentMigrationTask.version;

		ui.notifications.info(
			game.i18n.format("SHADOWDARK.migration.begin_schema", {version}),
			{permanent: false}
		);

		await this.migrateWorldActors();
		await this.migrateWorldItems();
		await this.migrateWorldCompendiums();

		ui.notifications.info(
			game.i18n.format("SHADOWDARK.migration.completed_schema", {version}),
			{permanent: false}
		);
	}

	needsMigration() {
		return this.latestVersion > this.currentVersion;
	}

	async run() {
		if (!this.needsMigration()) return;

		ui.notifications.info(
			game.i18n.localize("SHADOWDARK.migration.begin_migration"),
			{permanent: false}
		);

		for (const migration of this.allMigrations) {
			if (this.currentVersion < migration.version) {
				this.currentMigrationTask = migration;

				await this.migrateWorld();

				game.settings.set("shadowdark", "schemaVersion", migration.version);
			}
		}

		ui.notifications.info(
			game.i18n.localize("SHADOWDARK.migration.completed_migration"),
			{permanent: false}
		);
	}
}
