import {
	addChatMessageContextOptions,
	onRenderChatMessage,
} from "../chat/hooks.mjs";

export const ChatMessageHooks = {
	attach: () => {
		Hooks.on("getChatLogEntryContext", addChatMessageContextOptions); // v12 only
		Hooks.on("getChatMessageContextOptions", addChatMessageContextOptions); // v13 only
		Hooks.on("renderChatMessageHTML", (app, html, data) => onRenderChatMessage(app, html, data));
	},
};
