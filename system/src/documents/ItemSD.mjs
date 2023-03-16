export default class ItemSD extends Item {

	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Gems have non-configurable slot settings
		if (data.type === "Gem") {
			const slots = {
				free_carry: 0,
				per_slot: CONFIG.SHADOWDARK.INVENTORY.GEMS_PER_SLOT,
				slots_used: 1,
			};

			this.updateSource({"system.slots": slots});
		}
	}

	async getChatData(htmlOptions={}) {
		const data = {
			item: this.toObject(),
		};
		return data;
	}

	async displayCard(options={}) {
		// Render the chat card template
		const token = this.actor.token;
		const templateData = {
			actor: this.actor,
			tokenId: token?.uuis || null,
			data: await this.getChatData(),
			isSpell: this.isSpell(),
			isWeapon: this.isWeapon(),
		};
		const html = await renderTemplate("systems/shadowdark/templates/chat/item-card.hbs", templateData);

		const chatData = {
			user: game.user.id,
			type: CONST.CHAT_MESSAGE_TYPES.OTHER,
			content: html,
			flavor: this.system.chatFlavor || this.name,
			speaker: ChatMessage.getSpeaker({actor: this.actor, token}),
			flags: { "core.canPopout": true },
		};

		ChatMessage.applyRollMode(chatData, options.rollMode ?? game.settings.get("core", "rollMode"));

		const card = (options.createMessage !== false)
			? await ChatMessage.create(chatData) : chatData;

		return card;
	}

	/* -------------------------------------------- */
	/*  Roll Methods                                */
	/* -------------------------------------------- */

	async rollItem(parts, data, options={}) {
		options.flavor = game.i18n.format("SHADOWDARK.chat.item_roll.title", {name: this.name});
		options.dialogTemplate =  "systems/shadowdark/templates/dialog/roll-item-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";
		await CONFIG.DiceSD.RollD20Dialog(parts, data, options);
	}

	async rollSpell(parts, data, options={}) {
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-spell-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";

		await CONFIG.DiceSD.RollD20Dialog(parts, data, options);
	}

	/* -------------------------------------------- */
	/*  Getter Methods                              */
	/* -------------------------------------------- */

	hasProperty(property) {
		for (const key of this.system.properties) {
			if (key === property) return true;
		}
		return false;
	}

	isSpell() {
		return this.type === "Spell";
	}

	isTalent() {
		return this.type === "Talent";
	}

	isWeapon() {
		return this.type === "Weapon";
	}

	isMagicItem() {
		return this.hasProperty("magic");
	}

	isVersatile() {
		return this.hasProperty("versatile");
	}

	isOneHanded() {
		return this.hasProperty("oneHanded");
	}

	isTwoHanded() {
		return this.hasProperty("twoHanded");
	}

	isAShield() {
		return this.hasProperty("shield");
	}

	isNotAShield() {
		return !this.isAShield();
	}

	propertiesDisplay() {
		let properties = [];

		if (this.type === "Armor" || this.type === "Weapon" || this.type === "Talent") {
			for (const key of this.system.properties) {
				if (this.type === "Armor") {
					properties.push(
						CONFIG.SHADOWDARK.ARMOR_PROPERTIES[key]
					);
				}
				else if (this.type === "Weapon") {
					properties.push(
						CONFIG.SHADOWDARK.WEAPON_PROPERTIES[key]
					);
				}
				else if (this.type === "Talent") {
					properties.push(
						CONFIG.SHADOWDARK.TALENT_TYPES[key]
					);
				}
			}

		}

		return properties.join(", ");
	}
}
