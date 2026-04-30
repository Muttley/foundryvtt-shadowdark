import SolodarkSD from "../apps/SoloDarkSD.mjs";
export default class ChatMessageSD extends ChatMessage {

	_addEventHandlers(html) {
		// solo dark prompt
		const rollPromptButton = html.querySelector("button[data-action=roll-prompt]");
		if (rollPromptButton) {
			rollPromptButton.addEventListener("click", SolodarkSD.rollPrompt);
		}
		// roll damage
		const damageButton = html.querySelector('[data-action="rollDamage"]');
		if (damageButton) {
			damageButton.addEventListener("click", event => this._onRollDamage(event, damageButton));
		}

		// reroll
		html.querySelectorAll('[data-action="reroll"]').forEach(btn => {
			btn.addEventListener("click", event => this._onReroll(event, btn));
		});

		// apply damage
		html.querySelectorAll('[data-action="apply-damage"]').forEach(btn => {
			if (this.getFlag("shadowdark", "damageApplied")) {
				btn.classList.add("damage-applied");
			}
			btn.addEventListener("click", event => this._onApplyDamage(event, btn));
		});

		// click target
		html.querySelectorAll('[data-action="focus-target"]').forEach(el => {
			el.addEventListener("click", event => this._onFocusTarget(event));
			el.addEventListener("dblclick", event => this._onOpenTargetSheet(event));
		});
	}

	/** @override */
	async renderHTML(options={}) {
    	const html = await super.renderHTML(options);
		this._updateChatHeader(html);
		this._applyVisibilityRules(html);
		this._addEventHandlers(html);
		return html;
	}

	getRoll(type=null) {
		return this.rolls.find(r => r.options?.type === type);
	}

	get rollConfig() {
		return this.getFlag("shadowdark", "rollConfig");
	}

	_applyVisibilityRules(html) {
		const canReroll = game.user.isGM || game.user.id === this.user?.id;
		if (!canReroll) {
			html.querySelectorAll('[data-action="reroll"]').forEach(btn => btn.remove());
		}
		if (!game.user.isGM) {
			html.querySelector(".apply-damage-wrapper")?.remove();
		}
	}

	async _onApplyDamage(event, btn) {
		event.preventDefault();
		const li = btn.closest("[data-message-id]");
		if (!li) return;
		const message = game.messages.get(li.dataset.messageId);
		const config = message?.rollConfig;
		if (!config) return;

		if (message.getFlag("shadowdark", "damageApplied")) {
			const reapply = await Dialog.confirm({
				title: game.i18n.localize("SHADOWDARK.chat_card.dialog.reapply_damage.title"),
				content: `<p>${game.i18n.localize("SHADOWDARK.chat_card.dialog.reapply_damage.content")}</p>`,
				defaultYes: false,
			});
			if (!reapply) return;
		}

		const damageRoll = message.getRoll("damage");
		if (!damageRoll) return;

		let actor;
		if (btn.dataset.target === "target" && config.targetUuid) {
			const target = await fromUuid(config.targetUuid);
			actor = target?.actor;
		}
		else if (btn.dataset.target === "selected") {
			actor = canvas.tokens.controlled[0]?.actor;
		}
		else {
			ui.notifications.error(game.i18n.localize("SHADOWDARK.error.no_token_selected"));
		}

		if (!actor) return;
		const damage = (config.cast?.damageType === "healing")
			? -damageRoll.total
			: damageRoll.total;
		actor.applyDamage(damage);

		await message.setFlag("shadowdark", "damageApplied", true);
	}

	async _onFocusTarget(event) {
		event.preventDefault();
		const tokenUuid = event.currentTarget.dataset.targetUuid;
		const tokenDoc = await fromUuid(tokenUuid);
		if (!tokenDoc) return;
		const {x, y} = tokenDoc.object.center;
		await canvas.animatePan({x, y, scale: Math.max(canvas.stage.scale.x, 0.5)});
	}

	async _onOpenTargetSheet(event) {
		event.preventDefault();
		const actorUuid = event.currentTarget.dataset.actorUuid;
		const actor = await fromUuid(actorUuid);
		actor.sheet.render(true);
	}

	_onReroll(event, btn) {
		event.preventDefault();
		const li = btn.closest("[data-message-id]");
		if (!li) return;
		const message = game.messages.get(li.dataset.messageId);
		shadowdark.dice.rerollFromMessage(message, btn.dataset.rollType);
	}

	_onRollDamage(event, btn) {
		event.preventDefault();
		const li = btn.closest("[data-message-id]");
		if (!li) return;
		const message = game.messages.get(li.dataset.messageId);
		shadowdark.dice.rollDamageFromMessage(message);
	}

	/**
	 * Restructures the default Foundry chat message header into the Shadowdark format.
	 * @param {HTMLElement} html - The rendered chat message HTML element
	 */
	_updateChatHeader(html) {

		const header = html.querySelector(".message-header");
		const sender = html.querySelector(".message-sender");
		const senderWrapper = document.createElement("span");
		senderWrapper.classList.add("message-sender-wrapper");

		header.prepend(senderWrapper);
		senderWrapper.appendChild(sender);

		const actor = this.speakerActor;
		if (actor) {
			const img = document.createElement("img");
			img.src = this.speakerActor.img;
			img.alt = this.speaker.alias;
			senderWrapper.prepend(img);
		}

		html.querySelector(".whisper-to")?.remove();

		// Remove delete button
		const metadata = html.querySelector(".message-metadata");
		const deleteButton = metadata.querySelector(".message-delete");
		deleteButton?.remove();

	}

}
