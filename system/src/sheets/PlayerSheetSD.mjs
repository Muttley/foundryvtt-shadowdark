import ActorSheetSD from "./ActorSheetSD.mjs";

export default class PlayerSheetSD extends ActorSheetSD {

	constructor(object, options) {
		super(object, options);

		this.gemBag = new shadowdark.apps.GemBagSD(this.actor);
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "player"],
			width: 600,
			height: 700,
			resizable: true,
			tabs: [
				{
					navSelector: ".player-navigation",
					contentSelector: ".player-body",
					initial: "tab-abilities",
				},
			],
			dragDrop: [{
				dragSelector: ".item[draggable=true]",
			}],
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

		html.find(".ability-uses-decrement").click(
			event => this._onAbilityUsesDecrement(event)
		);

		html.find(".ability-uses-increment").click(
			event => this._onAbilityUsesIncrement(event)
		);

		html.find(".item-quantity-decrement").click(
			event => this._onItemQuantityDecrement(event)
		);

		html.find(".item-quantity-increment").click(
			event => this._onItemQuantityIncrement(event)
		);

		html.find(".item-toggle-equipped").click(
			event => this._onToggleEquipped(event)
		);

		html.find(".item-toggle-stashed").click(
			event => this._onToggleStashed(event)
		);

		html.find(".item-toggle-light").click(
			event => this._onToggleLightSource(event)
		);

		html.find(".open-gem-bag").click(
			event => this._onOpenGemBag(event)
		);

		html.find(".sell-treasure").click(
			event => this._onSellTreasure(event)
		);

		html.find(".toggle-lost").click(
			event => this._onToggleLost(event)
		);

		html.find("[data-action='use-ability']").click(
			event => this._onUseAbility(event)
		);

		html.find("[data-action='use-potion']").click(
			event => this._onUsePotion(event)
		);

		html.find("[data-action='learn-spell']").click(
			event => this._onLearnSpell(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	async getBackgroundSelectors() {
		const system = this.actor.system;

		const data = {
			ancestry: {
				name: "ancestry",
				label: game.i18n.localize("SHADOWDARK.sheet.player.ancestry.label"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.ancestry.tooltip"),
				item: await fromUuid(system.ancestry) ?? null,
			},
			background: {
				name: "background",
				label: game.i18n.localize("SHADOWDARK.sheet.player.background.label"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.background.tooltip"),
				item: await fromUuid(system.background) ?? null,
			},
			class: {
				name: "class",
				label: game.i18n.localize("SHADOWDARK.sheet.player.class.label"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.class.tooltip"),
				item: await fromUuid(system.class) ?? null,
			},
			deity: {
				name: "deity",
				label: game.i18n.localize("SHADOWDARK.sheet.player.deity.label"),
				tooltip: game.i18n.localize("SHADOWDARK.sheet.player.deity.tooltip"),
				item: await fromUuid(system.deity) ?? null,
			},
		};

		return data;
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		context.gearSlots = this.actor.numGearSlots();

		context.xpNextLevel = context.system.level.value * 10;
		context.armorClass = await this.actor.getArmorClass();

		context.isSpellcaster = await this.actor.isSpellcaster();
		context.canUseMagicItems = await this.actor.canUseMagicItems();
		context.showSpellsTab = context.isSpellcaster || this.actor.system.class === "";

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

		context.characterClass = this.actor.backgroundItems.class?.name;
		context.classTitle = this.actor.backgroundItems.title;

		context.usePulpMode = game.settings.get("shadowdark", "usePulpMode");

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
		}
	}

	/** @inheritdoc */
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

		// Talents & Effects may need some user input
		if (["Talent", "Effect"].includes(item.type)) {
			return this._createItemWithEffect(item);
		}

		const backgroundItems = [
			"Ancestry",
			"Background",
			"Class",
			"Deity",
			"Language",
		];

		if (backgroundItems.includes(item.type)) {
			return this._onDropBackgroundItem(item);
		}

		// Activate light spell if dropped onto the sheet
		if (CONFIG.SHADOWDARK.LIGHT_SOURCE_ITEM_IDS.includes(item.id)) {
			return this._dropActivateLightSource(item);
		}

		if (item.actor && item.isLight()) {
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
	 * Asks the user for input if necessary for an effect that requires said input.
	 * @param {Item} item - Item that has the effects
	 * @param {*} effect - The effect being analyzed
	 * @param {*} key - Optional key if it isn't a unique system.bonuses.key
	 * @returns {Object} - Object updated with the changes
	 */
	async _modifyEffectChangesWithInput(item, effect, key = false) {
		// Create an object out of the item to modify before creating
		const itemObject = item.toObject();
		let name = itemObject.name;

		const changes = await Promise.all(
			effect.changes.map(async c => {
				if (CONFIG.SHADOWDARK.EFFECT_ASK_INPUT.includes(c.key)) {
					const effectKey = (key) ? key : c.key.split(".")[2];

					// Ask for user input
					let linkedName;
					[c.value, linkedName] = await item._handlePredefinedEffect(effectKey);

					if (c.value) {
						name += ` (${linkedName})`;
					}
				}
				return c;
			})
		);

		// Modify the Effect object
		itemObject.effects.map(e => {
			if (e._id === effect._id) {
				e.changes = changes;
				itemObject.name = name;
			}
			return e;
		});

		return itemObject;
	}

	/**
	 * Contains logic that handles any complex effects, where the user
	 * needs to provide input to determine the effect.
	 * @param {Item} item - The item being created
	 */
	async _createItemWithEffect(item) {
		await Promise.all(item.effects?.map(async e => {

			// If the item contains effects that require user input,
			// ask and modify talent before creating
			if (
				e.changes?.some(c =>
					CONFIG.SHADOWDARK.EFFECT_ASK_INPUT.includes(c.key)
				)
			) {
				// Spell Advantage requires special handling as it uses the `advantage` bons
				if (e.changes.some(c => c.key === "system.bonuses.advantage")) {
					// If there is no value with REPLACME, it is another type of advantage talent
					if (e.changes.some(c => c.value === "REPLACEME")) {
						const key = "spellAdvantage";
						item = await this._modifyEffectChangesWithInput(item, e, key);
					}
				}
				else {
					item = await this._modifyEffectChangesWithInput(item, e);
				}
			}
		}));

		// If any effects was created without a value, we don't create the item
		if (item.effects.some(e => e.changes.some(c => !c.value))) return ui.notifications.warn(
			game.i18n.localize("SHADOWDARK.item.effect.warning.add_effect_without_value")
		);

		// Activate lightsource tracking
		if (item.effects.some(e => e.changes.some(c => c.key === "system.light.template"))) {
			const duration = item.totalDuration;
			item = item.toObject();
			item.system.light.isSource = true;
			item.system.light.longevitySecs = duration;
			item.system.light.remainingSecs = duration;
			item.system.light.longevityMins = duration / 60;
		}

		// Create the item
		const actorItem = await super._onDropItemCreate(item);
		if (item.effects.some(e => e.changes.some(c => c.key === "system.light.template"))) {
			this._toggleLightSource(actorItem[0]);
		}
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
				icon: '<i class="fas fa-hand-sparkles"></i>',
				label: game.i18n.localize("SHADOWDARK.item.spell.label"),
				callback: () => this._createItemFromSpell(item, "Spell"),
			},
			wand: {
				icon: '<i class="fas fa-magic"></i>',
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
		const name = (type !== "Spell")
			? game.i18n.format(
				`SHADOWDARK.item.name_from_spell.${type}`,
				{spellName: spell.name}
			)
			: spell.name;

		const itemData = {
			type,
			name,
			system: spell.system,
		};

		if (type === "Spell") {
			itemData.img = spell.img;
		}
		else {
			delete itemData.system.lost;
			itemData.system.magicItem = true;
			itemData.system.spellName = spell.name;
		}

		super._onDropItemCreate(itemData);
	}

	async _onAbilityUsesDecrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.uses.available > 0) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					_id: itemId,
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
					_id: itemId,
					"system.uses.available": item.system.uses.available + 1,
				},
			]);
		}
	}

	async _onItemChatClick(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget).data("item-id");
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
					_id: itemId,
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
					_id: itemId,
					"system.quantity": item.system.quantity + 1,
				},
			]);
		}
	}

	async _onLearnSpell(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");

		this.actor.learnSpell(itemId);
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
				title: `${game.i18n.localize("SHADOWDARK.dialog.item.confirm_sale")}`,
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							this.actor.sellItemById(itemId);
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

	async _onToggleEquipped(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		const [updatedItem] = await this.actor.updateEmbeddedDocuments("Item", [
			{
				_id: itemId,
				"system.equipped": !item.system.equipped,
				"system.stashed": false,
			},
		]);

		if (item.type === "Armor") this.actor.updateArmor(updatedItem);
	}

	async _onToggleStashed(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		const [updatedItem] = await this.actor.updateEmbeddedDocuments("Item", [
			{
				_id: itemId,
				"system.stashed": !item.system.stashed,
				"system.equipped": false,
			},
		]);

		if (item.type === "Armor") this.actor.updateArmor(updatedItem);
	}

	async _onUseAbility(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");

		this.actor.useAbility(itemId);
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

	async _onToggleLost(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		this.actor.updateEmbeddedDocuments("Item", [
			{
				_id: itemId,
				"system.lost": !item.system.lost,
			},
		]);
	}

	async _toggleLightSource(item, options = {}) {
		const active = !item.system.light.active;

		if (active) {
			// Find any currently active lights and turn them off
			const activeLightSources = await this.actor.getActiveLightSources();
			for (const lightSource of activeLightSources) {
				this.actor.updateEmbeddedDocuments(
					"Item", [{
						_id: lightSource.id,
						"system.light.active": false,
					}]
				);
			}
		}

		const dataUpdate = {
			_id: item.id,
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

		const boons = {
			blessing: {
				label: game.i18n.localize("SHADOWDARK.sheet.player.boons.blessings.label"),
				items: [],
			},
			oath: {
				label: game.i18n.localize("SHADOWDARK.sheet.player.boons.oaths.label"),
				items: [],
			},
			secret: {
				label: game.i18n.localize("SHADOWDARK.sheet.player.boons.secrets.label"),
				items: [],
			},
		};

		const inventory = {
			armor: {
				label: game.i18n.localize("SHADOWDARK.inventory.section.armor"),
				type: "Armor",
				items: [],
			},
			weapon: {
				label: game.i18n.localize("SHADOWDARK.inventory.section.weapon"),
				type: "Weapon",
				items: [],
			},
			basic: {
				label: game.i18n.localize("SHADOWDARK.inventory.section.basic"),
				type: "Basic",
				items: [],
			},
			potion: {
				label: game.i18n.localize("SHADOWDARK.inventory.section.potions"),
				type: "Potion",
				items: [],
			},
			scroll: {
				label: game.i18n.localize("SHADOWDARK.inventory.section.scrolls"),
				type: "Scroll",
				items: [],
			},
			wand: {
				label: game.i18n.localize("SHADOWDARK.inventory.section.wands"),
				type: "Wand",
				items: [],
			},
			treasure: {
				label: game.i18n.localize("SHADOWDARK.inventory.section.treasure"),
				items: [],
			},
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

		let slotCount = 0;

		for (const i of this._sortAllItems(context)) {
			if (i.system.isPhysical && i.type !== "Gem") {
				i.showQuantity = i.system.slots.per_slot > 1 ? true : false;

				// We calculate how many slots are used by this item, taking
				// into account the quantity and any free items.
				//
				const freeCarry = i.system.slots.free_carry;
				const perSlot = i.system.slots.per_slot;
				const quantity = i.system.quantity;
				const slotsUsed = i.system.slots.slots_used;

				let totalSlotsUsed = Math.ceil(quantity / perSlot) * slotsUsed;
				totalSlotsUsed -= freeCarry * slotsUsed;

				i.slotsUsed = totalSlotsUsed;

				if (!i.system.stashed) {
					slotCount += i.slotsUsed;
				}

				const section = i.system.treasure
					? "treasure"
					: i.type.toLowerCase();

				inventory[section].items.push(i);

				if (i.type === "Basic" && i.system.light.isSource) {
					i.isLightSource = true;
					i.lightSourceActive = i.system.light.active;
					i.lightSourceUsed = i.system.light.hasBeenUsed;

					const timeRemaining = Math.ceil(
						i.system.light.remainingSecs / 60
					);

					if (i.system.light.remainingSecs < 60) {
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
				talents[talentClass].items.push(i);
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

		let coinSlots = 0;
		const freeCoins = shadowdark.defaults.FREE_COIN_CARRY;
		if (totalCoins > freeCoins) {
			coinSlots = Math.ceil((totalCoins - freeCoins) / freeCoins);
		}

		// Now do the same for gems...
		let gemSlots = 0;
		let totalGems = gems.length;

		if (totalGems > 0) {
			gemSlots = Math.ceil(totalGems / CONFIG.SHADOWDARK.DEFAULTS.GEMS_PER_SLOT);
		}

		const classAbilities = [];

		const sortedGroups = Object.keys(allClassAbilities).sort((a, b) => a.localeCompare(b));
		for (const group of sortedGroups) {
			classAbilities.push({
				name: group,
				abilities: allClassAbilities[group],
			});
		}

		context.classAbilities = classAbilities;
		context.hasClassAbilities = classAbilities.length > 0;

		context.attacks = attacks;
		context.boons = boons;
		context.coins = {totalCoins, coinSlots};
		context.gems = {items: gems, totalGems, gemSlots};
		context.inventory = inventory;
		context.slotsUsed = slotCount + coinSlots + gemSlots;
		context.spells = spells;

		// Sort these by level for display...
		talents.level.items = talents.level.items.sort(
			(a, b) => a.system.level - b.system.level
		);
		context.talents = talents;
		context.effects = effects;
	}

 	async _updateObject(event, formData) {
		const hpValues = this.object.system.attributes.hp;

		// Modify the underlying base hp value if the max is changed manually
		if (formData["system.attributes.hp.max"] !== hpValues.max) {
			formData["system.attributes.hp.base"] =
				formData["system.attributes.hp.max"] - hpValues.bonus;
		}

		const abilities = this.object.system.abilities;

		// Modify the underlying base ability value if it is changed manually
		for (const ability of CONFIG.SHADOWDARK.ABILITY_KEYS) {
			const key = `system.abilities.${ability}.base`;

			if (formData[key] !== abilities[ability].base) {
				formData[key] = formData[key] - abilities[ability].bonus;
			}
		}

		super._updateObject(event, formData);
	}
}
