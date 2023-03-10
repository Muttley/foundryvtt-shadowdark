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

import sheetsActorTests, {
	key as sheetsActorKey,
	options as sheetsActorOptions,
} from "../sheets/__tests__/sheets-actor.test.mjs";
import sheetsItemTests, {
	key as sheetsItemKey,
	options as sheetsItemOptions,
} from "../sheets/__tests__/sheets-item.test.mjs";


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
});
