export default class ActorSheetSD extends ActorSheet {

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".open-item").click(
			event => this._onOpenItem(event)
		);

		html.find(".item-rollable").click(
			event => this._onRollItem(event)
		);

		html.find(".cast-spell").click(
			event => this._onCastSpell(event)
		);

		// Create context menu for items on both sheets
		this._contextMenu(html);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
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

		// Ability Scores
		for (const [key, ability] of Object.entries(context.system.abilities)) {
			const labelKey = `SHADOWDARK.ability_${key}`;
			ability.label = `${game.i18n.localize(labelKey)}`;

			// Players need to have their ability modifier calculated
			if (this.actor.type === "Player") {
				ability.modifier = this.actor.abilityModifier(key);
			}
		}

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

	_contextMenu(html) {
		ContextMenu.create(this, html, ".item", this._getItemContextOptions());
	}

	_getItemContextOptions() {
		const canEdit = function(element) {
			let result = false;
			const itemId = element.data("item-id");

			if (game.user.isGM) {
				result = true;
			}
			else {
				result = this.actor.items.find(item => item._id === itemId)
					? true
					: false;
			}

			return result;
		};

		return [
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

	async _onRollItem(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		const parts = [];
		let abilityBonus;
		let talentBonus;
		let itemBonus;

		if ( item.type === "Weapon" ) {
			const abilityId = item.system.type === "melee" ? "str" : "dex";
			parts.push("@abilityBonus");
			abilityBonus = this.actor.abilityModifier(abilityId);

			if ( item.system.attackBonus !== 0 ) {
				parts.push("@itemBonus");
				itemBonus = item.system.attackBonus;
			}
		}

		// @todo: push to parts & for set talentBonus as sum of talents affecting attack rolls

		return item.rollItem(parts, abilityBonus, itemBonus, talentBonus, {event: event});
	}

	async _onCastSpell(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);
		const tier = item.system.tier;

		const parts = [];
		let abilityBonus;
		let talentBonus;

		// @todo: How do we solve this with custom classes? Spellcasting modifier in system?
		const abilityId = this.actor.system.class === "Wizard" ? "int" : "wis";
		parts.push("@abilityBonus");
		abilityBonus = this.actor.abilityModifier(abilityId);

		// @todo: push to parts & for set talentBonus as sum of talents affecting spell rolls

		return item.rollSpell(parts, abilityBonus, talentBonus, tier, {event: event});
	}

}
