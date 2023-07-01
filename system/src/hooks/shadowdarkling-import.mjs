// Hooks used by the Shadowdarkling Importer

export const ShadowdarklingImport = {
	attach: () => {
		Hooks.on("renderSidebarTab", async function(app, html) {
			if (app.options.classes.includes("actors-sidebar")) {
				const title = game.i18n.localize("SHADOWDARK.apps.shadowdarkling-importer.title");

				const button = $(
					await renderTemplate(
						"systems/shadowdark/templates/ui/shadowdarkling-import-button.hbs",
						{ title }
					)
				);

				button.click(() => {
					new shadowdark.apps.ShadowdarklingImporterSD().render(true);
				});

				html.find(".directory-footer").append(button);
			}
		});
	},
};
