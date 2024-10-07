export default class UtilitySD {

	// Checks that the current user has permissions to create Actors
	//
	static canCreateCharacter() {
		return game.permissions.ACTOR_CREATE.includes(game.user.role);
	}

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

	static foundryMinVersion(version) {
		const majorVersion = parseInt(game.version.split(".")[0]);
		return majorVersion >= version;
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
		const itemObj =  fromUuidSync(uuid);
		if (itemObj) {
			return itemObj;
		}
		else {
			return {name: "[Invalid ID]", uuid: uuid};
		}
	}

	static getMessageStyles() {
		const messageStyles = this.foundryMinVersion(12)
			? CONST.CHAT_MESSAGE_STYLES
			: CONST.CHAT_MESSAGE_TYPES;

		return messageStyles;
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

	static async sleep(millisecs=1000) {
		return new Promise((resolve, reject) => {
  			setTimeout(resolve, millisecs);
		});
	}

	/**
	 * Asks the user for input if necessary for an effect that requires said input.
	 * @param {Item} item - Item that has the effects
	 * @param {*} effect - The effect being analyzed
	 * @param {*} key - Optional key if it isn't a unique system.bonuses.key
	 * @returns {Object} - Object updated with the changes
	 */
	static async modifyEffectChangesWithInput(item, effect, key = false) {
		// Create an object out of the item to modify before creating
		const itemObject = item.toObject();
		let name = itemObject.name;

		const changes = await Promise.all(
			effect.changes.map(async c => {
				if (CONFIG.SHADOWDARK.EFFECT_ASK_INPUT.includes(c.key)) {
					const effectKey = (key) ? key : c.key.split(".")[2];

					// Ask for user input
					let linkedName;
					[c.value, linkedName] = await item._handlePredefinedEffect(
						effectKey,
						null,
						name
					);

					if (c.value) {
						name += ` (${linkedName})`;
					}
				}
				return c;
			})
		);

		// Modify the Effect object
		itemObject.effects.map(e => {
			if (e._id === effect._id) {
				e.changes = changes;
				itemObject.name = name;
			}
			return e;
		});
		return itemObject;
	}

	/**
	 * Contains logic that handles any complex effects, where the user
	 * needs to provide input to determine the effect.
	 * @param {Item} item - The item being created
	 */
	static async createItemWithEffect(item) {
		let itemObj = item.toObject();
		await Promise.all(itemObj.effects?.map(async e => {

			// If the item contains effects that require user input,
			// ask and modify talent before creating
			if (
				e.changes?.some(c =>
					CONFIG.SHADOWDARK.EFFECT_ASK_INPUT.includes(c.key)
				)
			) {
				// Spell Advantage requires special handling as it uses the `advantage` bons
				if (e.changes.some(c => c.key === "system.bonuses.advantage")) {
					// If there is no value with REPLACME, it is another type of advantage talent
					if (e.changes.some(c => c.value === "REPLACEME")) {
						const key = "spellAdvantage";
						itemObj = await this.modifyEffectChangesWithInput(item, e, key);
					}
				}
				else {
					itemObj = await this.modifyEffectChangesWithInput(item, e);
				}
			}
		}));

		// If any effects was created without a value, we don't create the item
		if (itemObj.effects.some(e => e.changes.some(c => !c.value))) return ui.notifications.warn(
			game.i18n.localize("SHADOWDARK.item.effect.warning.add_effect_without_value")
		);

		// Activate lightsource tracking
		if (itemObj.effects.some(e => e.changes.some(c => c.key === "system.light.template"))) {
			const duration = itemObj.totalDuration;
			itemObj.system.light.isSource = true;
			itemObj.system.light.longevitySecs = duration;
			itemObj.system.light.remainingSecs = duration;
			itemObj.system.light.longevityMins = duration / 60;
		}
		return itemObj;
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

	static diceSound() {
		const sounds = [CONFIG.sounds.dice];
		const src = sounds[0];
		game.audio.play(src, {volume: 1});
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
}
