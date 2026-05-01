import ActorSheetSD from "./ActorSheetSD.mjs";

export default class NpcSheetSD extends ActorSheetSD {

	static DEFAULT_OPTIONS = foundry.utils.mergeObject(
		ActorSheetSD.DEFAULT_OPTIONS,
		{
			classes: ["shadowdark-app", "shadowdark-npc"],
			position: { width: 600, height: 730 },
			window: {
				resizable: true,
				contentClasses: ["shadowdark", "sheet", "npc"],
			},
			actions: {
				"display-feature": NpcSheetSD.prototype._onDisplayFeature,
				"cast-npc-spell": NpcSheetSD.prototype._onCastSpell,
				"focus-npc-spell": NpcSheetSD.prototype._onFocusNpcSpell,
			},
		},
		{ inplace: false }
	);

	static PARTS = {
		header: {
			template: "systems/shadowdark/templates/actors/_partials/header.hbs",
		},
		nav: {
			template: "systems/shadowdark/templates/actors/_partials/nav.hbs",
		},
		abilities: {
			template: "systems/shadowdark/templates/actors/npc/abilities.hbs",
			scrollable: [""],
		},
		spells: {
			template: "systems/shadowdark/templates/actors/npc/spells.hbs",
			scrollable: [""],
		},
		description: {
			template: "systems/shadowdark/templates/actors/npc/description.hbs",
			scrollable: [""],
		},
		effects: {
			template: "systems/shadowdark/templates/actors/_partials/effects-tab.hbs",
			scrollable: [""],
		},
	};

	static TABS = {
		primary: {
			initial: "abilities",
			labelPrefix: "SHADOWDARK.sheet.npc.tab",
			tabs: [
				{ id: "abilities" },
				{ id: "spells" },
				{ id: "description" },
				{ id: "effects", label: "SHADOWDARK.sheet.item.tab.effects" },
			],
		},
	};

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		for (const [key, ability] of Object.entries(this.actor.system.abilities)) {
			ability.label = game.i18n.localize(`SHADOWDARK.ability_${key}`);
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

		const stripHtml = html =>
			new DOMParser().parseFromString(html ?? "", "text/html").body.textContent ?? "";

		for (const i of this._sortAllItems(context)) {
			if (i.type === "NPC Attack") {
				const display = await this.actor.system.buildNpcAttackDisplays(i._id);
				attacks.push({itemId: i._id, display});
			}
			else if (i.type === "NPC Special Attack") {
				const display = await this.actor.system.buildNpcSpecialDisplays(i._id);
				specials.push({itemId: i._id, display});
			}
			else if (i.type === "NPC Feature") {
				const description =
					await foundry.applications.ux.TextEditor.implementation.enrichHTML(
						stripHtml(i.system.description),
						{ async: true }
					);
				features.push({itemId: i._id, name: i.name, description});
			}
			else if (i.type === "Spell") {
				i.description =
					await foundry.applications.ux.TextEditor.implementation.enrichHTML(
						stripHtml(i.system.description),
						{ async: true }
					);
				spells.push(i);
			}
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

	async _onDisplayFeature(event, target) {
		event.preventDefault();
		const item = this.actor.items.get(target.dataset.itemId);
		return item.displayCard();
	}

	async _onCastSpell(event, target, focus = false) {
		event.preventDefault();

		const itemUuid = target.dataset.itemUuid;
		const config = { cast: { focus: focus }, skipPrompt: event.shiftKey };

		this.actor.system.castSpell(itemUuid, config);
	}

	async _onFocusNpcSpell(event, target) {
		return this._onCastSpell(event, target, true);
	}

	async _onDropItem(event, item) {
		if (item.type === "Spell") {
			// add new spell to NPC
			return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
		}
		else {
			return super._onDropItem(event, item);
		}
	}

}
