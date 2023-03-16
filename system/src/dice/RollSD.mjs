export default class RollSD extends Roll {

	/**
	 * Main roll method for rolling a D20. Looks if it has been supplied
	 * a weapon and rolls that special case.
	 * @param {Array<string>}	- Parts for the roll
	 * @param {object} data 	- Data that carries actor and/or item
	 * @param {jQuery} $form 	- Form from an evaluated dialog
	 * @param {number} adv		- Determine the direction of advantage (1)
	 * 																/ disadvantage (-1)
	 * @param {*} options 		- Options to modify behavior
	 * @returns {Promise}			- Promise for...
	 */
	static async RollD20(parts, data, $form, adv=0, options={}) {
		// Augment data with form bonuses
		const formBonuses = this._getBonusesFromFrom($form);

		// Combine bonuses from form with the data
		data = foundry.utils.mergeObject(data, formBonuses);

		options.rollMode = $form ? this._getRollModeFromForm($form) : game.settings.get("core", "rollMode");

		// Roll the Dice
		data.rolls = {
			 d20: await this._rollD20(parts, data, adv),
		};

		// Weapon? -> Roll Damage dice
		if (data.item?.isWeapon()) {
			data.rolls = this._rollWeapon(data);
		}

		// Spell? -> Set a target
		if (data.item?.isSpell()) {
			options.target = data.item.system.tier + 10;
		}

		// Store the advantage for generating chat card
		data.adv = adv;

		// @todo: Build the Chat Data
		return this._renderRoll(data, options);
	}

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
	 * Compares requested parts to provided data values
	 * @param {Array<string>} parts - Parts with @bonuses to add to roll
	 * @param {object} data 				- Data object containing data.bonuses values
	 * @returns {Array<string>}			- Parts with only defined bonuses in data object
	 */
	static _digestParts(parts, data) {
		const reducedParts = [];
		parts.forEach(part => {
			// If both the bonus is defined, and not 0, push to the results
			if (data[part.substring(1)] && data[part.substring(1)] !== 0) reducedParts.push(part);
		});
		return reducedParts;
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

		// Store the first entry, assuming this is the main dice
		const mainDice = parts[0];

		// Remove bonuses lacking equivalent bonus in data
		parts = this._digestParts(parts, data);
		parts.unshift(mainDice);

		const roll = await new Roll(parts.join(" + "), data).evaluate({async: true});
		const renderedHTML = await roll.render();
		const critical = this._digestCritical(roll);

		return {
			roll,
			renderedHTML,
			critical,
		};
	}

	/**
	 * Analyses provided `data` and rolls with supplied bonuses, and advantage if
	 * requested.
	 * @param {Array<string>} parts - Bonus parts (@bonus) for consideration in roll
	 * @param {object} data 				- Data carrying object for use in roll.
	 * @param {-1|0|1} adv 					- Determine the direction of advantage (1)
	 * 																/ disadvantage (-1)
	 * @returns {object}						- Object containing evaluated roll data
	 */
	static async _rollD20(parts = [], data={}, adv=0) {
		// Modify the d20 to take advantage in consideration
		parts.unshift("1d20");
		parts = this._partsAdvantage(parts, adv);

		return this._rollDice(parts, data);
	}

	/* -------------------------------------------- */
	/*  Special Case Rolling                        */
	/* -------------------------------------------- */

	/**
	 * Rolls a weapon when suppled in the `data` object.
	 * @param {object} data - Object containing the item document of rolled item
	 * @returns {object}		- Returns the data object, with additional roll evaluations
	 */
	static async _rollWeapon(data) {
		// Get dice information from the weapon
		let numDice = data.item.system.damage.numDice;
		const damageDie = data.item.isTwoHanded()
			?	data.item.system.damage.twoHanded : data.item.system.damage.oneHanded;

		// Check and handle critical failure/success
		if ( data.rolls.d20.critical !== "failure" ) {
			if ( data.rolls.d20.critical === "success" ) numDice *= 2;

			// @todo: Check for bonus dice and add to numDice

			const primaryParts = [`${numDice}${damageDie}`];

			data.rolls.primaryDamage = await this._rollDice(primaryParts, data);

			if ( data.item.isVersatile() ) {
				const secondaryParts = [`${numDice}${data.item.system.damage.twoHanded}`];
				data.rolls.secondaryDamage = await this._rollDice(secondaryParts, data);
			}
		}
		return data;
	}

	/* -------------------------------------------- */
	/*  Dialog & Form Digestion                     */
	/* -------------------------------------------- */

	/**
	 * Extract the roll mode from a form
	 * @param {jQuery} $form 	- Callback HTML from dialog
	 * @returns {string}			- Selected Rollmode
	 */
	static _getRollModeFromForm($form) {
		return $form.find("[name=rollMode]").val();
	}

	/**
	 * Parses a submitted dialog form for bonuses
	 * @param {jQuery} $form 	- Submitted dialog form
	 * @returns {object}			- Bonuses from the dialog form
	 */
	static _getBonusesFromFrom($form) {
		const bonuses = {};
		if ($form.find("[name=item-bonus]").length) bonuses.itemBonus = $form.find("[name=item-bonus]")?.val();
		if ($form.find("[name=ability-bonus]").length) bonuses.abilityBonus = $form.find("[name=ability-bonus]")?.val();
		if ($form.find("[name=talent-bonus]").length) bonuses.talentBonus = $form.find("[name=talent-bonus]")?.val();
		return bonuses;
	}

	/* -------------------------------------------- */
	/*  Dialogs                                     */
	/* -------------------------------------------- */

	/**
	 * Renders HTML for display as roll dialog
	 * @param {Array<string>} parts		- Dice formula parts
	 * @param {object} data 					- Data for use in the dialog
	 * @param {object} options 				- Configuration options for dialog
	 * @returns {jQuery}							- Rendered HTML object
	 */
	static async _getRollDialogContent(
		parts,
		data,
		options = {}
	) {
		const dialogTemplate = options.dialogTemplate
			? options.dialogTemplate
			: "systems/shadowdark/templates/dialog/roll-dialog.hbs";

		const dialogData = {
			data,
			rollMode: game.settings.get("core", "rollMode"),
			formula: Array.from(parts).join(" + "),
			rollModes: CONFIG.Dice.rollModes,
		};

		return renderTemplate(dialogTemplate, dialogData);
	}

	/**
	 * Renders a Roll Dialog and displays the appropriate bonuses
	 * @param {Array<string>} parts - Predetermined roll @bonuses
	 * @param {object} data 				- Data container with dialogTitle
	 * @param {object} options 			- Configuration options for dialog
	 * @returns {Promise(Roll)}			- Returns the promise of evaluated roll(s)
	 */
	static async RollD20Dialog(parts, data, options={}) {
		// Render the HTML for the dialog
		let content;
		content = await this._getRollDialogContent(parts, data, options);

		return new Promise(resolve => {
			let roll;
			new Dialog(
				{
					title: options.dialogTitle
						? options.dialogTitle : game.i18n.localize("SHADOWDARK.roll.D20"),
					content,
					buttons: {
						advantage: {
							label: game.i18n.localize("SHADOWDARK.roll.advantage"),
							callback: async html => {
								roll = await this.RollD20(parts, data, html, 1, options);
							},
						},
						normal: {
							label: game.i18n.localize("SHADOWDARK.roll.normal"),
							callback: async html => {
								roll = await this.RollD20(parts, data, html, 0, options);
							},
						},
						disadvantage: {
							label: game.i18n.localize("SHADOWDARK.roll.disadvantage"),
							callback: async html => {
								roll = await this.RollD20(parts, data, html, -1, options);
							},
						},
					},
					default: "normal",
					close: () => {
						resolve(roll);
					},
				},
				options.dialogOptions
			).render(true);
		});
	}

	/* -------------------------------------------- */
	/*  Chat Card Generation for Displaying         */
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
			flavor: "bob",
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
	 * @returns {object}				- Data to populate the Chat Card template
	 */
	static _getChatCardTemplateData(title, data) {
		const templateData = {
			title: title,
			flavor: title,
			data: data,
			isSpell: false,
			isWeapon: false,
			isVersatile: false,
			critical: data.rolls.d20.critical,
			rolls: data.rolls,
		};
		if (data.item) {
			templateData.isSpell = data.item.isSpell();
			templateData.isWeapon = data.item.isWeapon();
			templateData.isVersatile = data.item.isVersatile();
		}
		return templateData;
	}

	static async _getChatCardContent(
		data,
		options = {}
	) {
		const chatCardTemplate = options.chatCardTemplate
			? options.chatCardTemplate
			: "systems/shadowdark/templates/chat/roll-card.hbs";

		const title = options.title
			? options.title
			: game.i18n.localize("SHADOWDARK.chatcard.default");

		const chatCardData = this._getChatCardTemplateData(title,	data);

		return renderTemplate(chatCardTemplate, chatCardData);
	}

	static async _renderRoll(data, options) {
		// @todo : Review
		const chatData = this._getChatCardData(
			data.rolls.d20.roll,
			options.speaker,
			options.targetValue
		);

		const content = await this._getChatCardContent(data, options);

		return new Promise(resolve => {
			// Setup the chat card
			if ( options.rollMode === "blindroll" ) chatData.blind = true;
			chatData.content = content;

			// Determine the flavor of the chat card
			switch (data.adv) {
				case 1: chatData.flavor = game.i18n.format("SHADOWDARK.roll.advantage_title", { title: options.flavor }); break;
				case -1: chatData.flavor = game.i18n.format("SHADOWDARK.roll.disadvantage_title", { title: options.flavor }); break;
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
}
