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
		return updateData;
	}

	async updateEffects(effects) {
		// Update Active Effect keys
		for (const effect of effects) {
			for (const change of effect.changes) {
				switch (change.key) {

					// TODO add more migration cases

					case "system.bonuses.advantage":

						// check HP
						if (change.value === "hp") {
							change.key = "system.roll.hp.advantage";
							change.mode = 2;
							change.value = 1;
							continue;
						}

						// search spells
						const spells = await shadowdark.compendiums.spells();
						if (spells.map(s => s.name.slugify()).includes(change.value)) {
							console.error("spell", change.value);
							change.key = `system.roll.spell.advantage.${change.value}`;
							change.mode = 2;
							change.value = 1;
							continue;
						}

					case "system.bonuses.armorMastery":
						change.key = `system.attributes.ac.${change.value}`;
						change.mode = 2;
						change.value = 1;
						continue;

					case "system.bonuses.hauler":
						change.key = "system.slots";
						change.mode = 2;
						change.value = "max(@abilities.con.mod, 0)";
						continue;

					case "system.bonuses.weaponMastery":
						const weapon = change.value;
						change.key = `system.roll.melee.bonus.${weapon}`;
						change.mode = 2;
						change.value = "1+floor(@level.value/2)";
						effect.changes.push({
							key: `system.roll.melee.damage.${weapon}`,
							mode: 2,
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

				}

			}
		}
		return effects;
	}

}
