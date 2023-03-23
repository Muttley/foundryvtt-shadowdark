import onRenderchatMessage from "../chat/hooks.mjs";

export const ChatMessageHooks = {
	attach: () => {
		Hooks.on("renderChatMessage", onRenderchatMessage);
	},
};
