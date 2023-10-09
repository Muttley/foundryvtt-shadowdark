export default class CompendiumItemSelector extends FormApplication {

	closeOnSelection = false;

	maxChoices = 0;

	uuid = randomID();

	static get defaultOptions() {
		const options = super.defaultOptions;

		mergeObject(options, {
			classes: ["shadowdark", "compendium-item-selector"],
			height: "auto",
			width: 320,
			closeOnSubmit: false,
			submitOnChange: true,
		});

		return options;
	}

	get prompt() {
		return game.i18n.localize("SHADOWDARK.dialog.item_selector.select_item.prompt");
	}

	get template() {
		return "systems/shadowdark/templates/apps/compendium-item-selector.hbs";
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.item_selector.default_title");
	}

	activateListeners(html) {
		html.find(".remove-item").click(event => this._onRemoveItem(event));

		super.activateListeners(html);
	}

	async decorateName(item) {
		// By default we just use the name, but this can be overriden by each
		// selector class if needed
		return item.name;
	}

	async getAllItemData() {
		this.availableItems = await this.getAvailableItems() ?? [];
		this.currentItemUuids = await this.getUuids() ?? [];
		this.currentItems = await this.getCurrentItems() ?? [];

		for (const item of this.availableItems) {
			item.decoratedName = await this.decorateName(item);
		}
	}

	async getCurrentItems() {
		const items = [];
		for (const uuid of this.currentItemUuids) {
			const item = await fromUuid(uuid);
			items.push(item);
		}

		return items.sort((a, b) => a.name.localeCompare(b.name));
	}

	async getData() {
		await this.getAllItemData();

		const data = {
			currentItems: this.currentItems,
			itemChoices: [],
			prompt: this.prompt,
			uuid: this.uuid,
		};

		// Don"t include already selected items
		for (const item of this.availableItems) {
			if (!this.currentItemUuids.includes(item.uuid)) {
				data.itemChoices.push(item);
			}
		}

		return data;
	}

	async _onRemoveItem(event) {
		event.preventDefault();
		event.stopPropagation();

		let itemIndex = $(event.currentTarget).data("item-index");

		const newItemUuids = [];

		for (let i = 0; i < this.currentItems.length; i++) {
			if (itemIndex === i) continue;
			newItemUuids.push(this.currentItems[i].uuid);
		}

		await this._saveUuids(newItemUuids);
	}

	async _saveUuids(uuids) {
		await this.saveUuids(uuids);

		this.render(false);
	}

	async _updateObject(event, formData) {
		let newUuids = this.currentItemUuids;

		const currentItemCount = this.currentItemUuids.length;
		if (this.maxChoices === 1 && currentItemCount === 1 && formData["item-selected"] !== "") {
			for (const item of this.availableItems) {
				if (item.decoratedName === formData["item-selected"]) {
					newUuids = [item.uuid];
					break;
				}
			}

			await this._saveUuids(newUuids);
		}
		else if (this.maxChoices === 0 || this.maxChoices > currentItemCount) {
			for (const item of this.availableItems) {
				if (item.decoratedName === formData["item-selected"]) {
					newUuids.push(item.uuid);
					break;
				}
			}

			await this._saveUuids(newUuids);
		}
		else {
			ui.notifications.warn(
				game.i18n.format("SHADOWDARK.dialog.item_selector.error.max_choices_exceeded",
					{maxChoices: this.maxChoices}
				)
			);

			return this.render(true);
		}

		if (this.closeOnSelection) this.close({force: true});
	}
}
