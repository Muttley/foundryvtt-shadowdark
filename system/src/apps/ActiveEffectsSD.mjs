export default class ActiveEffectsSD extends FormApplication {
	constructor(object, options) {
		super(object, options);

		this.effects = {};

		for (const [key] of Object.entries(options.data)) {
			this.effects[key] = {
				selected: false,
				title: this.options.data[key],
				id: "",
			};
		}

		const values = this.object.effects.contents.filter(ae => !ae.disabled);

		for (const key of values) {
			if (Object.keys(this.effects).includes(key.label)) {
				this.effects[key.label].selected = true;
				this.effects[key.label].id = key._id;
			}
		}
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "active-effects"],
			height: "auto",
			resizable: false,
			width: "auto",
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/active-effects.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.active_effects.title");
		return `${title}: ${this.object.name}`;
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".effect").click(
			event => this._onEffectSelect(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		return {effects: this.effects};
	}

	async _onEffectSelect(event) {
		event.preventDefault();

		const button = $(event.currentTarget);
		const effect = button.attr("data-property");

		this.effects[effect].selected = !this.effects[effect].selected;

		if (this.effects[effect].selected) {
			button.addClass("selected");
		}
		else {
			button.removeClass("selected");
		}
	}

	async _updateObject(event, formData) {
		this.object.sheet.render(true);
	}
}
