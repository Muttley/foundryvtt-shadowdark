const {api, sheets} = foundry.applications;

// const TextEditor = foundry.applications.ux.TextEditor.implementation;

export default class ItemSheetSDv2
	extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {},
		classes: [],
		form: {
			submitOnChange: true,
		},
		position: {
			width: 665,
			height: "auto",
		},
	};


	static TABS = [];


	get system() {
		return this.item.system;
	}


	get tabs() {
		if (!this.tabGroups.primary) {
			this.tabGroups.primary = this.defaultTab;
		}
		return [];
	}


	async _preparePartContext(partId, context, options) {
		await super._preparePartContext(partId, context, options);

		context.tab = context.tabs[partId];

		return context;
	}
}
