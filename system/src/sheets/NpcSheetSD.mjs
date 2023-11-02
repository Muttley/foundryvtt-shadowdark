import ActorSheetSD from "./ActorSheetSD.mjs";

export default class NpcSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "npc"],
			width: 600,
			height: 700,
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
		const parts = ["1d20", "@attackBonus"];
		data.attackBonus = item.system.bonuses.attackBonus;

		data.damageParts = ["@damageBonus"];
		data.damageBonus = item.system.bonuses.damageBonus;

		return item.rollNpcAttack(parts, data);
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find("[data-action='show-feature']").click(
			event => this._onShowFeature(event)
		);
		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		// Ability Scores
		for (const [key, ability] of Object.entries(context.system.abilities)) {
			const labelKey = `SHADOWDARK.ability_${key}`;
			ability.label = `${game.i18n.localize(labelKey)}`;
		}

		await this._prepareItems(context);

		return context;
	}

	async _prepareItems(context) {
		const attacks = [];
		const features = [];

		const effects = {
			effect: {
				label: game.i18n.localize("SHADOWDARK.item.effect.category.effect"),
				items: [],
			},
			condition: {
				label: game.i18n.localize("SHADOWDARK.item.effect.category.condition"),
				items: [],
			},
		};

		for (const i of this._sortAllItems(context)) {
			if (i.type === "NPC Attack") {
				const display = await this.actor.buildNpcAttackDisplays(i._id);
				attacks.push({itemId: i._id, display});
			}
			if (i.type === "NPC Feature") {
				const description = await TextEditor.enrichHTML(
					jQuery(i.system.description).text(),
					{
						async: true,
					}
				);

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
			else if (i.type === "Effect") {
				const category = i.system.category;
				effects[category].items.push(i);
			}
		}

		context.attacks = attacks;
		context.features = features;
		context.effects = effects;
	}

	async _onShowFeature(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget).data("item-id");
		this.actor.useAbility(itemId);
	}
}
