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
							change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
							change.value = 1;
							continue;
						}

					case "system.bonuses.acBonus":
						change.key = "system.attributes.ac.value";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.acBonusFromAttribute":
						change.key = "system.attributes.ac.value";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						change.value = `@attributes.${change.value}.mod`;
						continue;

					case "system.bonuses.gearSlots":
						change.key = "system.slots";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.meleeAttackBonus":
						change.key = "system.roll.melee.bonus.this";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.meleeDamageBonus":
						change.key = "system.roll.melee.damage.this";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.rangedAttackBonus":
						change.key = "system.roll.ranged.bonus.this";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.rangedDamageBonus":
						change.key = "system.roll.ranged.damage.this";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.spellcastingCheckBonus":
						change.key = "system.roll.spell.advantage.all";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.unarmoredAcBonus":
						change.key = "system.attributes.ac.unarmored";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

				}

			}
		}
		return effects;
	}

}
