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
			armorBonusAttributes: CONFIG.SHADOWDARK.ARMOR_BONUS_ATTRIBUTES,
			armorProperties: CONFIG.SHADOWDARK.ARMOR_PROPERTIES,
			hasCost: item.system.cost !== undefined,
			itemType: game.i18n.localize(`SHADOWDARK.item.type.${item.type}`),
			properties: [],
			propertiesDisplay: "",
			ranges: CONFIG.SHADOWDARK.RANGES,
			source: source.system,

			system: item.system,
			usesSlots: item.system.slots !== undefined,
			weaponBaseDamageDice: CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE,
			weaponProperties: CONFIG.SHADOWDARK.WEAPON_PROPERTIES,
			weaponTypes: CONFIG.SHADOWDARK.WEAPON_TYPES,
		});

		context.propertiesDisplay = item.propertiesDisplay();

		// if (item.type === "Armor" || item.type === "Weapon") {
		// 	for (const key of this.item.system.properties) {
		// 		if (item.type === "Armor") {
		// 			context.properties.push(context.armorProperties[key]);
		// 		}
		// 		else if (item.type === "Weapon") {
		// 			context.properties.push(context.weaponProperties[key]);
		// 		}
		// 	}

		// 	context.propertiesDisplay = context.properties.join(", ");
		// }

		if (item.type === "Spell") {
			context.casterClasses = [];

			context.spellCasterClasses = CONFIG.SHADOWDARK.SPELL_CASTER_CLASSES;
			context.spellDurations = CONFIG.SHADOWDARK.SPELL_DURATIONS;
			context.spellRanges = CONFIG.SHADOWDARK.SPELL_RANGES;

			context.showRoundValue = item.system.duration.type === "rounds";

			for (const key of this.item.system.class) {
				context.casterClasses.push(context.spellCasterClasses[key]);
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
