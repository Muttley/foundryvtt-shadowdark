import ItemPropertiesSD from "./ItemPropertiesSD.mjs";

export default class ArmorPropertiesSD extends ItemPropertiesSD {
	constructor(object, options) {
		super(
			object,
			{
				data: CONFIG.SHADOWDARK.ARMOR_PROPERTIES,
				systemKey: "properties",
			}
		);
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.item_properties.armor.title");
		return `${title}: ${this.object.name}`;
	}
}
