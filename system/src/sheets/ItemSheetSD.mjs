import ActiveEffectSD from "../documents/ActiveEffectSD.mjs";

export default class ItemSheetSD extends ItemSheet {

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

		html.find(".effect-control").click(ev => {
			ActiveEffectSD.onManageActiveEffect(ev, this.item);
		});

		html.find(".item-property-list.talent-type").click(
			event => this._onTalentTypeProperties(event)
		);

		html.find(".item-property-list.magic-type").click(
			event => this._onMagicItemTypeProperties(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}


	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		const item = context.item;
		const source = item.toObject();

		foundry.utils.mergeObject(context, {
			config: CONFIG.SHADOWDARK,
			hasCost: item.system.cost !== undefined,
			itemType: game.i18n.localize(`SHADOWDARK.item.type.${item.type}`),
			properties: [],
			propertiesDisplay: "",
			magicItemEffectsDisplay: "",
			talentEffectsDisplay: "",
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
		context.magicItemEffectsDisplay = item.magicItemEffectsDisplay();
		context.talentEffectsDisplay = item.talentEffectsDisplay();
		if (item.type === "Talent" || item.type === "Spell" || item.isMagicItem()) {
			// Effects
			context.effects = ActiveEffectSD.prepareActiveEffectCategories(item.effects, item);
		}

		if (item.type === "Spell") {
			context.casterClasses = [];

			context.showRoundValue = CONFIG.SHADOWDARK.VARIABLE_SPELL_DURATIONS
				.includes(item.system.duration.type);

			for (const key of this.item.system.class) {
				context.casterClasses.push(
					CONFIG.SHADOWDARK.SPELL_CASTER_CLASSES[key]
				);
			}

			context.casterClassesDisplay = context.casterClasses.join(", ");

			context.effects.talent.hidden = true;
			context.effects.item.hidden = true;
			context.effects.temporary.hidden = true;
		}

		context.descriptionHTML = await TextEditor.enrichHTML(
			context.system.description,
			{
				async: true,
			}
		);

		return context;
	}

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

	_updateObject(event, formData) {
		// Manage changes to ActiveEffects
		if (this.item.type === "Talent" || this.item.isMagicItem()) {
			ActiveEffectSD.onChangeActiveEffect(event, this.item);
		}

		super._updateObject(event, formData);
	}


}
