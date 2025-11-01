import PlayerSheetSD from "./PlayerSheetSD.mjs";
import * as select from "../apps/CompendiumItemSelectors/_module.mjs";

export default class VehicleSheetSD extends PlayerSheetSD {
	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark", "sheet", "vehicle"],
			scrollY: ["section.SD-content-body"],
			width: 600,
			height: 700,
			resizable: true,
			tabs: [
				{
					navSelector: ".SD-nav",
					contentSelector: ".SD-content-body",
					initial: "tab-details",
				},
			],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/actors/vehicle.hbs";
	}

	/** @inheritdoc */
	async getData(options) {
		const context = await super.getData(options);

		// Prepare the inventory using PlayerSheetSD's method
		await this._prepareItems(context);

		// Add passengers to gear slots.
		const passengerSlots =
			(this.actor.system.passengers ?? 0)
			* (this.actor.system.attributes.slotsPerPassenger ?? 0);

		context.slots = {
			...context.slots,
			passengers: passengerSlots,
			total: context.slots.total + passengerSlots,
		};

		// Add vehicle-specific data
		context.propertyItems = await this.actor.vehiclePropertyItems();

		return context;
	}

	/** @inheritdoc */
	activateListeners(html) {
		html
			.find(".property-selector")
			.click(event => this._onPropertySelection(event));

		html
			.find("[data-action='split-one']")
			.click(event => this._onSplitOne(event));

		// Handle default listeners last so system listeners are triggered first
		super.activateListeners(html);
	}

	_onPropertySelection(event) {
		event.preventDefault();
		new select.VehiclePropertySelector(this.actor).render(true);
	}

	async _onSplitOne(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);
		const toDecrement = item.system.slots.per_slot;

		if (item.system.quantity <= toDecrement) {
			// Nothing to split;
			return;
		}

		// Decrement quantity.
		await this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": itemId,
				"system.quantity": item.system.quantity - toDecrement,
			},
		]);

		// Add a cloned item with reset quantity.
		const newItem = item.clone({ system: { quantity: toDecrement } });
		await this.actor.createEmbeddedDocuments("Item", [newItem]);
	}

	// Override to remove per_slot limit, enabling unlimited stacking.
	//
	// Vehicles can stack unlimited quantities of the same item type (e.g., 50
	// torches in a single stack) rather than being limited by per_slot values.
	// This simplifies bulk cargo management for vehicles.
	//
	// Caveat: Turning lights on/off doesn't work with large stacks, as the torch
	// timer would affect all lights in the stack. Likewise, potions do not work
	// since all items would be consumed. Use the "split one" feature to separate
	// individual items for use.
	/** @override */
	async _onItemQuantityIncrement(event) {
		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		await this.actor.updateEmbeddedDocuments("Item", [
			{
				"_id": itemId,
				"system.quantity": item.system.quantity + 1,
			},
		]);
	}

	// Override to auto-remove when quantity is low.
	//
	// TODO: Consider making this the default in PlayerSheetSD.mjs
	/** @override */
	async _onItemQuantityDecrement(event) {
		event.preventDefault();

		const itemId = $(event.currentTarget).data("item-id");
		const item = this.actor.getEmbeddedDocument("Item", itemId);

		if (item.system.quantity <= 1) {
			// Remove empty stack of items.
			this.actor.deleteEmbeddedDocuments("Item", [itemId]);
		}
		else {
			// Otherwise decrement quantity.
			this.actor.updateEmbeddedDocuments("Item", [
				{
					"_id": itemId,
					"system.quantity": item.system.quantity - 1,
				},
			]);
		}
	}

	/** @override */
	async _updateObject(event, formData) {
		super._updateObject(event, formData);
	}
}
