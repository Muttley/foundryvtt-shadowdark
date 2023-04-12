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

	async getDetailsContent() {
		const description = await TextEditor.enrichHTML(
			this.system.description,
			{
				async: true,
			}
		);

		const data = {
			description,
			itemData: this.toObject(),
		};

		const baseTemplatePath = "systems/shadowdark/templates/partials";
		let detailsTemplate = "details-description.hbs";

		switch (this.type) {
			case "Spell": {
				detailsTemplate = "details-spell.hbs";
				break;
			}
		}

		const html = await renderTemplate(
			`${baseTemplatePath}/${detailsTemplate}`,
			data
		);

		return html;
	}

	lightRemainingString() {
		if (this.type !== "Basic" && !this.system.light.isSource) return;

		const timeRemaining = Math.ceil(
			this.system.light.remainingSecs / 60
		);

		if (this.system.light.remainingSecs < 60) {
			this.lightSourceTimeRemaining = game.i18n.localize(
				"SHADOWDARK.inventory.item.light_seconds_remaining"
			);
		}
		else {
			this.lightSourceTimeRemaining = game.i18n.format(
				"SHADOWDARK.inventory.item.light_remaining",
				{ timeRemaining }
			);
		}
	}

	setLightRemaining(remainingSeconds) {
		this.update({"system.light.remainingSecs": remainingSeconds});
	}

	/* -------------------------------------------- */
	/*  Roll Methods                                */
	/* -------------------------------------------- */

	async rollNpcAttack(parts, data, options={}) {
		options.dialogTemplate =  "systems/shadowdark/templates/dialog/roll-npc-attack-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";
		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	async rollItem(parts, data, options={}) {
		options.dialogTemplate =  "systems/shadowdark/templates/dialog/roll-item-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";
		await CONFIG.DiceSD.RollDialog(parts, data, options);
	}

	async rollSpell(parts, data, options={}) {
		options.dialogTemplate = "systems/shadowdark/templates/dialog/roll-spell-dialog.hbs";
		options.chatCardTemplate = "systems/shadowdark/templates/chat/item-card.hbs";
		const roll = await CONFIG.DiceSD.RollDialog(parts, data, options);
		// Special case for scrolls
		if (data.scroll && roll) data.actor.deleteEmbeddedDocuments("Item", [data.scroll._id]);
		return roll;
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

	isActiveLight() {
		return this.isLight() && this.system.light.active;
	}

	isLight() {
		return this.type === "Basic" && this.system.light.isSource;
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

	isFinesseWeapon() {
		return this.hasProperty("finesse");
	}

	isMagicItem() {
		return this.system.magicItem;
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

	magicItemEffectsDisplay() {
		let properties = [];

		if (this.isMagicItem()) {
			for (const key of this.effects) {
				if (!key.disabled) {
					properties.push(
						CONFIG.SHADOWDARK.MAGIC_ITEM_EFFECT_TYPES[key.label]
					);
				}
			}
		}

		return properties.join(", ");
	}

	talentEffectsDisplay() {
		let properties = [];

		if (this.isTalent()) {
			for (const key of this.effects) {
				if (!key.disabled) {
					properties.push(
						CONFIG.SHADOWDARK.TALENT_TYPES[key.label]
					);
				}
			}
		}

		return properties.join(", ");
	}

	propertiesDisplay() {
		let properties = [];

		if (this.type === "Armor" || this.type === "Weapon") {
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
			}

		}

		return properties.join(", ");
	}

	npcAttackRangesDisplay() {
		let ranges = [];

		if (this.type === "NPC Attack") {
			for (const key of this.system.ranges) {
				ranges.push(
					CONFIG.SHADOWDARK.RANGES[key]
				);
			}
		}

		return ranges.join(", ");
	}
}
