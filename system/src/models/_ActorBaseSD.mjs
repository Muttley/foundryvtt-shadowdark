const fields = foundry.data.fields;

export class ActorBaseSD extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		return {
			alignment: new fields.StringField({
				initial: "neutral",
				choices: Object.keys(CONFIG.SHADOWDARK.ALIGNMENTS),
			}),
			level: new fields.SchemaField({
				value: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
				xp: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
			}),
			notes: new fields.HTMLField(),
		};
	}

	attackBonus(attackType) {
		switch (attackType) {
			case "melee":
				return this.abilities.str.mod;
			case "ranged":
				return this.abilities.dex.mod;
			default:
				throw new Error(`Unknown attack type ${attackType}`);
		}
	}

	_getRollData(rollData) {
		// calculate initiative
		let initBonus = this.abilities.dex.mod;
		initBonus += this.roll?.initiative?.bonus ?? 0;
		const initAdv = this.roll?.initiative?.advantage ?? 0;
		rollData.initiative = CONFIG.DiceSD.applyAdvantage(`d20 +${initBonus}`, initAdv);
	}

	_sortByUserOrder(collection) {
		return Array.from(collection ?? []).sort(
			(a, b) => (a.sort || 0) - (b.sort || 0)
		);
	}

}
