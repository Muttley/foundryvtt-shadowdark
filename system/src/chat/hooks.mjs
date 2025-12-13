import SolodarkSD from "../apps/SoloDarkSD.mjs";

export function highlightSuccessFailure(app, html, data) {
	if ( !app.flags?.shadowdark?.isRoll ) return;

	const $html = $(html);

	const value = $html.find(".d20-roll .dice-total").text();

	if ( app.flags.shadowdark.critical === "failure" ) {
		$html.find(".d20-roll .dice-total").addClass("failure");

		$html.find(".d20-roll .dice-total").text(
			game.i18n.format(
				"SHADOWDARK.roll.critical.failure",
				{value: value}
			)
		);
	}
	else if ( app.flags.shadowdark.critical === "success" ) {
		$html.find(".d20-roll .dice-total").addClass("success");

		$html.find(".d20-roll .dice-total").text(
			game.i18n.format(
				"SHADOWDARK.roll.critical.success",
				{value: value}
			)
		);
	}
	else if ( app.flags.shadowdark.hasTarget && app.flags.shadowdark.success ) {
		$html.find(".d20-roll .dice-total").addClass("success");

		$html.find(".d20-roll .dice-total").text(
			game.i18n.format(
				"SHADOWDARK.roll.success",
				{value: value}
			)
		);
	}
	else if ( app.flags.shadowdark.hasTarget && !app.flags.shadowdark.success ) {
		$html.find(".d20-roll .dice-total").addClass("failure");

		$html.find(".d20-roll .dice-total").text(
			game.i18n.format(
				"SHADOWDARK.roll.failure",
				{value: value}
			)
		);
	}
}

/**
 * Parses the actor data from a chat card by token or actor
 * @param {jQuery} card - Chatcard to get actor from
 * @returns {Actor|null}
 */
async function _getChatCardActor(card) {
	// synthetic actor from token
	if ( card.dataset.tokenId ) {
		const token = await fromUuid(card.dataset.tokenId);
		if ( !token ) return null;
		return token.actor;
	}

	// Otherwise, get the actor
	const actorId = card.dataset.actorId;
	return game.actors.get(actorId) || null;
}

/**
 * Applies the result of a HP roll to an actors max HP and disables
 * the button.
 * @param {Event} event - PointerEvent for click on button
 */
async function applyHpToMax(event) {
	const button = event.currentTarget;

	// Disable button
	button.disabled = true;

	const hp = parseInt(button.dataset.value, 10);

	const card = button.closest(".chat-card");
	const actor = await _getChatCardActor(card);

	await actor.addToHpBase(hp);
}

/**
 * Handles the chatcard button actions when applicable.
 * @param {ChatLog} app - The ChatLog instance
 * @param {jQuery} html - Rendered chat message html
 * @param {object} data - Data passed to the render context
 */
async function chatCardButtonAction(app, html, data) {
	const $html = $(html);

	const hpButton = $html.find("button[data-action=apply-hp-to-max]");
	hpButton.on("click", ev => {
		ev.preventDefault();
		applyHpToMax(ev);
	});

	const castSpellButton = $html.find("button[data-action=cast-spell]");
	castSpellButton.on("click", ev => {
		ev.preventDefault();
		const itemId = $(ev.currentTarget).data("item-id");
		const actorId = $(ev.currentTarget).data("actor-id");
		const actor = game.actors.get(actorId);

		actor.castSpell(itemId);
	});

	const learnSpellButton = $html.find("button[data-action=learn-spell]");
	learnSpellButton.on("click", ev => {
		ev.preventDefault();
		const itemId = $(ev.currentTarget).data("item-id");
		const actorId = $(ev.currentTarget).data("actor-id");
		const actor = game.actors.get(actorId);

		actor.learnSpell(itemId);
	});

	const usePotionButton = $html.find("button[data-action=use-potion]");
	usePotionButton.on("click", ev => {
		ev.preventDefault();
		const itemId = $(ev.currentTarget).data("item-id");
		const actorId = $(ev.currentTarget).data("actor-id");
		const actor = game.actors.get(actorId);

		actor.usePotion(itemId);
	});

	const weaponAttackButton = $html.find("button[data-action=roll-attack]");
	weaponAttackButton.on("click", ev => {
		ev.preventDefault();
		const itemId = $(ev.currentTarget).data("item-id");
		const actorId = $(ev.currentTarget).data("actor-id");
		const actor = game.actors.get(actorId);

		actor.rollAttack(itemId);
	});

	const rollPromptButton = $html.find("button[data-action=roll-prompt]");
	rollPromptButton.on("click", ev => {
		ev.preventDefault();
		SolodarkSD.rollPrompt();
	});
}

export function chatCardBlind(app, html, data) {
	if (game.user.isGM) return false;

	const $html = $(html);

	if (app.blind) {
		$html.find(".blindable .dice-total").text("???");
		$html.find(".dice-rolls").remove();
		$html.find(".dice .part-total").remove();
		return true; // Prevent further actions to happen
	}
	return false;
}

export function removeTorchTimer(app, html, data) {
	if (game.user.isGM || game.settings.get("shadowdark", "playerShowLightRemaining") > 1) return;

	html.querySelectorAll(".light-source").forEach(el => {
  		el.remove();
	});
}

/**
 * Handles the rendering of a chat message to the log
 * @param {ChatLog} app - The ChatLog instance
 * @param {jQuery} html - Rendered chat message html
 * @param {object} data - Data passed to the render context
 */
export function onRenderChatMessage(app, html, data) {
	chatCardButtonAction(app, html, data);
	removeTorchTimer(app, html, data);
	const blind = chatCardBlind(app, html, data);
	if (!blind) highlightSuccessFailure(app, html, data);
}

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
