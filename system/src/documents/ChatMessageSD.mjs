import SolodarkSD from "../apps/SoloDarkSD.mjs";
export default class ChatMessageSD extends ChatMessage {


	async renderHTML(options={}) {
    	const html = await super.renderHTML(options);
		this._updateChatHeader(html);
		this._addEventHandlers(html);
		return html;
	}

	getRoll(type=null) {
		return this.rolls.find(r => r.options?.type === type);
	}

	get rollConfig() {
		return this.getFlag("shadowdark", "rollConfig");
	}

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

	_addEventHandlers(html) {

		// Enable roll prompt button for solodark
		const rollPromptButton = html.querySelector("button[data-action=roll-prompt]");
		if (rollPromptButton) {
			rollPromptButton.addEventListener("click", SolodarkSD.rollPrompt);
		}

		// Roll Damange Button
		const damageButton = html.querySelector('[data-action="rollDamage"]');
		if (damageButton) {
			damageButton.addEventListener("click", event => {
				event.preventDefault();
				// get message id
				const li = damageButton.closest("[data-message-id]");
				if (!li) return;
				const message = game.messages.get(li.dataset.messageId);
				shadowdark.dice.rollDamageFromMessage(message);
			});
		}
	}

}
