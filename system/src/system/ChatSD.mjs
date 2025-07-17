export default class ChatSD {

	static async _renderChatMessage(
		actor,
		data,
		template,
		mode
	) {
		const html = await renderTemplate(template, data.templateData);

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

	static async renderRollMessage(rollData, checkRoll, damageRoll=null) {
		if (!rollData.check) return;

		const template = "systems/shadowdark/templates/chat/roll-card.hbs";
		const templateData = rollData;
		templateData.check.HTML = await checkRoll.render();
		const rolls = [checkRoll];

		if (damageRoll && rollData.damage) {
			rolls.push(damageRoll);
			templateData.damage.HTML = await damageRoll.render();
		}

		const chatData = {
			content: await renderTemplate(template, templateData),
			flags: { "core.canPopout": true },
			flavor: rollData.title ?? undefined,
			speaker: ChatMessage.getSpeaker({
				actor: rollData.actor,
			}),
			rolls,
			user: game.user.id,
		};

		if (rollData.rollMode) {
			ChatMessage.applyRollMode(chatData, rollData.rollMode);
		}

		const message = await ChatMessage.create(chatData);
		console.log(message);
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
}
