export default class ItemSheetShadowdark extends ItemSheet {
	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 560,
			height: 400,
			classes: ["shadowdark", "sheet", "item"],
			resizable: true,
		});
	}

	/** @inheritdoc */
	get template() {
		return `systems/shadowdark/templates/items/${this.item.type}.hbs`;
	}

	/** @override */
	async getData(options) {
		// TODO Implement our own data context
		const data = super.getData();
		return data;
	}
}
