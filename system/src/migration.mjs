import MigrationRunnerSD from "./migrations/MigrationRunnerSD.mjs";

export default async function performDataMigration() {
	if ( !game.user.isGM ) return;

	await new MigrationRunnerSD().run();
}
