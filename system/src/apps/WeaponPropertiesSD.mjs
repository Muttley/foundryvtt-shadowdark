import ItemPropertiesSD from "./ItemPropertiesSD.mjs";

export default class WeaponPropertiesSD extends ItemPropertiesSD {
	constructor(object, options) {
		super(object, options, CONFIG.SHADOWDARK.WEAPON_PROPERTIES);
	}
}
