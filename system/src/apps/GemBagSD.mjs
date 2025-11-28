export default class GemBagSD extends foundry.appv1.api.Application {
	constructor(object, options) {
		super(object, options);

		this.actor = object;
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark"],
			height: "auto",
			resizable: true,
			width: 400,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/gem-bag.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.gem_bag.title");
		return `${title}: ${this.actor.name}`;
	}

	/** @inheritdoc */
	activateListeners(html) {

		html.find("[data-action='sell-all-gems']").click(
			event => this._onSellAllGems(event)
		);

		html.find("[data-action='sell-gem']").click(
			event => this._onSellGem(event)
		);

		html.find("[data-action='item-create']").click(
			event => this._onItemCreate(event)
		);

		html.find("[data-action='show-details']").click(
			event => shadowdark.utils.toggleItemDetails(event.currentTarget)
		);

		// Create context menu for items on both sheets
		this._contextMenu(html.get(0));

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const items = this.getGems();
		const totals = this.getGemValueTotal(items);
		const actor = this.actor;

		return {items, totals, actor};
	}

	gemBagIsEmpty() {
		return this.getGems().length === 0;
	}

	getGems() {
		return this.actor.items.filter(item => item.type === "Gem");
	}

	getGemValueTotal(items) {
		const totals = {
			system: {
				cost: {
					gp: 0,
					sp: 0,
					cp: 0,
				},
				quantity: 1,
			},
		};

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			totals.system.cost.gp += item.system.cost.gp;
			totals.system.cost.sp += item.system.cost.sp;
			totals.system.cost.cp += item.system.cost.cp;
		}

		return totals;
	}

	_contextMenu(html) {
		new foundry.applications.ux.ContextMenu.implementation(
			html,
			".item",
			this._getItemContextOptions(),
			{jQuery: false}
		);
	}

	_getItemContextOptions() {
		const me = this;

		const canEdit = function(element) {
			let result = false;
			const itemId = element.dataset.itemId;

			if (game.user.isGM) {
				result = true;
			}
			else {
				result = me.actor.items.find(item => item._id === itemId)
					? true
					: false;
			}

			return result;
		};

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_edit.title"),
				icon: '<i class="fas fa-edit"></i>',
				condition: element => canEdit(element),
				callback: element => {
					const itemId = element.dataset.itemId;
					const item = this.actor.items.get(itemId);
					return item.sheet.render(true);
				},
			},
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"),
				icon: '<i class="fas fa-trash"></i>',
				condition: element => canEdit(element),
				callback: element => {
					const itemId = element.dataset.itemId;
					this._onItemDelete(itemId);
				},
			},
		];
	}

	async _onItemCreate(event) {
		event.preventDefault();

		const [newItem] = await this.actor.createEmbeddedDocuments("Item", [{
			name: "New Gem",
			type: "Gem",
		}]);
		newItem.sheet.render(true);
	}

	_onItemDelete(itemId) {
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		renderTemplate(
			"systems/shadowdark/templates/dialog/delete-item.hbs",
			{name: itemData.name}
		).then(html => {
			new Dialog({
				title: `${game.i18n.localize("SHADOWDARK.dialog.item.confirm_delete")}`,
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							await this.actor.deleteEmbeddedDocuments(
								"Item",
								[itemId]
							);
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					},
				},
				default: "Yes",
			}).render(true);
		});
	}

	_onSellGem(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		const actor = this.actor;

		renderTemplate(
			"systems/shadowdark/templates/dialog/sell-item.hbs",
			{name: itemData.name}
		).then(html => {
			new Dialog({
				title: `${game.i18n.localize("SHADOWDARK.dialog.item.confirm_sale")}`,
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							await actor.system.sellItemById(itemId);

							if (this.gemBagIsEmpty()) {
								this.close();
							}
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					},
				},
				default: "Yes",
			}).render(true);
		});
	}

	_onSellAllGems(event) {
		event.preventDefault();

		renderTemplate(
			"systems/shadowdark/templates/dialog/sell-all-items.hbs",
			{name: "Gems"}
		).then(html => {
			new Dialog({
				title: `${game.i18n.localize("SHADOWDARK.dialog.item.confirm_sale")}`,
				content: html,
				buttons: {
					Yes: {
						icon: "<i class=\"fa fa-check\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
						callback: async () => {
							this.actor.system.sellAllGems();
							this.close();
						},
					},
					Cancel: {
						icon: "<i class=\"fa fa-times\"></i>",
						label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
					},
				},
				default: "Yes",
			}).render(true);
		});
	}
}
