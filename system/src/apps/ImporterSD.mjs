/**
 * Base class for text-based importers. Subclasses must define:
 * - static IMPORTER_CONFIG with { textField, sidebarTab, errorMessage }
 * - an async _import(text) method that parses the text and creates a document
 */
export default class ImporterSD extends foundry.applications.api.HandlebarsApplicationMixin(
	foundry.applications.api.ApplicationV2
) {

	static DEFAULT_OPTIONS = {
		tag: "form",
		window: {
			resizable: true,
			contentClasses: ["standard-form"],
		},
		position: {
			width: 600,
			height: 600,
		},
		form: {
			handler: ImporterSD._onSubmitForm,
			closeOnSubmit: false,
		},
	};

	/** @override */
	static async _onSubmitForm(event, form, formData) {
		const config = this.constructor.IMPORTER_CONFIG;
		const text = formData.object[config.textField];

		try {
			let newDoc = await this._import(text);
			ui.notifications.info(`Successfully Created: ${newDoc.name} [${newDoc._id}]`);
			ui.sidebar.activateTab(config.sidebarTab);
		}
		catch(error) {
			ui.notifications.error(`${config.errorMessage} ${error}`);
		}
	}

	_toCamelCase(str) {
		return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
	}
}
