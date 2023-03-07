export default class WeaponPropertiesSD extends FormApplication {

	constructor(object, options) {
		super(object, options);

		this.properties = {};

		const weaponProperties = CONFIG.SHADOWDARK.WEAPON_PROPERTIES;
		for (const [key] of Object.entries(weaponProperties)) {
			this.properties[key] = {
				selected: false,
				title: weaponProperties[key],
			};
		}

		for (const key of this.object.system.properties) {
			this.properties[key].selected = true;
		}
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "weapon-properties"],
			height: "auto",
			resizable: false,
			width: 250,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/weapon-properties.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.weapon-properties.title");
		return `${title}: ${this.object.name}`;
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".property").click(
			event => this._onPropertySelect(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		return {properties: this.properties};
	}

	async _onPropertySelect(event) {
		event.preventDefault();

		const button = $(event.currentTarget);
    	const property = button.attr("data-property");

		this.properties[property].selected = !this.properties[property].selected;

		if (this.properties[property].selected) {
			button.addClass("selected");
		}
		else {
			button.removeClass("selected");
		}
	}

	_updateObject(event, formData) {
		const selectedProperties = [];

		for (const [key, value] of Object.entries(this.properties)) {
			if (value.selected) {
				selectedProperties.push(key);
			}
		}

		this.object.update({"system.properties": selectedProperties});
	}
}
