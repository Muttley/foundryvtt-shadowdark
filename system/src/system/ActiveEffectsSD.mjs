export default class ActiveEffectsSD {
	static isLightSourceEffect(effect) {
		return effect.changes?.some(change => [
			"system.light.isSource",
			"system.light.template",
		].includes(change.key));
	}


	static async askLightSourceInput() {
		const animations = {
			"": game.i18n.localize("SHADOWDARK.item.light.animation_none"),
		};

		for (const [key, animation] of Object.entries(CONFIG.Canvas.lightAnimations)) {
			animations[key] = game.i18n.localize(animation.label);
		}

		const content = await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/effect-light-source.hbs",
			{animations}
		);
		const data = {
			title: game.i18n.localize("SHADOWDARK.item.effect.predefined_effect.lightSource"),
			content,
			classes: ["shadowdark-dialog"],
			buttons: {
				submit: {
					label: game.i18n.localize("SHADOWDARK.dialog.submit"),
					callback: html => {
						const form = html[0].querySelector("form");
						return Object.fromEntries(new FormData(form));
					},
				},
			},
			close: () => false,
		};

		return Dialog.wait(data);
	}


	static async createLightSourceEffect(owner, data) {
		const light = await this.askLightSourceInput();
		if (!light) return;

		const changes = [
			["system.light.isSource", true],
			["system.light.bright", Number(light.bright)],
			["system.light.dim", Number(light.dim)],
			["system.light.color", light.color],
			["system.light.animation", light.animation],
		].map(([effectKey, value]) => ({
			key: effectKey,
			value,
			mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
		}));

		const [newActiveEffect] = await owner.createEmbeddedDocuments(
			"ActiveEffect",
			[{
				name: game.i18n.localize("SHADOWDARK.item.effect.predefined_effect.lightSource"),
				img: data.img,
				changes,
				disabled: false,
				origin: owner.uuid,
				transfer: true,
			}]
		);

		if (owner.documentName === "Actor") {
			newActiveEffect.sheet.render(true);
		}
	}

	/**
	 * Creates a dialog that allows the user to pick from a list. Returns
	 * a slugified name to be used in effect values.
	 * @param {string} type - Type of input to ask about
	 * @param {Array<string>} options - The list of options to choose from
	 * @returns {Promise<object>}
	 */
	static async askEffectInput(effectParameters) {
		// const effectParameters = [{key, type, options}, {key, type, options}];
		const parameters = Array.isArray(effectParameters)
			? effectParameters
			: [effectParameters];
		for (const parameter of parameters) {
			parameter.label = await game.i18n.localize(
				`SHADOWDARK.dialog.effect.choice.${parameter.type}`
			);
			parameter.uuid = foundry.utils.randomID();
		}

		const content = await foundry.applications.handlebars.renderTemplate(
			"systems/shadowdark/templates/dialog/effect-list-choice.hbs",
			{
				effectParameters: parameters,
			}
		);

		const data = {
			title: await game.i18n.localize("SHADOWDARK.dialog.effect.choices.title"),
			content,
			classes: ["shadowdark-dialog"],
 			buttons: {
				submit: {
					label: game.i18n.localize("SHADOWDARK.dialog.submit"),
					callback: html => {
						const selected = {};

						for (const parameter of parameters) {
							// const formValue = html[0].querySelector("input")?.value ?? "";
							const selector = `#${parameter.type}-selection-${parameter.uuid}`;
							const formValue = html[0].querySelector(selector)?.value ?? "";

							let slug = false;
							for (const [key, value] of Object.entries(parameter.options)) {
								if (formValue === value) {
									slug = key;
									break;
								}
							}

							selected[parameter.type] = [slug, formValue] ?? null;
						}

						return selected;
					},
				},
			},
			close: () => false,
		};

		const result = await Dialog.wait(data);
		return result;
	}


	/**
	 * Contains logic that handles any complex effects, where the user
	 * needs to provide input to determine the effect.
	 * @param {Item} item - The item being created
	 */
	static async createItemWithEffect(item) {
		let itemObj = item.toObject();

		await Promise.all(itemObj.effects?.map(async effect => {
			// If the item contains effects that require user input,
			// ask and modify talent before creating
			if (effect.changes?.some(c => c.key.includes("REPLACEME"))) {
				itemObj = await this.modifyEffectChangesWithInput(item, effect);
			}
		}));

		// If any effects was created without a value, we don't create the item
		if (itemObj.effects.some(e => e.changes.some(c => (
			c.value === "" && c.key !== "system.light.animation"
		)))) return ui.notifications.warn(
			game.i18n.localize("SHADOWDARK.item.effect.warning.add_effect_without_value")
		);

		// Activate lightsource tracking
		const lightEffect = itemObj.effects.find(e => this.isLightSourceEffect(e));
		if (lightEffect) {
			const duration = itemObj.totalDuration;
			itemObj.system.light.isSource = true;
			itemObj.system.light.longevitySecs = duration;
			itemObj.system.light.remainingSecs = duration;
			itemObj.system.light.longevityMins = duration / 60;

			for (const change of lightEffect.changes) {
				const field = change.key.replace("system.light.", "");
				if (["animation", "bright", "color", "dim"].includes(field)) {
					itemObj.system.light[field] = change.value;
				}
			}
		}

		return itemObj;
	}


	/**
	 * Creates effects based on predefined effect choices and the supplied
	 * predefined effect mappings.
	 * @param {string} key - Name of the predefined effect
	 * @param {Object} data - The item data of the item to be created
	 * @returns {ActiveEffect}
	 */
	static async createPredefinedEffect(owner, key) {
		const data = CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[key];

		if (!data) return shadowdark.error(`No effect found (${key})`);
		if (key === "lightSource") {
			return this.createLightSourceEffect(owner, data);
		}

		let defaultValue = "REPLACEME";
		[defaultValue] = await shadowdark.effects.handlePredefinedEffect(
			key, data.defaultValue, data.name
		);

		if (defaultValue === "REPLACEME") {
			return shadowdark.warn("Can't create effect without selecting a value.");
		}

		data.defaultValue = defaultValue;

		const effectMode = foundry.utils.getProperty(
			CONST.ACTIVE_EFFECT_MODES,
			data.mode.split(".")[2]);

		const value = (isNaN(parseInt(data.defaultValue, 10)))
			? data.defaultValue
			: parseInt(data.defaultValue, 10);

		const effectData = [
			{
				name: game.i18n.localize(`SHADOWDARK.item.effect.predefined_effect.${key}`),
				img: data.img,
				changes: [{
					key: data.effectKey,
					value,
					mode: effectMode,
				}],
				disabled: false,
				origin: owner.uuid,
				transfer: (Object.keys(data).includes("transfer"))
					? data.transfer
					: true,
			},
		];

		// Create the effect
		const [newActiveEffect] = await owner.createEmbeddedDocuments(
			"ActiveEffect",
			effectData
		);

		if (owner.documentName === "Actor") {
			newActiveEffect.sheet.render(true);
		}
	}


	/**
	 * Returns an object containing the effect key, and the
	 * translated name into the current language.
	 * @returns {Object}
	 */
	static async getPredefinedEffectsList() {
		const effects = {};

		for (const key in CONFIG.SHADOWDARK.PREDEFINED_EFFECTS) {
			const effect = CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[key];

			effects[key] = {
				key,
				name: effect.name,
			};
		}

		return effects;
	}


	/**
	 * Handles special cases for predefined effect mappings
	 *
	 * @param {string} effectName - effectKey from mapping
	 * @param {Object} value - data value from mapping
	 * @param {Object} name - name value from mapping
	 * @returns {Promise<Object>}
	 */
	static async handlePredefinedEffect(effectName, value, name=null) {
		if (effectName === "Armor Mastery") {
			const type = "armor";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseArmor()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (effectName === "Spellcasting Advantage on Spell") {
			const type = "spell";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.spells()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (["Weapon Mastery", "Increased Weapon Damage Die"].includes(effectName)) {
			const type = "weapon";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseWeapons()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}

		return [value];
	}


	/**
	 * Asks the user for input if necessary for an effect that requires said input.
	 * @param {Item} item - Item that has the effects
	 * @param {*} effect - The effect being analyzed
	 * @param {*} key - Optional key if it isn't a unique system.bonuses.key
	 * @returns {Promise<Object>} - Object updated with the changes
	 */
	static async modifyEffectChangesWithInput(item, effect) {
		// Create an object out of the item to modify before creating
		const itemObject = item.toObject();
		let name = itemObject.name;

		let hasReplaceMe = false;
		for (const change of effect.changes) {
			if (change.key.includes("REPLACEME")) {
				hasReplaceMe = true;
				break;
			}
		}

		if (hasReplaceMe) {
			let linkedName;
			let slugifiedValue;

			[slugifiedValue, linkedName] = await this.handlePredefinedEffect(
				effect.name,
				null,
				name
			);

			if (slugifiedValue) {
				itemObject.name += ` (${linkedName})`;

				for (const effectEntry of itemObject.effects) {
					if (effect.name !== effectEntry.name) continue;

					effectEntry.changes.forEach(change => {
						change.key = change.key.replace("REPLACEME", slugifiedValue);
					});
				}
			}
		}

		return itemObject;
	}


	/**
	* Manage Active Effect instances through the Actor Sheet via effect control buttons.
	* @param {MouseEvent} event      The left-click event on the effect control
	* @param {Actor|Item} owner      The owning entity which manages this effect
	*/
	static async onManageActiveEffect(event, owner) {
		event.preventDefault();

		const a = event.currentTarget;
		const li = a.closest("li");

		const effect = li.dataset.effectUuid
			? await fromUuid(li.dataset.effectUuid)
			: null;

		switch (a.dataset.action) {
			case "create":
				const docs = await owner.createEmbeddedDocuments("ActiveEffect", [{
					disabled: li.dataset.effectType === "inactive",
					img: "icons/commodities/tech/cog-steel-grey.webp",
					label: game.i18n.localize("SHADOWDARK.effect.new"),
					name: game.i18n.localize("SHADOWDARK.effect.new"),
					origin: owner.uuid,
				}]);

				if (docs && docs[0]) docs[0].sheet.render(true);
				break;
			case "edit":
				return effect.sheet.render(true);
			case "delete":
				return foundry.applications.handlebars.renderTemplate(
					"systems/shadowdark/templates/dialog/are-you-sure.hbs"
				).then(html => {
					new Dialog({
						title: `${game.i18n.localize("SHADOWDARK.sheet.general.active_effects.delete_effect.tooltip")}`,
						content: html,
						buttons: {
							Yes: {
								icon: '<i class="fa fa-check"></i>',
								label: `${game.i18n.localize("SHADOWDARK.dialog.general.yes")}`,
								callback: async () => {
									effect.delete();
								},
							},
							Cancel: {
								icon: '<i class="fa fa-times"></i>',
								label: `${game.i18n.localize("SHADOWDARK.dialog.general.cancel")}`,
							},
						},
						default: "Yes",
					}).render(true);
				});
			case "toggle":
				return effect.update({disabled: !effect.disabled});
			case "toggle-situational":
				return effect.toggleSituational();
		}
	}

}
