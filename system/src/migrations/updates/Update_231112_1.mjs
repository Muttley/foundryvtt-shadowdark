import { UpdateBaseSD } from "../UpdateBaseSD.mjs";

export default class Update_231112_1 extends UpdateBaseSD {

	static version = 231112.1;

	async updateItem(itemData, actorData) {
		if (itemData.type !== "NPC Attack") return;

		const die = itemData.system?.damage?.value ?? "";
		const numDice = die !== ""
			? itemData.system?.damage?.numDice ?? 1
			: 0;

		const diceString = die !== ""
			? `${numDice}${die}`
			: "";

		const bonus = itemData.system?.bonuses?.damageBonus ?? 0;

		let bonusString = "";
		let damageFormula = "";
		if (diceString !== "") {
			if (bonus < 0) bonusString += `-${bonus}`;
			if (bonus > 0) bonusString += `+${bonus}`;

			damageFormula = `${diceString}${bonusString}`;
		}
		else {
			damageFormula = `${bonus}`;
		}

		const updateData = {
			"system.bonuses.damageBonus": 0,
			"system.damage.-=numDice": null,
			"system.damage.value": damageFormula,
		};

		return updateData;
	}
}
