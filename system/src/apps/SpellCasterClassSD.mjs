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
}
