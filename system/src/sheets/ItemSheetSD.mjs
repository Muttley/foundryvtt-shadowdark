export default class ItemSheetSD extends ItemSheet {

	/** @inheritdoc */
	static get defaultOptions() {
		// TODO Custom window sizes per item class?
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 490,
			height: 515,
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
			hasCost: item.system.cost !== undefined,
			itemType: game.i18n.localize(`SHADOWDARK.item.type.${item.type}`),
			ranges: CONFIG.SHADOWDARK.RANGES,
			source: source.system,
			system: item.system,
			usesSlots: item.system.slots !== undefined,
			weaponBaseDamageDice: CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE,
			weaponProperties: CONFIG.SHADOWDARK.WEAPON_PROPERTIES,
			weaponTypes: CONFIG.SHADOWDARK.WEAPON_TYPES,
		});

		return context;
	}
}
