import SHADOWDARK from "./src/config.mjs";
import loadTemplates from "./src/templates.mjs";
import registerHandlebarsHelpers from "./src/handlebars.mjs";
import registerSystemSettings from "./src/settings.mjs";

import * as apps from "./src/apps/_module.mjs";
import * as dice from "./src/dice/_module.mjs";
import * as documents from "./src/documents/_module.mjs";
import * as sheets from "./src/sheets/_module.mjs";
import * as migrations from "./src/migration.mjs";
import * as tours from "./src/tours/_module.mjs";

import { HooksSD } from "./src/hooks.mjs";

import "./src/testing/index.mjs";

/* -------------------------------------------- */
/*  Define Module Structure                     */
/* -------------------------------------------- */

globalThis.shadowdark = {
	apps,
	config: SHADOWDARK,
	dice,
	documents,
	sheets,
	migrations,
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

	console.log("Shadowdark RPG | Initialising the Shadowdark RPG Game System");

	game.shadowdark = {
		config: SHADOWDARK,
		lightSourceTracker: new apps.LightSourceTrackerSD(),
	};

	CONFIG.SHADOWDARK = SHADOWDARK;
	CONFIG.Actor.documentClass = documents.ActorSD;
	CONFIG.Item.documentClass = documents.ItemSD;
	CONFIG.DiceSD = dice.DiceSD;

	registerHandlebarsHelpers();
	registerSystemSettings();
	loadTemplates();

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

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("shadowdark", sheets.ItemSheetSD, {
		makeDefault: true,
		label: "SHADOWDARK.sheet.class.item",
	});
});

/* -------------------------------------------- */
/*  Foundry VTT Ready                           */
/* -------------------------------------------- */

// A hook event that fires when the game is fully ready.
//
Hooks.on("ready", () => {

	HooksSD.attach();

	// Migration checks
	if ( !game.user.isGM ) return;
	const currentMigrationVersion = game.settings.get("shadowdark", "systemVersion");
	const needsMigrationVersion = game.system.flags.needsMigrationVersion;
	const totalDocuments = game.actors.size + game.packs.size;

	// If no currentMigrationVersion is set and there are no documents, there is no need to migrate
	if (
		!currentMigrationVersion
		&& totalDocuments === 0
	) return game.settings.set("shadowdark", "systemVersion", game.system.version);

	// If the current migration exists, but doesn't need migration, return.
	if (
		currentMigrationVersion
		&& !isNewerVersion(needsMigrationVersion, currentMigrationVersion)
	) return console.log("Shadowdark RPG | Game Ready");

	migrations.migrateWorld();

	// Tours
	game.tours.register(
		"shadowdark",
		"shadowdark-lightsource-tracker-tour",
		new tours.ShadowdarkLightsourceTrackerTour()
	);

	console.log("Shadowdark RPG | Game Ready");
});

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

// A hook event that fires when Foundry has finished initializing but before
// the game state has been set up. Fires before any Documents, UI applications,
// or the Canvas have been initialized.
//
Hooks.once("setup", () => {
	console.log("Shadowdark RPG | Setup Hook");

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
});
