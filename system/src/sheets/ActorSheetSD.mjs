import * as select from "../apps/CompendiumItemSelectors/_module.mjs";

export default class ActorSheetSD extends foundry.applications.api.HandlebarsApplicationMixin(
	foundry.applications.sheets.ActorSheetV2
) {

	_hiddenSectionsLut = {
		activeEffects: true,
	};

	static DEFAULT_OPTIONS = {
		classes: ["shadowdark", "sheet"],
		window: {
			resizable: true,
		},
		form: {
			submitOnChange: true,
			closeOnSubmit: false,
		},
		actions: {
			"hide-section": ActorSheetSD.prototype._onHideSection,
			"roll-ability-check": ActorSheetSD.prototype._onRollAbilityCheck,
			"roll-hp": ActorSheetSD.prototype._onRollHP,
			"item-selector": ActorSheetSD.prototype._onItemSelection,
			"show-details": ActorSheetSD.prototype._onShowDetails,
			"item-attack": ActorSheetSD.prototype._onRollAttack,
			"toggle-lost": ActorSheetSD.prototype._onToggleLost,
			"item-create": ActorSheetSD.prototype._onItemCreate,
			// Effects-tab actions — five bare verbs all routed to the same
			// helper, which dispatches on `target.dataset.action`.
			"create": ActorSheetSD.prototype._onEffectControl,
			"edit": ActorSheetSD.prototype._onEffectControl,
			"delete": ActorSheetSD.prototype._onEffectControl,
			"toggle": ActorSheetSD.prototype._onEffectControl,
			"toggle-situational": ActorSheetSD.prototype._onEffectControl,
		},
	};

	/**
	 * Stub for v1 subclass `super.activateListeners(html)` calls during the
	 * v1→v2 migration. Removed once all subclasses define their own v2
	 * actions and no longer call super.
	 */
	activateListeners(html) {}

	// Public method retained for canvas-drop emulation. Resolves the uuid
	// then forwards to the v2 _onDropItem entry point.
	async emulateItemDrop(data) {
		const item = await fromUuid(data.uuid);
		return this._onDropItem({}, item);
	}

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		Object.assign(context, {
			actor: this.actor,
			config: CONFIG.SHADOWDARK,
			cssClass: this.actor.isOwner ? "editable" : "locked",
			editable: this.isEditable,
			hiddenSections: this._hiddenSectionsLut,
			items: this.actor.items,
			owner: this.actor.isOwner,
			predefinedEffects: await shadowdark.effects.getPredefinedEffectsList(),
			system: this.actor.system,
		});

		context.activeEffects = this.actor.allApplicableEffects().filter(e => !e.isSuppressed);

		context.notesHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
			this.actor.system.notes,
			{
				secrets: this.actor.isOwner,
				async: true,
				relativeTo: this.actor,
			}
		);

		return context;
	}

	/** @override */
	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);
	}

	/** @override */
	async _onRender(context, options) {
		await super._onRender(context, options);

		// Item context menu (right-click on .item rows).
		this._itemContextMenu(this.element);

		// Bridge: while subclasses are still v1, dispatch to their
		// activateListeners. Subclasses migrating to v2 stop defining it,
		// at which point this falls through to the no-op stub above.
		this.activateListeners($(this.element));
	}

	/** @override */
	_onChangeForm(formConfig, event) {
		// Intercept the unbound predefined-effects input. Its change creates
		// an active effect and shouldn't reach the standard form submit.
		// (The defensive strip in _processFormData covers any path that
		// bypasses this hook.)
		if (event.target?.name === "predefinedEffects") {
			const key = event.target.value;
			shadowdark.effects.createPredefinedEffect(this.actor, key);
			return;
		}
		super._onChangeForm(formConfig, event);
	}

	/** @override */
	_processFormData(event, form, formData) {
		// Mirror v1 ActorSheet._getSubmitData: strip fields whose paths are
		// currently overridden by an active effect, so the post-override
		// displayed value isn't persisted as new base data.
		const overrides = foundry.utils.flattenObject(this.actor.overrides ?? {});
		for (const key of Object.keys(overrides)) {
			delete formData.object[key];
		}
		// Defensive: predefinedEffects is unbound; never let it reach actor.update.
		delete formData.object.predefinedEffects;
		return super._processFormData(event, form, formData);
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

	_effectDropNotAllowed(item) {
		if (item?.type !== "Effect") return false;
		if (item?.system?.duration?.type !== "rounds") return false;
		if (game.combat) return false;

		ui.notifications.warn(
			game.i18n.localize("SHADOWDARK.item.effect.warning.add_round_item_outside_combat")
		);
		return true;
	}

	/** @override */
	async _onDropItem(event, item) {
		if (this._effectDropNotAllowed(item)) return false;
		return super._onDropItem(event, item);
	}

	async _onHideSection(event, target) {
		event.preventDefault();

		const sectionId = target.dataset.sectionToHide;

		const hideableSection = $(this.element).find(
			`[data-hideable-section-id="${sectionId}"]`
		);

		const iconElement = target.querySelector("i");

		if (this._hiddenSectionsLut[sectionId]) {
			this._hiddenSectionsLut[sectionId] = !this._hiddenSectionsLut[sectionId];
		}
		else {
			this._hiddenSectionsLut[sectionId] = true;
		}

		if (this._hiddenSectionsLut[sectionId]) {
			hideableSection.slideUp(200);
			target.dataset.tooltip = game.i18n.localize(
				"SHADOWDARK.sheet.general.section.toggle_show"
			);
		}
		else {
			hideableSection.slideDown(200);
			target.dataset.tooltip = game.i18n.localize(
				"SHADOWDARK.sheet.general.section.toggle_hide"
			);
		}

		iconElement.classList.toggle("fa-caret-down");
		iconElement.classList.toggle("fa-caret-right");
	}

	_onItemDelete(itemId) {
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		foundry.applications.handlebars.renderTemplate(
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

	_onItemSelection(event, target) {
		event.preventDefault();

		const itemType = target.dataset.options;

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

	_onShowDetails(event, target) {
		shadowdark.utils.toggleItemDetails(target);
	}

	async _onRollHP(event, target) {
		event.preventDefault();
		this.actor.system.rollHP();
	}

	async _onRollAbilityCheck(event, target) {
		event.preventDefault();
		const ability = target.dataset.ability;
		if (!ability) return;
		const skipPrompt = event.shiftKey ? true : false;
		this.actor.system.rollAbilityCheck(ability, {skipPrompt});
	}

	async _onRollAttack(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const data = {
			skipPrompt: event.shiftKey,
		};
		if (target.dataset.attackType) {
			data.attack = {type: target.dataset.attackType};
		}
		this.actor.system.rollAttack(itemId, data);
	}

	async _onToggleLost(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);
		const wandSpellUuid = target.dataset.wandSpellUuid;

		if (wandSpellUuid) {
			item.system.toggleSpellLost(wandSpellUuid);
		}
		else {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.lost": !item.system.lost,
				},
			]);
		}
	}

	async _onItemCreate(event, target) {
		event.preventDefault();
		const itemType = target.dataset.itemType;

		const itemData = {
			name: `New ${itemType}`,
			type: itemType,
			system: {},
		};

		switch (itemType) {
			case "Basic":
				if (target.dataset.itemTreasure) {
					itemData.system.treasure = true;
				}
				break;
			case "Spell":
				itemData.system.tier = target.dataset.spellTier || 1;
				break;
			case "Talent":
				itemData.system.talentClass = target.dataset.talentClass || "level";
				break;
		}

		const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
		newItem.sheet.render(true);
	}

	_onEffectControl(event, target) {
		shadowdark.effects.onManageActiveEffect(event, target, this.actor);
	}

	_sortAllItems(context) {
		// Pre-sort all items so that when they are filtered into their relevant
		// categories they are already sorted alphabetically (case-sensitive)
		return Array.from(context.items ?? []).sort(
			(a, b) => a.name.localeCompare(b.name)
		);
	}
}
