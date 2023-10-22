// Hooks used by the monster Importer

export const MonsterImport = {
	attach: () => {
		Hooks.on("renderSidebarTab", async function(app, html) {
			if (app.options.classes.includes("actors-sidebar") && game.user.isGM) {
				const title = game.i18n.localize("SHADOWDARK.apps.monster-importer.title");

				const button = $(
					await renderTemplate(
						"systems/shadowdark/templates/ui/monster-import-button.hbs",
						{ title }
					)
				);

				button.click(() => {
					new shadowdark.apps.MonsterImporterSD().render(true);
				});

				html.find(".directory-footer").append(button);
			}
		});
	},
};
