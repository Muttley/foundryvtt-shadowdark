import ActorSheetSD from "./ActorSheetSD.mjs";

export default class NpcSheetSD extends ActorSheetSD {

	static DEFAULT_OPTIONS = foundry.utils.mergeObject(
		ActorSheetSD.DEFAULT_OPTIONS,
		{
			classes: ["shadowdark", "sheet", "npc"],
			position: { width: 600, height: 730 },
			window: { resizable: true },
		},
		{ inplace: false }
	);

	static PARTS = {
		form: {
			template: "systems/shadowdark/templates/actors/npc.hbs",
			scrollable: [".SD-content-body"],
		},
	};

	/** @inheritdoc */
	activateListeners(html) {
		html.find("[data-action='display-feature']").click(
			event => this._displayFeature(event)
		);

		html.find("[data-action='focus-npc-spell']").click(
			event => this._onCastSpell(event, { isFocusRoll: true })
		);

		html.find("[data-action='cast-npc-spell']").click(
			event => this._onCastSpell(event)
		);

		html.find(".toggle-lost").click(
			event => this._onToggleLost(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		// Ability Scores
		for (const [key, ability] of Object.entries(this.actor.system.abilities)) {
			const labelKey = `SHADOWDARK.ability_${key}`;
			ability.label = `${game.i18n.localize(labelKey)}`;
		}

		await this._prepareItems(context);

		return context;
	}

	async _prepareItems(context) {
		const attacks = [];
		const specials = [];
		const spells = [];
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
			// Push Attacks
			if (i.type === "NPC Attack") {
				const display = await this.actor.system.buildNpcAttackDisplays(i._id);
				attacks.push({itemId: i._id, display});
			}

			// Push Specials
			else if (i.type === "NPC Special Attack") {
				const display = await this.actor.system.buildNpcSpecialDisplays(i._id);
				specials.push({itemId: i._id, display});
			}

			// Push Features
			else if (i.type === "NPC Feature") {
				// TODO remove jQuery
				const description =
					await foundry.applications.ux.TextEditor.implementation.enrichHTML(
						jQuery(i.system.description).text(),
						{
							async: true,
						}
					);

				features.push({
					itemId: i._id,
					name: i.name,
					description,
				});
			}

			// Push Spells
			else if (i.type === "Spell") {
				// TODO remove jQuery
				i.description =
					await foundry.applications.ux.TextEditor.implementation.enrichHTML(
						jQuery(i.system.description).text(),
						{
							async: true,
						}
					);

				spells.push(i);
			}

			// Push Effects
			else if (i.type === "Effect") {
				const category = i.system.category;
				effects[category].items.push(i);
			}
		}

		context.attacks = attacks;
		context.specials = specials;
		context.spells = spells;
		context.features = features;
		context.effects = effects;
	}

	async _displayFeature(event) {
		event.preventDefault();
		const item = this.actor.items.get(event.currentTarget?.dataset?.itemId);
		return item.displayCard();
	}

	async _onCastSpell(event, options) {
		event.preventDefault();

		const itemUuid = event.currentTarget.dataset.itemUuid;

		if (event.shiftKey) {
			this.actor.system.castSpell(itemUuid, {skipPrompt: true});
		}
		else {
			this.actor.system.castSpell(itemUuid);
		}
	}

	async _onDropItem(event, data) {
		// get uuid of dropped item
		const droppedItem = await fromUuid(data.uuid);

		// if it's an spell, else return as normal
		if (droppedItem.type === "Spell") {
			// add new spell to NPC
			this.actor.createEmbeddedDocuments("Item", [droppedItem]);
		}
		else {
			super._onDropItem(event, data);
		}
	}

}
