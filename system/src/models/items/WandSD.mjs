import { PhysicalItemSD } from "./_PhysicalItemSD.mjs";

const fields = foundry.data.fields;

export default class WandSD extends PhysicalItemSD {
	static defineSchema() {
		const schema = {
			broken: new fields.BooleanField({initial: false}),
			spells: new fields.ArrayField(
				new fields.SchemaField({
					uuid: new fields.DocumentUUIDField(),
					lost: new fields.BooleanField({initial: false}),
				})
			),
		};

		return Object.assign(super.defineSchema(), schema);
	}

	prepareBaseData() {
		super.prepareBaseData();
		this.magicItem = true;
	}

	get isRollable() {
		return true;
	}

	get isWand() {
		return true;
	}

	async toggleSpellLost(spellUuid) {
		const spells = this.spells.map(s => foundry.utils.deepClone(s));

		// find and reset spell
		if (spellUuid) {
			const spell = spells.find(s => s.uuid === spellUuid);
			if (spell) spell.lost = !spell.lost;
		}
		else {
			// reset all spells if no spellUuid is given
			for (const spell of spells) spell.lost = false;
		}

		return this.parent.update({"system.spells": spells});
	}
}
