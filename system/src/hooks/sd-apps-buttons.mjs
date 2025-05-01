// Hooks used by the Shadowdarkling Importer

export const SDAppsButtons = {
	attach: () => {
		Hooks.on("renderSidebarTab", async function(app, html) {
			if (app.options.classes.includes("actors-sidebar")) {

				const renderedHTML = $(
					await renderTemplate(
						"systems/shadowdark/templates/ui/sd-apps-buttons.hbs"
					)
				);

				html.find(".directory-footer").append(renderedHTML);

				html.on("click", ".character-generator-button", () => {
					new shadowdark.apps.CharacterGeneratorSD().render(true);
				});

				html.on("click", ".shadowdarkling-import-button", () => {
					new shadowdark.apps.ShadowdarklingImporterSD().render(true);
				});
			}
		});

		Hooks.on("renderSidebar", async function(app, html) {
			if (game.version > 13) {
				const renderedHTML = $(
					await renderTemplate(
						"systems/shadowdark/templates/ui/sd-apps-buttons.hbs"
					)
				);

				const footer = html.querySelector("#actors .directory-footer");
				await footer.append(renderedHTML[0]);

				footer.querySelector(".character-generator-button").addEventListener("click", () => {
					new shadowdark.apps.CharacterGeneratorSD().render(true);
				});

				footer.querySelector(".shadowdarkling-import-button").addEventListener("click", () => {
					new shadowdark.apps.ShadowdarklingImporterSD().render(true);
				});
			}
		});


	},
};
