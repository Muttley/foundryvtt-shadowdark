export default class ChatSD {

	static async _renderChatMessage(
		actor,
		data,
		template,
		mode
	) {
		const html = await renderTemplate(template, data);

		if (!mode) {
			mode = game.settings.get("core", "rollMode");
		}

		const messageStyles = shadowdark.utils.getMessageStyles();

		const chatData = {
			user: game.user.id,
			speaker: ChatMessage.getSpeaker({
				actor: actor,
			}),
			rollMode: mode,
			content: html,
			type: messageStyles.OTHER,
		};

		ChatMessage.applyRollMode(chatData, mode);

		await ChatMessage.create(chatData);
	}

	static async renderGeneralMessage(actor, data, mode) {
		this._renderChatMessage(actor, data,
			"systems/shadowdark/templates/chat/general.hbs",
			mode
		);
	}

	static async renderRollRequestMessage(actor, data, mode) {
		this._renderChatMessage(actor, data,
			"systems/shadowdark/templates/chat/roll-request.hbs",
			mode
		);
	}
}
