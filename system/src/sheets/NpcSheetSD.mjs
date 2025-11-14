import ActorSheetSD from "./ActorSheetSD.mjs";

export default class NpcSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "npc"],
			scrollY: ["section.SD-content-body"],
			width: 600,
			height: 730,
			resizable: true,
			tabs: [
				{
					navSelector: ".SD-nav",
					contentSelector: ".SD-content-body",
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
		html.find("[data-action='item-use-ability']").click(
			event => this._onUseAbility(event)
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
		for (const [key, ability] of Object.entries(context.system.abilities)) {
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
				const display = await this.actor.buildNpcAttackDisplays(i._id);
				attacks.push({itemId: i._id, display});
			}

			// Push Specials
			else if (i.type === "NPC Special Attack") {
				const display = await this.actor.buildNpcSpecialDisplays(i._id);
				specials.push({itemId: i._id, display});
			}

			// Push Features
			else if (i.type === "NPC Feature") {
				const description = await TextEditor.enrichHTML(
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
			else if (i.type === "NPC Spell") {
				i.description = await TextEditor.enrichHTML(
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

	async _onUseAbility(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget).data("item-id");
		this.actor.useAbility(itemId);
	}

	async _onCastSpell(event, options) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");

		if (event.shiftKey) {
			this.actor.castNPCSpell(itemId, {...options, fastForward: true, adv: 0});
		}
		else if (event.altKey) {
			this.actor.castNPCSpell(itemId, {...options, fastForward: true, adv: 1});
		}
		else if (event.ctrlKey) {
			this.actor.castNPCSpell(itemId, {...options, fastForward: true, adv: -1});
		}
		else {
			this.actor.castNPCSpell(itemId, options);
		}
	}

	async _onDropItem(event, data) {
		// get uuid of dropped item
		const droppedItem = await fromUuid(data.uuid);

		// if it's an PC spell, convert to NPC spell, else return as normal
		if (droppedItem.type === "Spell") {
			const newNpcSpell = {
				name: droppedItem.name,
				type: "NPC Spell",
				system: {
					description: droppedItem.system.description,
					duration: {
						type: droppedItem.system.duration.type,
						value: droppedItem.system.duration.value,
					},
					range: droppedItem.system.range,
					dc: droppedItem.system.tier + 10,
				},
			};
			// add new spell to NPC
			this.actor.createEmbeddedDocuments("Item", [newNpcSpell]);
		}
		else {
			super._onDropItem(event, data);
		}
	}
}
