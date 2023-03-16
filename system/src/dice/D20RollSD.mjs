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

	// @todo: Potentially can be removed
	/**
	 * Parses an evaluated roll
	 * @param {roll} roll 	- Evaluated Roll
	 * @returns {object}		- Data object augmented with roll digest
	 */
	static _digestResult(roll) {
		const result = {
			critical: this._digestCritical(roll),
			total: roll.total,
		};

		return result;
	}

	/**
	 * Compares requested parts to provided data values
	 * @param {Array<string>} parts - Parts with @bonuses to add to roll
	 * @param {object} data 				- Data object containing data.bonuses values
	 * @returns {Array<string>}			- Parts with only relevant bonuses
	 */
	static _digestParts(parts, data) {
		parts.forEach(part => {
			if (part[0] !== "@") return;
			// If the bonus doesn't exists, or is 0, remove bonus from parts
			if (!data[part.slice(1)] || data[part.slice(1)] === 0) parts.splice(
				parts.indexOf(part), 1);
		});
		return parts;
	}

	/* -------------------------------------------- */
	/*  Getters from parents                        */
	/* -------------------------------------------- */

	// @todo: Implement on the actor sheet instead
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
	 * Parses a submitted dialog form for bonuses
	 * @param {jQuery} $form 	- Submitted dialog form
	 */
	static _getBonusesFromFrom($form) {
		itemBonus = $form.find("[name=item-bonus]").val();
		abilityBonus = $form.find("[name=ability-bonus]").val();
		talentBonus = $form.find("[name=talent-bonus]").val();
		return {
			itemBonus,
			abilityBonus,
			talentBonus,
		};
	}

	// @todo: May be removed?
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
	 * @param {object} data 		- Optional data containing .item and .actor
	 * @returns {object}				- data to populate the Chat Card template
	 */
	static _getChatCardTemplateData(title, data) {
		const templateData = {
			title: title,
			data: data,
			isSpell: false,
			isWeapon: false,
			isVersatile: false,
			critical: data.rolls.rollD20Result.critical,
			rolls: data.rolls,
		};
		if (data.item) {
			templateData.isSpell = data.item.isSpell();
			templateData.isWeapon = data.item.isWeapon();
			templateData.isVersatile = data.item.isVersatile();
		}
		return templateData;
	}

	/**
	 * Prepares data for rendering a dialog
	 * @param {object} data 					- Data for use in the dialog
	 * @param {string} rollMode 			- Default roll mode
	 * @param {object} parts 					- Dice formula parts
	 * @returns {object}							- Dialog data
	 */
	static _getRollDialogData(data, rollMode, parts) {
		return {
			data,
			rollMode,
			formula: parts.join(" + "),
			rollModes: CONFIG.Dice.rollModes,
		};
	}

	/**
	 * Renders HTML for display as roll dialog
	 * @param {object} data 					- Data for use in the dialog
	 * @param {string} rollMode 			- Default roll mode
	 * @param {object} parts 					- Dice formula parts
	 * @param {string} dialogTemplate - Handlebars Template to construct from
	 * @returns {HTML}
	 */
	static _getRollDialogContent(data, rollMode, parts, dialogTemplate) {
		const dialogData = this._getRollDialogData(data, rollMode, parts);
		return renderTemplate(dialogTemplate, dialogData);
	}

	/* -------------------------------------------- */
	/*  Dice Rolling                                */
	/* -------------------------------------------- */

	/**
	 *
	 * @param {Array<string>} rollParts	- Array containing parts for rolling
	 * @param {-1|0|1} adv 							- Pre-determined Advantage
	 * @returns {Array<string>}					- Modified rollParts
	 */
	static _partsAdvantage(rollParts, adv = 0) {
		const splitDice = rollParts[0].split("d");

		if (adv === 1) {
			rollParts[0] = `${splitDice[0] * 2}d${splitDice[1]}kh`;
		}
		else if (adv === -1) {
			rollParts[0] = `${splitDice[0] * 2}d${splitDice[1]}kl`;
		}
		return rollParts;
	}

	/**
	 * Rolls dice, with parts. Evaluates them, and returns the data.
	 * @param {Array<string>}	parts	- Dice and Bonuses associated with the roll (@bonus)
	 * @param {object} data					- Data containing requivalent @bonus fields
	 * 																like `data.bonus`
	 * @returns {object} 						- Returns the evaluated `roll`, the rendered
	 * 							                	HTML `renderedHTML`, and `critical` info.
	 */
	static async _rollDice(parts, data = {}) {
		if (parts[0] === "d") parts[0] = `1${parts[0]}`;

		// Remove bonuses lacking equivalent bonus in data
		parts = this._digestParts(parts, data);

		const roll = await new Roll(parts.join(" + "), data).evaluate({async: true});
		const renderedHTML = await roll.render();
		const critical = this._digestCritical(roll);

		return {
			roll,
			renderedHTML,
			critical,
		};
	}


	static async RollD20(parts, data, $form, adv=0, options={}) {
		// const rollMode = this._getRollModeFromForm($form);

		// Augment data with form bonuses
		const formBonuses = this._getBonusesFromForm(data, $form);

		// Combine bonuses from form with the data
		data = foundry.utils.mergeObjects(data, formBonuses);

		// Modify the d20 to take advantage in consideration
		parts.unshift("1d20");
		parts = this._partsAdvantage(parts, adv);

		return await this._rollDice(parts, data);
	}


	// @todo: Cleanup
	/**
	 * Rolls after the Roll Dialog has been submitted
	 * @param {Array<string>} rollParts 			- Modifiers to be used in roll
	 * @param {number} adv 										- Advantage(1)/Disadvantage(-1)
	 * @param {jQuery} $form 									- Callback HTML from dialog
	 * @param {object} data										- Object containing item, actor
	 * @param {object} options								- Options for the chat message
	 * @param {string} options.title					- Title to display on chat card
	 * @param {string} options.flavor					- Flavor text for the chat card
	 * @param {User} options.speaker  				- Who the message comes from
	 * @param {number} options.targetValue		- Target value to meet or beat
	 * @param {HTML} options.chatCardTemplate	- Template to render chat message
	 * @param {boolean} options.chatMessage		- Flag if to render message or not
	 * @returns {Promise<Roll>}								- Roll result
	 */
	static async _rollD20(
		rollParts,
		adv,
		$form,
		data,
		options = {
			title,
			flavor: title,
			speaker: ChatMessage.getSpeaker(game.user.id),
			targetValue,
			chatCardTemplate,
			chatMessage,
		}) {

		data.rolls = {};

		// @todo: use this to correctly show the message in chat
		// Extract the roll mode
		const rollMode = this._getRollModeFromForm($form);

		// Augment the rollParts if advantage/disadvantage button has been clicked
		rollParts = this._partsAdvantage(rollParts, data, adv);

		// Parse provided HTMLForm to remove unecessary @bonus fields
		rollParts = this._checkBonusesFromForm(rollParts, data, $form);

		// Evaluate & digest the roll
		data.rolls.rollD20 = await new Roll(rollParts.join("+"), data).evaluate({ async: true });
		data.rolls.rollD20Result = this._digestResult(data.rolls.rollD20);

		// Render the roll and store rendered HTML
		await data.rolls.rollD20.render().then(r => {
			data.rolls.rollD20HTML= r;
		});

		// Roll weapon damage
		if ( data.item?.isWeapon() ) data = await this._rollWeapon(data);

		// Build templateData
		const templateData = this._getChatCardTemplateData(
			options.title,
			data
		);

		const chatData = this._getChatCardData(
			data.rolls.rollD20,
			options.speaker,
			options.targetValue
		);

		return new Promise(resolve => {
			renderTemplate(options.chatCardTemplate, templateData).then(content => {
				// Setup the chat card
				if ( rollMode === "blindroll" ) chatData.blind = true;
				chatData.content = content;

				// Determine the flavor of the chat card
				switch (adv) {
					case 1: chatData.flavor = game.i18n.format("SHADOWDARK.roll.advantage_title", { title: options.flavor }); break;
					case 2: chatData.flavor = game.i18n.format("SHADOWDARK.roll.disadvantage_title", { title: options.flavor }); break;
					default: chatData.flavor = options.flavor;
				}

				// Integration with Dice So Nice
				if (game.dice3d) {
					resolve(this._rollDiceSoNice(data.rolls, chatData, options.chatMessage));
				}
				else {
					chatData.sound = CONFIG.sounds.dice;
					if (options.chatMessage !== false) ChatMessage.create(chatData);
					resolve(data.rolls.rollD20Result);
				}
			});
		});
	}

	// @todo: Cleanup
	/**
	 * Rolls a weapon and it's associated damage dice
	 * @param {object} data 	- Data with the item to be rolled
	 * @returns {object} data - Returns 'data' augmented with weapon damage rolls
	 */
	static async _rollWeapon(data) {
		let numDice = data.item.system.damage.numDice;
		const damageRollParts = data.item.isTwoHanded()
			? data.item.system.damage.twoHanded : data.item.system.damage.oneHanded;

		if ( data.rolls.rollD20Result.critical !== "failure" ) {
			if ( data.rolls.rollD20Result.critical === "success" ) {
				numDice *= 2;
			}
			data.rolls.rollPrimaryDamage = await new Roll(`${numDice}${damageRollParts}`, data).evaluate({ async: true });

			// Render HTML for roll
			await data.rolls.rollPrimaryDamage.render().then(r => {
				data.rolls.primaryDamageHTML = r;
			});

			if ( data.item.isVersatile() ) {
				const secondaryRollParts = data.item.system.damage.twoHanded;
				data.rolls.rollSecondaryDamage = await new Roll(`${numDice}${secondaryRollParts}`, data).evaluate({ async: true });

				// Render HTML for roll
				await data.rolls.rollSecondaryDamage.render().then(r => {
					data.rolls.secondaryDamageHTML = r;
				});
			}
		}
		return data;
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
				rolls.rollD20,
				game.user,
				true
			)
			.then(() => {
				if ( rolls.rollPrimaryDamage ) {
					game.dice3d
						.showForRoll(
							rolls.rollPrimaryDamage,
							game.user,
							true
						);
				}
				if ( rolls.rollSecondaryDamage ) {
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
	/*  Main rolling functions                      */
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
		onClose,
		dialogOptions,
		targetValue,
		rollMode = game.settings.get("core", "rollMode"),
		chatMessage = true,
		options = {
			fastForward: false,
		},
	}) {
		// Add 1d20 to roll parts
		parts.unshift("1d20");

		// @todo: Review
		options = {
			...options,
			title,
			flavor: title,
			speaker,
			targetValue,
			chatCardTemplate,
			chatMessage,
		};

		// Shall we skip showing a dialog and just roll normally?
		if ( options.fastForward ) {
			return _rollD20(parts, 0, data, options);
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
									roll = await this._rollD20(parts, 1, html, data, options);
								},
							},
							normal: {
								label: game.i18n.localize("SHADOWDARK.roll.normal"),
								callback: async html => {
									roll = await this._rollD20(parts, 0, html, data, options);
								},
							},
							disadvantage: {
								label: game.i18n.localize("SHADOWDARK.roll.disadvantage"),
								callback: async html => {
									roll = await this._rollD20(parts, -1, html, data, options);
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
