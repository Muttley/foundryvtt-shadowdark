import ItemPropertiesSD from "./ItemPropertiesSD.mjs";

export default class NpcAttackRangesSD extends ItemPropertiesSD {
	constructor(object, options) {
		super(
			object,
			{
				data: CONFIG.SHADOWDARK.RANGES,
				systemKey: "ranges",
			}
		);
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.npc_attack_ranges.title");
		return `${title}: ${this.object.name}`;
	}
}
