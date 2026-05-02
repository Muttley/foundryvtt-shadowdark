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
		const index = this.spells.findIndex(s => s.uuid === spellUuid);
		if (index === -1) return;
		return this.setSpellLost(spellUuid, !this.spells[index].lost);
	}

	async setSpellLost(spellUuid, lost=true, criticalFailure=false) {
		const spells = this.spells.map(s => foundry.utils.deepClone(s));
		const spell = spells.find(s => s.uuid === spellUuid);
		if (!spell) {
			return console.error(game.i18n.localize("SHADOWDARK.error.spells.spell_not_found"), spellUuid);
		}
		spell.lost = lost;
		return this.parent.update({
			system: {
				spells: spells,
				broken: criticalFailure,
			},
		});
	}
}
