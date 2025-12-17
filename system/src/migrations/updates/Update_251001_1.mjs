import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_251001_1 extends UpdateBaseSD {
	static version = 251001.1;

	async updateActor(actorData) {
		if (actorData.type !== "Player") return;

		let updateData = {};
		updateData.effects = await this.updateEffects(actorData.effects);

		return updateData;
	}

	async updateItem(itemData, actorData) {
		let updateData = {};
		updateData.effects = await this.updateEffects(itemData.effects);

		// NPC spell to Spell
		if (itemData.type === "NPC Spell") {
			updateData.type = "Spell";
			updateData["==system"] = {...itemData.system};
		}

		return updateData;
	}

	async updateEffects(effects) {
		// Update Active Effect keys
		for (const effect of effects) {
			for (const change of effect.changes) {
				switch (change.key) {

					// TODO add more migration cases

					case "system.bonuses.advantage":

						// check initiative
						if (change.value === "initiative") {
							change.key = "system.roll.initiative.advantage";
							change.value = 1;
							continue;
						}

						// check HP
						if (change.value === "hp") {
							change.key = "system.roll.hp.advantage";
							change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
							change.value = 1;
							continue;
						}

						// search spells
						const spells = await shadowdark.compendiums.spells();
						if (spells.map(s => s.name.slugify()).includes(change.value)) {
							change.key = `system.roll.spell.advantage.${change.value}`;
							change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
							change.value = 1;
							continue;
						}

					case "system.bonuses.armorMastery":
						change.key = `system.attributes.ac.${change.value}`;
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						change.value = 1;
						continue;

					case "system.bonuses.hauler":
						change.key = "system.slots";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						change.value = "max(@abilities.con.mod, 0)";
						continue;

					case "system.bonuses.weaponMastery":
						const weapon = change.value;
						change.key = `system.roll.melee.bonus.${weapon}`;
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						change.value = "1+floor(@level.value/2)";
						effect.changes.push({
							key: `system.roll.melee.damage.${weapon}`,
							mode: CONST.ACTIVE_EFFECT_MODES.ADD,
							value: "1+floor(@level.value/2)",
						});
						continue;

					case "system.attributes.hp.bonus": change.key = "system.attributes.hp.max"; continue;

					case "system.abilities.str.bonus":
					case "system.abilities.str.base":
						change.key = "system.abilities.str.value"; continue;

					case "system.abilities.dex.bonus":
					case "system.abilities.dex.base":
						change.key = "system.abilities.dex.value"; continue;

					case "system.abilities.con.bonus":
					case "system.abilities.con.base":
						change.key = "system.abilities.con.value"; continue;

					case "system.abilities.int.bonus":
					case "system.abilities.int.base":
						change.key = "system.abilities.int.value"; continue;

					case "system.abilities.wis.bonus":
					case "system.abilities.wis.base":
						change.key = "system.abilities.wis.value"; continue;

					case "system.abilities.cha.bonus":
					case "system.abilities.cha.base":
						change.key = "system.abilities.cha.value"; continue;

					case "system.bonuses.acBonus":
						change.key = "system.attributes.ac.value"; continue;

					case "system.bonuses.acBonusFromAttribute":
						change.key = "system.attributes.ac.value";
						change.value = `@attributes.${change.value}.mod`;
						continue;

					case "system.bonuses.gearSlots":
						change.key = "system.slots"; continue;

					case "system.bonuses.meleeAttackBonus":
						change.key = "system.roll.melee.bonus.this"; continue;

					case "system.bonuses.meleeDamageBonus":
						change.key = "system.roll.melee.damage.all"; continue;

					case "system.bonuses.rangedAttackBonus":
						change.key = "system.roll.ranged.bonus.this"; continue;

					case "system.bonuses.rangedDamageBonus":
						change.key = "system.roll.ranged.damage.all"; continue;

					case "system.bonuses.damageBonus":
						change.key = "system.roll.attack.damage.this"; continue;

					case "system.bonuses.spellcastingCheckBonus":
						change.key = "system.roll.spell.advantage.all"; continue;

					case "system.bonuses.unarmoredAcBonus":
						change.key = "system.attributes.ac.unarmored"; continue;

					case "system.bonuses.attackBonus":
						change.key = "system.roll.attack.bonus.this"; continue;

					case "system.bonuses.critical.multiplier":
						change.key = "system.roll.attack.critical-multiplier.this"; continue;

					case "system.bonuses.stoneSkinTalent":
						change.key = "system.attributes.ac.value";
						change.value = "2+floor(@level.value/2)";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.backstabDie":
						change.key = "system.roll.attack.extra-damage-die.this";
						change.value = "1+floor(@level.value/2)";
						continue;

					case "system.bonuses.critical.failureThreshold":
						change.key = "system.roll.attack.failure-threshold.this"; continue;

					case "system.bonuses.critical.successThreshold":
						change.key = "system.roll.attack.critical-threshold.this"; continue;

					case "system.bonuses.weaponDamageDieD12":
						change.key = `system.roll.attack.upgrade-damage-die.${change.value}`;
						change.value = 4;
						continue;

					case "system.bonuses.damageMultiplier":
						change.key = "system.roll.attack.damage";
						if (effect.parent.type === "weapon") {
							change.key += ".this";
						}
						change.mode = CONST.ACTIVE_EFFECT_MODES.MULTIPLY;
						continue;

					case "system.bonuses.weaponDamageDieImprovementByProperty":
						change.key = `system.roll.attack.upgrade-damage-die.${change.value}`;
						change.value = 1;
						continue;

					case "system.bonuses.weaponDamageExtraDieByProperty":
						change.key = "system.roll.attack.extra-damage-die.this";
						change.value = `@attributes.${change.value}.mod`;
						continue;

				}

			}
		}
		return effects;
	}

}
