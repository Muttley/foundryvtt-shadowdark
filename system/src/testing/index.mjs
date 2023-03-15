/**
 * @file Orchestration for our Quench tests
 */

/* Utils Import */
import chatChatcardTests, {
	key as chatChatcardKey,
	options as chatChatcardOptions,
} from "../chat-message/__tests__/chat-chatcard.test.js";

import diceD20Tests, {
	key as diceD20Key,
	options as diceD20Options,
} from "../dice/__tests__/dice-d20.test.js";

/* Document imports */
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

/* Sheet Imports */
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

/* Apps import */


Hooks.on("quenchReady", async quench => {
	// Utils test
	quench.registerBatch(
		chatChatcardKey,
		chatChatcardTests,
		chatChatcardOptions
	);
	quench.registerBatch(
		diceD20Key,
		diceD20Tests,
		diceD20Options
	);

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

	// Apps test
});
