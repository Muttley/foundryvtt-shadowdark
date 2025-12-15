export default class ChatSD {

	static async _renderChatMessage(
		actor,
		data,
		template,
		mode
	) {
		const html = await foundry.applications.handlebars.renderTemplate(
			template,
			data.templateData);

		if (!mode) {
			mode = game.settings.get("core", "rollMode");
		}

		const chatData = {
			content: html,
			flags: { "core.canPopout": true },
			flavor: data.flavor ?? undefined,
			rollMode: mode,
			speaker: ChatMessage.getSpeaker({
				actor: actor,
			}),
			type: data.type ?? CONST.CHAT_MESSAGE_STYLES.OTHER,
			user: game.user.id,
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

	static async renderItemCardMessage(actor, data, mode) {
		this._renderChatMessage(actor, data, data.template, mode);
	}

	static async renderRollRequestMessage(actor, data, mode) {
		this._renderChatMessage(actor, data,
			"systems/shadowdark/templates/chat/roll-request.hbs",
			mode
		);
	}

	static async renderUseAbilityMessage(actor, data, mode) {
		this._renderChatMessage(actor, data,
			"systems/shadowdark/templates/chat/use-ability.hbs",
			mode
		);
	}

	static async renderRollMessage(config, rolls=[]) {
		if (!Array.isArray(rolls)) return;

		const actor = game.actors.get(config.actorId);

		const mainRoll = rolls.find(r => r && r.options.type === "main");
		const damageRoll = rolls.find(r => r && r.options.type === "damage");

		// generate template data
		const template = "systems/shadowdark/templates/chat/roll-card.hbs";
		const templateData = {...config};
		templateData.actor = actor;

		if (config.itemUuid) {
			templateData.item = await fromUuid(config.itemUuid);
		}
		if (config.targetUuid) {
			templateData.target = await fromUuid(config.targetUuid);
		}
		if (mainRoll) {
			templateData.mainRoll.html = await mainRoll.render();
		}
		if (damageRoll) {
			templateData.damageRoll.html = await damageRoll.render();
		}
		const content = await foundry.applications.handlebars.renderTemplate(
			template,
			templateData
		);

		// Create Chat Message
		const chatData = {
			content,
			flags: {
				"core.canPopout": true,
				"shadowdark.rollConfig": config,
			},
			flavor: config.title ?? undefined,
			speaker: ChatMessage.getSpeaker({
				actor,
			}),
			rolls,
			user: game.user.id,
		};
		if (config.rollMode) {
			ChatMessage.applyRollMode(chatData, config.rollMode);
		}

		return chatData;
	}
}
