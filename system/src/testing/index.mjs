/**
 * @file Orchestration for our Quench tests
 */

/* Utils Import */
import chatChatcardTests, {
	key as chatChatcardKey,
	options as chatChatcardOptions,
} from "../chat/__tests__/chat-chatcard.test.js";

/* Dice Import */
import diceTests, {
	key as diceKey,
	options as diceOptions,
} from "../dice/__tests__/dice.test.js";
import diceChatTemplateTests, {
	key as diceChatTemplateKey,
	options as diceChatTemplateOptions,
} from "../dice/__tests__/dice-chat-templates.test.js";

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
import documentsItemsTalentTests, {
	key as documentsItemsTalentKey,
	options as documentsItemsTalentOptions,
} from "../documents/__tests__/documents-item-talent.test.mjs";

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
// @todo: Write tests

Hooks.on("quenchReady", async quench => {
	// Utils test
	quench.registerBatch(
		chatChatcardKey,
		chatChatcardTests,
		chatChatcardOptions
	);

	// Dice test
	quench.registerBatch(
		diceKey,
		diceTests,
		diceOptions
	);
	quench.registerBatch(
		diceChatTemplateKey,
		diceChatTemplateTests,
		diceChatTemplateOptions
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
	quench.registerBatch(
		documentsItemsTalentKey,
		documentsItemsTalentTests,
		documentsItemsTalentOptions
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
