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

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.item-properties.weapon.title");
		return `${title}: ${this.object.name}`;
	}
}
