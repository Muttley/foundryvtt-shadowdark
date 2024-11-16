export default class ActiveEffectsSD {

	/**
	 * Creates a dialog that allows the user to pick from a list. Returns
	 * a slugified name to be used in effect values.
	 * @param {string} type - Type of input to ask about
	 * @param {Array<string>} options - The list of options to choose from
	 * @returns {string}
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

		const content = await renderTemplate(
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
				label: game.i18n.localize(`SHADOWDARK.item.effect.predefined_effect.${key}`),
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
	 * @param {string} key - effectKey from mapping
	 * @param {Object} value - data value from mapping
	 * @param {Object} name - name value from mapping
	 * @returns {Object}
	 */
	static async handlePredefinedEffect(key, value, name=null) {
		if (key === "acBonusFromAttribute") {
			const type = "attribute";

			const options = shadowdark.config.ABILITIES_LONG;

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "armorMastery") {
			const type = "armor";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.baseArmor()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "lightSource") {
			const type = "lightsource";

			// TODO Need to move to light source objects to allow customisation
			//
			const lightSourceList = await foundry.utils.fetchJsonWithTimeout(
				"systems/shadowdark/assets/mappings/map-light-sources.json"
			);

			const options = {};
			Object.keys(lightSourceList).map(i => {
				return options[i] = game.i18n.localize(lightSourceList[i].lang);
			});

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "spellAdvantage") {
			const type = "spell";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.spells()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "spellcastingClasses") {
			const type = "class";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.spellcastingBaseClasses()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (
			[
				"weaponDamageDieImprovementByProperty",
				"weaponDamageExtraDieImprovementByProperty",
			].includes(key)
		) {
			const type = "weapon_property";

			const options = await shadowdark.utils.getSlugifiedItemList(
				await shadowdark.compendiums.weaponProperties()
			);

			const chosen = await this.askEffectInput({name, type, options});
			return chosen[type] ?? [value];
		}
		else if (key === "weaponDamageExtraDieByProperty") {
			const parameters = [
				{
					key: key,
					type: "damage_die",
					options: shadowdark.config.DICE,
				},
				{
					key: key,
					type: "weapon_property",
					options: await shadowdark.utils.getSlugifiedItemList(
						await shadowdark.compendiums.weaponProperties()
					),
				},
			];

			const chosen = await this.askEffectInput(parameters);


			if (chosen.damage_die && chosen.weapon_property) {
				return [`${chosen.damage_die[0]}|${chosen.weapon_property[0]}`];
			}
			else {
				return [value];
			}
		}
		else if (["weaponMastery", "weaponDamageDieD12"].includes(key)) {
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
					[c.value, linkedName] = await this.handlePredefinedEffect(
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
	* Manage Active Effect instances through the Actor Sheet via effect control buttons.
	* @param {MouseEvent} event      The left-click event on the effect control
	* @param {Actor|Item} owner      The owning entity which manages this effect
	*/
	static async onManageActiveEffect(event, owner) {
		event.preventDefault();

		const a = event.currentTarget;
		const li = a.closest("li");
		const effectId = li.dataset.effectId;

		let effect = null;
		if (owner.documentName === "Actor") {
			effect = effectId
				? owner.allApplicableEffects().find(effect => effect.id === effectId)
				: null;
		}
		else if (owner.documentName === "Item") {
			effect = effectId
				? owner.transferredEffects.find(effect => effect.id === effectId)
				: null;
		}

		switch (a.dataset.action) {
			case "create":
				const docs = await owner.createEmbeddedDocuments("ActiveEffect", [{
					disabled: li.dataset.effectType === "inactive",
					img: "icons/commodities/tech/cog-steel-grey.webp",
					label: "New Effect",
					origin: owner.uuid,
				}]);

				if (docs && docs[0]) docs[0].sheet.render(true);
				break;
			case "edit":
				return effect.sheet.render(true);
			case "delete":
				return renderTemplate(
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
		}
	}


	/**
	* Prepare the data structure for Active Effects which are currently applied
	* to an Actor or Item.
	*
	* @param {ActiveEffect[]} effects    The array of Active Effect instances
	*                                    to prepare sheet data for
	* @return {object}                   Data for rendering
	*/
	static prepareActiveEffectCategories(effects) {
		const categories = {
			active: {
				type: "active",
				effects: [],
			},
			inactive: {
				type: "inactive",
				effects: [],
			},
		};

		for (const effect of effects) {
			const decoratedEffect = {
				disabled: effect.disabled,
				durationLabel: effect.duration.label,
				id: effect.id,
				img: effect.img,
				name: effect.name,
				sourceName: effect.parent?.name ?? "Unknown",
			};

			if (effect.disabled) {
				categories.inactive.effects.push(decoratedEffect);
			}
			else {
				categories.active.effects.push(decoratedEffect);
			}
		}

		categories.active.effects.sort(
			(a, b) => a.name.localeCompare(b.name)
		).sort(
			(a, b) => a.sourceName.localeCompare(b.sourceName)
		);

		categories.inactive.effects.sort(
			(a, b) => a.name.localeCompare(b.name)
		).sort(
			(a, b) => a.sourceName.localeCompare(b.sourceName)
		);

		return categories;
	}

}
