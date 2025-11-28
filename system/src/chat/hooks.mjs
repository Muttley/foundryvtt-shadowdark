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
			&& (_chatMessageIsBasicRoll(message)
				|| _chatMessageIsDamageCard(message));
	};

	const canApplySecondaryDamage = li => {
		const message = getMessage(li);

		return game.user.isGM
			&& canvas.tokens?.controlled.length
			&& (_chatMessageIsDamageCardSecondary(message));
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
		},
		{
			name: game.i18n.localize("SHADOWDARK.chat_card.context.apply_damage_secondary"),
			icon: '<i class="fas fa-user-minus"></i>',
			condition: canApplySecondaryDamage,
			callback: li => applyChatCardDamageSecondary(li, 1),
		},
		{
			name: game.i18n.localize("SHADOWDARK.chat_card.context.apply_healing_secondary"),
			icon: '<i class="fas fa-user-plus"></i>',
			condition: canApplySecondaryDamage,
			callback: li => applyChatCardDamageSecondary(li, -1),
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
	let roll;

	// There are two version of this check.
	// Version #1, this is a single roll

	if (_chatMessageIsBasicRoll(message)) {
		roll = message.rolls[0];
	}
	else if (_chatMessageIsDamageCard(message)) {
		roll = message?.flags?.shadowdark?.rolls?.damage?.roll;
	}
	else {
		return;
	}

	return Promise.all(canvas.tokens.controlled.map(t => {
		const a = t.actor;
		return a.applyDamage(roll.total, multiplier);
	}));
}

/**
 * Apply secondary rolled dice damage to the token or tokens which are currently controlled.
 * The multipliers allows for damage to be scaled for healing, or other modifications.
 * Specifically used for damage cards with two outputs, such at versatile.
 *
 * @param {HTMLElement} li      The chat entry which contains the roll data
 * @param {number} multiplier   A damage multiplier to apply to the rolled damage.
 * @returns {Promise}
 */
function applyChatCardDamageSecondary(li, multiplier) {

	const message = getMessage(li);

	if (!_chatMessageIsDamageCardSecondary(message)) {
		return;
	}

	let roll = message?.flags?.shadowdark?.rolls?.secondaryDamage?.roll;

	return Promise.all(canvas.tokens.controlled.map(t => {
		const a = t.actor;
		return a.applyDamage(roll.total, multiplier);
	}));
}


/**
 * Identifies basic ChatMessage rolls like `/r d6`
 * @param {ChatMessage} message
 * @returns
 */
function _chatMessageIsBasicRoll(message) {
	return message?.isRoll
		&& message?.rolls[0];
}

/**
 * Identifies our custom Attack + Damage cards
 * @param {ChatMessage} message
 * @returns
 */
function _chatMessageIsDamageCard(message) {
	return message?.flags?.shadowdark?.isRoll
		&& (message?.flags?.shadowdark?.rolls?.damage);
}

/**
 * Identifies our custom Attack + Damage card with secondary damage roll
 * Clasically, this is a versatile weapon
 * @param {ChatMessage} message
 * @returns
 */
function _chatMessageIsDamageCardSecondary(message) {
	return message?.flags?.shadowdark?.isRoll
		&& message?.flags?.shadowdark?.rolls?.secondaryDamage;
}
