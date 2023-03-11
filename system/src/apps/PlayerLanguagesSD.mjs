import ItemPropertiesSD from "./ItemPropertiesSD.mjs";

export default class PlayerLanguagesSD extends ItemPropertiesSD {
	constructor(object, options) {
		super(
			object,
			{
				data: CONFIG.SHADOWDARK.LANGUAGES,
				systemKey: "languages",
			}
		);
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.item-properties.languages.title");
		return `${title}: ${this.object.name}`;
	}
}
