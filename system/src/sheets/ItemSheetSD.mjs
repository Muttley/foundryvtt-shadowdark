
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

		if (item.type === "Spell" || item.type === "Effect") {
			context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
				.includes(item.system.duration.type);

		}

		if (item.type === "Talent" || item.type === "Effect" || item.system.magicItem ) {
			context.predefinedEffects = await this._getPredefinedEffectsList();
			context.effects = item.effects;
		}

		if (item.type === "Spell") {
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
				async: true,
			}
		);

		return context;
	}

	/* -------------------------------------------- */
	/*  Event Handling                              */
	/* -------------------------------------------- */

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

		super._onChangeInput(event);
	}

	/* ---------- Item Property Apps ---------- */

	_onArmorProperties(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.ArmorPropertiesSD(
			this.item, {event: event}
		).render(true);
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

	_onEffectActivate(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		const effect = this._getEffectFromEvent(event);
		shadowdark.log(
			`${effect.disabled ? "A" : "Dea"}ctivating effect ${effect.name ?? effect.label}`
		);
		return this._activateEffect(effect);
	}

	_onEffectEdit(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		const effect = this._getEffectFromEvent(event);
		shadowdark.log(`Editing effect ${effect.name ?? effect.label}`);
		return effect.sheet.render(true);
	}

	_onEffectDelete(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		const effect = this._getEffectFromEvent(event);
		shadowdark.log(`Deleting effect ${effect.name ?? effect.label}`);
		return this._deleteEffect(effect);
	}

	_onEffectTransfer(event) {
		event.preventDefault();
		if (!this.isEditable) return;
		const effect = this._getEffectFromEvent(event);
		shadowdark.log(`Toggling to transfer effect ${effect.name ?? effect.label}`);
		return this._toggleTransferEffect(effect);
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

	_getDuration() {
		const duration = {
			rounds: null,
			seconds: null,
		};

		// Set duration
		if (
			this.item.system.tokenIcon?.show
			&& !["unlimited", "focus", "instant"].includes(this.item.system.duration.type)
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

		// For conditions we always want duration so it shows on the token, if checked
		if (
			this.item.system.tokenIcon?.show
			&& this.item.system.category === "condition"
			&& ["unlimited", "focus", "instant"].includes(this.item.system.duration.type)
		) {
			duration.seconds = 1;
		}

		return duration;
	}


	/* ---------- Predefined Effect Methods ---------- */

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
	async _getPredefinedEffectsData() {
		return await foundry.utils.fetchJsonWithTimeout(
			"systems/shadowdark/assets/mappings/map-predefined-effects.json"
		);
	}

	async _askEffectInput(choiceType, choices) {
		let options = "";
		for (const [key, value] of Object.entries(choices)) {
			options += `<option value="${key}">${value}</option>`;
		}

		const title = game.i18n.localize(`SHADOWDARK.dialog.effect.choice.${choiceType}`);
		const data = {
			title: title,
			content: `
				<form>
					<h3>${title}</h3>
					<div class="form-group">
						<div class="form-fields">
							<input list="selections" type="text" value="" placeholder="" />
							<datalist id="selections">${options}</select>
						</div>
					</div>
				</form>
			`,
			classes: ["shadowdark-dialog"],
 			buttons: {
				submit: {
					label: game.i18n.localize("SHADOWDARK.dialog.submit"),
					callback: html => html[0].querySelector("input").value,
				},
			},
			close: () => false,
		};

		const result = await Dialog.wait(data);
		return result;
	}

	/**
	 * Handles special cases for predefined effect mappings that use the
	 * 'askInput' fields.
	 * @param {string} key - effectKey from mapping
	 * @param {Object} data - data from mapping
	 * @returns {Object}
	 */
	async _handlePredefinedEffect(key, data) {
		// @todo: CUSTOMIZATION How to generalize this with custom expansion of base items?
		if (key === "weaponMastery") {
			data.defaultValue = await this._askEffectInput("weapon", CONFIG.SHADOWDARK.WEAPON_BASE_WEAPON);
			if (!data.defaultValue) return;
		}
		else if (key === "armorMastery") {
			data.defaultValue = await this._askEffectInput("armor", CONFIG.SHADOWDARK.ARMOR_BASE_ARMOR);
			if (!data.defaultValue) return;
		}
		else if (key === "spellAdvantage") {
			// @todo: CUSTOMIZATION Allow custom spell compendiums
			const spellPack = game.packs.get("shadowdark.spells");
			const spellDocuments = await spellPack.getDocuments();
			const spellNames = {};
			spellDocuments.map(i => spellNames[i.name.slugify()] = i.name );
			data.defaultValue = await this._askEffectInput("spell", spellNames);
			if (!data.defaultValue) return;
		}
		return data;
	}

	async _createPredefinedEffect(key, data) {
		const handledData = await this._handlePredefinedEffect(key, data);
		if (!handledData) shadowdark.log("Can't create effect without selecting a value.");

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
		this.item.createEmbeddedDocuments(
			"ActiveEffect",
			effectData
		);
	}
}
