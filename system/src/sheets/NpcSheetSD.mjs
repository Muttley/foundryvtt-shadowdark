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

	async _onRollItem(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		if (item.type === "NPC Attack" && item.system.attackType === "special") {
			// TODO These are not technically rollable, but maybe in the
			// future we could add an interactive chat card for contested
			// checks, etc.
			return;
		}

		const data = {
			item: item,
			actor: this.actor,
		};

		// Summarize the bonuses for the attack roll
		const parts = ["@attackBonus"];
		data.attackBonus = item.system.attack.bonus;

		data.damageParts = ["@damageBonus"];
		data.damageBonus = item.system.damage.bonus;

		return item.rollNpcAttack(parts, data);
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
