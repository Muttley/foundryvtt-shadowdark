/**
 * This function is used to hook into the Chat Log context menu, adds additional
 * options to each
 *
 * These options make it easy to conveniently apply damage to tokens based on
 * the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {object[]} options    The Array of Context Menu options
 *
 * @returns {object[]}          The extended options Array including new context choices
 */
export function addChatMessageContextOptions(html, options) {

	const canApplyDamage = li => {
		const message = getMessage(li);

		return game.user.isGM
			&& canvas.tokens?.controlled.length
			&& _chatMessageIsDamageCard(message);
	};

	options.push(
		{
			name: game.i18n.localize("SHADOWDARK.chat_card.context.apply_damage"),
			icon: '<i class="fas fa-user-minus"></i>',
			condition: canApplyDamage,
			callback: li => applyChatCardDamage(li, 1),
		},
		{
			name: game.i18n.localize("SHADOWDARK.chat_card.context.apply_healing"),
			icon: '<i class="fas fa-user-plus"></i>',
			condition: canApplyDamage,
			callback: li => applyChatCardDamage(li, -1),
		}
	);

	return options;
}

// TODO Refactor below here

function getMessage(element) {
	return game.messages.get(
		(element instanceof HTMLElement)
			? element.dataset.messageId // JS HTML Element
			: element.data("messageId") // JQuery HTML Element
	);
}

/**
 * Apply rolled dice damage to the token or tokens which are currently controlled.
 * The multipliers allows for damage to be scaled for healing, or other modifications
 *
 * @param {HTMLElement} li      The chat entry which contains the roll data
 * @param {number} multiplier   A damage multiplier to apply to the rolled damage.
 * @returns {Promise}
 */
function applyChatCardDamage(li, multiplier) {
	const message = getMessage(li);
	const roll = message.rolls[1];

	if (!roll) return;

	return Promise.all(canvas.tokens.controlled.map(t => {
		const a = t.actor;
		return a.applyDamage(roll.total, multiplier);
	}));
}

/**
 * Identifies our custom Attack + Damage cards
 * @param {ChatMessage} message
 * @returns
 */
function _chatMessageIsDamageCard(message) {
	return message?.flags?.shadowdark?.rollConfig?.damageRoll ? true : false;
}
