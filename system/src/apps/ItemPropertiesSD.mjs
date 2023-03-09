export default class ItemPropertiesSD extends FormApplication {
	constructor(object, options, properties) {
		super(object, options);

		this.properties = {};

		for (const [key] of Object.entries(properties)) {
			this.properties[key] = {
				selected: false,
				title: properties[key],
			};
		}

		for (const key of this.object.system.properties) {
			this.properties[key].selected = true;
		}
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "item-properties"],
			height: "auto",
			resizable: false,
			width: "auto",
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/item-properties.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.item-properties.title");
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
