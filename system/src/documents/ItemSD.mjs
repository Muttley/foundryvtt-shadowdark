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

	/* -------------------------------------------- */
	/*  Roll Methods                                */
	/* -------------------------------------------- */

	async rollItem(parts, abilityBonus, itemBonus, talentBonus, options={}) {
		const title = game.i18n.format("SHADOWDARK.chat.ItemRoll.Title", {name: this.name});
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });

		await CONFIG.Dice.D20RollSD.d20Roll({
			parts,
			data: { abilityBonus, itemBonus, talentBonus, item: this },
			title,
			speaker,
			template: "systems/shadowdark/templates/dialog/roll-item-dialog.hbs",
			fastForward: options.fastForward ?? false,
		});
	}

	async rollSpell(parts, abilityBonus, talentBonus, tier, options={}) {
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const spellDC = 10 + tier;

		const title = game.i18n.format("SHADOWDARK.chat.SpellRoll.Title", {name: this.name, tier, spellDC});

		await CONFIG.Dice.D20RollSD.d20Roll({
			parts,
			data: { abilityBonus, talentBonus, item: this },
			title,
			speaker,
			template: "systems/shadowdark/templates/dialog/roll-spell-dialog.hbs",
			fastForward: options.fastForward ?? false,
		});
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

	isAShield() {
		return this.hasProperty("shield");
	}

	isNotAShield() {
		return !this.isAShield();
	}
}
