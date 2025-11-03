import SourceFilterSettings from "./apps/SourceFilterSettings.mjs";

/**
 * Register all of the system"s settings.
 */
export default function registerSystemSettings() {

	// -----------------
	//  Content Sources
	// -----------------
	//
	game.settings.registerMenu("shadowdark", "sources", {
		name: "SHADOWDARK.settings.source_filter.name",
		hint: "SHADOWDARK.settings.source_filter.hint",
		label: "SHADOWDARK.settings.source_filter.button_label",
		icon: "fa-solid fa-book",
		type: SourceFilterSettings,
		restricted: true,
	});
	SourceFilterSettings.registerSetting();

	// ----------------
	//  NPC HIT POINTS
	// ----------------
	//
	game.settings.register("shadowdark", "rollNpcHpWhenAddedToScene", {
		name: "SHADOWDARK.settings.roll_npc_hp.name",
		hint: "SHADOWDARK.settings.roll_npc_hp.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	// -----------
	//  PULP MODE
	// -----------
	//
	game.settings.register("shadowdark", "usePulpMode", {
		name: "SHADOWDARK.settings.use_pulp_mode.name",
		hint: "SHADOWDARK.settings.use_pulp_mode.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: async () => {
			for (const actor of game.actors) {
				if (actor.sheet.rendered) {
					actor.sheet.render(true);
				}
			}
		},
	});

	// ---------------
	//  MOMENTUM MODE
	// ---------------
	game.settings.register("shadowdark", "useMomentumMode", {
		name: "SHADOWDARK.settings.use_momentum_mode.name",
		hint: "SHADOWDARK.settings.use_momentum_mode.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	// ------------------------
	//  LIGHT TRACKER SETTINGS
	// ------------------------
	//
	game.settings.register("shadowdark", "trackLightSources", {
		name: "SHADOWDARK.settings.track_light_sources.name",
		hint: "SHADOWDARK.settings.track_light_sources.hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		requiresReload: true,
		onChange: () => game.shadowdark.lightSourceTracker._settingsChanged(),
	});

	game.settings.register("shadowdark", "trackLightSourcesOpen", {
		name: "SHADOWDARK.settings.track_light_sources.open_on_start.name",
		hint: "SHADOWDARK.settings.track_light_sources.open_on_start.hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register("shadowdark", "trackInactiveUserLightSources", {
		name: "SHADOWDARK.settings.track_light_sources.inactive_user.name",
		hint: "SHADOWDARK.settings.track_light_sources.inactive_user.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: () => game.shadowdark.lightSourceTracker._settingsChanged(),
	});

	game.settings.register("shadowdark", "realtimeLightTracking", {
		name: "SHADOWDARK.settings.track_light_sources.realtime_tracking.name",
		hint: "SHADOWDARK.settings.track_light_sources.realtime_tracking.hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: () => game.shadowdark.lightSourceTracker._settingsChanged(),
	});

	game.settings.register("shadowdark", "pauseLightTrackingWithGame", {
		name: "SHADOWDARK.settings.track_light_sources.pause_with_game.name",
		hint: "SHADOWDARK.settings.track_light_sources.pause_with_game.hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	game.settings.register("shadowdark", "trackLightSourcesInterval", {
		name: "SHADOWDARK.settings.track_light_sources.interval.name",
		hint: "SHADOWDARK.settings.track_light_sources.interval.hint",
		scope: "world",
		config: true,
		default: shadowdark.defaults.LIGHT_TRACKER_UPDATE_INTERVAL_SECS,
		type: Number,
		range: {
			min: 10,
			max: 120,
			step: 10,
		},
		requiresReload: true,
	});

	game.settings.register("shadowdark", "playerShowLightRemaining", {
		name: "SHADOWDARK.settings.track_light_sources.show_remaining.name",
		hint: "SHADOWDARK.settings.track_light_sources.show_remaining.hint",
		scope: "world",
		config: true,
		default: 2,
		type: Number,
		choices: {
			0: "SHADOWDARK.settings.track_light_sources.show_remaining.option0",
			1: "SHADOWDARK.settings.track_light_sources.show_remaining.option1",
			2: "SHADOWDARK.settings.track_light_sources.show_remaining.option2",
		},
	});

	// ----------------------
	//  EFFECT PANEL SETTINGS
	// ----------------------
	//
	game.settings.register("shadowdark", "showPassiveEffects", {
		name: "SHADOWDARK.settings.effect_panel.show_passive.name",
		hint: "SHADOWDARK.settings.effect_panel.show_passive.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	// ------------------
	//  AMMO CONSUMPTION
	// ------------------
	//
	game.settings.register("shadowdark", "autoConsumeAmmunition", {
		hint: "SHADOWDARK.settings.consume_ammunition.hint",
		name: "SHADOWDARK.settings.consume_ammunition.name",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	// ------------------
	//  ATTACK TARGETING
	// ------------------
	game.settings.register("shadowdark", "enableTargeting", {
		hint: "SHADOWDARK.settings.enable_targeting.hint",
		name: "SHADOWDARK.settings.enable_targeting.name",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	// ----------------------
	//  INITIATIVE SETTINGS
	// ----------------------
	//
	game.settings.register("shadowdark", "useClockwiseInitiative", {
		name: "SHADOWDARK.settings.use_clockwise_initiative.name",
		hint: "SHADOWDARK.settings.use_clockwise_initiative.hint",
		scope: "world",
		type: Boolean,
		config: true,
		default: false,
		requiresReload: true,
	});

	// ----------------
	//  DEBUG SETTINGS
	// ----------------
	//
	game.settings.register("shadowdark", "debugEnabled", {
		name: "SHADOWDARK.settings.debugEnabled.name",
		hint: "SHADOWDARK.settings.debugEnabled.hint",
		scope: "world",
		type: Boolean,
		config: true,
		default: false,
		requiresReload: true,
	});

	game.settings.register("shadowdark", "systemVersion", {
		name: "SHADOWDARK.settings.systemVersion.name",
		hint: "SHADOWDARK.settings.systemVersion.hint",
		scope: "world",
		config: game.settings.get("shadowdark", "debugEnabled"),
		default: "",
		type: String,
	});

	game.settings.register("shadowdark", "schemaVersion", {
		name: "SHADOWDARK.settings.schemaVersion.name",
		hint: "SHADOWDARK.settings.schemaVersion.hint",
		scope: "world",
		config: game.settings.get("shadowdark", "debugEnabled"),
		default: -1,
		type: Number,
	});

	game.settings.register("shadowdark", "migrateSystemCompendiums", {
		name: "SHADOWDARK.settings.migrateSystemCompendiums.name",
		hint: "SHADOWDARK.settings.migrateSystemCompendiums.hint",
		scope: "world",
		type: Boolean,
		config: game.settings.get("shadowdark", "debugEnabled"),
		default: false,
		requiresReload: true,
	});

}
