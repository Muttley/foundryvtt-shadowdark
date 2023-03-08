/**
 * @file Orchestration for our Quench tests
 */

import documentsActorTests, {
	key as documentsActorKey,
	options as documentsActorOptions,
} from "../documents/__tests__/documents-actor.test.mjs";


Hooks.on("quenchReady", async quench => {
	quench.registerBatch(
		documentsActorKey,
		documentsActorTests,
		documentsActorOptions
	);
});
