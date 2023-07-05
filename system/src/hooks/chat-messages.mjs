import {
	addChatMessageContextOptions,
	onRenderChatMessage,
} from "../chat/hooks.mjs";

export const ChatMessageHooks = {
	attach: () => {
		Hooks.on("getChatLogEntryContext", addChatMessageContextOptions);
		Hooks.on("renderChatMessage", (app, html, data) => onRenderChatMessage(app, html, data));
	},
};
