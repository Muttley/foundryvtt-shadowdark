export default class ActorSD extends Actor {

	/* -------------------------------------------- */
	/*  Methods                                     */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareBaseData() {
		switch (this.type) {
			case "character":
				return this._prepareCharacterData();
			case "npc":
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

	_prepareCharacterData() {}

	_prepareNPCData() {}
}
