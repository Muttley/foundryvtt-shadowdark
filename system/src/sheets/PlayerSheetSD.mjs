import ActorSheetSD from "./ActorSheetSD.mjs";

export default class PlayerSheetSD extends ActorSheetSD {

	constructor(object, options) {
		super(object, options);

		this.editingHp = false;
		this.editingStats = false;
		this.gemBag = new shadowdark.apps.GemBagSD(this.actor);
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "player"],
			scrollY: ["section.SD-content-body"],
			width: 600,
			height: 700,
			resizable: true,
			tabs: [
				{
					navSelector: ".SD-nav",
					contentSelector: ".SD-content-body",
					initial: "tab-abilities",
				},
			],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/player.hbs";
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".item-image").click(
			event => this._onItemChatClick(event)
		);

		html.find("[data-action='ability-decrement']").click(
			event => this._onAbilityUsesDecrement(event)
		);

		html.find("[data-action='ability-increment']").click(
			event => this._onAbilityUsesIncrement(event)
		);

		html.find("[data-action='cast-spell']").click(
			event => this._onCastSpell(event)
		);

		html.find("[data-action='focus-spell']").click(
			event => {
				this._onCastSpell(event, { isFocusRoll: true });
			}
		);

		html.find("[data-action='create-boon']").click(
			event => this._onCreateBoon(event)
		);

		html.find("[data-action='create-item']").click(
			event => this._onCreateItem(event)
		);

		html.find("[data-action='create-treasure']").click(
			event => this._onCreateTreasure(event)
		);

		html.find("[data-action='item-decrement']").click(
			event => this._onItemQuantityDecrement(event)
		);

		html.find("[data-action='item-increment']").click(
			event => this._onItemQuantityIncrement(event)
		);

		html.find("[data-action='learn-spell']").click(
			event => this._onLearnSpell(event)
		);

		html.find("[data-action='level-up']").click(
			event => this._onlevelUp(event)
		);

		html.find("[data-action='open-spellbook']").click(
			event => this._onOpenSpellBook(event)
		);

		html.find("[data-action='open-gem-bag']").click(
			event => this._onOpenGemBag(event)
		);

		html.find("[data-action='sell-treasure']").click(
			event => this._onSellTreasure(event)
		);

		html.find("[data-action='toggle-edit-hp']").click(
			event => this._onToggleEditHp(event)
		);

		html.find("[data-action='toggle-edit-stats']").click(
			event => this._onToggleEditStats(event)
		);

		html.find("[data-action='toggle-equipped']").click(
			event => this._onToggleEquipped(event)
		);

		html.find("[data-action='toggle-light']").click(
			event => this._onToggleLightSource(event)
		);

		html.find("[data-action='toggle-stashed']").click(
			event => this._onToggleStashed(event)
		);

		html.find("[data-action='use-ability']").click(
			event => this._onUseAbility(event)
		);

		html.find("[data-action='use-potion']").click(
			event => this._onUsePotion(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	async getBackgroundSelectors() {
		const system = this.actor.system;

		const data = {
			ancestry: {
				name: "ancestry",
				label: game.i18n.localize("TYPES.Item.Ancestry"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.ancestry.tooltip"),
				item: await fromUuid(system.ancestry) ?? null,
			},
			background: {
				name: "background",
				label: game.i18n.localize("TYPES.Item.Background"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.background.tooltip"),
				item: await fromUuid(system.background) ?? null,
			},
			class: {
				name: "class",
				label: game.i18n.localize("TYPES.Item.Class"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.class.tooltip"),
				item: await fromUuid(system.class) ?? null,
			},
			deity: {
				name: "deity",
				label: game.i18n.localize("TYPES.Item.Deity"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.deity.tooltip"),
				item: await fromUuid(system.deity) ?? null,
			},
			patron: {
				name: "patron",
				label: game.i18n.localize("TYPES.Item.Patron"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.patron.tooltip"),
				item: await fromUuid(system.patron) ?? null,
			},
		};

		return data;
	}

	/** @override */
	async _render(options, _options) {
		await super._render(options, _options);

		if (this.actor.system.showLevelUp) {
			this.actor.update({"system.showLevelUp": false});
			new shadowdark.apps.LevelUpSD(this.actor.id).render(true);
		}
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);
		context.gearSlots = this.actor.numGearSlots();

		context.xpNextLevel = context.system.level.value * 10;
		context.levelUp = (context.system.level.xp >= context.xpNextLevel);

		context.system.attributes.ac.value = await this.actor.getArmorClass();

		context.isSpellCaster = await this.actor.isSpellCaster();
		context.canUseMagicItems = await this.actor.canUseMagicItems();
		context.showSpellsTab = context.isSpellCaster || context.canUseMagicItems;

		context.maxHp = this.actor.system.attributes.hp.base
			+ this.actor.system.attributes.hp.bonus;

		context.abilities = this.actor.getCalculatedAbilities();

		context.knownLanguages = await this.actor.languageItems();

		context.backgroundSelectors = await this.getBackgroundSelectors();

		// Get the inventory ready
		await this._prepareItems(context);

		context.abilitiesOverrides = Object.keys(
			foundry.utils.flattenObject(
				this.actor.overrides?.system?.abilities || {}
			)
		);

		context.attributeOverrides = Object.keys(
			foundry.utils.flattenObject(
				this.actor.overrides?.system?.attributes || {}
			)
		);

		context.characterClass = await this.actor.getClass();
		context.classHasPatron = context.characterClass?.system?.patron?.required ?? false;
		context.classTitle = await this.actor.getTitle();

		context.characterPatron = await this.actor.getPatron();

		context.usePulpMode = game.settings.get("shadowdark", "usePulpMode");

		context.editingHp = this.editingHp;
		context.editingStats = this.editingStats;

		// Update the Gem Bag, but don't render it unless it's already showing
		this.gemBag.render(false);

		return context;
	}

	async _onDropBackgroundItem(item) {
		switch (item.type) {
			case "Ancestry":
				return this.actor.addAncestry(item);
			case "Background":
				return this.actor.addBackground(item);
			case "Class":
				return this.actor.addClass(item);
			case "Deity":
				return this.actor.addDeity(item);
			case "Language":
				return this.actor.addLanguage(item);
			case "Patron":
				return this.actor.addPatron(item);
		}
	}

	/** @override */
	async _onDropItem(event, data) {
		switch ( data.type ) {
			case "Item":
				return this._onDropItemSD(event, data);
		}
		super._onDropItem(event, data);
	}

	/**
	 * Checks if the dropped item should be handled in a special way
	 * @param {Event} event - The triggering event
	 * @param {object} data - Contains the type of dropped item, and the uuid
	 * @returns {Promise<any>}
	 */
	async _onDropItemSD(event, data) {
		const item = await fromUuid(data.uuid);

		if (item.type === "Spell") return this._createItemFromSpellDialog(item);

		if (await this._effectDropNotAllowed(data)) return false;

		// Background items are handled differently currently
		const backgroundItems = [
			"Ancestry",
			"Background",
			"Class",
			"Deity",
			"Language",
			"Patron",
		];

		if (backgroundItems.includes(item.type)) {
			return this._onDropBackgroundItem(item);
		}

		// Items with Effects may need some user input
		if (item.effects.toObject().length > 0) {
			let itemObj = await shadowdark.effects.createItemWithEffect(item);

			// add item to actor
			const [newItem] = await super._onDropItem(event, data);

			if (itemObj.effects.some(e => e.changes.some(c => c.key === "system.light.template"))) {
				this._toggleLightSource(newItem);
			}

			return;
		}

		// Activate light spell if dropped onto the sheet
		if (CONFIG.SHADOWDARK.LIGHT_SOURCE_ITEM_IDS.includes(item.id)) {
			return this._dropActivateLightSource(item);
		}

		// is a light base item being dropped from a different actor?
		if (item.isLight() && item.actor && (item.actor._id !== this.actor._id)) {
			const isActiveLight = item.isActiveLight();

			if (isActiveLight) {
				// We're transferring an active light to this sheet, so turn off
				// any existing light sources
				const newActorLightSources = await this.actor.getActiveLightSources();
				for (const activeLight of newActorLightSources) {
					await this._toggleLightSource(activeLight);
				}
			}

			// Now create a copy of the item on the target
			const [newItem] = await super._onDropItem(event, data);

			if (isActiveLight) {
				// Turn the original light off before it gets deleted, and
				// make sure the new one is turned on
				item.actor.turnLightOff();
				newItem.actor.turnLightOn(newItem._id);
			}
			// Now we can delete the original item
			await item.actor.deleteEmbeddedDocuments(
				"Item",
				[item._id]
			);
		}
		else {
			super._onDropItem(event, data);
		}
	}

	/**
	 * Actives a lightsource if dropped onto the Player sheet. Used for
	 * activating Light spell et.c.
	 *
	 * @param {Item} item - Item that is a lightsource
	 */
	async _dropActivateLightSource(item) {
		const actorItem = await super._onDropItemCreate(item);
		this._toggleLightSource(actorItem[0]);
	}

	/**
	 * Creates a scroll from a spell item
	 */
	async _createItemFromSpellDialog(item) {
		const content = await renderTemplate(
			"systems/shadowdark/templates/dialog/create-item-from-spell.hbs",
			{
				spellName: item.name,
				isGM: game.user.isGM,
			}
		);

		const buttons = {
			potion: {
				icon: '<i class="fas fa-prescription-bottle"></i>',
				label: game.i18n.localize("SHADOWDARK.item.potion.label"),
				callback: () => this._createItemFromSpell(item, "Potion"),
			},
			scroll: {
				icon: '<i class="fas fa-scroll"></i>',
				label: game.i18n.localize("SHADOWDARK.item.scroll.label"),
				callback: () => this._createItemFromSpell(item, "Scroll"),
			},
			spell: {
				icon: '<i class="fa-solid fa-hand-sparkles"></i>',
				label: game.i18n.localize("SHADOWDARK.item.spell.label"),
				callback: () => this._createItemFromSpell(item, "Spell"),
			},
			wand: {
				icon: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
				label: game.i18n.localize("SHADOWDARK.item.wand.label"),
				callback: () => this._createItemFromSpell(item, "Wand"),
			},
		};

		return Dialog.wait({
			title: game.i18n.format("SHADOWDARK.dialog.item.create_from_spell", { spellName: item.name }),
			content,
			buttons,
			close: () => false,
			default: "scroll",
		});
	}

	async _createItemFromSpell(spell, type) {
		const itemData = await shadowdark.utils.createItemFromSpell(type, spell);

		super._onDropItemCreate(itemData);
	}

	async _onAbilityUsesDecrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.uses.available > 0) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.uses.available": item.system.uses.available - 1,
				},
			]);
		}
	}

	async _onAbilityUsesIncrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.uses.available < item.system.uses.max) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.uses.available": item.system.uses.available + 1,
				},
			]);
		}
	}

	async _onCreateBoon(event) {
		new Dialog( {
			title: game.i18n.localize("SHADOWDARK.dialog.create_custom_item"),
			content: await renderTemplate(
				"systems/shadowdark/templates/dialog/create-new-boon.hbs",
				{
					boonTypes: CONFIG.SHADOWDARK.BOON_TYPES,
					default: "blessing",
					level: this.actor?.system?.level?.value ?? 0,
				}
			),
			buttons: {
				create: {
					label: game.i18n.localize("SHADOWDARK.dialog.create"),
					callback: async html => {
						// create boon from dialog data
						const itemData = {
							name: html.find("#item-name").val(),
							type: "Boon",
							system: {
								boonType: html.find("#item-boonType").val(),
								level: Number(html.find("#item-boonLevel").val()),
							},
						};
						const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
						newItem.sheet.render(true);
					},
				},
			},
			default: "create",
		}).render(true);
	}

	async _onCreateItem(event) {
		new Dialog( {
			title: game.i18n.localize("SHADOWDARK.dialog.create_custom_item"),
			content: await renderTemplate("systems/shadowdark/templates/dialog/create-new-item.hbs"),
			buttons: {
				create: {
					label: game.i18n.localize("SHADOWDARK.dialog.create"),
					callback: async html => {
						// create item from dialog data
						const itemData = {
							name: html.find("#item-name").val(),
							type: html.find("#item-type").val(),
							system: {},
						};
						const [newItem] = await this.actor.createEmbeddedDocuments("Item", [itemData]);
						newItem.sheet.render(true);
					},
				},
			},
			default: "create",
		}).render(true);
	}

	async _onCreateTreasure(event) {
		new Dialog( {
			title: game.i18n.localize("SHADOWDARK.dialog.create_treasure"),
			content: await renderTemplate("systems/shadowdark/templates/dialog/create-new-treasure.hbs"),
			buttons: {
				create: {
					label: game.i18n.localize("SHADOWDARK.dialog.create"),
					callback: async html => {
						// create treasure from dialog data
						const itemData = {
							name: html.find("#item-name").val(),
							type: "Basic",
							system: {
								treasure: true,
								cost: {
									gp: parseInt(html.find("#item-gp").val()),
									sp: parseInt(html.find("#item-sp").val()),
									cp: parseInt(html.find("#item-cp").val()),
								},
							},
						};
						await this.actor.createEmbeddedDocuments("Item", [itemData]);
					},
				},
			},
			default: "create",
		}).render(true);
	}

	async _onItemChatClick(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget.parentElement).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		item.displayCard();
	}

	async _onItemQuantityDecrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity > 0) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.quantity": item.system.quantity - 1,
				},
			]);
		}
	}

	async _onItemQuantityIncrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity < item.system.slots.per_slot) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.quantity": item.system.quantity + 1,
				},
			]);
		}
	}

	async _onToggleEditHp(event) {
		this.editingHp = !this.editingHp;
		this.render();
	}

	async _onToggleEditStats(event) {
		this.editingStats = !this.editingStats;
		this.render();
	}

	async _onCastSpell(event, options) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		if (event.shiftKey) {
			this.actor.castSpell(itemId, {...options, fastForward: true, adv: 0});
		}
		else if (event.altKey) {
			this.actor.castSpell(itemId, {...options, fastForward: true, adv: 1});
		}
		else if (event.ctrlKey) {
			this.actor.castSpell(itemId, {...options, fastForward: true, adv: -1});
		}
		else {
			this.actor.castSpell(itemId, options);
		}
	}

	async _onLearnSpell(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");

		this.actor.learnSpell(itemId);
	}

	async _onOpenSpellBook(event) {
		event.preventDefault();
		this.actor.openSpellBook();
	}

	async _onlevelUp(event) {
		event.preventDefault();

		let actorClass = await this.actor.getClass();
		if (this.actor.system.level.value === 0 && actorClass.name.includes("Level 0")) {
			new shadowdark.apps.CharacterGeneratorSD(this.actor._id).render(true);
			this.close();
		}
		else {
			new shadowdark.apps.LevelUpSD(this.actor._id).render(true);
		}
	}

	async _onOpenGemBag(event) {
		event.preventDefault();

		this.gemBag.render(true);
	}

	_onSellTreasure(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const itemData = this.object.getEmbeddedDocument("Item", itemId);

		renderTemplate(
			"systems/shadowdark/templates/dialog/sell-item.hbs",
			{name: itemData.name}
		).then(html => {
			new Dialog({
				title: game.i18n.localize("SHADOWDARK.dialog.item.confirm_sale"),
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: game.i18n.localize("SHADOWDARK.dialog.general.yes"),
						callback: async () => {
							this.actor.sellItemById(itemId);
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: game.i18n.localize("SHADOWDARK.dialog.general.cancel"),
					},
				},
				default: "Yes",
			}).render(true);
		});
	}

	async _onToggleEquipped(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		await this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": itemId,
				"system.equipped": !item.system.equipped,
				"system.stashed": false,
			},
		]);

	}

	async _onToggleStashed(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		await this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": itemId,
				"system.stashed": !item.system.stashed,
				"system.equipped": false,
			},
		]);
	}

	async _onUseAbility(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		if (event.shiftKey) {
			this.actor.useAbility(itemId, {fastForward: true, adv: 0});
		}
		else if (event.altKey) {
			this.actor.useAbility(itemId, {fastForward: true, adv: 1});
		}
		else if (event.ctrlKey) {
			this.actor.useAbility(itemId, {fastForward: true, adv: -1});
		}
		else {
			this.actor.useAbility(itemId);
		}
	}

	async _onUsePotion(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");

		this.actor.usePotion(itemId);
	}

	async _sendToggledLightSourceToChat(active, item, options = {}) {
		const cardData = {
			active: active,
			name: item.name,
			timeRemaining: Math.floor(item.system.light.remainingSecs / 60),
			longevity: item.system.light.longevityMins,
			actor: this,
			item: item,
			picked_up: options.picked_up ?? false,
			showRemainingMins: game.settings.get("shadowdark", "playerShowLightRemaining") > 1,
		};

		let template = options.template ?? "systems/shadowdark/templates/chat/lightsource-toggle.hbs";

		const content = await renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			speaker: options.speaker ?? ChatMessage.getSpeaker(),
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

	async _onToggleLightSource(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		this._toggleLightSource(item);
	}

	async _toggleLightSource(item, options = {}) {
		const active = !item.system.light.active;

		if (active) {
			// Find any currently active lights and turn them off
			const activeLightSources = await this.actor.getActiveLightSources();
			for (const lightSource of activeLightSources) {
				this.actor.updateEmbeddedDocuments(
					"Item", [{
						"_id": lightSource.id,
						"system.light.active": false,
					}]
				);
			}
		}

		const dataUpdate = {
			"_id": item.id,
			"system.light.active": active,
		};

		if (!item.system.light.hasBeenUsed) {
			dataUpdate["system.light.hasBeenUsed"] = true;
		}

		const [updatedLight] = await this.actor.updateEmbeddedDocuments(
			"Item", [dataUpdate]
		);

		await this.actor.toggleLight(active, item.id);

		// We only update the Light Source Tracker if this Actor is currently
		// selected by a User as their character
		//
		if (this.actor.isClaimedByUser()) {
			this._sendToggledLightSourceToChat(active, item, options);
			game.shadowdark.lightSourceTracker.toggleLightSource(
				this.actor,
				updatedLight
			);
		}
	}

	async _prepareItems(context) {
		const gems = [];

		const boons = {};
		for (const [key, label] of Object.entries(CONFIG.SHADOWDARK.BOON_TYPES)) {
			boons[key] = {
				label,
				items: [],
			};
		}

		const inventory = {
			equipped: [],
			stashed: [],
			treasure: [],
			carried: [],
		};

		const spellitems = {
			wands: [],
			scrolls: [],
		};

		const spells = {};


		const talents = {
			ancestry: {
				label: game.i18n.localize("SHADOWDARK.talent.class.ancestry"),
				items: [],
			},
			class: {
				label: game.i18n.localize("SHADOWDARK.talent.class.class"),
				items: [],
			},
			level: {
				label: game.i18n.localize("SHADOWDARK.talent.class.level"),
				items: [],
			},
		};

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

		const attacks = {melee: [], ranged: []};

		const allClassAbilities = {};

		const slots = {
			total: 0,
			gear: 0,
			treasure: 0,
			coins: 0,
			gems: 0,
		};

		const freeCarrySeen = {};

		for (const i of this._sortAllItems(context)) {
			i.uuid = `Actor.${this.actor._id}.Item.${i._id}`;

			if (i.system.isPhysical && i.type !== "Gem") {
				i.showQuantity =
					i.system.isAmmunition || i.system.slots.per_slot > 1
						? true
						: false;

				// We calculate how many slots are used by this item, taking
				// into account the quantity and any free items.
				//
				let freeCarry = i.system.slots.free_carry;

				if (Object.hasOwn(freeCarrySeen, i.name)) {
					freeCarry = Math.max(0, freeCarry - freeCarrySeen[i.name]);
					freeCarrySeen[i.name] += freeCarry;
				}
				else {
					freeCarrySeen[i.name] = freeCarry;
				}

				const perSlot = i.system.slots.per_slot;
				const quantity = i.system.quantity;
				const slotsUsed = i.system.slots.slots_used;

				let totalSlotsUsed = Math.ceil(quantity / perSlot) * slotsUsed;
				totalSlotsUsed -= freeCarry * slotsUsed;

				i.slotsUsed = totalSlotsUsed;

				// calculate slot usage
				if (!i.system.stashed) {
					if (i.system.treasure) {
						slots.treasure += i.slotsUsed;
					}
					else {
						slots.gear += i.slotsUsed;
					}
				}

				// sort into groups
				if (i.system.equipped) {
					inventory.equipped.push(i);
				}
				else if (i.system.stashed) {
					inventory.stashed.push(i);
				}
				else if (i.system.treasure) {
					inventory.treasure.push(i);
				}
				else {
					inventory.carried.push(i);
				}

				if (i.type === "Basic" && i.system.light.isSource) {
					i.isLightSource = true;
					i.lightSourceActive = i.system.light.active;
					i.lightSourceUsed = i.system.light.hasBeenUsed;

					const timeRemaining = Math.ceil(
						i.system.light.remainingSecs / 60
					);

					const lightRemainingSetting = (game.user.isGM)? 2 : game.settings.get("shadowdark", "playerShowLightRemaining");

					if (lightRemainingSetting > 0) {
						// construct time remaing progress bar
						const maxSeconds = i.system.light.longevityMins * 60;
						i.lightSourceProgress = "◆";
						for (let x = 1; x < 4; x++) {
							if (i.system.light.remainingSecs > (maxSeconds * x / 4)) {
								i.lightSourceProgress = i.lightSourceProgress.concat(" ", "◆");
							}
							else {
								i.lightSourceProgress = i.lightSourceProgress.concat(" ", "◇");
							}
						}
					}

					if (lightRemainingSetting < 2) {
						i.lightSourceTimeRemaining = "";
					}
					else if (i.system.light.remainingSecs < 60) {
						i.lightSourceTimeRemaining = game.i18n.localize(
							"SHADOWDARK.inventory.item.light_seconds_remaining"
						);
					}
					else {
						i.lightSourceTimeRemaining = game.i18n.format(
							"SHADOWDARK.inventory.item.light_remaining",
							{ timeRemaining }
						);
					}
				}

				if (i.type === "Weapon" && i.system.equipped) {
					const weaponAttacks = await this.actor.buildWeaponDisplays(i._id);
					attacks.melee.push(...weaponAttacks.melee);
					attacks.ranged.push(...weaponAttacks.ranged);
				}

				if (i.type === "Wand" && !i.system.stashed) {
					spellitems.wands.push(i);
				}

				if (i.type === "Scroll" && !i.system.stashed) {
					spellitems.scrolls.push(i);
				}
			}
			else if (i.type === "Boon") {
				if (boons[i.system.boonType]) {
					boons[i.system.boonType].items.push(i);
				}
			}
			else if (i.type === "Gem") {
				gems.push(i);
			}
			else if (i.type === "Spell") {
				const spellTier = i.system.tier;
				spells[spellTier] ||= [];
				spells[spellTier].push(i);
			}
			else if (i.type === "Talent") {
				const talentClass = i.system.talentClass;
				const section = talentClass !== "patronBoon" ? talentClass : "level";
				talents[section].items.push(i);
			}
			else if (i.type === "Effect") {
				const category = i.system.category;
				effects[category].items.push(i);
			}
			else if (i.type === "Class Ability") {
				const group = i.system.group !== ""
					? i.system.group
					: game.i18n.localize("SHADOWDARK.sheet.abilities.ungrouped.label");

				if (Array.isArray(allClassAbilities[group])) {
					allClassAbilities[group].push(i);
				}
				else {
					allClassAbilities[group] = [i];
				}
			}
		}

		// Work out how many slots all these coins are taking up...
		const coins = this.actor.system.coins;
		const totalCoins = coins.gp + coins.sp + coins.cp;

		const freeCoins = shadowdark.defaults.FREE_COIN_CARRY;
		if (totalCoins > freeCoins) {
			slots.coins = Math.ceil((totalCoins - freeCoins) / freeCoins);
		}

		// Now do the same for gems...
		let totalGems = gems.length;
		if (totalGems > 0) {
			slots.gems = Math.ceil(totalGems / CONFIG.SHADOWDARK.DEFAULTS.GEMS_PER_SLOT);
		}

		// calculate total slots
		slots.total = slots.gear + slots.treasure + slots.coins + slots.gems;

		const classAbilities = [];

		const sortedGroups = Object.keys(allClassAbilities).sort((a, b) => a.localeCompare(b));
		for (const group of sortedGroups) {
			classAbilities.push({
				name: group,
				abilities: allClassAbilities[group],
			});
		}

		// Sort talents by level for display...
		talents.level.items = talents.level.items.sort(
			(a, b) => a.system.level - b.system.level
		);

		// Sorts inventory items by user defined order
		Object.keys(inventory).forEach(key => {
			inventory[key] = inventory[key].sort((a, b) => (a.sort || 0) - (b.sort || 0));
		  });

		context.classAbilities = classAbilities;
		context.hasClassAbilities = classAbilities.length > 0;

		context.attacks = attacks;
		context.boons = boons;
		context.totalCoins = totalCoins;
		context.gems = {items: gems, totalGems};
		context.inventory = inventory;
		context.spellitems = spellitems;
		context.slots = slots;
		context.spells = spells;
		context.talents = talents;
		context.effects = effects;
	}

 	async _updateObject(event, formData) {
		if (event.target) {
			// if HP MAX was change, turn off editing and set base hp value
			if (event.target.name === "system.attributes.hp.max") {
				this.editingHp = false;

				// Calculate new base hp value to pass to super
				const hpValues = this.object.system.attributes.hp;
				formData["system.attributes.hp.base"] =
						formData["system.attributes.hp.max"] - hpValues.bonus;
			}

			// if a stat was manually changed, also change base values, turn off editing
			if (event.target.name.match(/system\.abilities\.(\w*)\.total/)) {
				const abilityKey = event.target.name.match(/system\.abilities\.(\w*)\.total/);
				const base = `system.abilities.${abilityKey[1]}.base`;
				const total = `system.abilities.${abilityKey[1]}.total`;
				formData[base] = formData[total]
					- this.object.system.abilities[abilityKey[1]].bonus;
				this.editingStats = false;
			}
		}
		super._updateObject(event, formData);
	}
}
