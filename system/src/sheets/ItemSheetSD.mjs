import * as select from "../apps/CompendiumItemSelectors/_module.mjs";

export default class ItemSheetSD extends ItemSheet {

	firstLoad = true;

	/* -------------------------------------------- */
	/*  Inherited                                   */
	/* -------------------------------------------- */

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 665,
			height: 620,
			classes: ["shadowdark", "sheet", "item"],
			scrollY: ["section.SD-content-body"],
			resizable: true,
			tabs: [
				{
					navSelector: ".SD-nav",
					contentSelector: ".SD-content-body",
					initial: "tab-details",
				},
			],
		});
	}

	/** @inheritdoc */
	get template() {
		return `systems/shadowdark/templates/items/${this.item.typeSlug}.hbs`;
	}

	/** @inheritdoc */
	get title() {
		return `[${this.item.type}] ${this.item.name}`;
	}

	/** @inheritdoc */
	activateListeners(html) {

		html.find("[data-action=delete-choice]").click(
			event => this._deleteChoiceItem(event)
		);

		html.find("[data-action=class-title-add]").click(
			event => this._onClassTitleAdd(event)
		);

		html.find("[data-action=class-title-delete]").click(
			event => this._onClassTitleDelete(event)
		);

		html.find("[data-action=npc-attack-ranges]").click(
			event => this._onNpcAttackRanges(event)
		);

		html.find(".item-property-list.talent-type").click(
			event => this._onTalentTypeProperties(event)
		);

		html.find(".item-property-list.magic-type").click(
			event => this._onMagicItemTypeProperties(event)
		);

		html.find(".item-selector").click(
			event => this._onItemSelection(event)
		);

		html.find("[data-action=remove-name-table]").click(
			event => this._onRemoveTable(event)
		);

		html.find(".effect-control").click(event => {
			shadowdark.effects.onManageActiveEffect(event, this.item);
		});

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}


	async getAncestrySelectorConfigs(context) {

		const [fixedLanguages, availableFixedLanguages] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.languages(),
				this.item.system.languages.fixed ?? []
			);

		const [selectedLanguages, availableSelectLanguages] =
		await shadowdark.utils.getDedupedSelectedItems(
			await shadowdark.compendiums.languages(),
			this.item.system.languages.selectOptions ?? []
		);


		const ancestryNameTables =
			await shadowdark.compendiums.ancestryNameTables();

		context.ancestryNameTables = {};
		for (const ancestryNameTable of ancestryNameTables) {

			context.ancestryNameTables[ancestryNameTable.uuid] =
			ancestryNameTable.name.replace(/^Character\s+Names:\s/, "");
		}

		context.fixedLanguagesConfig = {
			availableItems: availableFixedLanguages,
			choicesKey: "languages.fixed",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.ancestry.languages.label"),
			name: "system.languages.fixed",
			prompt: game.i18n.localize("SHADOWDARK.ancestry.languages.prompt"),
			selectedItems: fixedLanguages,
		};

		context.languageChoicesConfig = {
			availableItems: availableSelectLanguages,
			choicesKey: "languages.selectOptions",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.language_choices.label"),
			name: "system.languages.selectOptions",
			prompt: game.i18n.localize("SHADOWDARK.class.language_choices.prompt"),
			selectedItems: selectedLanguages,
		};

		const [selectedTalents, availableTalents] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.ancestryTalents(),
				this.item.system.talents ?? []
			);

		context.talentsConfig = {
			availableItems: availableTalents,
			choicesKey: "talents",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.ancestry.talents.label"),
			name: "system.talents",
			prompt: game.i18n.localize("SHADOWDARK.ancestry.talents.prompt"),
			selectedItems: selectedTalents,
		};
	}


	async getClassSelectorConfigs(context) {
		const [selectedArmor, availableArmor] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.baseArmor(),
				this.item.system.armor ?? []
			);

		context.armorConfig = {
			availableItems: availableArmor,
			choicesKey: "armor",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.armor.label"),
			name: "system.armor",
			prompt: game.i18n.localize("SHADOWDARK.class.armor.prompt"),
			selectedItems: selectedArmor,
		};

		const classTalentTables =
			await shadowdark.compendiums.classTalentTables();

		context.classTalentTables = {};
		for (const classTalentTable of classTalentTables) {

			context.classTalentTables[classTalentTable.uuid] =
				classTalentTable.name.replace(/^Class\s+Talents:\s/, "");
		}

		const [fixedLanguages, availableFixedLanguages] =
		await shadowdark.utils.getDedupedSelectedItems(
			await shadowdark.compendiums.languages(),
			this.item.system.languages.fixed ?? []
		);
		const [selectedLanguages, availableSelectLanguages] =
		await shadowdark.utils.getDedupedSelectedItems(
			await shadowdark.compendiums.languages(),
			this.item.system.languages.selectOptions ?? []
		);

		context.fixedLanguagesConfig = {
			availableItems: availableFixedLanguages,
			choicesKey: "languages.fixed",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.languages.label"),
			name: "system.languages.fixed",
			prompt: game.i18n.localize("SHADOWDARK.class.language_choices.prompt"),
			selectedItems: fixedLanguages,
		};

		context.languageChoicesConfig = {
			availableItems: availableSelectLanguages,
			choicesKey: "languages.selectOptions",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.language_choices.label"),
			name: "system.languages.selectOptions",
			prompt: game.i18n.localize("SHADOWDARK.class.language_choices.prompt"),
			selectedItems: selectedLanguages,
		};

		const classTalents = await shadowdark.compendiums.classTalents();

		const [selectedTalents, availableTalents] =
			await shadowdark.utils.getDedupedSelectedItems(
				classTalents,
				this.item.system.talents ?? []
			);

		context.talentsConfig = {
			availableItems: availableTalents,
			choicesKey: "talents",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.talents.label"),
			name: "system.talents",
			prompt: game.i18n.localize("SHADOWDARK.class.talents.prompt"),
			selectedItems: selectedTalents,
		};

		const [selectedTalentChoices, availableTalentChoices] =
			await shadowdark.utils.getDedupedSelectedItems(
				classTalents,
				this.item.system.talentChoices ?? []
			);

		context.talentChoicesConfig = {
			availableItems: availableTalentChoices,
			choicesKey: "talentChoices",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.talent_choices.label"),
			name: "system.talentChoices",
			prompt: game.i18n.localize("SHADOWDARK.class.talent_choices.prompt"),
			selectedItems: selectedTalentChoices,
		};

		const spellcastingClasses =
			await shadowdark.compendiums.spellcastingBaseClasses();

		context.spellcastingClasses = {};
		for (const spellcastingClass of spellcastingClasses) {
			if (spellcastingClass.name === this.item.name) continue;
			context.spellcastingClasses[spellcastingClass.uuid] =
				spellcastingClass.name;
		}

		const [selectedWeapons, availableWeapons] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.baseWeapons(),
				this.item.system.weapons ?? []
			);

		context.weaponsConfig = {
			availableItems: availableWeapons,
			choicesKey: "weapons",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.class.weapons.label"),
			name: "system.weapons",
			prompt: game.i18n.localize("SHADOWDARK.class.weapons.prompt"),
			selectedItems: selectedWeapons,
		};
	}


	async getSources(context) {
		context.sources = await shadowdark.compendiums.sources();

		const itemSource = context.sources.find(
			s => s.uuid === context.item.system.source.title
		);

		context.sourceLoaded = itemSource || context.item.system.source.title === ""
			? true
			: false;
	}


	async getSpellSelectorConfigs(context) {
		const [selectedClasses, availableClasses] =
			await shadowdark.utils.getDedupedSelectedItems(
				await shadowdark.compendiums.spellcastingBaseClasses(),
				this.item.system.class ?? []
			);

		context.spellcasterClassesConfig = {
			availableItems: availableClasses,
			choicesKey: "class",
			isItem: true,
			label: game.i18n.localize("SHADOWDARK.spell.classes.label"),
			name: "system.class",
			prompt: game.i18n.localize("SHADOWDARK.spell.classes.prompt"),
			selectedItems: selectedClasses,
		};
	}


	/** @override */
	async getData(options) {
		let loadingDialog;

		if (this.firstLoad) {
			this.firstLoad = false;
			loadingDialog = new shadowdark.apps.LoadingSD().render(true);
		}

		const context = await super.getData(options);

		await this.getSources(context);

		foundry.utils.mergeObject(context, {
			config: CONFIG.SHADOWDARK,
			editable: this.isEditable,
			itemType: game.i18n.localize(`SHADOWDARK.item.type.${context.item.type}`),
			predefinedEffects: await shadowdark.effects.getPredefinedEffectsList(),
			system: context.item.system,
		});

		context.descriptionHTML = await TextEditor.enrichHTML(
			context.system.description,
			{
				secrets: context.item.isOwner,
				async: true,
				relativeTo: this.item,
			}
		);

		// Call any type-specific methods for this item type to gather
		// additional data for the sheet
		//
		const itemTypeSafeName = context.item.type.replace(/\s/g, "");
		const itemTypeFunctionName = `getSheetDataFor${itemTypeSafeName}Item`;

		if (typeof this[itemTypeFunctionName] === "function") {
			shadowdark.debug(`Calling Item type-specific method ${itemTypeFunctionName}()`);
			await this[itemTypeFunctionName](context);
		}

		if (loadingDialog) loadingDialog.close({force: true});

		return context;
	}


	// ------------------------------------------------------------------------
	// Type-specific methods are used to gather any additional data necessary
	// for rendering the item sheet.
	//
	// These methods are called using reflection from the main getData() method
	// and should be named as follows:
	//
	//     getSheetDataFor{item_type_with_no_spaces}Item
	// ------------------------------------------------------------------------

	async getSheetDataForAncestryItem(context) {
		await this.getAncestrySelectorConfigs(context);
	}


	async getSheetDataForArmorItem(context) {
		context.propertyItems = await context.item.propertyItems();

		const mySlug = context.item.name.slugify();

		context.baseArmor = await shadowdark.utils.getSlugifiedItemList(
			await shadowdark.compendiums.baseArmor()
		);

		delete context.baseArmor[mySlug];
	}


	async getSheetDataForBasicItem(context) {
		const item = context.item;

		if (item.system.light.isSource) {
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
			const lightRemainingSetting = (game.user.isGM)? 2 : game.settings.get("shadowdark", "playerShowLightRemaining");
			context.showRemainingMins = lightRemainingSetting > 1;
		}
	}


	async getSheetDataForClassItem(context) {
		await this.getClassSelectorConfigs(context);

		context.spellsKnown =
			context.item.system.spellcasting.class !== "__not_spellcaster__";
	}


	async getSheetDataForEffectItem(context) {
		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration.type);
	}


	async getSheetDataForNPCAttackItem(context) {
		context.npcAttackRangesDisplay = context.item.npcAttackRangesDisplay();
	}


	async getSheetDataForNPCSpecialAttackItem(context) {
		context.npcAttackRangesDisplay = context.item.npcAttackRangesDisplay();
	}


	async getSheetDataForNPCSpellItem(context) {
		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration.type);
	}


	async getSheetDataForPatronItem(context) {
		const patronBoonTables =
			await shadowdark.compendiums.patronBoonTables();

		context.patronBoonTables = {};

		for (const patronBoonTable of patronBoonTables) {
			context.patronBoonTables[patronBoonTable.uuid] =
				patronBoonTable.name.replace(/^Patron\s+Boons:\s/, "");
		}
	}


	async getSheetDataForScrollItem(context) {
		await this.getSpellSelectorConfigs(context);

		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration.type);
	}


	async getSheetDataForSpellItem(context) {
		await this.getSpellSelectorConfigs(context);

		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration.type);
	}


	async getSheetDataForTalentItem(context) {
		context.showsLevelInput = {
			ancestry: false,
			class: false,
			level: true,
			patronBoon: true,
		};
	}


	async getSheetDataForWandItem(context) {
		await this.getSpellSelectorConfigs(context);

		context.variableDuration = CONFIG.SHADOWDARK.VARIABLE_DURATIONS
			.includes(context.item.system.duration.type);
	}


	async getSheetDataForWeaponItem(context) {
		context.propertyItems = await context.item.propertyItems();

		const mySlug = context.item.name.slugify();

		context.ammunition = await shadowdark.utils.getSlugifiedItemList(
			await shadowdark.compendiums.ammunition()
		);

		context.baseWeapons = await shadowdark.utils.getSlugifiedItemList(
			await shadowdark.compendiums.baseWeapons()
		);

		delete context.baseWeapons[mySlug];
	}


	/** @inheritdoc */
	_canDragDrop(selector) {
		return this.isEditable;
	}

	/**
	 * Deletes an Item/Skill choice from this item, using the data stored
	 * on the target element
	 *
	 * @param {event} Event The triggered event
	 */
	_deleteChoiceItem(event) {
		if (!this.isEditable) return;

		event.preventDefault();
		event.stopPropagation();

		const deleteUuid = $(event.currentTarget).data("uuid");
		const choicesKey = $(event.currentTarget).data("choices-key");

		// handles cases where choicesKey is nested property.
		const currentChoices = choicesKey
			.split(".")
			.reduce((obj, path) => obj ? obj[path]: [], this.item.system);

		const newChoices = [];
		for (const itemUuid of currentChoices) {
			if (itemUuid === deleteUuid) continue;
			newChoices.push(itemUuid);
		}

		const dataKey = `system.${choicesKey}`;
		this.item.update({[dataKey]: newChoices});
	}

	/** @inheritdoc */
	async _onChangeInput(event) {

		// Test Effects value change
		// Modify the effect when field is modified
		if (event.target?.id === "effect-change-value") {
			return await this._onEffectChangeValue(event);
		}

		// Test for Predefiend Effects
		// Create effects when added through the predefined effects input
		if (event.target?.name === "predefinedEffects") {
			const key = event.target.value;
			return shadowdark.effects.createPredefinedEffect(this.item, key);
		}

		// Test for Effect Duration Change
		// If the change value is the duration field(s)
		const durationTarget = [
			"system.duration.type",
			"system.duration.value",
		].includes(event.target?.name);

		const durationClassName =
			event.target?.parentElement.id === "effect-duration";

		if (durationTarget && durationClassName) {
			if (event.target.name === "system.duration.value") {
				this.item.system.duration.value = event.target.value;
			}
			await this._onUpdateDurationEffect();
		}

		// Test for multi-choice selector
		// We only have to do something special if we're handling a multi-choice
		// datalist

		const choicesKey = $(event.currentTarget).data("choices-key");
		const isItem = $(event.currentTarget).data("is-item") === "true";
		if (event.target.list && choicesKey) {
			return await this._onChangeChoiceList(event, choicesKey, isItem);
		}

		await super._onChangeInput(event);
	}

	async _onChangeChoiceList(event, choicesKey, isItem) {
		const options = event.target.list.options;
		const value = event.target.value;

		let uuid = null;
		for (const option of options) {
			if (option.value === value) {
				uuid = option.getAttribute("data-uuid");
				break;
			}
		}

		if (uuid === null) return;

		// handles cases where choicesKey is nested property.
		let currentChoices = choicesKey
			.split(".")
			.reduce((obj, path) => obj ? obj[path]: [], this.item.system);

		if (currentChoices.includes(uuid)) return; // No duplicates

		currentChoices.push(uuid);

		const choiceItems = [];
		for (const itemUuid of currentChoices) {
			if (isItem) {
				choiceItems.push(await fromUuid(itemUuid));
			}
			else {
				choiceItems.push(itemUuid);
			}
		}

		if (isItem) {
			choiceItems.sort((a, b) => a.name.localeCompare(b.name));
		}
		else {
			choiceItems.sort((a, b) => a.localeCompare(b));
		}

		const sortedChoiceUuids = isItem
			? choiceItems.map(item => item.uuid)
			: choiceItems;

		return this.item.update({[event.target.name]: sortedChoiceUuids});
	}

	async _onClassTitleAdd(event) {
		if (!this.isEditable) return;

		event.preventDefault();
		event.stopPropagation();

		const titles = this.item.system.titles ?? [];
		const toValues = [0];

		titles.forEach(t => {
			toValues.push(t.to);
		});

		const max = Math.max(...toValues) + 1;

		titles.push({
			from: max,
			to: max + 1,
			lawful: "",
			neutral: "",
			chaotic: "",
		});

		this.item.update({"system.titles": titles});

	}

	async _onClassTitleDelete(event) {
		if (!this.isEditable) return;
		event.preventDefault();
		event.stopPropagation();

		const index = Number.parseInt(event.currentTarget.dataset.index);
		const titles = this.item.system.titles ?? [];
		const newTitles = [];

		for (let i = 0; i < titles.length; i++) {
			if (index === i) continue;
			newTitles.push(titles[i]);
		}

		this.item.update({"system.titles": newTitles});
	}

	async _onEffectChangeValue(event) {
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

		return await super._onChangeInput(event);
	}

	/** @inheritdoc */
	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);

		switch (data.type) {
			case "Item":
				return this._onDropItemSD(event, data);
			case "RollTable":
				return this._onDropTable(event, data);
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

	async _onDropTable(event, data) {
		if (this.item.type === "Ancestry") {
			this.item.update({"system.nameTable": data.uuid});
		}
	}

	async _onRemoveTable(event, data) {
		this.item.update({"system.nameTable": ""});
	}

	_onItemSelection(event) {
		event.preventDefault();

		const itemType = event.currentTarget.dataset.itemType;
		const selectType = event.currentTarget.dataset.selectType;

		switch (selectType) {
			case "itemProperty":
				if (itemType === "armor") {
					new select.ArmorPropertySelector(this.item).render(true);
				}
				else if (itemType === "weapon") {
					new select.WeaponPropertySelector(this.item).render(true);
				}


				break;
		}
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

	/** @inheritdoc */
	_onSubmit(event) {
		if (!this.isEditable) return;

		switch (this.item.type) {
			case "Ancestry": {
				const updateData = this._getSubmitData();

				delete updateData["system.languages.fixed"];
				delete updateData["system.languages.selectOptions"];
				delete updateData["system.talents"];

				this.item.update(updateData);
				break;
			}
			case "Class": {
				const updateData = this._getSubmitData();

				delete updateData["system.armor"];
				delete updateData["system.languages.fixed"];
				delete updateData["system.languages.selectOptions"];
				delete updateData["system.talentChoices"];
				delete updateData["system.talents"];
				delete updateData["system.weapons"];

				const titles = [];
				if (Array.isArray(updateData["title.from"])) {
					for (let i = 0; i < updateData["title.from"].length; i++) {
						titles.push({
							to: updateData["title.to"][i],
							from: updateData["title.from"][i],
							chaotic: updateData["title.chaotic"][i],
							lawful: updateData["title.lawful"][i],
							neutral: updateData["title.neutral"][i],
						});
					}

					titles.sort((a, b) => a.from - b.from);
				}
				else {
					titles.push({
						to: updateData["title.to"],
						from: updateData["title.from"],
						chaotic: updateData["title.chaotic"],
						lawful: updateData["title.lawful"],
						neutral: updateData["title.neutral"],
					});
				}

				updateData["system.titles"] = titles;

				["to", "from", "chaotic", "lawful", "neutral"].forEach(key => {
					delete updateData[`title.${key}`];
				});

				this.item.update(updateData);
				break;
			}
			case "Scroll":
			case "Spell":
			case "Wand": {
				const updateData = this._getSubmitData();

				delete updateData["system.class"];

				this.item.update(updateData);
				break;
			}
			default:
				super._onSubmit(event);
		}
	}

	_onTalentTypeProperties(event) {
		event.preventDefault();

		if (!this.isEditable) return;

		new shadowdark.apps.TalentTypesSD(
			this.item, {event: event}
		).render(true);
	}

	async _onUpdateDurationEffect() {
		if (!this.isEditable) return;
		this.item.effects.map(e => e.update({duration: this._getDuration()}));
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

	async _updateObject(event, formData) {
		// convert light remain from minutes to secsonds for update
		if (formData["system.light.remainingSecs"]) {
			formData["system.light.remainingSecs"] = formData["system.light.remainingSecs"] * 60;
		}
		super._updateObject(event, formData);
	}
}
