/**
 * Register all of the system's settings.
 */
export default function registerSystemSettings() {

	// Internal System Version
	game.settings.register("shadowdark", "systemVersion", {
		name: "System Version",
		scope: "world",
		config: false,
		type: String,
		default: "",
	});

}
