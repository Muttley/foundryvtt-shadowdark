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
	/*  Methods                                     */
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

	/* ---------- Effect Methods ---------- */

	/**
	 * Creates a dialog that allows the user to pick from a list. Returns
	 * a slugified name to be used in effect values.
	 * @param {string} choiceType - Type of input to ask about
	 * @param {Array<string>} choices - The list of options to choose from
	 * @returns {string}
	 */
	async _askEffectInput(choiceType, choices) {
		let options = "";
		for (const [key, value] of Object.entries(choices)) {
			options += `<option value="${key}">${value}</option>`;
		}

		const title = game.i18n.localize(`SHADOWDARK.dialog.effect.choice.${choiceType}`);
		const data = {
			title: title,
			content: `
				<form>
					<h3>${title}</h3>
					<div class="form-group">
						<div class="form-fields">
							<input list="selections" type="text" value="" placeholder="" />
							<datalist id="selections">${options}</select>
						</div>
					</div>
				</form>
			`,
			classes: ["shadowdark-dialog"],
 			buttons: {
				submit: {
					label: game.i18n.localize("SHADOWDARK.dialog.submit"),
					callback: html => (html[0].querySelector("input").value)
						? html[0].querySelector("input").value
						: false,
				},
			},
			close: () => false,
		};

		const result = await Dialog.wait(data);
		return result;
	}

	/**
	 * Handles special cases for predefined effect mappings that use the
	 * 'askInput' fields.
	 * @param {string} key - effectKey from mapping
	 * @param {Object} value - data value from mapping
	 * @returns {Object}
	 */
	async _handlePredefinedEffect(key, value) {
		// @todo: CUSTOMIZATION How to generalize this with custom expansion of base items?
		if (key === "weaponMastery") {
			return this._askEffectInput("weapon", CONFIG.SHADOWDARK.WEAPON_BASE_WEAPON);
		}
		else if (key === "armorMastery") {
			return this._askEffectInput("armor", CONFIG.SHADOWDARK.ARMOR_BASE_ARMOR);
		}
		else if (key === "spellAdvantage") {
			// @todo: CUSTOMIZATION Allow custom spell compendiums
			const spellNames = await this.getSpellListSlugified();
			return this._askEffectInput("spell", spellNames);
		}
		return value;
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

	/**
	 * Makes an array with all available spell names, slugified. This
	 * is used for the predefined effects for Spell Advantage.
	 * @returns {Array<string>}
	 */
	async getSpellListSlugified() {
		// @todo: CUSTOMIZATION Allow custom spell compendiums
		const spellPack = game.packs.get("shadowdark.spells");
		const spellDocuments = await spellPack.getDocuments();
		const spellNames = {};
		spellDocuments.map(i => spellNames[i.name.slugify()] = i.name );
		return spellNames;
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
