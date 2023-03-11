import ItemPropertiesSD from "./ItemPropertiesSD.mjs";

export default class SpellCasterClassSD extends ItemPropertiesSD {
	constructor(object, options) {
		super(
			object,
			{
				data: CONFIG.SHADOWDARK.SPELL_CASTER_CLASSES,
				systemKey: "class",
			}
		);
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.item-properties.caster_classes.title");
		return `${title}: ${this.object.name}`;
	}
}
