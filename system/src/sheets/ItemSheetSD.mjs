export default class ItemSheetSD extends ItemSheet {

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
		return "systems/shadowdark/templates/items/item.hbs";
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		const item = context.item;
		const source = item.toObject();

		foundry.utils.mergeObject(context, {
			source: source.system,
			system: item.system,
			itemType: game.i18n.localize(`SHADOWDARK.item.type.${item.type}`),
			usesSlots: item.system.slots !== undefined,
			hasCost: item.system.cost !== undefined,
		});

		return context;
	}
}
