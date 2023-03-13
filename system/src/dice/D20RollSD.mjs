export default class D20RollSD extends Roll {

	constructor(formula, data, options) {
		super(formula, data, options);

		if (!this.options.configured) this.configureModifiers();
	}

	configureModifiers() {
		this.options.configured = true;
	}

	/**
	 * Analyze a roll result for critical hit
	 * @param {Roll} roll - Roll results
	 * @returns {string|null} - Either the type of critical as string, or null
	 */
	static digestCritical(roll) {
		if ( roll.terms[0].faces !== 20 ) return null;
		// Get the final result if using adv/disadv
		else if ( roll.terms[0].total === 20 ) return "success";
		else if ( roll.terms[0].total === 1 ) return "failure";
		return null;
	}

	/**
	 * Parses an evaluated roll
	 * @param {object} data - Data supplied to the roll
	 * @param {roll} roll - Evaluated Roll
	 * @returns {object}
	 */
	static digestResult(data, roll) {
		const result = {
			critical: this.digestCritical(roll),
			total: roll.total,
		};

		return result;
	}

	static async d20Roll({
		item = null,
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
		rollType = "",
		fastForward = false,
		chatMessage = true,
	}) {
		/**
		 *
		 * @param {Array<string>} rollParts - Modifiers to be used in roll
		 * @param {number} adv - Advantage(1)/Disadvantage(-1)
		 * @param {jQuery} $form - Callback HTML from dialog
		 * @returns {Promise<>}
		 */
		const _roll = async (rollParts, adv, $form) => {
			let flav = flavor instanceof Function ? flavor(rollParts, data) : title;
			if (adv === 1) {
				rollParts[0] = ["2d20kh"];
				flav = game.i18n.format("SHADOWDARK.Roll.AdvantageTitle", { title: title });
			}
			else if (adv === -1) {
				rollParts[0] = ["2d20kl"];
				flav = game.i18n.format("SHADOWDARK.Roll.DisadvantageTitle", { title: title });
			}

			// Check if itemBonus is defined
			if ($form) data.itemBonus = $form.find("[name=item-bonus]").val();
			if ((!data.itemBonus || data.itemBonus === 0) && rollParts.indexOf("@itemBonus") !== -1) rollParts.splice(rollParts.indexOf("@itemBonus"), 1);

			// Check if abilityBonus is defined
			if ($form) data.abilityBonus = $form.find("[name=ability-bonus]").val();
			if ((!data.abilityBonus || data.abilityBonus === 0) && rollParts.indexOf("@abilityBonus") !== -1) rollParts.splice(rollParts.indexOf("@abilityBonus"), 1);

			// Check if talentBonus is defind
			if ($form) data.talentBonus = $form.find("[name=talent-bonus]").val();
			if ((!data.talentBonus || data.abilityBonus === 0) && rollParts.indexOf("@talentBonus") !== -1) rollParts.splice(rollParts.indexOf("@talentBonus"), 1);

			// Execute roll and send it to chat
			const roll = await new Roll(rollParts.join("+"), data).evaluate({ async: true });

			const result = D20RollSD.digestResult(data, roll);

			const chatData = {
				user: game.user.id,
				speaker,
				flags: {
					isRoll: true,
					"core.canPopout": true,
					hasTarget: targetValue ? true : false,
					success: roll.total >= targetValue,
					critical: result.critical,
				},
			};

			data.target = targetValue || "";

			// Build templateData
			const templateData = {
				title: title,
				flavor: flav,
				data: data,
				isSpell: data.item ? data.item.isSpell() : false,
				isWeapon: data.item ? data.item.isWeapon() : false,
				isVersatile: data.item ? data.item.isVersatile() : false,
				result: result,
			};

			// Roll weapon damage
			let twoHandedDamageRoll;
			let oneHandedDamageRoll;
			if ( templateData.isWeapon ) {
				let numDice = data.item.system.damage.numDice;
				const damageRollParts = data.item.isTwoHanded()
					? data.item.system.damage.twoHanded : data.item.system.damage.oneHanded;

				if ( result.critical !== "failure" ) {
					if ( result.critical === "success" ) {
						numDice *= 2;
					}

					oneHandedDamageRoll = await new Roll(`${numDice}${damageRollParts}`, data).evaluate({ async: true });

					// Render HTML for roll
					await oneHandedDamageRoll.render().then(r => {
						templateData.primaryDamage = r;
					});

					if ( data.item.isVersatile() ) {
						const secondaryRollParts = data.item.system.damage.twoHanded;
						twoHandedDamageRoll = await new Roll(`${numDice}${secondaryRollParts}`, data).evaluate({ async: true });

						// Render HTML for roll
						await twoHandedDamageRoll.render().then(r => {
							templateData.secondaryDamage = r;
						});
					}
				}
			}

			return new Promise(resolve => {
				roll.render().then(r => {
					templateData.rollSD = r;
					renderTemplate(chatCardTemplate, templateData).then(content => {
						chatData.content = content;
						// Integration with Dice So Nice
						if (game.dice3d) {
							game.dice3d
								.showForRoll(
									roll,
									game.user,
									true
								)
								.then(() => {
									if ( oneHandedDamageRoll ) {
										game.dice3d
											.showForRoll(oneHandedDamageRoll, game.user, true);
									}
									if ( twoHandedDamageRoll ) {
										game.dice3d
											.showForRoll(twoHandedDamageRoll, game.user, true);
									}
								})
								.then(() => {
									if (chatMessage !== false) ChatMessage.create(chatData);
									resolve(roll);
								});
						}
						else {
							chatData.sound = CONFIG.sounds.dice;
							if (chatMessage !== false) ChatMessage.create(chatData);
							resolve(roll);
						}
					});
				});
			});
		};

		// Modify the roll and handle fast-forwarding
		parts.unshift("1d20");
		if ( fastForward ) {
			return _roll(parts, 0);
		}
		else {
			if (parts.indexOf("@abilityBonus") === -1) parts = parts.concat(["@abilityBonus"]);
			if (parts.indexOf("@itemBonus") === -1) parts = parts.concat(["@itemBonus"]);
			if (parts.indexOf("@talentBonus") === -1) parts = parts.concat(["@talentBonus"]);

			// Render dialog
			const dialogData = {
				data,
				rollMode,
				formula: parts.join(" + "),
				rollModes: CONFIG.Dice.rollModes,
			};

			const content = await renderTemplate(dialogTemplate, dialogData);
			let roll;

			return new Promise(resolve => {
				new Dialog(
					{
						title,
						content,
						buttons: {
							advantage: {
								label: game.i18n.localize("SHADOWDARK.Roll.Advantage"),
								callback: async html => {
									roll = await _roll(parts, 1, html);
								},
							},
							normal: {
								label: game.i18n.localize("SHADOWDARK.Roll.Normal"),
								callback: async html => {
									roll = await _roll(parts, 0, html);
								},
							},
							disadvantage: {
								label: game.i18n.localize("SHADOWDARK.Roll.Disadvantage"),
								callback: async html => {
									roll = await _roll(parts, -1, html);
								},
							},
						},
						default: game.i18n.localize("SHADOWDARK.Roll.Normal"),
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
