export function highlightSuccessFailure(app, html, data) {
	if ( !app.flags.isRoll ) return;
	const value = html.find(".d20-roll .dice-total").text();
	if ( app.flags.critical === "failure" ) {
		html.find(".d20-roll .dice-total").addClass("failure");
		html.find(".d20-roll .dice-total").text( game.i18n.format("SHADOWDARK.roll.critical.failure", { value: value }));
	}
	else if ( app.flags.critical === "success" ) {
		html.find(".d20-roll .dice-total").addClass("success");
		html.find(".d20-roll .dice-total").text( game.i18n.format("SHADOWDARK.roll.critical.success", { value: value }));
	}
	else if ( app.flags.hasTarget && app.flags.success ) {
		html.find(".d20-roll .dice-total").addClass("success");
		html.find(".d20-roll .dice-total").text( game.i18n.format("SHADOWDARK.roll.success", { value: value }) );
	}
	else if ( app.flags.hasTarget && !app.flags.success ) {
		html.find(".d20-roll .dice-total").addClass("failure");
		html.find(".d20-roll .dice-total").text( game.i18n.format("SHADOWDARK.roll.failure", { value: value }) );
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
export function chatCardButtonAction(app, html, data) {
	const hpButton = html.find("button[data-action=apply-hp-to-max]");
	hpButton.on("click", ev => {
		ev.preventDefault();
		applyHpToMax(ev);
	});

	const castSpellButton = html.find("button[data-action=cast-spell]");
	castSpellButton.on("click", ev => {
		ev.preventDefault();
		const itemId = $(ev.currentTarget).data("item-id");
		const actorId = $(ev.currentTarget).data("actor-id");
		const actor = game.actors.get(actorId);

		actor.castSpell(itemId);
	});

	const usePotionButton = html.find("button[data-action=use-potion]");
	usePotionButton.on("click", ev => {
		ev.preventDefault();
		const itemId = $(ev.currentTarget).data("item-id");
		const actorId = $(ev.currentTarget).data("actor-id");
		const actor = game.actors.get(actorId);

		actor.usePotion(itemId);
	});

	const weaponAttackButton = html.find("button[data-action=roll-attack]");
	weaponAttackButton.on("click", ev => {
		ev.preventDefault();
		const itemId = $(ev.currentTarget).data("item-id");
		const actorId = $(ev.currentTarget).data("actor-id");
		const actor = game.actors.get(actorId);

		actor.rollAttack(itemId);
	});
}

/**
 * Handles the rendering of a chat message to the log
 * @param {ChatLog} app - The ChatLog instance
 * @param {jQuery} html - Rendered chat message html
 * @param {object} data - Data passed to the render context
 */
export default function onRenderChatMessage(app, html, data) {
	chatCardButtonAction(app, html, data);
	highlightSuccessFailure(app, html, data);
}
