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
});
