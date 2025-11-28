import {
	addChatMessageContextOptions,
} from "../chat/hooks.mjs";

export const ChatMessageHooks = {
	attach: () => {
		Hooks.on("getChatMessageContextOptions", addChatMessageContextOptions);
	},
};
