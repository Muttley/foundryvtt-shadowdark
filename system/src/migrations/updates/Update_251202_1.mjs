import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_251202_1 extends UpdateBaseSD {
	static version = 251202.1;

	async updateEffects(effects) {
		// Update Active Effect keys
		for (const effect of effects) {
			for (const change of effect.changes) {
				switch (change.key) {

					case "system.bonuses.advantage":

						// check initiative
						if (change.value === "initiative") {
							change.key = "system.roll.initiative.advantage";
							change.mode = 2;
							change.value = 1;
							continue;
						}

					case "system.bonuses.acBonus":
						change.key = "system.attributes.ac.value";
						change.mode = 2;
						continue;

					case "system.bonuses.acBonusFromAttribute":
						change.key = "system.attributes.ac.value";
						change.mode = 2;
						change.value = `@attributes.${change.value}.mod`;
						continue;

					case "system.bonuses.gearSlots":
						change.key = "system.slots";
						change.mode = 2;
						continue;

				}

			}
		}
		return effects;
	}

}
