export function ItemPilesSetup() {

	Hooks.once("item-piles-ready", async () => {

		// VERSIONS can define different configurations for differnt system versions
		// matches to specific system version, ie 4.0.0 or uses latest
		const VERSIONS = {
			latest: {

				VERSION: "1.1", // Version of the Item Piles settings enforced. Increase when updating.

				// The actor class type is the type of actor that will be used for
				// the default item pile actor that is created on first item drop.
				ACTOR_CLASS_TYPE: "Player",

				// The item class type is the type of item that will be used for the
				// default loot item
				ITEM_CLASS_LOOT_TYPE: "",

				// The item class type is the type of item that will be used for the
				// default weapon item
				ITEM_CLASS_WEAPON_TYPE: "",

				// The item class type is the type of item that will be used for the
				// default equipment item
				ITEM_CLASS_EQUIPMENT_TYPE: "",

				// The item quantity attribute is the path to the attribute on items
				// that denote how many of that item that exists
				ITEM_QUANTITY_ATTRIBUTE: "system.quantity",

				// Item filters actively remove items from the item pile inventory UI
				// that users cannot loot, such as spells, feats, and classes
				ITEM_FILTERS: [
					{
						path: "type",
						filters: "Ancestry,Background,Boon,Class Ability,Class,Deity,Patron,Effect,Language,NPC Attack,NPC Special Attack,NPC Spell,NPC Feature,Property,Spell,Talent",
					},
				],

				// Item similarities determines how item piles detect similarities and
				// differences in the system
				ITEM_SIMILARITIES: ["name", "type", "system.light.remainingSecs"],

				// prevent items from stacking
				UNSTACKABLE_ITEM_TYPES: [],

				// Currencies in item piles is a versatile system that can accept actor
				// attributes (a number field on the actor's sheet) or items (actual items
				// in their inventory)
				// In the case of attributes, the path is relative to the "actor.system"
				// In the case of items, it is recommended you export the item with
				// `.toObject()` and strip out any module data
				CURRENCIES: [
					{
						type: "attribute",
						name: "Gold Pieces",
						img: "icons/commodities/currency/coin-embossed-crown-gold.webp",
						abbreviation: "{#}GP",
						data: {
							path: "system.coins.gp",
						},
						primary: true,
						exchangeRate: 1,
					},
					{
						type: "attribute",
						name: "Silver Pieces",
						img: "icons/commodities/currency/coin-engraved-moon-silver.webp",
						abbreviation: "{#}SP",
						data: {
							path: "system.coins.sp",
						},
						primary: false,
						exchangeRate: 0.1,
					},
					{
						type: "attribute",
						name: "Copper Pieces",
						img: "icons/commodities/currency/coin-engraved-waves-copper.webp",
						abbreviation: "{#}CP",
						data: {
							path: "system.coins.cp",
						},
						primary: false,
						exchangeRate: 0.01,
					},
				],

				// This function is an optional system handler that specifically transforms
				// an item's price into a more unified numeric format
				ITEM_COST_TRANSFORMER: (item, currencies) => {
					const cost = foundry.utils.getProperty(item, "system.cost") ?? {};
					let totalCost = 0;
					for (const costDenomination in cost) {
						const subCost =
							Number(foundry.utils.getProperty(cost, costDenomination)) ?? 0;
						if (subCost === 0) {
							continue;
						}
						const currencyDenomination = currencies
							.filter(currency => currency.type === "attribute")
							.find(currency => {
								return currency.data.path.toLowerCase().endsWith(costDenomination);
							});
						totalCost += subCost * (currencyDenomination?.exchangeRate ?? 0);
					}
					return totalCost;
				},
			},
		};

		// Add configuration into item piles via the API
		for (const [version, data] of Object.entries(VERSIONS)) {
			await game.itempiles.API.addSystemIntegration(data, version);
		}

		// disabled trading
		await game.settings.set("item-piles", "enableTrading", false);
		ui.players.render();
	});


	// ================================
	// Light Source Corrections
	// ================================

	// override item piles behaviour when droping a torch
	Hooks.on("item-piles-preDropItemDetermined", (actor, target, itemData) => {
		if (itemData.item.system?.light?.isSource) return false;
	});

	// Undo stacking when getting items from a store
	Hooks.on("item-piles-preTradeItems", (sellingActor, sellerUpdates, buyingActor, buyerUpdates, userId, interactionId) => {
		// Don't expand item if transfering to an item pile character
		if (buyingActor.getFlag("item-piles", "data")?.enabled === true) return;
		unstackItems(
			buyerUpdates.itemsToCreate,
			buyerUpdates.itemsToUpdate
		);
	});

	// Undo stacking when getting items from a pile
	Hooks.on("item-piles-preTransferItems", (source, sourceUpdates, target, targetUpdates, interactionId) => {
		// Don't expand item if transfering to an item pile character
		if (target.getFlag("item-piles", "data")?.enabled === true) return;
		unstackItems(
			targetUpdates.itemsToCreate,
			targetUpdates.itemsToUpdate
		);
	});
}

function unstackItems(creates, updates) {

	// split up multiple quantity creates
	for (let i = 0; i < creates.length; i++) {
		const item = creates[i];
		if (item.system?.slots?.per_slot <= 1) {
			const quantity = item.system.quantity;
			if (quantity > 1) {
				item._id = "";
				item.system.quantity = 1;

				// Create a new item for each incoming quantity
				for (let j = 0; j < quantity; j++) {
					creates.push(item);
				}

				// Remove pending update
				creates.splice(i, 1);
			}
		}
	}

	// split up quantity updates
	for (let i = 0; i < updates.length; i++) {
		const item = updates[i];
		if (item.system?.slots?.per_slot <= 1) {
			const quantity = item.system.quantity;
			item._id = "";
			item.system.quantity = 1;

			// Create a new item for each incoming quantity
			for (let j = 1; j < quantity; j++) {
				creates.push(item);
			}

			// Remove pending update
			updates.splice(i, 1);
		}
	}
}
