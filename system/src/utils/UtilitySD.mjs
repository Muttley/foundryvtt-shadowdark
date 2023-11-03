export default class UtilitySD {
	/**
	 * Creates de-duplicated lists of Selected and Unselected Items.
	 *
	 * @param {allItems} Array A list of all available skills
	 * @param {items} Array A list of currently selected skills
	 *
	 * @returns {Promise} Promise which represents an array containing both the
	 * selected and unselected skill arrays
	 */
	static async getDedupedSelectedItems(allItems, items) {
		const unselectedItems = [];
		const selectedItems = [];

		allItems.forEach(item => {
			if (!items.includes(item.uuid)) {
				unselectedItems.push(item);
			}
		});

		for (const itemUuid of items) {
			selectedItems.push(await fromUuid(itemUuid));
		}

		selectedItems.sort((a, b) => a.name.localeCompare(b.name));

		return [selectedItems, unselectedItems];
	}

	static getNextDieInList(die, allDice) {
		if (die === false) return die;

		for (let i = 0; i < allDice.length; i++) {
			if (allDice[i] === die && allDice.length > i + 1) {
				return allDice[i + 1];
			}
		}

		return die;
	}

	static async getSlugifiedItemList(items) {
		const itemList = {};
		items.map(i => itemList[i.name.slugify()] = i.name );
		return itemList;
	}

	/* Create a roll Macro from an Item dropped on the hotbar.
	* Get an existing item macro if one exists, otherwise create a new one.
	*
	* @param {object} data - The dropped data
	* @param {number} slot - The hotbar slot to use
	* @returns {Promise} - Promise of assigned macro or a notification
	*/
	static async createHotbarMacro(data, slot) {
		// Preserve Default macro behaviour
		if (data.type === "Macro") {
			return game.user.assignHotbarMacro(await fromUuid(data.uuid), slot);
		}

		// sanity checks
		if (data.type !== "Item") return;
		// if (data.uuid.indexOf("Item.") <= 0) return;
		const item = await fromUuid(data.uuid);
		console.log(item);

		// Create the macro command
		const command = `shadowdark.macro.rollItemMacro("${item.name}");`;
		let macro = game.macros.contents.find( m => m.name === item.name && m.command === command );
		if (!macro || macro.ownership[game.userId] === undefined) {
			macro = await Macro.create({
				name: item.name,
				type: "script",
				img: item.img,
				command,
				flags: { "shadowdark.itemMacro": true },
			});
		}
		return game.user.assignHotbarMacro(macro, slot);
	}
}
