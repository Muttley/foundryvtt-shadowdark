import * as select from "../apps/CompendiumItemSelectors/_module.mjs";

export default class ActorSheetSD extends ActorSheet {

	_hiddenSectionsLut = {
		activeEffects: true,
	};

	/** @inheritdoc */
	activateListeners(html) {
		html.find("[data-action='hide-section']").click(
			event => this._onHideSection(event)
		);

		html.find("[data-action='roll-ability-check']").click(
			event => this._onRollAbilityCheck(event)
		);

		html.find("[data-action='roll-hp']").click(
			event => this._onRollHP(event)
		);

		html.find(".item-selector").click(
			event => this._onItemSelection(event)
		);

		html.find("[data-action='show-details']").click(
			event => shadowdark.utils.toggleItemDetails(event.currentTarget)
		);

		html.find("[data-action='item-attack']").click(
			event => this._onRollAttack(event)
		);

		html.find("[data-action='toggle-lost']").click(
			event => this._onToggleLost(event)
		);

		html.find("[data-action='item-create']").click(
			event => this._onItemCreate(event)
		);

		html.find(".effect-control").click(ev => {
			shadowdark.effects.onManageActiveEffect(ev, this.actor);
		});

		// Create context menu for items on both sheets
		this._itemContextMenu(html.get(0));

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	// Emulate a itom drop as it was on the sheet, when dropped on the canvas
	async emulateItemDrop(data) {
		return this._onDropItem({}, data);
	}

	/** @override */
	async getData(options) {
		const source = this.actor.toObject();
		const actorData = this.actor.toObject(false);

		const context = {
			actor: actorData,
			config: CONFIG.SHADOWDARK,
			cssClass: this.actor.isOwner ? "editable" : "locked",
			editable: this.isEditable,
			hiddenSections: this._hiddenSectionsLut,
			isNpc: this.actor.type === "NPC",
			isPlayer: this.actor.type === "Player",
			items: actorData.items,
			owner: this.actor.isOwner,
			predefinedEffects: await shadowdark.effects.getPredefinedEffectsList(),
			rollData: this.actor.getRollData.bind(this.actor),
			source: source.system,
			system: actorData.system,
		};

		context.activeEffects = shadowdark.effects.prepareActiveEffectCategories(
			this.actor.allApplicableEffects()
		);

		context.notesHTML = await TextEditor.enrichHTML(
			context.system.notes,
			{
				secrets: this.actor.isOwner,
				async: true,
				relativeTo: this.actor,
			}
		);

		return context;
	}

	_getActorOverrides() {
		return Object.keys(foundry.utils.flattenObject(this.object.overrides || {}));
	}

	_getItemContextOptions() {
		const canEdit = function(element, actor) {
			let result = false;
			const itemId = element.dataset.itemId;

			if (game.user.isGM) {
				result = true;
			}
			else if (actor.isOwner) {
				result = actor.items.find(item => item._id === itemId)
					? true
					: false;
			}

			return result;
		};

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_edit.title"),
				icon: '<i class="fas fa-edit"></i>',
				condition: element => canEdit(element, this.actor),
				callback: element => {
					const itemId = element.dataset.itemId;
					const item = this.actor.items.get(itemId);
					return item.sheet.render(true);
				},
			},
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"),
				icon: '<i class="fas fa-trash"></i>',
				condition: element => canEdit(element, this.actor),
				callback: element => {
					const itemId = element.dataset.itemId;
					this._onItemDelete(itemId);
				},
			},
		];
	}

	_itemContextMenu(html) {
		new foundry.applications.ux.ContextMenu.implementation(
			html,
			".item",
			this._getItemContextOptions(),
			{jQuery: false}
		);
	}

	async _effectDropNotAllowed(data) {
		const item = await fromUuid(data.uuid);

		if (item.type === "Effect") {
			if (item.system.duration.type === "rounds" && !game.combat) {
				ui.notifications.warn(
					game.i18n.localize("SHADOWDARK.item.effect.warning.add_round_item_outside_combat")
				);
				return true;
			}
		}

		return false;
	}

	/** @inheritdoc */
	async _onChangeInput(event) {
		// Test for Predefiend Effects
		// Create effects when added through the predefined effects input
		if (event.target?.name === "predefinedEffects") {
			const key = event.target.value;
			return shadowdark.effects.createPredefinedEffect(this.actor, key);
		}

		await super._onChangeInput(event);
	}

	async _onDropItem(event, data) {
		if (await this._effectDropNotAllowed(data)) return false;

		return super._onDropItem(event, data);
	}

	async _onHideSection(event) {
		event.preventDefault();

		const data = event.currentTarget.dataset;
		const sectionId = data.sectionToHide;

		const hideableSection = $(this._element).find(
			`[data-hideable-section-id="${sectionId}"]`
		);

		const iconElement = event.currentTarget.querySelector("i");

		if (this._hiddenSectionsLut[sectionId]) {
			this._hiddenSectionsLut[sectionId] = !this._hiddenSectionsLut[sectionId];
		}
		else {
			this._hiddenSectionsLut[sectionId] = true;
		}

		if (this._hiddenSectionsLut[sectionId]) {
			hideableSection.slideUp(200);
			event.currentTarget.dataset.tooltip = game.i18n.localize(
				"SHADOWDARK.sheet.general.section.toggle_show"
			);
		}
		else {
			hideableSection.slideDown(200);
			event.currentTarget.dataset.tooltip = game.i18n.localize(
				"SHADOWDARK.sheet.general.section.toggle_hide"
			);
		}

		iconElement.classList.toggle("fa-caret-down");
		iconElement.classList.toggle("fa-caret-right");
	}

	_onItemDelete(itemId) {
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		renderTemplate(
			"systems/shadowdark/templates/dialog/delete-item.hbs",
			{name: itemData.name}
		).then(html => {
			new Dialog({
				title: "Confirm Deletion",
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							if (itemData.system.light?.active) {
								await itemData.parent.sheet._toggleLightSource(itemData);
							}
							await this.actor.deleteEmbeddedDocuments(
								"Item",
								[itemId]
							);
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					},
				},
				default: "Yes",
			}).render(true);
		});
	}

	_onItemSelection(event) {
		event.preventDefault();

		const itemType = event.currentTarget.dataset.options;

		switch (itemType) {
			case "ancestry":
				new select.AncestrySelector(this.actor).render(true);
				break;
			case "background":
				new select.BackgroundSelector(this.actor).render(true);
				break;
			case "class":
				new select.ClassSelector(this.actor).render(true);
				break;
			case "deity":
				new select.DeitySelector(this.actor).render(true);
				break;
			case "language":
				new select.LanguageSelector(this.actor).render(true);
				break;
			case "patron":
				new select.PatronSelector(this.actor).render(true);
				break;
		}
	}

	async _onRollHP(event) {
		event.preventDefault();

		this.actor.rollHP();
	}

	async _onRollAbilityCheck(event) {
		event.preventDefault();

		let ability = $(event.currentTarget).data("ability");

		// skip roll prompt if shift clicked
		if (event.shiftKey) {
			this.actor.rollAbility(ability, {event: event, fastForward: true});
		}
		else {
			this.actor.rollAbility(ability, {event: event});
		}
	}

	async _onRollAttack(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const attackType =  $(event.currentTarget).data("attack-type");
		const handedness = $(event.currentTarget).data("handedness");

		const options = {
			attackType,
			handedness,
		};


		// skip roll prompt if shift clicked
		if (event.shiftKey) {
			options.fastForward = true;
		}

		this.actor.rollAttack(itemId, options);

	}

	async _onToggleLost(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": itemId,
				"system.lost": !item.system.lost,
			},
		]);
	}

	async _onItemCreate(event) {
		event.preventDefault();
		const itemType = $(event.currentTarget).data("item-type");

		const itemData = {
			name: `New ${itemType}`,
			type: itemType,
			system: {},
		};

		switch (itemType) {
			case "Basic":
				if ($(event.currentTarget).data("item-treasure")) {
					itemData.system.treasure = true;
				}
				break;
			case "Spell":
				itemData.system.tier =
					$(event.currentTarget).data("spell-tier") || 1;
				break;
			case "Talent":
				itemData.system.talentClass =
					$(event.currentTarget).data("talent-class") || "level";
				break;
		}

		const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
		newItem.sheet.render(true);
	}

	_sortAllItems(context) {
		// Pre-sort all items so that when they are filtered into their relevant
		// categories they are already sorted alphabetically (case-sensitive)
		return (context.items ?? []).sort((a, b) => a.name.localeCompare(b.name));
	}
}
