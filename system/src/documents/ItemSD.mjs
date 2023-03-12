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

	async roll(parts, bonus, talents, options={}) {
		const title = game.i18n.format("SHADOWDARK.chat.ItemRoll.Title", {name: this.name});
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		console.log(`rolling ${this}`);

		await CONFIG.Dice.D20RollSD.d20Roll({
			parts,
			data: { bonus, talents, item: this },
			title,
			speaker,
			template: "systems/shadowdark/templates/dialog/roll-item-dialog.hbs",
		});
	}


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
