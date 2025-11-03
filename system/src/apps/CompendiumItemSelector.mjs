export default class CompendiumItemSelector extends foundry.appv1.api.FormApplication {
	closeOnSelection = false;

	maxChoices = 0;

	itemsLoaded = false;

	uuid = foundry.utils.randomID();

	static get defaultOptions() {
		const options = super.defaultOptions;

		foundry.utils.mergeObject(options, {
			classes: ["shadowdark"],
			height: "auto",
			width: 320,
			closeOnSubmit: false,
			submitOnChange: true,
		});

		return options;
	}

	get prompt() {
		return game.i18n.localize("SHADOWDARK.dialog.type_here");
	}

	get template() {
		return "systems/shadowdark/templates/apps/compendium-item-selector.hbs";
	}

	get title() {
		return game.i18n.localize("SHADOWDARK.dialog.item_selector.default_title");
	}

	async _autoCloseWhenRendered() {
		while (!this.rendered) {
			await shadowdark.utils.sleep(100); // millisecs
		}

		this.close({force: true});
	}

	async _getAvailableItems() {
		const loadingDialog = new shadowdark.apps.LoadingSD().render(true);

		const availableItems = await this.getAvailableItems() ?? [];
		this.itemsLoaded = true;

		const itemsAvailable = availableItems?.size > 0 ?? false;

		if (itemsAvailable) {
			for (const item of availableItems) {
				item.decoratedName = await this.decorateName(item);
			}

			this.availableItems = Array.from(availableItems).sort(
				(a, b) => a.name.localeCompare(b.name)
			);
		}
		else {
			ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.dialog.item_selector.error.no_items_found")
			);

			this._autoCloseWhenRendered();
		}

		loadingDialog.close({force: true});
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

	async getCurrentItemData() {
		this.currentItemUuids = await this.getUuids() ?? [];
		this.currentItems = await this.getCurrentItems() ?? [];
	}

	async getCurrentItems() {
		const items = [];
		for (const uuid of this.currentItemUuids) {
			const item = await fromUuid(uuid);
			item.decoratedName = await this.decorateName(item);
			items.push(item);
		}

		return items.sort((a, b) => a.name.localeCompare(b.name));
	}

	async getData() {
		if (!this.itemsLoaded) {
			await this._getAvailableItems();
		}

		await this.getCurrentItemData();

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
