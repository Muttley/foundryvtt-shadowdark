import {
	addChatMessageContextOptions,
	onRenderChatMessage,
} from "../chat/hooks.mjs";

export const ChatMessageHooks = {
	attach: () => {
		if (game.version < 13) {
			Hooks.on("getChatLogEntryContext", addChatMessageContextOptions);
		}
		else {
			Hooks.on("getChatMessageContextOptions", addChatMessageContextOptions);
		}
		Hooks.on("renderChatMessage", (app, html, data) => onRenderChatMessage(app, html, data));
	},
};
