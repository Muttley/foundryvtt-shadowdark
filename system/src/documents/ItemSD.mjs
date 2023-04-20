export default class ItemSD extends Item {

	async getChatData(htmlOptions={}) {
		const description = await TextEditor.enrichHTML(
			this.system.description,
			{
				async: true,
			}
		);

		const data = {
			actor: this.actor,
			description,
			item: this.toObject(),
		};

		return data;
	}

	async displayCard(options={}) {
		// Render the chat card template
		const token = this.actor.token;

		const templateData = await this.getChatData();

		const template = this.getItemTemplate("systems/shadowdark/templates/chat/item");

		const html = await renderTemplate(template, templateData);

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
		const templateData = await this.getChatData();

		const templatePath = this.getItemTemplate(
			"systems/shadowdark/templates/partials/details"
		);

		const html = await renderTemplate(templatePath,	templateData);

		return html;
	}

	getItemTemplate(basePath) {
		switch (this.type) {
			case "Armor":
				return `${basePath}/armor.hbs`;
			case "Spell":
				return `${basePath}/spell.hbs`;
			case "Weapon":
				return `${basePath}/weapon.hbs`;
			default:
				return `${basePath}/default.hbs`;
		}
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

	isEffect() {
		return this.type === "Effect";
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

	// Duration getters
	get totalDuration() {
		const { duration } = this.system;
		if (["unlimited", "focus"].includes(duration.type)) {
			return Infinity;
		}
		else if (["instant"].includes(duration.type)) {
			return 0;
		}
		else {
			return duration.value
				* (CONFIG.SHADOWDARK.DURATION_UNITS[duration.type] ?? 0);
		}
	}

	get remainingDuration() {
		if (this.type !== "Effect") return false;

		// Handle rounds-effects
		if (this.system.duration.type === "rounds") {
			// If there is combat, check if it was added during combat, otherwise
			// consider it expired
			if (game.combat) {
				const startCombatTime = this.system.start.combatTime;
				if (!startCombatTime) return { expired: true, remaining: 0, progress: 100 };

				const round = startCombatTime.split(".")[0];
				const turn = startCombatTime.split(".")[1];

				// If it is a new round or the same turn the effect
				// was initiated, calculate duration
				if (
					round !== game.combat.round
					|| turn !== game.combat.turn
				) {
					const duration = parseInt(this.system.duration.value, 10);
					const remaining = parseInt(round, 10) + duration - game.combat.round;
					const progress = (100 - Math.floor(100 * remaining / duration));
					return {
						expired: remaining <= 0,
						remaining,
						progress,
					};
				}
				else {
					return false;
				}
			}
			// If added outside combat, expire the effect
			else {
				return { expired: true, remaining: 0, progress: 100 };
			}
		}

		// Handle timing effects
		const duration = this.totalDuration;

		if (duration === Infinity) {
			return { expired: false, remaining: Infinity, progress: 0 };
		}
		else if (!duration) {
			return { expired: true, remaining: 0, progress: 0 };
		}
		else {
			const start = this.system.start?.value ?? 0;
			const remaining = start + duration - game.time.worldTime;
			const progress = (100 - Math.floor(100 * remaining / duration));
			const result = { expired: remaining <= 0, remaining, progress };
			return result;
		}
	}

	/* -------------------------------------------- */
	/*  Event Handlers                              */
	/* -------------------------------------------- */

	/* Set the start time and initiative roll of newly created effect */
	/** @override */
	async _preCreate(data, options, user) {
		await super._preCreate(data, options, user);

		// Store the creation time & initiative on the effect
		if (data.type === "Effect") {
			if (this.system.duration.type === "rounds" && !game.combat) {
				ui.notifications.warn(
					game.i18n.localize("SHADOWDARK.item.effect.warning.add_round_item_outside_combat")
				);
				return false;
			}

			const combatTime = (game.combat)
				? `${game.combat.round}.${game.combat.turn}`
				: null;
			this.updateSource({
				"system.start": {
					value: game.time.worldTime,
					combatTime,
				},
			});
		}

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
}
