import { SHADOWDARK } from "./src/config.js";
import { registerSystemSettings } from "./src/settings.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

// A hook event that fires as Foundry is initializing, right before any
// initialization tasks have begun.
//
Hooks.once("init", () => {
	console.log("Shadowdark | Initialising the Shadowdark RPG Game System");

	game.shadowdark = {
		config: SHADOWDARK,
	};

	CONFIG.SHADOWDARK = SHADOWDARK;

	registerSystemSettings();
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
});
