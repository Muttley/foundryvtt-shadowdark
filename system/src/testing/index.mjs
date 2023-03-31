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
import appsActiveEffectsTests, {
	key as appsActiveEffectsKey,
	options as appsActiveEffectsOptions,
} from "../apps/__tests__/apps-active-effects.test.mjs";
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
import appsMagicItemEffectsTests, {
	key as appsMagicItemEffectsKey,
	options as appsMagicItemEffectsOptions,
} from "../apps/__tests__/apps-magic-item-effects.test.mjs";
import appsNPCAttackRangesTests, {
	key as appsNPCAttackRangesKey,
	options as appsNPCAttackRangesOptions,
} from "../apps/__tests__/apps-npc-attack-ranges.test.mjs";

import appsPlayerLanguagesTests, {
	key as appsPlayerLanguagesKey,
	options as appsPlayerLanguagesOptions,
} from "../apps/__tests__/apps-player-languages.test.mjs";
import appsSpellcasterClassTests, {
	key as appsSpellcasterClassKey,
	options as appsSpellcasterClassOptions,
} from "../apps/__tests__/apps-spellcaster-class.test.mjs";
import appsTalentTypesTests, {
	key as appsTalentTypesKey,
	options as appsTalentTypesOptions,
} from "../apps/__tests__/apps-talent-types.test.mjs";
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
// @todo: Refactor the Dice mechanics to be more intiutive to find
import diceTests, {
	key as diceKey,
	options as diceOptions,
} from "../dice/__tests__/dice.test.mjs";
import diceChatTemplateTests, {
	key as diceChatTemplateKey,
	options as diceChatTemplateOptions,
} from "../dice/__tests__/dice-chat-templates.test.mjs";

/* Document Imports */
import documentsActiveEffectsTests, {
	key as documentsActiveEffectsKey,
	options as documentsActiveEffectsOptions,
} from "../documents/__tests__/documents-active-effects.test.mjs";
import documentsActorTests, {
	key as documentsActorKey,
	options as documentsActorOptions,
} from "../documents/__tests__/documents-actor.test.mjs";
import documentsItemMagicItemsTests, {
	key as documentsItemMagicItemsKey,
	options as documentsItemMagicItemsOptions,
} from "../documents/__tests__/documents-item-magic-items.test.mjs";
import documentsItemsSpellsTests, {
	key as documentsItemsSpellsKey,
	options as documentsItemsSpellsOptions,
} from "../documents/__tests__/documents-item-spell.test.mjs";
import documentsItemsTalentTests, {
	key as documentsItemsTalentKey,
	options as documentsItemsTalentOptions,
} from "../documents/__tests__/documents-item-talent.test.mjs";
import documentsItemsTests, {
	key as documentsItemsKey,
	options as documentsItemsOptions,
} from "../documents/__tests__/documents-item.test.mjs";

/* E2E Tests */
import e2eAppsLightsourceTrackerTests, {
	key as e2eAppsLightsourceTrackerKey,
	options as e2eAppsLightsourceTrackerOptions,
} from "../apps/__tests__/e2e-apps-lightsource-tracker.test.mjs";

/* Hooks Imports */
import hooksChatMessageTests, {
	key as hooksChatMessageKey,
	options as hooksChatMessageOptions,
} from "../hooks/__tests__/hooks-chat-message.test.mjs";
import hooksLightsourceTrackerTests, {
	key as hooksLightsourceTrackerKey,
	options as hooksLightsourceTrackerOptions,
} from "../hooks/__tests__/hooks-light-source-tracker.test.mjs";

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
		appsActiveEffectsKey,
		appsActiveEffectsTests,
		appsActiveEffectsOptions
	);
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
		appsMagicItemEffectsKey,
		appsMagicItemEffectsTests,
		appsMagicItemEffectsOptions
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
		appsTalentTypesKey,
		appsTalentTypesTests,
		appsTalentTypesOptions
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
		documentsActiveEffectsKey,
		documentsActiveEffectsTests,
		documentsActiveEffectsOptions
	);
	quench.registerBatch(
		documentsActorKey,
		documentsActorTests,
		documentsActorOptions
	);
	quench.registerBatch(
		documentsItemMagicItemsKey,
		documentsItemMagicItemsTests,
		documentsItemMagicItemsOptions
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
