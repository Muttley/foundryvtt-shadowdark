export default class RollDialogSD extends foundry.applications.api.HandlebarsApplicationMixin(
	foundry.applications.api.ApplicationV2
) {

	static DEFAULT_OPTIONS = {
		id: "sd-roll-dialog",
		tag: "form",
		window: {
			resizable: false,
		},
		position: {
			width: 380,
		},
		form: {
			closeOnSubmit: false,
		},
	};

	static PARTS = {
		form: {
			template: "systems/shadowdark/templates/dialog/roll.hbs",
		},
		footer: {
			template: "systems/shadowdark/templates/dialog/roll-footer.hbs",
		},
	};

	constructor(config, dataFunction=null, options = {}) {
		super(options);
		this.config = config;
		this.dataFunction = dataFunction;
		this.submitted = false;
	}

	/** @override */
	get title() {
		return this.config.type ?? "";
	}

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		context.heading = this.config.heading;

		// Main Roll
		if (this.config?.mainRoll?.formula) {
			context.mainRoll = {
				label: this.config.mainRoll.label,
				key: "mainRoll.formula",
				tooltip: this.config.mainRoll.tooltips,
				formula: this.config.mainRoll.formula,
			};
		}

		// advantage
		if (this.config?.mainRoll) {
			const currentAdvantage = this.config.mainRoll.advantage ?? 0;
			context.advantageOptions = [
				{
					value: "1",
					label: game.i18n.localize("SHADOWDARK.roll.advantage"),
					checked: currentAdvantage === 1,
				},
				{
					value: "0",
					label: game.i18n.localize("SHADOWDARK.roll.normal"),
					checked: currentAdvantage === 0,
				},
				{
					value: "-1",
					label: game.i18n.localize("SHADOWDARK.roll.disadvantage"),
					checked: currentAdvantage === -1,
				},
			];
		}

		// Damage Roll
		if (this.config?.damageRoll?.formula) {
			context.damageRoll = {
				label: this.config.damageRoll.label,
				key: "damageRoll.formula",
				tooltip: this.config.damageRoll.tooltips,
				formula: this.config.damageRoll.formula,
			};
		}

		// Prepare situational options
		context.situationalOptions = [];
		if (this.config.situational?.length > 0) {
			for (const uuid of this.config.situational) {
				const effect = await fromUuid(uuid);
				// Check if this option is in the selected array
				const isSelected = this.config.selected?.includes(uuid) ?? false;
				context.situationalOptions.push({
					name: effect.parent.name,
					description: shadowdark.utils.removeHTML(effect.description),
					key: uuid,
					selected: isSelected,
				});
			}
		}

		// roll modes
		context.rollMode = this.config.rollMode;
		context.rollModes = CONFIG.Dice.rollModes;

		await Hooks.call("SD-Roll-Dialog", context);

		return context;
	}

	/** @override */
	_onRender(context, options) {
		super._onRender(context, options);

		// Add submit listener to the form for the roll button
		this.element.addEventListener("submit", this._onSubmit.bind(this));

		// Prevent form submission on Enter key press
		this.element.addEventListener("keydown", event => {
			if (event.key === "Enter") {
				event.preventDefault();
			}
		});

		// Add change listeners to situational effect checkboxes
		const checkboxes = this.element.querySelectorAll('input[type="checkbox"][name="selected"]');
		checkboxes.forEach(checkbox => {
			checkbox.addEventListener("change", this._onCheckboxChange.bind(this));
		});
	}

	/**
	 * Handle situational checkbox changes
	 */
	async _onCheckboxChange() {
		// Get current selected values
		const formData = new FormDataExtended(this.element).object;
		const selectedArray = formData.selected
			? (Array.isArray(formData.selected) ? formData.selected : [formData.selected])
			: [];

		this.config.selected = selectedArray;

		// Run dataFunction to regenerate config
		if (typeof this.dataFunction === "function") {
			await this.dataFunction();
			// Re-render the dialog with updated config
			await this.render(true);
		}
	}

	/**
	 * Handle form submission - only for the roll button
	 * @param {Event} event - The submit event
	 */
	_onSubmit(event) {
		event.preventDefault();

		// Get form data - this.element is the form since tag is "form"
		const formData = new foundry.applications.ux.FormDataExtended(this.element).object;

		// Update config.mainRoll.formula if present
		if (formData["mainRoll.formula"] !== undefined && this.config?.mainRoll) {
			this.config.mainRoll.formula = formData["mainRoll.formula"];
		}

		// Update config.damageRoll.formula if present
		if (formData["damageRoll.formula"] !== undefined && this.config?.damageRoll) {
			this.config.damageRoll.formula = formData["damageRoll.formula"];
		}

		// Convert advantage string to number and update config
		if (formData.advantage !== undefined) {
			const advantageValue = parseInt(formData.advantage);
			formData["mainRoll.advantage"] = advantageValue;
			delete formData.advantage;

			// Update config.mainRoll.advantage
			if (this.config?.mainRoll) {
				this.config.mainRoll.advantage = advantageValue;
			}
		}

		this.result = formData;
		this.submitted = true;

		this.close();
	}
}
