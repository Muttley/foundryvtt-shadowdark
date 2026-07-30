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
			style: data.style ?? CONST.CHAT_MESSAGE_STYLES.OTHER,
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

	static async showItemCard(uuid) {
		const item = await fromUuid(uuid);
		if (!item) return;

		const mode = game.settings.get("core", "rollMode");

		const chatData = {
			content: await item.system.render({expanded: true}),
			speaker: ChatMessage.getSpeaker({alias: game.user.name}),
			flags: { "core.canPopout": true },
			rollMode: mode,
		};

		ChatMessage.applyRollMode(chatData, mode);
		await ChatMessage.create(chatData);
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

	static async renderRollHTML(config, rolls = []) {
		if (!Array.isArray(rolls)) return;

		const actor = await fromUuid(config.actorUuid);

		const mainRoll = rolls.find(r => r && r.options.type === "main");
		const damageRoll = rolls.find(r => r && r.options.type === "damage");

		// generate template data
		const template = "systems/shadowdark/templates/chat/roll-card.hbs";
		const templateData = foundry.utils.deepClone(config);

		templateData.actor = actor;

		templateData.messages = this.resolveMessages(config.messages, mainRoll);

		if (config.itemUuid) {
			let item = await fromUuid(config.itemUuid);
			if (item) {
				let subtext = item.system.subtext;

				// replace sub text if using ranged attack with melee weapon
				let attackType = config.attack?.type;

				// add any ammunition to subtext
				if (config.attack?.selectedAmmunition) {
					const ammoItem = await fromUuid(config.attack.selectedAmmunition);
					if (ammoItem) {
						subtext = subtext.concat(
							` • ${ammoItem.name} (${ammoItem.system.quantity}/${ammoItem.system.slots.per_slot})`
						);
					}
				}

				// replace item with spell item if casting from wand or scroll
				if (config.cast?.spellUuid && config.cast.spellUuid !== item.uuid) {
					subtext = `${item.name} • ${subtext}`;
					const spellItem = await fromUuid(config.cast.spellUuid);
					item = spellItem ?? item;
				}

				templateData.itemHTML = await item.system.render({subtext, attackType});
			}
		}
		if (config.targetUuid) {
			templateData.target = await fromUuid(config.targetUuid);
			if (config.type !== "check") templateData.showTargets = true;
		}
		if (mainRoll) {
			templateData.mainRoll.html = await mainRoll.render();
			templateData.mainRoll.success = mainRoll.success;
		}
		if (damageRoll) {
			templateData.damageRoll.html = await damageRoll.render();
		}

		return foundry.applications.handlebars.renderTemplate(
			template,
			templateData
		);
	}

	static async renderRollMessage(config, rolls=[]) {

		const content = await ChatSD.renderRollHTML(config, rolls);
		const actor = await fromUuid(config.actorUuid);

		// Create Chat Message
		const chatData = {
			content,
			flags: {
				"core.canPopout": true,
				"shadowdark.rollConfig": config,
			},
			flavor: config.heading ?? undefined,
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

	static resolveMessages(messages, roll) {
		if (!messages || !roll) return [];
		let keys;
		if (roll.criticalSuccess)      keys = ["any", "success", "criticalSuccess"];
		else if (roll.criticalFailure) keys = ["any", "failure", "criticalFailure"];
		else if (roll.success)         keys = ["any", "success"];
		else                           keys = ["any", "failure"];

		return keys.flatMap(key => messages[key] ?? []);
	}
}
