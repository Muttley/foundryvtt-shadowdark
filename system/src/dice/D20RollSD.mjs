export default class D20RollSD extends Roll {
	/* -------------------------------------------- */
	/*  Roll Analysis                               */
	/* -------------------------------------------- */

	/**
	 * Analyze a roll result for critical hit
	 * @param {Roll} roll - Roll results
	 * @returns {string|null} - Either the type of critical as string, or null
	 */
	static _digestCritical(roll) {
		if ( roll.terms[0].faces !== 20 ) return null;
		// Get the final result if using adv/disadv
		else if ( roll.terms[0].total === 20 ) return "success";
		else if ( roll.terms[0].total === 1 ) return "failure";
		return null;
	}

	/**
	 * Parses an evaluated roll
	 * @param {object} data - Data supplied to the roll
	 * @param {roll} roll 	- Evaluated Roll
	 * @returns {object}		- Data object augmented with roll digest
	 */
	static _digestResult(data, roll) {
		const result = {
			critical: this._digestCritical(roll),
			total: roll.total,
		};

		return result;
	}

	/* -------------------------------------------- */
	/*  Getters from parents                        */
	/* -------------------------------------------- */

	static _getTalentAdvantage(actor) {
		// Check if the actor has talents
		// Check if talents are advantage types
		// If current context, item or whatever, fulfills the conditions, return
		//    that the user should have advantage.
		// This should be implemented as coloring the Dialog button?
	}

	/* -------------------------------------------- */
	/*  Form & Dialog Digestion                     */
	/* -------------------------------------------- */

	/**
	 * Extract the roll mode from a form
	 * @param {jQuery} $form 	- Callback HTML from dialog
	 * @return {string}				- Selected Rollmode
	 */
	static _getRollModeFromForm($form) {
		return $form.find("[name=rollMode]").val();
	}

	/**
	 * Checks the forms and removes @bonus fields from the parts if not present
	 * or 0.
	 * @param {Array<string>} rollParts	- Roll parts to be modified
	 * @param {object} data 						- Data provided to the roll
	 * @param {jQuery} $form 						- Callback HTML from dialog
	 * @return {Array<string>}					- Modified rollParts
	 */
	static _checkBonusesFromForm(rollParts, data, $form) {
		if ($form) data.itemBonus = $form.find("[name=item-bonus]").val();
		if ((!data.itemBonus || data.itemBonus === 0) && rollParts.indexOf("@itemBonus") !== -1) rollParts.splice(rollParts.indexOf("@itemBonus"), 1);

		// Check if abilityBonus is defined
		if ($form) data.abilityBonus = $form.find("[name=ability-bonus]").val();
		if ((!data.abilityBonus || data.abilityBonus === 0) && rollParts.indexOf("@abilityBonus") !== -1) rollParts.splice(rollParts.indexOf("@abilityBonus"), 1);

		// Check if talentBonus is defind
		if ($form) data.talentBonus = $form.find("[name=talent-bonus]").val();
		if ((!data.talentBonus || data.abilityBonus === 0) && rollParts.indexOf("@talentBonus") !== -1) rollParts.splice(rollParts.indexOf("@talentBonus"), 1);

		return rollParts;
	}

	/* -------------------------------------------- */
	/*  Data Generation for Displaying              */
	/* -------------------------------------------- */

	/**
	 * Parse roll data and optional target value
	 * @param {Roll} roll 						- Evaluated roll data
	 * @param {object} speaker  			- ChatMessage.getSpeaker who will be sending the message
	 * @param {number|false} target 	- Target value to beat with the roll
	 * @return {object}								- Data for rendering a chatcard
	 */
	static _getChatCardData(roll, speaker, target=false) {
		const chatData = {
			user: game.user.id,
			speaker: speaker,
			flags: {
				isRoll: true,
				"core.canPopout": true,
				hasTarget: target !== false,
				critical: this._digestCritical(roll),
			},
		};
		if (target) chatData.flags.success = roll.total >= target;
		return chatData;
	}

	/**
	 * Generate Template Data for displaying custom chat cards
	 * @param {string} title 		- Headline of chatcard
	 * @param {string} flavor 	- Flavor text to put under the actor name in chat card
	 * @param {object} data 		- Optional data containing .item and .actor
	 * @returns {object}				- data to populate the Chat Card template
	 */
	static _getChatCardTemplateData(title, flavor, data, result) {
		const templateData = {
			title: title,
			flavor: flavor,
			data: data,
			isSpell: false,
			isWeapon: false,
			isVersatile: false,
			result: result,
			rolls: {},
		};
		if (data.item) {
			templateData.isSpell = data.item.isSpell();
			templateData.isWeapon = data.item.isWeapon();
			templateData.isVersatile = data.item.isVersatile();
		}
		return templateData;
	}

	/**
	 * Renders HTML for display as roll dialog
	 * @param {object} data 					- Data for use in the dialog
	 * @param {string} rollMode 			- Default roll mode
	 * @param {object} parts 					- Dice formula parts
	 * @param {string} dialogTemplate - Handlebars Template to construct from
	 * @returns {HTML}
	 */
	static async _getRollDialogContent(data, rollMode, parts, dialogTemplate) {
		const dialogData = {
			data,
			rollMode,
			formula: parts.join(" + "),
			rollModes: CONFIG.Dice.rollModes,
		};

		return renderTemplate(dialogTemplate, dialogData);
	}

	/* -------------------------------------------- */
	/*  Dice Rolling                                */
	/* -------------------------------------------- */

	// @todo: Cleanup
	static async _rollWeapon(rolls, data) {
		const damageRolls = {
			rollPrimaryDamage: {},
			rollSecondaryDamage: {},
			primaryDamage: "",
			secondaryDamage: "",
		};

		let numDice = data.item.system.damage.numDice;
		const damageRollParts = data.item.isTwoHanded()
			? data.item.system.damage.twoHanded : data.item.system.damage.oneHanded;

		if ( data.result.critical !== "failure" ) {
			if ( data.result.critical === "success" ) {
				numDice *= 2;
			}

			damageRolls.rollPrimaryDamage = await new Roll(`${numDice}${damageRollParts}`, data).evaluate({ async: true });

			// Render HTML for roll
			await damageRolls.rollPrimaryDamage.render().then(r => {
				damageRolls.primaryDamage = r;
			});

			if ( data.item.isVersatile() ) {
				const secondaryRollParts = data.item.system.damage.twoHanded;
				damageRolls.rollSecondaryDamage = await new Roll(`${numDice}${secondaryRollParts}`, data).evaluate({ async: true });

				// Render HTML for roll
				await damageRolls.rollSecondaryDamage.render().then(r => {
					damageRolls.secondaryDamage = r;
				});
			}
		}
		return damageRolls;
	}

	/* -------------------------------------------- */
	/*  Integrations                                */
	/* -------------------------------------------- */

	/**
	 * Renders Dice So Nice in order of D20 -> Damage Rolls and creates
	 * a chat message with the generated content.
	 * @param {object} rolls 					- Object containing evaluated rolls
	 * @param {object} chatData 			- Parsed roll data as generated by _getchatCardData
	 * 																  augmented with content from
	 *                                  _getChatCardTemplateData
	 * @param {boolean} chatMessage 	- Boolean to display chat message or just generate it
	 * @return {object}								- Returns the D20 result
	 */
	static async _rollDiceSoNice(rolls, chatData, chatMessage) {
		game.dice3d
			.showForRoll(
				rolls.rollD20Result,
				game.user,
				true
			)
			.then(() => {
				if ( Object.keys(rolls.rollPrimaryDamage).length > 0 ) {
					game.dice3d
						.showForRoll(
							rolls.rollPrimaryDamage,
							game.user,
							true
						);
				}
				if ( Object.keys(rolls.rollSecondaryDamage).length > 0 ) {
					game.dice3d
						.showForRoll(
							rolls.rollSecondaryDamage,
							game.user,
							true
						);
				}
			})
			.then(() => {
				if (chatMessage !== false) ChatMessage.create(chatData);
				return rolls.rollD20Result;
			});
	}

	/* -------------------------------------------- */
	/*  END Refactored Structure                    */
	/* -------------------------------------------- */

	/**
	 *
	 * @param {object} data - Object containing item, actor
	 * @returns
	 */
	static async d20Roll({
		parts,
		data,
		dialogTemplate = "systems/shadowdark/templates/dialog/roll-dialog.hbs",
		chatCardTemplate,
		title,
		speaker,
		flavor,
		onClose,
		dialogOptions,
		targetValue,
		rollMode = game.settings.get("core", "rollMode"),
		chatMessage = true,
		options = {
			fastForward: false,
		}
	}) {
		/**
		 * Rolls after the Roll Dialog has been submitted
		 * @param {Array<string>} rollParts - Modifiers to be used in roll
		 * @param {number} adv 							- Advantage(1)/Disadvantage(-1)
		 * @param {jQuery} $form 						- Callback HTML from dialog
		 * @returns {Promise<Roll>}					- Roll result
		 */
		const _roll = async (rollParts, adv, $form) => {
			const rolls = {
				rollD20Result: {},
				rollPrimaryDamage: {},
				rollSecondaryDamage: {},
			};

			// @todo: use this to correctly show the message later
			// Extract the roll mode
			const rollMode = this._getRollModeFromForm($form);

			// Set the rollParts and flavor if advantage/disadvantage button has been clicked
			if (adv === 1) {
				rollParts[0] = ["2d20kh"];
				flavor = game.i18n.format("SHADOWDARK.roll.advantage_title", { title: title });
			}
			else if (adv === -1) {
				rollParts[0] = ["2d20kl"];
				flavor = game.i18n.format("SHADOWDARK.roll.disadvantage_title", { title: title });
			}

			// Parse $form to remove unecessary @bonus fields
			rollParts = this._checkBonusesFromForm(rollParts, data, $form);

			// Execute roll and send it to chat
			rolls.rollD20Result = await new Roll(rollParts.join("+"), data).evaluate({ async: true });

			data.result = this._digestResult(data, rolls.rollD20Result);

			const chatData = this._getChatCardData(rolls.rollD20Result, speaker, targetValue);

			// @todo: Check the chatData instead?
			// Set the target if specified
			data.target = targetValue || "";

			// @todo: Tighten this up
			// Build templateData
			const templateData = this._getChatCardTemplateData(title, flavor, data, data.result);

			// @todo: This needs a better structure
			// Roll weapon damage
			if ( data.item?.isWeapon() ) {
				const damageRolls = await this._rollWeapon(rolls, data);
				rolls.rollPrimaryDamage = damageRolls.rollPrimaryDamage;
				rolls.rollSecondaryDamage = damageRolls.rollSecondaryDamage;
				templateData.rolls.primaryDamage = damageRolls.primaryDamage;
				templateData.rolls.secondaryDamage = damageRolls.secondaryDamage;
			}

			// @todo: _renderRoll()
			return new Promise(resolve => {
				rolls.rollD20Result.render().then(r => {
					templateData.rolls.rollD20Result = r;
					renderTemplate(chatCardTemplate, templateData).then(content => {
						chatData.content = content;
						// Integration with Dice So Nice
						if (game.dice3d) {
							resolve(this._rollDiceSoNice(rolls, chatData, chatMessage));
						}
						else {
							chatData.sound = CONFIG.sounds.dice;
							if (chatMessage !== false) ChatMessage.create(chatData);
							resolve(rolls.rollD20Result);
						}
					});
				});
			});
		};

		/* -------------------------------------------- */
		/*  Roll Management                             */
		/* -------------------------------------------- */
		// Add 1d20 to roll parts
		parts.unshift("1d20");

		// Shall we skip showing a dialog and just roll normally?
		if ( options.fastForward ) {
			return _roll(parts, 0);
		}
		else {
			// @todo: Review how this is more useful than just using a fully populated
			//        `parts`
			// Add all the types of bonuses?
			if (parts.indexOf("@abilityBonus") === -1) parts = parts.concat(["@abilityBonus"]);
			if (parts.indexOf("@itemBonus") === -1) parts = parts.concat(["@itemBonus"]);
			if (parts.indexOf("@talentBonus") === -1) parts = parts.concat(["@talentBonus"]);

			// Render dialog
			const content = await this._getRollDialogContent(data, rollMode, parts, dialogTemplate);

		  return new Promise(resolve => {
				let roll;
				new Dialog(
					{
						title,
						content,
						buttons: {
							advantage: {
								label: game.i18n.localize("SHADOWDARK.roll.advantage"),
								callback: async html => {
									roll = await _roll(parts, 1, html);
								},
							},
							normal: {
								label: game.i18n.localize("SHADOWDARK.roll.normal"),
								callback: async html => {
									roll = await _roll(parts, 0, html);
								},
							},
							disadvantage: {
								label: game.i18n.localize("SHADOWDARK.roll.disadvantage"),
								callback: async html => {
									roll = await _roll(parts, -1, html);
								},
							},
						},
						default: game.i18n.localize("SHADOWDARK.roll.normal"),
						close: html => {
							if (onClose) onClose(html, parts, data);
							resolve(roll);
						},
				  },
					dialogOptions
				).render(true);
			});
		}
	}
}
