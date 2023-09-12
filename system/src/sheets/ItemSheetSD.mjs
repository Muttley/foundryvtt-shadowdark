
export default class ItemSheetSD extends ItemSheet {

	/* -------------------------------------------- */
	/*  Inherited                                   */
	/* -------------------------------------------- */

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 665,
			height: 620,
			classes: ["shadowdark", "sheet", "item"],
			resizable: true,
			tabs: [
				{
					navSelector: ".item-navigation",
					contentSelector: ".item-body",
					initial: "tab-details",
				},
			],
			dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/items/item.hbs";
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".item-property-list.armor").click(
			event => this._onArmorProperties(event)
		);

		html.find(".item-property-list.npc-attack-ranges").click(
			event => this._onNpcAttackRanges(event)
		);

		html.find(".item-property-list.spell").click(
			event => this._onSpellCasterClasses(event)
		);

		html.find(".item-property-list.weapon").click(
			event => this._onWeaponProperties(event)
		);

		html.find(".item-property-list.talent-type").click(
			event => this._onTalentTypeProperties(event)
		);

		html.find(".item-property-list.magic-type").click(
			event => this._onMagicItemTypeProperties(event)
		);

		// Effect listeners
		html.find(".effect-control[data-action=create]").click(
			event => this._onEffectCreate(event)
		);

		html.find(".effect-control[data-action=activate]").click(
			event => this._onEffectActivate(event)
		);

		html.find(".effect-control[data-action=edit]").click(
			event => this._onEffectEdit(event)
		);

		html.find(".effect-control[data-action=delete]").click(
			event => this._onEffectDelete(event)
		);

		html.find(".effect-control[data-action=transfer]").click(
			event => this._onEffectTransfer(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/* -------------------------------------------- */
	/*  Overrides                                   */
	/* -------------------------------------------- */

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		const item = context.item;
		const source = item.toObject();

		foundry.utils.mergeObject(context, {
			config: CONFIG.SHADOWDARK,
			effectsEditable: (
				item.parent === null
				|| game.version.split(".")[0] > 10
			),
			hasCost: item.system.cost !== undefined,
			itemType: game.i18n.localize(`SHADOWDARK.item.type.${item.type}`),
			properties: [],
			propertiesDisplay: "",
			showMagicItemCheckbox: item.system.isPhysical && !["Potion", "Scroll", "Wand"].includes(item.type),
			source: source.system,
			system: item.system,
			usesSlots: item.system.slots !== undefined,
		});

		if (item.type === "Basic" && item.system.light.isSource) {
			if (!item.system.light.hasBeenUsed) {
				// Unused light sources should always have their remaining time
				// at maximum
				const maxRemaining = item.system.light.longevityMins * 60; // seconds

				if (item.system.light.remainingSecs !== maxRemaining) {
					item.setLightRemaining(maxRemaining);
					item.system.light.remainingSecs = maxRemaining;
				}

				context.lightRemainingMins = item.system.light.longevityMins;
			}
			else {
				context.lightRemainingMins = Math.floor(
					item.system.light.remainingSecs / 60
				);
			}
		}

		if (item.type === "NPC Attack") {
			context.npcAttackRangesDisplay = item.npcAttackRangesDisplay();
		}

		context.propertiesDisplay = item.propertiesDisplay();

		if (["Effect", "Potion", "Scroll", "Spell", "Wand"].includes(item.type)) {
			context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
				.includes(item.system.duration.type);

		}

		if (item.type === "Talent" || item.type === "Effect" || item.system.magicItem ) {
			context.predefinedEffects = await this._getPredefinedEffectsList();
			context.effects = item.effects;
		}

		if (["Potion", "Scroll", "Spell", "Wand"].includes(item.type)) {
			context.casterClasses = [];

			for (const key of this.item.system.class) {
				context.casterClasses.push(
					CONFIG.SHADOWDARK.SPELL_CASTER_CLASSES[key]
				);
			}

			context.casterClassesDisplay = context.casterClasses.join(", ");
		}

		context.descriptionHTML = await TextEditor.enrichHTML(
			context.system.description,
			{
				secrets: context.item.isOwner,
				async: true,
				relativeTo: this.item,
			}
		);

		return context;
	}

	/* -------------------------------------------- */
	/*  Event Handling                              */
	/* -------------------------------------------- */

	/** @inheritdoc */
	_canDragDrop(selector) {
		return this.isEditable;
	}

	/** @inheritdoc */
	async _onChangeInput(event) {
		// Modify the effect when field is modified
		if (event.target?.className === "effect-change-value") {
			const li = event.target.closest("li");
			const effectId = li.dataset.effectId;
			const effect = this.item.effects.get(effectId);

			console.log(`Modifying talent ${event.target.name} (${effectId}) with value ${event.target.value}`);
			const updates = {};

			const value = (isNaN(parseInt(event.target.value, 10)))
				? event.target.value
				: parseInt(event.target.value, 10);

			// Check the changes
			updates.changes = effect.changes.map(ae => {
				if (ae.key === event.target.name) {
					ae.value = value;
				}
				return ae;
			});

			// Set the duration
			updates.duration = this._getDuration();

			await effect.update(updates);
		}

		// Create effects when added through the predefined effects input
		if (event.target?.name === "system.predefinedEffects") {
			const key = event.target.value;
			const jsonData = await this._getPredefinedEffectsData();
			let effectData = jsonData[key];

			if (!effectData) return console.error(`No effect found (${key})`);

			await this._createPredefinedEffect(key, effectData);
		}

		await super._onChangeInput(event);

		// If the change value is the duration field(s)
		if (
			["system.duration.type", "system.duration.value"].includes(event.target?.name)
			&& event.target?.parentElement.className === "effect-duration"
		) {
			await this._onUpdateDurationEffect();
		}
	}

	/* ---------- Item Property Apps ---------- */


	_onArmorProperties(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.ArmorPropertiesSD(
			this.item, {event: event}
		).render(true);
	}

	/** @inheritdoc */
	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);

		switch (data.type) {
			case "Item":
				return this._onDropItemSD(event, data);
			default:
				return super._onDrop();
		}
	}

	async _onDropItemSD(event, data) {
		const myType = this.item.type;

		// Allow the dropping of spells onto the followin Item types to make
		// creating them easier
		//
		const allowedType = ["Potion", "Scroll", "Wand"].includes(myType);

		const droppedItem = await fromUuid(data.uuid);
		const isSpellDrop = droppedItem.type === "Spell";

		if (!(allowedType && isSpellDrop)) return super._onDrop();

		const name = game.i18n.format(
			`SHADOWDARK.item.name_from_spell.${myType}`,
			{spellName: droppedItem.name}
		);

		const updateData = {
			name,
			system: droppedItem.system,
			// TODO Add some kind of default cost to the new item?
		};

		delete updateData.system.lost;
		updateData.system.magicItem = true;
		updateData.system.spellName = droppedItem.name;

		this.item.update(updateData);
	}

	_onMagicItemTypeProperties(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.MagicItemEffectsSD(
			this.item, {event: event}
		).render(true);
	}

	_onNpcAttackRanges(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.NpcAttackRangesSD(
			this.item, {event: event}
		).render(true);
	}

	_onSpellCasterClasses(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.SpellCasterClassSD(
			this.item, {event: event}
		).render(true);
	}

	_onTalentTypeProperties(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.TalentTypesSD(
			this.item, {event: event}
		).render(true);
	}

	_onWeaponProperties(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.WeaponPropertiesSD(
			this.item, {event: event}
		).render(true);
	}

	/* ---------- Effect Event Handlers ---------- */
	/**
	 * Creates a new effect and renders the effect sheet. This is used
	 * for adding custom effects to an item with effects enabled.
	 * @param {Event} event - Event with information about the effect to create
	 * @returns {void}
	 */
	async _onEffectCreate(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		shadowdark.log(`Creating a new effect on ${this.item.name}`);
		const effectData = {
			label: game.i18n.localize("SHADOWDARK.effect.new"),
			icon: "icons/svg/aura.svg",
			origin: this.item.uuid,
		};
		const effect = await this._createEffect(effectData);
		return effect[0]?.sheet.render(true);
	}

	/**
	 * Toggles an ActiveEffect as active/inactive.
	 * @param {Event} event - Clicking event
	 * @returns {void}
	 */
	_onEffectActivate(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		const effect = this._getEffectFromEvent(event);
		shadowdark.log(
			`${effect.disabled ? "A" : "Dea"}ctivating effect ${effect.name ?? effect.label}`
		);
		return this._activateEffect(effect);
	}

	/**
	 * Renders an ActiveEffect sheet for editing.
	 * @param {Event} event - Clicking event
	 * @returns {void}
	 */
	_onEffectEdit(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		const effect = this._getEffectFromEvent(event);
		shadowdark.log(`Editing effect ${effect.name ?? effect.label}`);
		return effect.sheet.render(true);
	}

	/**
	 * Deletes an ActiveEffect.
	 * @param {Event} event - Clicking event
	 * @returns {void}
	 */
	_onEffectDelete(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		const effect = this._getEffectFromEvent(event);
		shadowdark.log(`Deleting effect ${effect.name ?? effect.label}`);
		return this._deleteEffect(effect);
	}

	/**
	 * Toggles an ActiveEffect as being transferred ot nor.
	 * @param {Event} event - Clicking event
	 * @returns {void}
	 */
	_onEffectTransfer(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		const effect = this._getEffectFromEvent(event);
		shadowdark.log(`Toggling to transfer effect ${effect.name ?? effect.label}`);
		return this._toggleTransferEffect(effect);
	}

	async _onUpdateDurationEffect() {
		if (!this.isEditable) return;
		this.item.effects.map(e => e.update({duration: this._getDuration()}));
	}


	/* -------------------------------------------- */
	/*  Methods                                     */
	/* -------------------------------------------- */

	/* ---------- Effect Methods ---------- */

	_getEffectFromEvent(event) {
		const a = event.currentTarget;
		const li = a.closest("li");
		const effect = li.dataset.effectId
			? this.item.effects.get(li.dataset.effectId)
			: null;
		return effect;
	}

	_createEffect(data) {
		// Add duration to the effect so it shows up as a token icon when applied
		data.duration = this._getDuration();
		return this.item.createEmbeddedDocuments("ActiveEffect", [data]);
	}

	_activateEffect(effect) {
		return effect.update({disabled: !effect.disabled});
	}

	_toggleTransferEffect(effect) {
		return effect.update({transfer: !effect.transfer});
	}

	_deleteEffect(effect) {
		return effect.delete();
	}

	/**
	 * Returns duration data for an active effect. This is used
	 * to make sure the effect will show on a token icon.
	 * @returns {object}
	 */
	_getDuration() {
		const duration = {
			rounds: null,
			seconds: null,
		};

		// Set duration
		if (
			this.item.system.tokenIcon?.show
			&& !["unlimited", "focus", "instant", "permanent"].includes(this.item.system.duration.type)
		) {
			if (this.item.system.duration.type === "rounds") {
				duration.rounds = this.item.system.duration.value;
			}
			else {
				duration.seconds =
				this.item.system.duration.value
					* (CONFIG.SHADOWDARK.DURATION_UNITS[this.item.system.duration.type] ?? 0);
			}
		}

		// If the show token icon is checked and it is either a condition OR the setting for always
		// showing passive effects is checked in settings, we set a duration that won't tick down.
		if (
			this.item.system.tokenIcon?.show
			&& (
				this.item.system.category === "condition"
				|| game.settings.get("shadowdark", "showPassiveEffects")
			)
			&& ["unlimited", "focus", "instant", "permanent"].includes(this.item.system.duration.type)
		) {
			duration.seconds = 4201620;
		}

		return duration;
	}


	/* ---------- Predefined Effect Methods ---------- */

	/**
	 * Returns an object containing the effect key, and the
	 * translated name into the current language.
	 * @returns {Object}
	 */
	async _getPredefinedEffectsList() {
		const effects = {};
		const jsonData = await this._getPredefinedEffectsData();

		for (const [key] of Object.entries(jsonData)) {
			effects[key] = {
				key: key,
				name: game.i18n.localize(jsonData[key].lang),
			};
		}

		return effects;
	}

	// @todo: CUSTOMIZATION Extend this with custom paths as for the art mapping
	/**
	 * Reads the predefined effects mapping json file and returns it as a JSON object.
	 * @returns {Object}
	 */
	async _getPredefinedEffectsData() {
		return await foundry.utils.fetchJsonWithTimeout(
			"systems/shadowdark/assets/mappings/map-predefined-effects.json"
		);
	}

	/**
	 * Creates effects based on predefined effect choices and the supplied
	 * predefined effect mappings.
	 * @param {string} key - Name of the predefined effect
	 * @param {Object} data - The item data of the item to be created
	 * @returns {ActiveEffect}
	 */
	async _createPredefinedEffect(key, data) {
		const handledData = data;
		handledData.defaultValue = await this.item._handlePredefinedEffect(key, data.defaultValue);

		if (handledData.defaultValue === "REPLACEME") {
			return shadowdark.log("Can't create effect without selecting a value.");
		}

		const effectMode = foundry.utils.getProperty(
			CONST.ACTIVE_EFFECT_MODES,
			data.mode.split(".")[2]);

		const value = (isNaN(parseInt(handledData.defaultValue, 10)))
			? handledData.defaultValue
			: parseInt(handledData.defaultValue, 10);

		const effectData = [
			{
				name: game.i18n.localize(`SHADOWDARK.item.effect.predefined_effect.${key}`),
				label: game.i18n.localize(`SHADOWDARK.item.effect.predefined_effect.${key}`),
				icon: handledData.icon,
				changes: [{
					key: handledData.effectKey,
					value,
					mode: effectMode,
				}],
				disabled: false,
				transfer: (Object.keys(handledData).includes("transfer"))
					? handledData.transfer
					: true,
			},
		];

		// Create the effect
		await this.item.createEmbeddedDocuments(
			"ActiveEffect",
			effectData
		);
	}
}
