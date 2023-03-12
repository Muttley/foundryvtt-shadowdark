/**
 * @file Orchestration for our Quench tests
 */

import documentsActorTests, {
	key as documentsActorKey,
	options as documentsActorOptions,
} from "../documents/__tests__/documents-actor.test.mjs";
import documentsItemsTests, {
	key as documentsItemsKey,
	options as documentsItemsOptions,
} from "../documents/__tests__/documents-item.test.mjs";
import documentsItemsSpellsTests, {
	key as documentsItemsSpellsKey,
	options as documentsItemsSpellsOptions,
} from "../documents/__tests__/documents-item-spell.test.mjs";

import sheetsActorTests, {
	key as sheetsActorKey,
	options as sheetsActorOptions,
} from "../sheets/__tests__/sheets-actor.test.mjs";
import sheetsItemTests, {
	key as sheetsItemKey,
	options as sheetsItemOptions,
} from "../sheets/__tests__/sheets-item.test.mjs";
import sheetsPlayerTests, {
	key as sheetsPlayerKey,
	options as sheetsPlayerOptions,
} from "../sheets/__tests__/sheets-player.test.mjs";


Hooks.on("quenchReady", async quench => {
	// Document tests
	quench.registerBatch(
		documentsActorKey,
		documentsActorTests,
		documentsActorOptions
	);
	quench.registerBatch(
		documentsItemsKey,
		documentsItemsTests,
		documentsItemsOptions
	);
	quench.registerBatch(
		documentsItemsSpellsKey,
		documentsItemsSpellsTests,
		documentsItemsSpellsOptions
	);

	// Sheet tests
	quench.registerBatch(
		sheetsActorKey,
		sheetsActorTests,
		sheetsActorOptions
	);
	quench.registerBatch(
		sheetsItemKey,
		sheetsItemTests,
		sheetsItemOptions
	);
	quench.registerBatch(
		sheetsPlayerKey,
		sheetsPlayerTests,
		sheetsPlayerOptions
	);
});
