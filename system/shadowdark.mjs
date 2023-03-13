import SHADOWDARK from "./src/config.mjs";
import loadTemplates from "./src/templates.mjs";
import onUpdateWorldTime from "./src/time.mjs";
import registerHandlebarsHelpers from "./src/handlebars.mjs";
import registerSystemSettings from "./src/settings.mjs";

import * as apps from "./src/apps/_module.mjs";
import * as dice from "./src/dice/_module.mjs";
import * as documents from "./src/documents/_module.mjs";
import * as sheets from "./src/sheets/_module.mjs";
import onRenderchatMessage from "./src/chat-message/ChatCardSD.mjs";

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

	console.log("Shadowdark | Initialising the Shadowdark RPG Game System");

	game.shadowdark = {
		config: SHADOWDARK,
	};

	CONFIG.SHADOWDARK = SHADOWDARK;
	CONFIG.Actor.documentClass = documents.ActorSD;
	CONFIG.Item.documentClass = documents.ItemSD;
	CONFIG.Dice.D20RollSD = dice.D20RollSD;
	CONFIG.Dice.DamageRoll = dice.DamageRollSD;

	registerHandlebarsHelpers();
	registerSystemSettings();
	loadTemplates();

	// Register sheet application classes
	Actors.unregisterSheet("core", ActorSheet);
	Actors.registerSheet("shadowdark", sheets.PlayerSheetSD, {
		types: ["Player"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.ClassPlayer",
	});

	Actors.registerSheet("shadowdark", sheets.NpcSheetSD, {
		types: ["NPC"],
		makeDefault: true,
		label: "SHADOWDARK.sheet.ClassNpc",
	});

	Items.unregisterSheet("core", ItemSheet);
	Items.registerSheet("shadowdark", sheets.ItemSheetSD, {
		makeDefault: true,
		label: "SHADOWDARK.sheet.ClassItem",
	});
});

/* -------------------------------------------- */
/*  Foundry VTT Ready                           */
/* -------------------------------------------- */

// A hook event that fires when the game is fully ready.
//
Hooks.on("ready", () => {
	console.log("Shadowdark | Game Ready");
});

/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

// A hook event that fires when Foundry has finished initializing but before
// the game state has been set up. Fires before any Documents, UI applications,
// or the Canvas have been initialized.
//
Hooks.once("setup", () => {
	console.log("Shadowdark | Setup Hook");

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

Hooks.on("updateWorldTime", onUpdateWorldTime);
Hooks.on("renderChatMessage", onRenderchatMessage);
