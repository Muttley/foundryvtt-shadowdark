export default class UtilitySD {

	/* Create a roll Macro from an Item dropped on the hotbar.
	 * Get an existing item macro if one exists, otherwise create a new one.
	 *
	 * @param {object} data - The dropped data
	 * @param {number} slot - The hotbar slot to use
	 * @returns {Promise} - Promise of assigned macro or a notification
	 */
	static async createHotbarMacro(data, slot) {
		const itemData = await Item.implementation.fromDropData(data);

		if (!itemData) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.macro.warn.create_item_requires_ownership")
			);
		}

		const macroData = {
			command: `shadowdark.macro.rollItemMacro("${itemData.name}")`,
			flags: {"shadowdark.itemMacro": true},
			img: itemData.img,
			name: itemData.name,
			scope: "actor",
			type: "script",
		};

		// Assign the macro to the hotbar
		const macro =
			game.macros.find(m => m.name === macroData.name
				&& m.command === macroData.command
				&& m.author.isSelf
			) || (await Macro.create(macroData));

		game.user.assignHotbarMacro(macro, slot);
	}

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

	// If this is a new release, show the release notes to the GM the first time
	// they login
	static async showNewReleaseNotes() {
		if (game.user.isGM) {
			const savedVersion = game.settings.get("shadowdark", "systemVersion");
			const systemVersion = game.system.version;

			if (systemVersion !== savedVersion) {
				Hotbar.toggleDocumentSheet(
					CONFIG.SHADOWDARK.JOURNAL_UUIDS.RELEASE_NOTES
				);

				game.settings.set(
					"shadowdark", "systemVersion",
					systemVersion
				);
			}
		}
	}
}
