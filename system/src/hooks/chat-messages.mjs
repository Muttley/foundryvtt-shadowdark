import {
	addChatMessageContextOptions,
	onRenderChatMessage,
} from "../chat/hooks.mjs";

export const ChatMessageHooks = {
	attach: () => {
		Hooks.on("getChatMessageContextOptions", addChatMessageContextOptions);
		Hooks.on("renderChatMessageHTML", onRenderChatMessage);
	},
};
