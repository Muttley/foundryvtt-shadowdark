export default class ChatMessageSD extends ChatMessage {

	async renderHTML(options={}) {
    	const html = await super.renderHTML(options);
		this._updateChatHeader(html);
		return html;
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

}
