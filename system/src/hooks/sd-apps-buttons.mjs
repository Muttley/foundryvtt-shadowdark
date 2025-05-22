// Hooks used by the Shadowdarkling Importer

export const SDAppsButtons = {
	attach: () => {
		if (game.version < 13) {
			// v12 method using JQuery
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
		}
		else {
			// v13 method without JQuery
			Hooks.on("renderActorDirectory", async function(app, html) {
				const renderedHTML = await foundry.applications.handlebars.renderTemplate(
					"systems/shadowdark/templates/ui/sd-apps-buttons.hbs"
				);

				const footer = html.querySelector("#actors .directory-footer");
				await footer.insertAdjacentHTML("beforeend", renderedHTML);

				footer.querySelector(".character-generator-button").addEventListener("click", () => {
					new shadowdark.apps.CharacterGeneratorSD().render(true);
				});

				footer.querySelector(".shadowdarkling-import-button").addEventListener("click", () => {
					new shadowdark.apps.ShadowdarklingImporterSD().render(true);
				});
			});
		}
	},
};
