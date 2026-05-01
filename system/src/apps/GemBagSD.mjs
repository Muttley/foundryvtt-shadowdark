export default class GemBagSD extends foundry.applications.api.HandlebarsApplicationMixin(
	foundry.applications.api.ApplicationV2
) {
	constructor(actor, options = {}) {
		super(options);
		this.actor = actor;
	}

	static DEFAULT_OPTIONS = {
		classes: ["shadowdark-app", "shadowdark-gem-bag"],
		position: { width: 400, height: "auto" },
		window: {
			resizable: true,
			contentClasses: ["shadowdark", "gem-bag"],
		},
		actions: {
			"sell-all-gems": GemBagSD.prototype._onSellAllGems,
			"sell-gem": GemBagSD.prototype._onSellGem,
			"item-create": GemBagSD.prototype._onItemCreate,
			"show-details": GemBagSD.prototype._onShowDetails,
		},
	};

	static PARTS = {
		content: {
			template: "systems/shadowdark/templates/apps/gem-bag.hbs",
		},
	};

	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.gem_bag.title");
		return `${title}: ${this.actor.name}`;
	}

	async _prepareContext(options) {
		const items = this.getGems();
		const totals = this.getGemValueTotal(items);
		return { items, totals, actor: this.actor };
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		// Enable right-clicking a gem to edit / delete it.
		this._contextMenu(this.element);
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

		for (const item of items) {
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
		const canEdit = element => {
			const itemId = element.dataset.itemId;
			if (game.user.isGM) return true;
			return !!this.actor.items.find(item => item._id === itemId);
		};

		return [
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_edit.title"),
				icon: '<i class="fas fa-edit"></i>',
				condition: canEdit,
				callback: element => {
					const itemId = element.dataset.itemId;
					const item = this.actor.items.get(itemId);
					return item.sheet.render(true);
				},
			},
			{
				name: game.i18n.localize("SHADOWDARK.sheet.general.item_delete.title"),
				icon: '<i class="fas fa-trash"></i>',
				condition: canEdit,
				callback: element => {
					const itemId = element.dataset.itemId;
					this._onItemDelete(itemId);
				},
			},
		];
	}

	_onShowDetails(event, target) {
		shadowdark.utils.toggleItemDetails(target);
	}

	async _onItemCreate(event, target) {
		event.preventDefault();
		const [newItem] = await this.actor.createEmbeddedDocuments("Item", [{
			name: "New Gem",
			type: "Gem",
		}]);
		newItem.sheet.render(true);
	}

	_onItemDelete(itemId) {
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);

		foundry.applications.handlebars.renderTemplate(
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

	_onSellGem(event, target) {
		event.preventDefault();

		const itemId = target.dataset.itemId;
		const itemData = this.actor.getEmbeddedDocument("Item", itemId);
		const actor = this.actor;

		foundry.applications.handlebars.renderTemplate(
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

	_onSellAllGems(event, target) {
		event.preventDefault();

		foundry.applications.handlebars.renderTemplate(
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
							await this.actor.system.sellAllGems();
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
