// Hooks used by the Shadowdarkling Importer

export const SDAppsButtons = {
	attach: () => {
		Hooks.on("renderActorDirectory", async function(app, html) {
			const renderedHTML = await foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/ui/sd-apps-buttons.hbs"
			);

			const footer = html.querySelector("#actors .directory-header");
			await footer.insertAdjacentHTML("afterbegin", renderedHTML);

			footer.querySelector(".character-generator-button").addEventListener("click", () => {
				new shadowdark.apps.CharacterGeneratorSD().render(true);
			});

			footer.querySelector(".shadowdarkling-import-button").addEventListener("click", () => {
				new shadowdark.apps.ShadowdarklingImporterSD().render(true);
			});
		});
	},
};
