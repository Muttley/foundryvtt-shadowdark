export default class ItemSheetSD extends ItemSheet {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			width: 550,
			height: 560,
			classes: ["shadowdark", "sheet", "item"],
			resizable: true,
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

		html.find(".item-property-list.spell").click(
			event => this._onSpellCasterClasses(event)
		);

		html.find(".item-property-list.weapon").click(
			event => this._onWeaponProperties(event)
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
			source: source.system,
			system: item.system,
			usesSlots: item.system.slots !== undefined,
		});

		context.propertiesDisplay = item.propertiesDisplay();

		if (item.type === "Spell") {
			context.casterClasses = [];

			context.showRoundValue = item.system.duration.type === "rounds";

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

	_onArmorProperties(event) {
		event.preventDefault();

		new shadowdark.apps.ArmorPropertiesSD(
			this.item, {event: event}
		).render(true);
	}

	_onSpellCasterClasses(event) {
		event.preventDefault();

		new shadowdark.apps.SpellCasterClassSD(
			this.item, {event: event}
		).render(true);
	}

	_onWeaponProperties(event) {
		event.preventDefault();

		new shadowdark.apps.WeaponPropertiesSD(
			this.item, {event: event}
		).render(true);
	}
}
