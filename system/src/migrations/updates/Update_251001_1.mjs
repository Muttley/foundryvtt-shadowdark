import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_251001_1 extends UpdateBaseSD {
	static version = 251001.1;

	NEW_KEYS = [
		"system.abilities.cha.value",
		"system.abilities.con.value",
		"system.abilities.dex.value",
		"system.abilities.int.value",
		"system.abilities.str.value",
		"system.abilities.wis.value",
		"system.attributes.ac.",
		"system.attributes.hp.max",
		"system.attributes.hp.value",
		"system.bonus.",
		"system.roll.",
		"system.slots",
		"system.spellcasting.classes",
		"system.spellcasting.allowAllItems",
		"system.spellcasting.itemAbility",
	];


	async updateActor(actorData) {
		if (actorData.type !== "Player") return;

		let updateData = {};
		updateData.effects = await this.updateEffects(actorData.effects, actorData.type);

		return updateData;
	}


	async updateItem(itemData, actorData) {
		if (!itemData) return {};
		let updateData = {};
		updateData.effects = await this.updateEffects(itemData.effects, itemData.type);

		// Migrate __not_spellcaster__ to ""
		if (itemData.type === "Class" && itemData.system?.spellcasting?.class === "__not_spellcaster__") {
			updateData["system.spellcasting.class"] = "";
		}

		// NPC spell to Spell
		if (itemData.type === "NPC Spell") {
			updateData.type = "Spell";
			updateData["==system"] = {...itemData.system};
		}

		// finish migrating any Scroll or Wand data from old schema to spellUuid or spells array
		if (itemData.type === "Scroll" || itemData.type === "Wand") {
			const legacyData = itemData.flags?.shadowdark?.legacyData;

			if (legacyData?.spellName) {
				const spell = await shadowdark.compendiums.findSpell(
					legacyData.spellName, legacyData.class ?? []
				);

				if (spell) {
					if (itemData.type === "Scroll") {
						updateData["system.spellUuid"] = spell.uuid;
					}
					else if (itemData.type === "Wand") {
						updateData["system.spells"] = [{uuid: spell.uuid, lost: legacyData.lost ?? false}];
					}
				}
				else {
					const details = [
						legacyData.spellName ? `Spell: ${legacyData.spellName}` : null,
						legacyData.class?.length ? `CastingClasses: ${legacyData.class.join(", ")}` : null,
						legacyData.tier ? `Tier ${legacyData.tier}` : null,
						legacyData.duration ? `Duration: ${legacyData.duration.value} ${legacyData.duration.type}` : null,
						legacyData.range ? `Range: ${legacyData.range}` : null,
					].filter(Boolean).join(", ");
					updateData["system.description"] = `${itemData.system.description ?? ""}<p><strong>[Migration Failure]</strong> Could not find spell "${legacyData.spellName}" in the compendium. Please link the spell manually on the item sheet.</p><p>${details}</p>`;
				}

			}
		}

		return updateData;
	}


	async updateEffects(effects, parentType = undefined) {
		// Update Active Effect keys
		for (const effect of effects) {
			for (const change of effect.changes) {
				switch (change.key) {

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
						const spells = await shadowdark.compendiums.spells(false);
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

					case "system.attributes.hp.bonus":
						change.key = "system.attributes.hp.max";
						continue;

					case "system.abilities.str.bonus":
					case "system.abilities.str.base":
						change.key = "system.abilities.str.value";
						continue;

					case "system.abilities.dex.bonus":
					case "system.abilities.dex.base":
						change.key = "system.abilities.dex.value";
						continue;

					case "system.abilities.con.bonus":
					case "system.abilities.con.base":
						change.key = "system.abilities.con.value";
						continue;

					case "system.abilities.int.bonus":
					case "system.abilities.int.base":
						change.key = "system.abilities.int.value";
						continue;

					case "system.abilities.wis.bonus":
					case "system.abilities.wis.base":
						change.key = "system.abilities.wis.value";
						continue;

					case "system.abilities.cha.bonus":
					case "system.abilities.cha.base":
						change.key = "system.abilities.cha.value";
						continue;

					case "system.bonuses.acBonus":
						change.key = "system.attributes.ac.value";
						continue;

					case "system.attributes.ac.override":
						change.key = "system.attributes.ac.value";
						continue;

					case "system.bonuses.acBonusFromAttribute":
						change.key = "system.attributes.ac.value";
						change.value = `@attributes.${change.value}.mod`;
						continue;

					case "system.bonuses.gearSlots":
						change.key = "system.slots";
						continue;

					case "system.bonuses.meleeAttackBonus":
						change.key = "system.roll.melee.bonus";

						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.meleeDamageBonus":
						change.key = "system.roll.melee.damage";

						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.rangedAttackBonus":
						change.key = "system.roll.ranged.bonus";

						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.rangedDamageBonus":
						change.key = "system.roll.ranged.damage";
						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.damageBonus":
						change.key = "system.roll.attack.damage";
						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.spellcastingCheckBonus":
						change.key = "system.roll.spell.bonus.all";
						continue;

					case "system.bonuses.unarmoredAcBonus":
						change.key = "system.attributes.ac.unarmored";
						continue;

					case "system.bonuses.attackBonus":
						change.key = "system.roll.attack.bonus";
						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.critical.multiplier":
						change.key = "system.roll.attack.critical-multiplier";
						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.stoneSkinTalent":
						change.key = "system.attributes.ac.value";
						change.value = "2+floor(@level.value/2)";
						change.mode = CONST.ACTIVE_EFFECT_MODES.ADD;
						continue;

					case "system.bonuses.backstabDie":
						change.key = "system.roll.attack.extra-damage-die.all";
						change.value = "1+floor(@level.value/2)";
						continue;

					case "system.bonuses.critical.failureThreshold":
						change.key = "system.roll.attack.critical-failure";
						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.critical.successThreshold":
						change.key = "system.roll.attack.critical-success";
						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}

						continue;

					case "system.bonuses.weaponDamageDieD12":
						change.key = `system.roll.attack.upgrade-damage-die.${change.value}`;
						change.value = 5;
						continue;

					case "system.bonuses.damageMultiplier":
						change.key = "system.roll.attack.damage";
						if (parentType === "Weapon") {
							change.key += ".this";
						}
						else {
							change.key += ".all";
						}
						change.mode = CONST.ACTIVE_EFFECT_MODES.MULTIPLY;
						continue;

					case "system.bonuses.weaponDamageDieImprovementByProperty":
						change.key = `system.roll.attack.upgrade-damage-die.${change.value}`;
						change.value = 1;
						continue;

					case "system.bonuses.weaponDamageExtraDieByProperty":
						change.key = `system.roll.attack.extra-damage-die.${change.value}`;
						change.value = 1;
						continue;

					case "system.bonuses.spellcastingClasses":
						change.key = "system.spellcasting.classes";
						continue;

					case "system.attackBonus":
						change.key = "system.roll.attack.bonus";
						change.key += (parentType === "Weapon") ? ".this" : ".all";
						continue;

					case "system.damage.bonus":
						change.key = "system.roll.attack.damage";
						change.key += (parentType === "Weapon") ? ".this" : ".all";
						continue;

					case "system.damage.critMultiplier":
						change.key = "system.roll.attack.critical-multiplier";
						change.key += (parentType === "Weapon") ? ".this" : ".all";
						continue;

					default:
						// Make sure we're not trying to migrate an effect which
						// is already using the correct key
						let isNewKey = false;
						for (const KEY of this.NEW_KEYS) {
							if (change.key.startsWith(KEY)) {
								isNewKey = true;
								break;
							}
						}

						if (isNewKey) {
							continue;
						}
						else {
							console.error(`ERROR: No migration path for Active Effect key "${effect.target} > ${effect.name} > ${change.key}" with value "${change.value}"`);
						}
				}

			}
		}
		return effects;
	}

}
