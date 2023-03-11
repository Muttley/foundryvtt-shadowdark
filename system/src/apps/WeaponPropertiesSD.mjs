import ItemPropertiesSD from "./ItemPropertiesSD.mjs";

export default class WeaponPropertiesSD extends ItemPropertiesSD {
	constructor(object, options) {
		super(
			object,
			{
				data: CONFIG.SHADOWDARK.WEAPON_PROPERTIES,
				systemKey: "properties",
			}
		);
	}
}
