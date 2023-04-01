// Hooks used by the Shadowdarkling Importer

export const ShadowdarklingImport = {
	attach: () => {
		Hooks.on("renderSidebarTab", function(app, html) {
			if (app.options.id === "actors") {
				const importButton = $(
					`<button class="shadowdarkling-import-button" 
          data-tooltop="SHADOWDARK.apps.shadowdarkling-importer.title">
          <i class="fas fa-user-plus"></i>
          <b class="button-text">${game.i18n.localize("SHADOWDARK.apps.shadowdarkling-importer.title")}</b></button>`
				);

				importButton.click(() => {
					new shadowdark.apps.ShadowdarklingImporterSD().render(true);
				});

				html.find(".directory-footer").append(importButton);
			}
		});
	},
};
