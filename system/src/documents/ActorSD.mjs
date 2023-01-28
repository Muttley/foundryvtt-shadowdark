export default class ActorSD extends Actor {

	/* -------------------------------------------- */
	/*  Methods                                     */
	/* -------------------------------------------- */

	abilityModifier(ability) {
		return this._abilityModifier(this.system.abilities[ability].value);
	}

	/** @inheritDoc */
	prepareBaseData() {
		switch (this.type) {
			case "Player":
				return this._preparePlayerData();
			case "NPC":
				return this._prepareNPCData();
		}
	}

	/** @inheritDoc */
	prepareData() {
		super.prepareData();
	}

	/** @inheritDoc */
	prepareDerivedData() {}

	/* -------------------------------------------- */
	/*  Base Data Preparation Helpers               */
	/* -------------------------------------------- */

	_preparePlayerData() {}

	_prepareNPCData() {}

	/* -------------------------------------------- */
	/*  Internal Helpers                            */
	/* -------------------------------------------- */

	_abilityModifier(abilityScore) {
		if (abilityScore >= 1 && abilityScore <= 3) return -4;
		if (abilityScore >= 4 && abilityScore <= 5) return -3;
		if (abilityScore >= 6 && abilityScore <= 7) return -2;
		if (abilityScore >= 8 && abilityScore <= 9) return -1;
		if (abilityScore >= 10 && abilityScore <= 11) return 0;
		if (abilityScore >= 12 && abilityScore <= 13) return 1;
		if (abilityScore >= 14 && abilityScore <= 15) return 2;
		if (abilityScore >= 16 && abilityScore <= 17) return 3;
		if (abilityScore >= 18) return 4;
	}
}
