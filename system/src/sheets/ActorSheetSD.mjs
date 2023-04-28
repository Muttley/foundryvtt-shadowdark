export default class ActorSheetSD extends ActorSheet {

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".ability-name.rollable").click(
			event => this._onRollAbilityCheck(event)
		);

		html.find(".hp.rollable").click(
			event => this._onRollHP(event)
		);

		html.find(".open-item").click(
			event => this._onOpenItem(event)
		);

		html.find(".show-details").click(
			event => this._onShowDetails(event)
		);

		html.find("[data-action='item-attack']").click(
			event => this._onRollAttack(event)
		);

		html.find("[data-action='cast-spell']").click(
			event => this._onCastSpell(event)
		);

		html.find(".item-create").click(
			event => this._onItemCreate(event)
		);

		// Create context menu for items on both sheets
		this._itemContextMenu(html);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	async attachDetailsButtonEvents(item, detailsDiv) {
		if (["Scroll", "Spell", "Wand"].includes(item.type)) {
			const castSpellButton = $(detailsDiv).find("button[data-action=cast-spell]");

			castSpellButton.on("click", ev => {
				ev.preventDefault();
				const itemId = $(ev.currentTarget).data("item-id");
				const actorId = $(ev.currentTarget).data("actor-id");
				const actor = game.actors.get(actorId);

				actor.castSpell(itemId);
			});
		}

		if (item.type === "Scroll") {
			const learnSpellButton = $(detailsDiv).find("button[data-action=learn-spell]");

			learnSpellButton.on("click", ev => {
				ev.preventDefault();
				const itemId = $(ev.currentTarget).data("item-id");
				const actorId = $(ev.currentTarget).data("actor-id");
				const actor = game.actors.get(actorId);

				actor.learnSpell(itemId);
			});
		}

		if (item.type === "Potion") {
			const usePotionButton = $(detailsDiv).find("button[data-action=use-potion]");

			usePotionButton.on("click", ev => {
				ev.preventDefault();
				const itemId = $(ev.currentTarget).data("item-id");
				const actorId = $(ev.currentTarget).data("actor-id");
				const actor = game.actors.get(actorId);

				actor.usePotion(itemId);
			});
		}

		if (item.type === "Weapon") {
			const useWeaponButton = $(detailsDiv).find("button[data-action=roll-attack]");

			useWeaponButton.on("click", ev => {
				ev.preventDefault();
				const itemId = $(ev.currentTarget).data("item-id");
				const actorId = $(ev.currentTarget).data("actor-id");
				const actor = game.actors.get(actorId);

				actor.rollAttack(itemId);
			});
		}
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
			isNpc: this.actor.type === "NPC",
			isPlayer: this.actor.type === "Player",
			items: actorData.items,
			owner: this.actor.isOwner,
			rollData: this.actor.getRollData.bind(this.actor),
			source: source.system,
			system: actorData.system,
		};

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
		const canEdit = function(element) {
			let result = false;
			const itemId = element.data("item-id");

			if (game.user.isGM) {
				result = true;
			}
			else {
				result = game.user.character.items.find(item => item._id === itemId)
					? true
					: false;
			}

			return result;
		};

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_edit.title"),
				icon: '<i class="fas fa-edit"></i>',
				condition: element => canEdit(element),
				callback: element => {
					const itemId = element.data("item-id");
					const item = this.actor.items.get(itemId);
					return item.sheet.render(true);
				},
			},
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"),
				icon: '<i class="fas fa-trash"></i>',
				condition: element => canEdit(element),
				callback: element => {
					const itemId = element.data("item-id");
					this._onItemDelete(itemId);
				},
			},
		];
	}

	_itemContextMenu(html) {
		ContextMenu.create(this, html, ".item", this._getItemContextOptions());
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
							if (itemData.system.light.active) {
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

	async _onOpenItem(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		return item.sheet.render(true);
	}

	async _onRollHP(event) {
		event.preventDefault();

		this.actor.rollHP();
	}

	async _onRollAbilityCheck(event) {
		event.preventDefault();

		let ability = $(event.currentTarget).data("ability");
		this.actor.rollAbility(ability, {event: event});
	}

	async _onRollAttack(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		this.actor.rollAttack(itemId);
	}

	async _onShowDetails(event) {
		event.preventDefault();

		const parentTableRow = $(event.currentTarget).parent().parent();
		const numColumns = parentTableRow.find("td").length;

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		if (parentTableRow.hasClass("expanded")) {
			const detailsRow = parentTableRow.next(".item-details");
			const detailsDiv = detailsRow.find("td > .item-details__slidedown");
			detailsDiv.slideUp(200, () => detailsRow.remove());
		}
		else {
			const content = await item.getDetailsContent();

			// don't do anything if there are no details to show
			if (content.trim() === "") return;

			const detailsRow = document.createElement("tr");
			detailsRow.classList.add("item-details");

			const detailsData = document.createElement("td");
			detailsData.setAttribute("colspan", numColumns);

			const detailsDiv = document.createElement("div");
			detailsDiv.setAttribute("style", "display: none");

			detailsDiv.insertAdjacentHTML("afterbegin", content);
			detailsDiv.classList.add("item-details__slidedown");

			this.attachDetailsButtonEvents(item, detailsDiv);

			detailsData.appendChild(detailsDiv);
			detailsRow.appendChild(detailsData);

			parentTableRow.after(detailsRow);

			$(detailsDiv).slideDown(200);
		}

		parentTableRow.toggleClass("expanded");
	}

	async _onCastSpell(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");

		this.actor.castSpell(itemId);
	}

	// Emulate a itom drop as it was on the sheet, when dropped on the canvas
	async emulateItemDrop(data) {
		return this._onDropItem({}, data);
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
		const allItems = [];
		(context.items ?? []).forEach(item => allItems.push(item));

		allItems.sort((a, b) => {
			if (a.name < b.name) {
				return -1;
			}
			if (a.name > b.name) {
				return 1;
			}
			return 0;
		});

		return allItems;
	}
}
