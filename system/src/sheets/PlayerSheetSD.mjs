import ActorSheetSD from "./ActorSheetSD.mjs";
import * as select from "../apps/CompendiumItemSelectors/_module.mjs";

export default class PlayerSheetSD extends ActorSheetSD {

	constructor(object, options) {
		super(object, options);
		this.editingHp = false;
		this.editingStats = false;
		this.gemBag = new shadowdark.apps.GemBagSD(this.actor);
	}

	static DEFAULT_OPTIONS = foundry.utils.mergeObject(
		ActorSheetSD.DEFAULT_OPTIONS,
		{
			classes: ["shadowdark-app", "shadowdark-player"],
			position: { width: 600, height: 700 },
			window: {
				resizable: true,
				contentClasses: ["shadowdark", "sheet", "player"],
			},
			actions: {
				"ability-decrement": PlayerSheetSD.prototype._onAbilityUsesDecrement,
				"ability-increment": PlayerSheetSD.prototype._onAbilityUsesIncrement,
				"cast-spell": PlayerSheetSD.prototype._onCastSpell,
				"focus-spell": PlayerSheetSD.prototype._onFocusSpell,
				"create-boon": PlayerSheetSD.prototype._onCreateBoon,
				"create-item": PlayerSheetSD.prototype._onCreateItem,
				"create-treasure": PlayerSheetSD.prototype._onCreateTreasure,
				"item-decrement": PlayerSheetSD.prototype._onItemQuantityDecrement,
				"item-increment": PlayerSheetSD.prototype._onItemQuantityIncrement,
				"learn-spell": PlayerSheetSD.prototype._onLearnSpell,
				"level-up": PlayerSheetSD.prototype._onLevelUp,
				"open-spellbook": PlayerSheetSD.prototype._onOpenSpellBook,
				"open-gem-bag": PlayerSheetSD.prototype._onOpenGemBag,
				"sell-treasure": PlayerSheetSD.prototype._onSellTreasure,
				"toggle-edit-hp": PlayerSheetSD.prototype._onToggleEditHp,
				"toggle-edit-stats": PlayerSheetSD.prototype._onToggleEditStats,
				"toggle-equipped": PlayerSheetSD.prototype._onToggleEquipped,
				"toggle-handedness": PlayerSheetSD.prototype._onToggleHandedness,
				"toggle-light": PlayerSheetSD.prototype._onToggleLightSource,
				"toggle-stashed": PlayerSheetSD.prototype._onToggleStashed,
				"use-ability": PlayerSheetSD.prototype._onUseAbility,
				"use-potion": PlayerSheetSD.prototype._onUsePotion,
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
		details: {
			template: "systems/shadowdark/templates/actors/player/details.hbs",
			scrollable: [""],
		},
		abilities: {
			template: "systems/shadowdark/templates/actors/player/abilities.hbs",
			scrollable: [""],
		},
		spells: {
			template: "systems/shadowdark/templates/actors/player/spells.hbs",
			scrollable: [""],
		},
		inventory: {
			template: "systems/shadowdark/templates/actors/player/inventory.hbs",
			scrollable: [""],
		},
		talents: {
			template: "systems/shadowdark/templates/actors/player/talents.hbs",
			scrollable: [""],
		},
		effects: {
			template: "systems/shadowdark/templates/actors/_partials/effects-tab.hbs",
			scrollable: [""],
		},
		notes: {
			template: "systems/shadowdark/templates/actors/player/notes.hbs",
			scrollable: [""],
		},
	};

	static TABS = {
		primary: {
			initial: "abilities",
			labelPrefix: "SHADOWDARK.sheet.player.tab",
			tabs: [
				{ id: "details" },
				{ id: "abilities" },
				{ id: "spells" },
				{ id: "inventory" },
				{ id: "talents" },
				{ id: "notes" },
				{ id: "effects", label: "SHADOWDARK.sheet.item.tab.effects" },
			],
		},
	};

	/** @override */
	_configureRenderParts(options) {
		const parts = super._configureRenderParts(options);
		if (!this.actor.system.canUseMagicItems) delete parts.spells;
		return parts;
	}

	/** @override */
	_prepareTabs(group) {
		const tabs = super._prepareTabs(group);
		if (group === "primary" && !this.actor.system.canUseMagicItems) {
			delete tabs.spells;
		}
		return tabs;
	}

	async getBackgroundSelectors() {
		const system = this.actor.system;

		return {
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
	}

	/** @override */
	async _onRender(context, options) {
		await super._onRender(context, options);

		// Click on item image -> display chat card
		for (const el of this.element.querySelectorAll(".item-image")) {
			el.addEventListener("click", event => this._onItemChatClick(event));
		}

		// Update the Gem Bag, but don't render it unless it's already showing
		this.gemBag.render(false);

		// Auto-open level-up dialog if flag was set elsewhere
		if (this.actor.getFlag("shadowdark", "showLevelUp")) {
			await this.actor.setFlag("shadowdark", "showLevelUp", false);
			new shadowdark.apps.LevelUpSD(this.actor.id).render(true);
		}
	}

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		context.abilities = this.actor.system.abilities;
		context.gearSlots = this.actor.system.slots;

		context.xpNextLevel = this.actor.system.level.value * 10;
		context.levelUp = (this.actor.system.level.xp >= context.xpNextLevel);

		context.isSpellCaster = this.actor.system.isSpellCaster;
		context.canUseMagicItems = this.actor.system.canUseMagicItems;

		context.maxHp = this.actor.system.attributes.hp.max;

		context.knownLanguages = await this.actor.system.getLanguageItems();

		context.backgroundSelectors = await this.getBackgroundSelectors();

		await this._prepareItems(context);

		context.characterClass = await this.actor.system.getClass();
		context.classHasPatron = context.characterClass?.system?.patron?.required ?? false;
		context.classTitle = await this.actor.system.getTitle();
		context.characterPatron = await this.actor.system.getPatron();

		context.usePulpMode = game.settings.get("shadowdark", "usePulpMode");

		context.editingHp = this.editingHp;
		context.editingStats = this.editingStats;

		return context;
	}


	async _onDropBackgroundItem(item) {
		switch (item.type) {
			case "Ancestry":
				return this.actor.system.addAncestry(item);
			case "Background":
				return this.actor.system.addBackground(item);
			case "Class":
				return this.actor.system.addClass(item);
			case "Deity":
				return this.actor.system.addDeity(item);
			case "Language":
				return this.actor.system.addLanguage(item);
			case "Patron":
				return this.actor.system.addPatron(item);
		}
	}

	/** @override */
	async _onDropItem(event, item) {
		if (item.type === "Spell") return this._createItemFromSpellDialog(item);

		if (this._effectDropNotAllowed(item)) return false;

		const backgroundItems = [
			"Ancestry", "Background", "Class", "Deity", "Language", "Patron",
		];
		if (backgroundItems.includes(item.type)) {
			return this._onDropBackgroundItem(item);
		}

		// Items with Effects may need some user input
		if (item.effects.toObject().length > 0) {
			const itemObj = await shadowdark.effects.createItemWithEffect(item);
			const newItem = await this.actor.createEmbeddedDocuments("Item", [itemObj]);

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
			const newItem = await super._onDropItem(event, item);

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
			super._onDropItem(event, item);
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
		const content = await foundry.applications.handlebars.renderTemplate(
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

	async _onItemChatClick(event) {
		event.preventDefault();
		const itemId = event.currentTarget.closest("[data-item-id]")?.dataset.itemId;
		if (!itemId) return;
		const item = this.actor.getEmbeddedDocument("Item", itemId);
		item.displayCard();
	}

	async _onAbilityUsesDecrement(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.uses.available > 0) {
			this.actor.updateEmbeddedDocuments("Item", [{
				"_id": itemId,
				"system.uses.available": item.system.uses.available - 1,
			}]);
		}
	}

	async _onAbilityUsesIncrement(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.uses.available < item.system.uses.max) {
			this.actor.updateEmbeddedDocuments("Item", [{
				"_id": itemId,
				"system.uses.available": item.system.uses.available + 1,
			}]);
		}
	}

	async _onCreateBoon(event, target) {
		new Dialog({
			title: game.i18n.localize("SHADOWDARK.dialog.create_custom_item"),
			content: await foundry.applications.handlebars.renderTemplate(
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

	async _onCreateItem(event, target) {
		new Dialog({
			title: game.i18n.localize("SHADOWDARK.dialog.create_custom_item"),
			content: await foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/dialog/create-new-item.hbs"
			),
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

	async _onCreateTreasure(event, target) {
		new Dialog({
			title: game.i18n.localize("SHADOWDARK.dialog.create_treasure"),
			content: await foundry.applications.handlebars.renderTemplate(
				"systems/shadowdark/templates/dialog/create-new-treasure.hbs"
			),
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
									gp: parseInt(html.find("#item-gp").val() ?? 0),
									sp: parseInt(html.find("#item-sp")?.val() ?? 0),
									cp: parseInt(html.find("#item-cp").val() ?? 0),
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

	async _onItemQuantityDecrement(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity > 0) {
			this.actor.updateEmbeddedDocuments("Item", [{
				"_id": itemId,
				"system.quantity": item.system.quantity - 1,
			}]);
		}
	}

	async _onItemQuantityIncrement(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity < item.system.slots.per_slot) {
			this.actor.updateEmbeddedDocuments("Item", [{
				"_id": itemId,
				"system.quantity": item.system.quantity + 1,
			}]);
		}
	}

	async _onToggleEditHp(event, target) {
		this.editingHp = !this.editingHp;
		this.render();
	}

	async _onToggleEditStats(event, target) {
		this.editingStats = !this.editingStats;
		this.render();
	}

	async _onCastSpell(event, target, focus = false) {
		event.preventDefault();

		const spellUuid = target.dataset.spellUuid;
		const itemUuid = target.dataset.itemUuid;
		const config = { cast: { focus: focus }, skipPrompt: event.shiftKey };
		if (itemUuid) config.itemUuid = itemUuid;

		this.actor.system.castSpell(spellUuid, config);
	}

	async _onFocusSpell(event, target) {
		return this._onCastSpell(event, target, true);
	}

	async _onLearnSpell(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		this.actor.system.learnSpell(itemId);
	}

	async _onOpenSpellBook(event, target) {
		event.preventDefault();
		this.actor.system.openSpellBook();
	}

	async _onLevelUp(event, target) {
		event.preventDefault();

		const actorClass = await this.actor.system.getClass();

		if (!actorClass) {
			ui.notifications.info("Pick a class for this character first.");
			const actorId = this.actor.id;
			const hookId = Hooks.on("updateActor", (actor, changes) => {
				if (actor.id !== actorId) return;
				if (!foundry.utils.getProperty(changes, "system.class")) return;
				Hooks.off("updateActor", hookId);
				new shadowdark.apps.LevelUpSD(actorId).render(true);
			});
			new select.ClassSelector(this.actor).render(true);
			return;
		}

		if (this.actor.system.level.value === 0 && actorClass.name.includes("Level 0")) {
			new shadowdark.apps.CharacterGeneratorSD(this.actor._id).render(true);
			this.close();
			return;
		}

		new shadowdark.apps.LevelUpSD(this.actor._id).render(true);
	}

	async _onOpenGemBag(event, target) {
		event.preventDefault();
		this.gemBag.render(true);
	}

	_onSellTreasure(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		foundry.applications.handlebars.renderTemplate(
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
							this.actor.system.sellItemById(itemId);
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

	async _onToggleEquipped(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		await this.actor.updateEmbeddedDocuments("Item", [{
			"_id": itemId,
			"system.equipped": !item.system.equipped,
			"system.stashed": false,
		}]);
	}

	async _onToggleHandedness(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (!item || !item.system.isVersatile) return;

		if (item.system.handedness === "1h") {
			const shields = await this.actor.system.getEquippedShields();
			for (const shield of shields) {
				shield.update({"system.equipped": false});
			}
			item.update({"system.handedness": "2h"});
		}
		else {
			item.update({"system.handedness": "1h"});
		}
	}

	async _onToggleStashed(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		await this.actor.updateEmbeddedDocuments("Item", [{
			"_id": itemId,
			"system.stashed": !item.system.stashed,
			"system.equipped": false,
		}]);
	}

	async _onUseAbility(event, target) {
		event.preventDefault();
		const itemUuid = target.dataset.itemUuid;

		if (event.shiftKey) {
			this.actor.system.useAbility(itemUuid, {skipPrompt: true});
		}
		else {
			this.actor.system.useAbility(itemUuid);
		}
	}

	async _onUsePotion(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		this.actor.usePotion(itemId);
	}

	async _sendToggledLightSourceToChat(active, item, options = {}) {
		const cardData = {
			active,
			name: item.name,
			timeRemaining: Math.floor(item.system.light.remainingSecs / 60),
			longevity: item.system.light.longevityMins,
			actor: this,
			item,
			picked_up: options.picked_up ?? false,
			showRemainingMins: game.settings.get("shadowdark", "playerShowLightRemaining") > 1,
		};

		const template = options.template ?? "systems/shadowdark/templates/chat/lightsource-toggle.hbs";
		const content = await foundry.applications.handlebars.renderTemplate(template, cardData);

		await ChatMessage.create({
			content,
			speaker: options.speaker ?? ChatMessage.getSpeaker(),
			rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
		});
	}

	async _onToggleLightSource(event, target) {
		event.preventDefault();
		const itemId = target.dataset.itemId;
		const item = this.actor.getEmbeddedDocument("Item", itemId);
		this._toggleLightSource(item);
	}

	async _toggleLightSource(item, options = {}) {
		const active = !item.system.light.active;

		if (active) {
			const activeLightSources = await this.actor.getActiveLightSources();
			for (const lightSource of activeLightSources) {
				this.actor.updateEmbeddedDocuments("Item", [{
					"_id": lightSource.id,
					"system.light.active": false,
				}]);
			}
		}

		const dataUpdate = {
			"_id": item.id,
			"system.light.active": active,
		};
		if (!item.system.light.hasBeenUsed) {
			dataUpdate["system.light.hasBeenUsed"] = true;
		}

		const [updatedLight] = await this.actor.updateEmbeddedDocuments("Item", [dataUpdate]);

		await this.actor.toggleLight(active, item.id);

		if (this.actor.isClaimedByUser()) {
			this._sendToggledLightSourceToChat(active, item, options);
			game.shadowdark.lightSourceTracker.toggleLightSource(this.actor, updatedLight);
		}
	}

	async _prepareItems(context) {
		const gems = [];

		const boons = {};
		for (const [key, label] of Object.entries(CONFIG.SHADOWDARK.BOON_TYPES)) {
			boons[key] = { label, items: [] };
		}

		const inventory = {
			equipped: [],
			treasure: [],
			carried: [],
			stashed: this.actor.system.getStashedItems(),
		};

		const spellitems = { wands: [], scrolls: [] };
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

		const attacks = await this.actor.system.getAttacks();

		for (const i of this.actor.system.getPhysicalItems()) {
			if (i.system.isGem) {
				gems.push(i);
			}
			else if (i.system.equipped) {
				inventory.equipped.push(i);
			}
			else if (i.system.treasure) {
				inventory.treasure.push(i);
			}
			else {
				inventory.carried.push(i);
			}

			if (i.system.isWand && i.system.isIdentified && !i.system.broken) {
				for (const spell of (i.system.spells ?? [])) {
					if (!spell.uuid) continue;
					const spellObj = await fromUuid(spell.uuid);
					if (spellObj) {
						spellitems.wands.push({item: i, spell: spellObj, lost: spell.lost});
					}
				}
			}
			if (i.system.isScroll && i.system.isIdentified) {
				const spellObj = await fromUuid(i.system.spellUuid);
				spellitems.scrolls.push({item: i, spell: spellObj});
			}
		}

		const nonPhysicalItems = this.actor.items.filter(i => !i.system.isPhysical);
		for (const i of nonPhysicalItems) {
			if (i.type === "Boon") {
				if (boons[i.system.boonType]) {
					boons[i.system.boonType].items.push(i);
				}
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
		}

		talents.ancestry.items.sort((a, b) => a.name.localeCompare(b.name));
		talents.class.items.sort((a, b) => a.name.localeCompare(b.name));
		talents.level.items.sort((a, b) => a.system.level - b.system.level);

		for (const tier in spells) {
			spells[tier].sort((a, b) => a.name.localeCompare(b.name));
		}

		context.classAbilities = this.actor.system.getClassAbilities();
		context.attacks = attacks;
		context.boons = boons;
		context.gems = {items: gems, totalGems: gems.length};
		context.inventory = inventory;
		context.spellitems = spellitems;
		context.slots = this.actor.system.getSlotUsage();
		context.spells = spells;
		context.talents = talents;
		context.effects = effects;
	}

}
