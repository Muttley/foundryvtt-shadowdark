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
		const errorList = form.querySelector(".import-errors");

		// Clear previous errors
		if (errorList) {
			errorList.replaceChildren();
			errorList.hidden = true;
		}

		try {
			let newDoc = await this._import(text);
			ui.notifications.info(
				`Successfully Created: ${newDoc.name} [${newDoc._id}]`
			);
			ui.sidebar.activateTab(config.sidebarTab);
			this.close();
			newDoc.sheet.render(true);
		}
		catch(error) {
			if (error.details && errorList) {
				for (const msg of error.details) {
					const li = document.createElement("li");
					li.textContent = msg;
					errorList.appendChild(li);
				}
				errorList.hidden = false;
			}
			else {
				ui.notifications.error(
					`${config.errorMessage} ${error}`
				);
			}
		}
	}

	_toCamelCase(str) {
		return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
	}
}
