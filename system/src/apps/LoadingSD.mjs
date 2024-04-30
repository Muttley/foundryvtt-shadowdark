export default class LoadingSD extends Application {

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "loading-spinner"],
			resizable: false,
			width: "auto",
			height: 120,
		});
	}

	get template() {
		return "systems/shadowdark/templates/apps/loading.hbs";
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.app.loading.title");
	}

	async close(options={}) {
		// Occasionally the loading dialog will try to close before it has fully
		// rendered.
		//
		// If this happens Foundry will not remove the window correctly, so we
		// make sure to only try and properly close the window once it has
		// finished rendering.
		//
		while (!this.rendered) {
			await shadowdark.utils.sleep(100); // millisecs
		}

		super.close(options);
	}
}
