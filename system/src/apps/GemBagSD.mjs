export default class GemBagSD extends Application {
	constructor(object, options) {
		super(object, options);

		this.actor = object;
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "gem-bag"],
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
		const title = game.i18n.localize("SHADOWDARK.app.gem-bag.title");
		return `${title}: ${this.actor.name}`;
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".open-item").click(
			event => this._onOpenItem(event)
		);

		html.find(".sell-all-button").click(
			event => this._onSellAllGems(event)
		);

		html.find(".sell-gem").click(
			event => this._onSellGem(event)
		);

		// Create context menu for items on both sheets
		this._contextMenu(html);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const items = this.actor.items.filter(item => item.type === "Gem");
		const totals = this.getGemValueTotal(items);

		return {items, totals};
	}

	getGemValueTotal(items) {
		const totals = {gp: 0, sp: 0, cp: 0};

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			totals.gp += item.system.cost.gp;
			totals.sp += item.system.cost.sp;
			totals.cp += item.system.cost.cp;
		}

		return totals;
	}

	_contextMenu(html) {
		ContextMenu.create(this, html, ".item", this._getItemContextOptions());
	}

	_getItemContextOptions() {
		const canEdit = function(tr) {
			let result = false;
			const itemId = tr.data("item-id");

			if (game.user.isGM) {
				result = true;
			}
			else {
				result = this.actor.items.find(item => item._id === itemId)
					? true
					: false;
			}

			return result;
		};

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"),
				icon: '<i class="fas fa-trash"></i>',
				condition: tr => canEdit(tr),
				callback: tr => {
					const itemId = tr.data("item-id");
					this._onItemDelete(itemId);
				},
			},
		];
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
							this.actor.deleteEmbeddedDocuments(
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

	async _onOpenItem(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.items.get(itemId);

		return item.sheet.render(true);
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
							actor.sellItemById(itemId);
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
							this.actor.sellAllGems();
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
