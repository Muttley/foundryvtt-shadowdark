export const registerSystemSettings = function() {

	// Internal System Version
	game.settings.register("shadowdark", "systemVersion", {
		name: "System Version",
		scope: "world",
		config: false,
		type: String,
		default: "",
	});

};
