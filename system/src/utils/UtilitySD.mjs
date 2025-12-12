export default class UtilitySD {

	// Checks that the current user has permissions to create Actors
	//
	static canCreateCharacter() {
		return game.permissions.ACTOR_CREATE.includes(game.user.role);
	}


	static combineCollection(map1, map2) {
		map2.forEach(value => {
			if (map1.has(value._id)) {
				shadowdark.warn(`Map already contains an item with key ${key}`);
			}
			else {
				map1.set(value._id, value);
			}
		});

		return map1;
	}


	/** Create a roll Macro from an Item dropped on the hotbar.
	 *  Get an existing item macro if one exists, otherwise create a new one.
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

		let command = `await Hotbar.toggleDocumentSheet("${itemData.uuid}");`;
		let flags = {};
		let name = itemData.name;

		if (itemData.isRollable) {
			command = `shadowdark.macro.rollItemMacro("${itemData.name}")`;
			flags = {"shadowdark.itemMacro": true};
			name = `${game.i18n.localize("Roll")} ${name}`;
		}
		else {
			name = `${game.i18n.localize("Display")} ${name}`;
		}

		const macroData = {
			command,
			flags,
			img: itemData.img,
			name,
			scope: "actor",
			type: CONST.MACRO_TYPES.SCRIPT,
		};

		// Assign the macro to the hotbar
		const macro =
			game.macros.find(m => m.name === macroData.name
				&& m.command === macroData.command
				&& m.author.isSelf
			) || (await Macro.create(macroData));

		game.user.assignHotbarMacro(macro, slot);
	}


	static async createItemFromSpell(type, spell) {
		const name = (type !== "Spell")
			? game.i18n.format(
				`SHADOWDARK.item.name_from_spell.${type}`,
				{ spellName: spell.name }
			)
			: spell.name;

		const itemData = {
			type,
			name,
			system: spell.system,
		};

		if (type === "Spell") {
			itemData.img = spell.img;
		}
		else {
			delete itemData.system.lost;
			itemData.system.magicItem = true;
			itemData.system.spellImg = spell.img;
			itemData.system.spellName = spell.name;
		}
		return itemData;
	}


	static diceSound() {
		const sounds = [CONFIG.sounds.dice];
		const src = sounds[0];
		game.audio.play(src, {volume: 1});
	}


	static foundryMinVersion(version) {
		const majorVersion = parseInt(game.version.split(".")[0]);
		return majorVersion >= version;
	}


	// Work out the current Actor.
	// If the user is the GM then use the current token they have selected.
	//
	static async getCurrentActor() {
		let actor = null;

		if (game.user.isGM) {
			const controlledTokenCount = canvas.tokens.controlled.length;
			if (controlledTokenCount > 0) {
				if (controlledTokenCount !== 1) {
					return ui.notifications.warn(
						game.i18n.localize("SHADOWDARK.error.too_many_tokens_selected")
					);
				}
				else {
					actor = canvas.tokens.controlled[0].actor;
				}
			}
		}
		else {
			actor = game.user.character;
		}

		return actor;
	}


	/**
	 * Creates de-duplicated lists of Selected and Unselected Items.
	 *
	 * @param {allItems} Array A list of all available items
	 * @param {items} Array A list of currently selected items
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
			selectedItems.push(await this.getFromUuid(itemUuid));
		}

		selectedItems.sort((a, b) => a.name.localeCompare(b.name));

		return [selectedItems, unselectedItems];
	}


	static async getFromUuid(uuid) {
		const itemObj = await fromUuid(uuid);
		if (itemObj) {
			return itemObj;
		}
		else {
			return {name: "[Invalid ID]", uuid: uuid};
		}
	}


	static getFromUuidSync(uuid) {
		const itemObj = fromUuidSync(uuid);
		if (itemObj) {
			return itemObj;
		}
		else {
			return {name: "[Invalid ID]", uuid: uuid};
		}
	}


	static async getItemsFromRollResults(results) {
		const items = [];

		for (const result of results) {
			const uuid = [
				"Compendium",
				result.documentCollection,
				result.documentId,

			].join(".");

			items.push(await fromUuid(uuid));
		}

		return items;
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


	static isPrimaryGM() {
		if (!game.user.isGM) return false;

		// if primaryGM flag is true, return
		if (game.user.getFlag("shadowdark", "primaryGM")) {
			return true;
		}
		else {
			// locate the primary GM
			const primaryGMs = game.users.filter(x =>
				x.active === true && x.flags.shadowdark.primaryGM === true
			);
			if (primaryGMs.length === 0) {
				// if no primary GM, set current user as primary GM
				game.user.setFlag("shadowdark", "primaryGM", true);
				shadowdark.log("Promoted to Primary GM");
				return true;
			}
			else {
				return false;
			}
		}
	}


	static async loadLegacyArtMappings() {
		// search modules for legacy art mappings and convert to new format
		for (const module of game.modules) {
			if (!module.active) continue;
			const flags = module.flags?.[module.id];
			if (flags?.["shadowdark-art"]) {
				module.flags.compendiumArtMappings = {
					shadowdark: {
						mapping: flags["shadowdark-art"],
					},
				};
			}
		}
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


	static async sleep(millisecs=1000) {
		return new Promise((resolve, reject) => {
  			setTimeout(resolve, millisecs);
		});
	}


	static async toggleItemDetails(target) {
		const listObj = $(target).parent();

		// if details are already shown, close details
		if (listObj.hasClass("expanded")) {
			const detailsDiv = listObj.find(".item-details");
			detailsDiv.slideUp(200, () => detailsDiv.remove());
		}
		else {

			const itemId = listObj.data("uuid");
			const item = await fromUuid(itemId);

			let details = "";
			if (item) {
				details = await item.getDetailsContent();
			}

			const detailsDiv = document.createElement("div");
			detailsDiv.setAttribute("style", "display: none");
			detailsDiv.classList.add("item-details");
			detailsDiv.insertAdjacentHTML("afterbegin", details);
			listObj.append(detailsDiv);
			$(detailsDiv).slideDown(200);
		}

		listObj.toggleClass("expanded");
	}

}
