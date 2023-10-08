/**
 * @file Orchestration for our Quench tests
 */

/* Base/Root Imports */
import baseConfigTests, {
	key as baseConfigKey,
	options as baseConfigOptions,
} from "../__tests__/base-config.test.mjs";
import baseHandlebarsTests, {
	key as baseHandlebarsKey,
	options as baseHandlebarsOptions,
} from "../__tests__/base-handlebars.test.mjs";
import baseHooksTests, {
	key as baseHooksKey,
	options as baseHooksOptions,
} from "../__tests__/base-hooks.test.mjs";
import baseMigrationsTests, {
	key as baseMigrationsKey,
	options as baseMigrationsOptions,
} from "../__tests__/base-migrations.test.mjs";
import baseSettingsTests, {
	key as baseSettingsKey,
	options as baseSettingsOptions,
} from "../__tests__/base-settings.test.mjs";
import baseTemplatesTests, {
	key as baseTemplatesKey,
	options as baseTemplatesOptions,
} from "../__tests__/base-templates.test.mjs";

/* Apps Imports */
import appsArmorPropertiesTests, {
	key as appsArmorPropertiesKey,
	options as appsArmorPropertiesOptions,
} from "../apps/__tests__/apps-armor-properties.test.mjs";
import appsGemBagTests, {
	key as appsGemBagKey,
	options as appsGemBagOptions,
} from "../apps/__tests__/apps-gem-bag.test.mjs";
import appsItemPropertiesTests, {
	key as appsItemPropertiesKey,
	options as appsItemPropertiesOptions,
} from "../apps/__tests__/apps-item-properties.test.mjs";
import appsLightsourceTrackerTests, {
	key as appsLightsourceTrackerKey,
	options as appsLightsourceTrackerOptions,
} from "../apps/__tests__/apps-lightsource-tracker.test.mjs";
import appsNPCAttackRangesTests, {
	key as appsNPCAttackRangesKey,
	options as appsNPCAttackRangesOptions,
} from "../apps/__tests__/apps-npc-attack-ranges.test.mjs";
import appsPlayerLanguagesTests, {
	key as appsPlayerLanguagesKey,
	options as appsPlayerLanguagesOptions,
} from "../apps/__tests__/apps-player-languages.test.mjs";
import appsShadowdarklingImporterTests, {
	key as appsShadowdarklingImporterKey,
	options as appsShadowdarklingImporterOptions,
} from "../apps/__tests__/apps-shadowdarkling-importer.test.mjs";
import appsSpellcasterClassTests, {
	key as appsSpellcasterClassKey,
	options as appsSpellcasterClassOptions,
} from "../apps/__tests__/apps-spellcaster-class.test.mjs";
import appsWeaponPropertiesTests, {
	key as appsWeaponPropertiesKey,
	options as appsWeaponPropertiesOptions,
} from "../apps/__tests__/apps-weapon-properties.test.mjs";

/* Chat Imports */
import chatChatcardTests, {
	key as chatChatcardKey,
	options as chatChatcardOptions,
} from "../chat/__tests__/chat-chatcard.test.mjs";

/* Dice Imports */
// TODO: Refactor the Dice mechanics to be more intiutive to find
import diceTests, {
	key as diceKey,
	options as diceOptions,
} from "../dice/__tests__/dice.test.mjs";
import diceChatTemplateTests, {
	key as diceChatTemplateKey,
	options as diceChatTemplateOptions,
} from "../dice/__tests__/dice-chat-templates.test.mjs";

/* Document Imports */
import documentsActorTests, {
	key as documentsActorKey,
	options as documentsActorOptions,
} from "../documents/__tests__/documents-actor.test.mjs";
import documentsItemsEffectsTests, {
	key as documentsItemsEffectsKey,
	options as documentsItemsEffectsOptions,
} from "../documents/__tests__/documents-item-effect.test.mjs";
import documentsItemsEffectsPredefinedTests, {
	key as documentsItemsEffectsPredefinedKey,
	options as documentsItemsEffectsPredefinedOptions,
} from "../documents/__tests__/documents-item-effect-predefined-effects.test.mjs";
import documentsItemsSpellsTests, {
	key as documentsItemsSpellsKey,
	options as documentsItemsSpellsOptions,
} from "../documents/__tests__/documents-item-spell.test.mjs";
import documentsItemsTests, {
	key as documentsItemsKey,
	options as documentsItemsOptions,
} from "../documents/__tests__/documents-item.test.mjs";

/* E2E Tests */
import e2eAppsLightsourceTrackerTests, {
	key as e2eAppsLightsourceTrackerKey,
	options as e2eAppsLightsourceTrackerOptions,
} from "../apps/__tests__/e2e-apps-lightsource-tracker.test.mjs";
import e2eDocumentsItemEffectTests, {
	key as e2eDocumentsItemEffectKey,
	options as e2eDocumentsItemEffectOptions,
} from "../documents/__tests__/e2e-documents-item-effect.test.mjs";

/* Hooks Imports */
import hooksChatMessageTests, {
	key as hooksChatMessageKey,
	options as hooksChatMessageOptions,
} from "../hooks/__tests__/hooks-chat-message.test.mjs";
import hooksLightsourceTrackerTests, {
	key as hooksLightsourceTrackerKey,
	options as hooksLightsourceTrackerOptions,
} from "../hooks/__tests__/hooks-light-source-tracker.test.mjs";
import hooksShadowdarklingImportTests, {
	key as hooksShadowdarklingImportKey,
	options as hooksShadowdarklingImportOptions,
} from "../hooks/__tests__/hooks-shadowdarkling-import.test.mjs";

/* Sheet Imports */
import sheetsActorTests, {
	key as sheetsActorKey,
	options as sheetsActorOptions,
} from "../sheets/__tests__/sheets-actor.test.mjs";
import sheetsItemTests, {
	key as sheetsItemKey,
	options as sheetsItemOptions,
} from "../sheets/__tests__/sheets-item.test.mjs";
import sheetsActorNPCTests, {
	key as sheetsActorNPCKey,
	options as sheetsActorNPCOptions,
} from "../sheets/__tests__/sheets-actor-npc.test.mjs";
import sheetsActorPlayerTests, {
	key as sheetsActorPlayerKey,
	options as sheetsActorPlayerOptions,
} from "../sheets/__tests__/sheets-actor-player.test.mjs";

Hooks.on("quenchReady", async quench => {
	// Base/Root test
	quench.registerBatch(
		baseConfigKey,
		baseConfigTests,
		baseConfigOptions
	);
	quench.registerBatch(
		baseHandlebarsKey,
		baseHandlebarsTests,
		baseHandlebarsOptions
	);
	quench.registerBatch(
		baseHooksKey,
		baseHooksTests,
		baseHooksOptions
	);
	quench.registerBatch(
		baseMigrationsKey,
		baseMigrationsTests,
		baseMigrationsOptions
	);
	quench.registerBatch(
		baseSettingsKey,
		baseSettingsTests,
		baseSettingsOptions
	);
	quench.registerBatch(
		baseTemplatesKey,
		baseTemplatesTests,
		baseTemplatesOptions
	);

	// Apps test
	quench.registerBatch(
		appsArmorPropertiesKey,
		appsArmorPropertiesTests,
		appsArmorPropertiesOptions
	);
	quench.registerBatch(
		appsGemBagKey,
		appsGemBagTests,
		appsGemBagOptions
	);
	quench.registerBatch(
		appsItemPropertiesKey,
		appsItemPropertiesTests,
		appsItemPropertiesOptions
	);
	quench.registerBatch(
		appsLightsourceTrackerKey,
		appsLightsourceTrackerTests,
		appsLightsourceTrackerOptions
	);
	quench.registerBatch(
		appsNPCAttackRangesKey,
		appsNPCAttackRangesTests,
		appsNPCAttackRangesOptions
	);
	quench.registerBatch(
		appsPlayerLanguagesKey,
		appsPlayerLanguagesTests,
		appsPlayerLanguagesOptions
	);
	quench.registerBatch(
		appsSpellcasterClassKey,
		appsSpellcasterClassTests,
		appsSpellcasterClassOptions
	);
	quench.registerBatch(
		appsShadowdarklingImporterKey,
		appsShadowdarklingImporterTests,
		appsShadowdarklingImporterOptions
	);
	quench.registerBatch(
		appsWeaponPropertiesKey,
		appsWeaponPropertiesTests,
		appsWeaponPropertiesOptions
	);

	// E2E Apps test
	quench.registerBatch(
		e2eAppsLightsourceTrackerKey,
		e2eAppsLightsourceTrackerTests,
		e2eAppsLightsourceTrackerOptions
	);

	// Chat test
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
		documentsItemsEffectsKey,
		documentsItemsEffectsTests,
		documentsItemsEffectsOptions
	);
	quench.registerBatch(
		documentsItemsEffectsPredefinedKey,
		documentsItemsEffectsPredefinedTests,
		documentsItemsEffectsPredefinedOptions
	);

	// E2E Document tests
	quench.registerBatch(
		e2eDocumentsItemEffectKey,
		e2eDocumentsItemEffectTests,
		e2eDocumentsItemEffectOptions
	);

	// Hooks test
	quench.registerBatch(
		hooksChatMessageKey,
		hooksChatMessageTests,
		hooksChatMessageOptions
	);
	quench.registerBatch(
		hooksLightsourceTrackerKey,
		hooksLightsourceTrackerTests,
		hooksLightsourceTrackerOptions
	);
	quench.registerBatch(
		hooksShadowdarklingImportKey,
		hooksShadowdarklingImportTests,
		hooksShadowdarklingImportOptions
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
		sheetsActorNPCKey,
		sheetsActorNPCTests,
		sheetsActorNPCOptions
	);
	quench.registerBatch(
		sheetsActorPlayerKey,
		sheetsActorPlayerTests,
		sheetsActorPlayerOptions
	);
});
