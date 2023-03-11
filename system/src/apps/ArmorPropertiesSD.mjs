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
}
