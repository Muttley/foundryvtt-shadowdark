import ActiveEffectsSD from "./src/system/ActiveEffectsSD.mjs";
import ChatSD from "./src/system/ChatSD.mjs";
import CompendiumsSD from "./src/documents/CompendiumsSD.mjs";
import loadTemplates from "./src/templates.mjs";
import Logger from "./src/utils/Logger.mjs";
import performDataMigration from "./src/migration.mjs";
import registerHandlebarsHelpers from "./src/handlebars.mjs";
import registerSystemSettings from "./src/settings.mjs";
import registerTextEditorEnrichers from "./src/enrichers.mjs";
import SHADOWDARK from "./src/config.mjs";
import ShadowdarkMacro from "./src/macro.mjs";
import UtilitySD from "./src/utils/UtilitySD.mjs";

import * as apps from "./src/apps/_module.mjs";
import * as chat from "./src/chat/_module.mjs";
import * as dice from "./src/dice/_module.mjs";
import * as documents from "./src/documents/_module.mjs";
import * as models from "./src/models/_module.mjs";
import * as sheets from "./src/sheets/_module.mjs";

import {
	HooksSD,
	HooksImmediate,
	HooksInitSD,
} from "./src/hooks.mjs";

import listenOnSocket from "./src/socket.mjs";

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */

globalThis.shadowdark = {
	apps,
	chat: ChatSD,
	compendiums: CompendiumsSD,
	config: SHADOWDARK,
	debug: Logger.debug,
	defaults: SHADOWDARK.DEFAULTS,
	dice,
	documents,
	effects: ActiveEffectsSD,
	error: Logger.error,
	log: Logger.log,
	macro: ShadowdarkMacro,
	sheets,
	utils: UtilitySD,
	warn: Logger.warn,
};

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

// A hook event that fires as Foundry is initializing, right before any
// initialization tasks have begun.
//
Hooks.once("init", () => {
	globalThis.shadowdark = game.shadowdark = Object.assign(
		game.system,
		globalThis.shadowdark
	);

	shadowdark.log("Initialising the Shadowdark RPG Game System");

	game.shadowdark = {
		config: SHADOWDARK,
		lightSourceTracker: new apps.LightSourceTrackerSD(),
		effectPanel: new apps.EffectPanelSD(),
	};

	CONFIG.SHADOWDARK = SHADOWDARK;
	CONFIG.Actor.documentClass = documents.ActorSD;
	CONFIG.ActiveEffect.documentClass = documents.ActiveEffectSD;
	CONFIG.Item.documentClass = documents.ItemSD;
	CONFIG.Combat.documentClass = documents.EncounterSD;
	CONFIG.ChatMessage.documentClass = documents.ChatMessageSD;
	CONFIG.ActiveEffect.legacyTransferral = false;

	CONFIG.Dice.rolls = [dice.RollSD];

	registerHandlebarsHelpers();
	registerSystemSettings();
	registerTextEditorEnrichers();
	loadTemplates();

	UtilitySD.loadLegacyArtMappings();

	// Register Data Models
	Object.assign(CONFIG.Actor.dataModels, {
		Player: models.PlayerSD,
		NPC: models.NpcSD,
		Vehicle: models.VehicleSD,
	});

	Object.assign(CONFIG.Item.dataModels, {
		"Ancestry": models.AncestrySD,
		"Armor": models.ArmorSD,
		"Background": models.BackgroundSD,
		"Basic": models.BasicSD,
		"Boon": models.BoonSD,
		"Class": models.ClassSD,
		"Class Ability": models.ClassAbilitySD,
		"Deity": models.DeitySD,
		"Effect": models.EffectSD,
		"Gem": models.GemSD,
		"Language": models.LanguageSD,
		"NPC Attack": models.NpcAttackSD,
		"NPC Feature": models.NpcFeatureSD,
		"NPC Special Attack": models.NpcSpecialAttackSD,
		"NPC Spell": models.NpcSpellSD,
		"Patron": models.PatronSD,
		"Potion": models.PotionSD,
		"Property": models.PropertySD,
		"Scroll": models.ScrollSD,
		"Spell": models.SpellSD,
		"Talent": models.TalentSD,
		"Wand": models.WandSD,
		"Weapon": models.WeaponSD,
	});

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("shadowdark", sheets.PlayerSheetSD, {
		types: ["Player"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.player",
	});

	Actors.registerSheet("shadowdark", sheets.NpcSheetSD, {
		types: ["NPC"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.npc",
	});

	Actors.registerSheet("shadowdark", sheets.LightSheetSD, {
		types: ["Light"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.npc",
	});

	Actors.registerSheet("shadowdark", sheets.VehicleSheetSD, {
		types: ["Vehicle"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.vehicle",
	});

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("shadowdark", sheets.ItemSheetSD, {
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.item",
	});

	// Attack init hooks
	HooksInitSD.attach();

});

/* -------------------------------------------- */
/*  Foundry VTT Ready                           */
/* -------------------------------------------- */

// A hook event that fires when the game is fully ready.
//
Hooks.on("ready", async () => {
	// Check to see if any data migrations need to be run, and then run them
	await performDataMigration();

	HooksSD.attach();
	listenOnSocket();

	chat.messages.welcomeMessage();

	UtilitySD.showNewReleaseNotes();

	shadowdark.log("Game Ready");
});

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

// A hook event that fires when Foundry has finished initializing but before
// the game state has been set up. Fires before any Documents, UI applications,
// or the Canvas have been initialized.
//
Hooks.once("setup", () => {
	shadowdark.log("Setup Hook");

	// Localize all the strings in the game config in advance
	//
	for (const obj in game.shadowdark.config) {
		if ({}.hasOwnProperty.call(game.shadowdark.config, obj)) {
			for (const el in game.shadowdark.config[obj]) {
				if ({}.hasOwnProperty.call(game.shadowdark.config[obj], el)) {
					if (typeof game.shadowdark.config[obj][el] === "string") {
						game.shadowdark.config[obj][el] = game.i18n.localize(
							game.shadowdark.config[obj][el]
						);
					}
				}
			}
		}
	}

	for (const predefinedEffect in CONFIG.SHADOWDARK.PREDEFINED_EFFECTS) {
		CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[predefinedEffect].name =
			game.i18n.localize(
				CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[predefinedEffect].name
			);
	}
});

HooksImmediate.attach();
