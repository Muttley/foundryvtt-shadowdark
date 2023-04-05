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

		html.find("[data-action='item-attack']").click(
			event => this._onRollItem(event)
		);

		html.find("[data-action='cast-spell']").click(
			event => this._onCastSpell(event)
		);

		html.find("[data-action='cast-scroll']").click(
			event => this._onCastSpellScroll(event)
		);

		html.find(".item-create").click(
			event => this._onItemCreate(event)
		);

		// Create context menu for items on both sheets
		this._itemContextMenu(html);

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

	async _onRollItem(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		const data = {
			item: item,
			rollType: (item.isWeapon()) ? item.system.baseWeapon.slugify() : item.name.slugify(),
			actor: this.actor,
		};

		const bonuses = this.actor.system.bonuses;

		// Summarize the bonuses for the attack roll
		const parts = ["@abilityBonus", "@talentBonus"];
		data.damageParts = [];

		// Magic Item bonuses
		if (item.system.attackBonus) {
			parts.push("@itemBonus");
			data.itemBonus = item.system.attackBonus;
		}
		if (item.system.damage?.bonus) {
			data.damageParts.push("@itemDamageBonus");
			data.itemDamageBonus = item.system.damage.bonus;
		}

		// Talents & Ability modifiers
		if (item.system.type === "melee") {
			if (item.isFinesseWeapon()) {
				data.abilityBonus = Math.max(
					this.actor.abilityModifier("str"),
					this.actor.abilityModifier("dex")
				);
			}
			else {
				data.abilityBonus = this.actor.abilityModifier("str");
			}

			data.talentBonus = bonuses.meleeAttackBonus;
			data.meleeDamageBonus = bonuses.meleeDamageBonus;
			data.damageParts.push("@meleeDamageBonus");
		}
		else {
			data.abilityBonus = this.actor.abilityModifier("dex");

			data.talentBonus = bonuses.rangedAttackBonus;
			data.rangedDamageBonus = bonuses.rangedDamageBonus;
			data.damageParts.push("@rangedDamageBonus");
		}

		// Check Weapon Mastery & add if applicable
		if (
			item.system.weaponMastery
			|| this.actor.system.bonuses.weaponMastery.includes(item.system.baseWeapon)
			|| this.actor.system.bonuses.weaponMastery.includes(item.name.slugify())
		) {
			data.weaponMasteryBonus = 1 + Math.floor(this.actor.system.level.value / 2);
			data.talentBonus += data.weaponMasteryBonus;
			data.damageParts.push("@weaponMasteryBonus");
		}

		return item.rollItem(parts, data);
	}

	async _onCastSpellScroll(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		const spellUuid = item.system.description.substring(
			item.system.description.indexOf("[") + 1,
			item.system.description.lastIndexOf("]")
		);

		const spell = await fromUuid(spellUuid);

		// Do nothing if not a spellcaster
		const abilityId = this.actor.getSpellcastingAbility();
		if (!abilityId) return;

		const data = {
			rollType: spell.name.slugify(),
			item: spell,
			scroll: item,
			actor: this.actor,
			abilityBonus: this.actor.abilityModifier(abilityId),
			talentBonus: this.actor.system.bonuses.spellcastingCheckBonus,
		};

		const parts = ["@abilityBonus", "@talentBonus"];

		return spell.rollSpell(parts, data);
	}

	async _onCastSpell(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		const abilityId = this.actor.getSpellcastingAbility();

		const data = {
			rollType: item.name.slugify(),
			item: item,
			scroll: false,
			actor: this.actor,
			abilityBonus: this.actor.abilityModifier(abilityId),
			talentBonus: this.actor.system.bonuses.spellcastingCheckBonus,
		};

		const parts = ["@abilityBonus", "@talentBonus"];

		// @todo: push to parts & for set talentBonus as sum of talents affecting spell rolls

		return item.rollSpell(parts, data);
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
