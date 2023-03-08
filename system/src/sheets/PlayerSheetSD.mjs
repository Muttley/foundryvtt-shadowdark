import ActorSheetSD from "./ActorSheetSD.mjs";

export default class PlayerSheetSD extends ActorSheetSD {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "player"],
			width: 560,
			height: 560,
			resizable: true,
			tabs: [
				{
					navSelector: ".player-navigation",
					contentSelector: ".player-body",
					initial: "pc-tab-abilities",
				},
			],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/player.hbs";
	}

	/** @inheritdoc */
	activateListeners(html) {
		html.find(".ability-name").click(this._onRollAbilityTest.bind(this));

		html.find(".item-quantity-decrement").click(
			event => this._onItemQuantityDecrement(event)
		);

		html.find(".item-quantity-increment").click(
			event => this._onItemQuantityIncrement(event)
		);

		html.find(".item-toggle-equipped").click(
			event => this._onToggleEquipped(event)
		);

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	/** @override */
	async getData(options) {
		const context = await super.getData(options);

		context.gearSlots = this.actor.numGearSlots();
		context.xpNextLevel = context.system.level.value * 10;

		this._prepareItems(context);

		return context;
	}

	_onItemQuantityDecrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity > 0) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					_id: itemId,
					"system.quantity": item.system.quantity - 1,
				},
			]);
		}
	}

	_onItemQuantityIncrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity < item.system.slots.per_slot) {
			this.actor.updateEmbeddedDocuments("Item", [
				{
					_id: itemId,
					"system.quantity": item.system.quantity + 1,
				},
			]);
		}
	}

	_onRollAbilityTest(event) {
		event.preventDefault();
		let ability = event.currentTarget.parentElement.dataset.ability;
		this.actor.rollAbility(ability, {event: event});
	}

	_onToggleEquipped(event) {
		event.preventDefault();
		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);
		this.actor.updateEmbeddedDocuments("Item", [
			{
				_id: itemId,
				"system.equipped": !item.system.equipped,
			},
		]);
	}

	_prepareItems(context) {
		const gems = [];
		const inventory = [];
		const spells = [];
		const talents = [];

		const allItems = this._sortAllItems(context);

		let slotCount = 0;

		for (const i of allItems) {
			if (i.type === "Armor" || i.type === "Basic" || i.type === "Weapon") {
				i.showQuantity = i.system.slots.per_slot > 1 ? true : false;

				i.slotsUsed = (
					Math.ceil(
						i.system.quantity / i.system.slots.per_slot
					)
					* i.system.slots.slots_used
				) - (i.system.slots.free_carry * i.system.slots.slots_used);

				slotCount += i.slotsUsed;

				inventory.push(i);
			}
			else if (i.type === "Gem") {
				gems.push(i);
			}
			else if (i.type === "Spell") {
				spells.push(i);
			}
			else if (i.type === "Talent") {
				talents.push(i);
			}
		}

		context.inventory = inventory;
		context.spells = spells;
		context.talents = talents;
		context.slotsUsed = slotCount;
	}

	_sortAllItems(context) {
		// Pre-sort all items so that when they are filtered into their relevant
		// categories they are already sorted alphabetically (case-sensitive)
		const allItems = [];
		(context.items ?? []).forEach(item => allItems.push(item));

		allItems.sort((a, b) => {
			if (a.name < b.name) {
				return -1;
			}
			if (a.name > b.name) {
				return 1;
			}
			return 0;
		});

		return allItems;
	}
}
