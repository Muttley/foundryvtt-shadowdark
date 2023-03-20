import ActorSheetSD from "./ActorSheetSD.mjs";

export default class NpcSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "npc"],
			width: 600,
			height: 666, // Memnon says "Hi!"
			resizable: true,
			tabs: [
				{
					navSelector: ".npc-navigation",
					contentSelector: ".npc-body-content",
					initial: "tab-details",
				},
			],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/npc.hbs";
	}

	/** @inheritdoc */
	activateListeners(html) {
		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		await this._prepareItems(context);

		return context;
	}

	async _prepareItems(context) {
		const attacks = [];
		const features = [];

		for (const i of this._sortAllItems(context)) {
			if (i.type === "NPC Attack") {
				const display = await this.actor.buildNpcAttackDisplays(i._id);
				attacks.push({itemId: i._id, display});
			}
			if (i.type === "NPC Feature") {
				const description = jQuery(i.system.description).text();
				const display = await renderTemplate(
					"systems/shadowdark/templates/partials/npc-feature.hbs",
					{
						name: i.name,
						description,
					}
				);
				features.push({
					itemId: i._id,
					display,
				});
			}
		}

		context.attacks = attacks;
		context.features = features;
	}
}
