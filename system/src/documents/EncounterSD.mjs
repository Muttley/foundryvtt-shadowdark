export default class EncounterSD extends Combat {
	async rollInitiative(ids, options = {}) {
		if (game.settings.get("shadowdark", "useClockwiseInitiative")) {
			//Structure input data
			ids = typeof  ids === 'string' ? [ids] : ids
			const chatRollMode = game.settings.get("core", "rollMode");

			const combatants = ids.flatMap((id) => this.combatants.get(id) ?? []) // replace with this.combatants?
			for (const combatant of combatants) {
				super.setInitiative(combatant.id, null)
			}
			const rollers = []
			const npcs = []
			for (const combatant of combatants) {
				if (combatant.actor.type === 'Player') rollers.push(combatant)
				else if (combatant.actor.type === 'NPC') npcs.push(combatant)
			}


			// npcs.sort((a, b) => b.actor.getRollData().initiativeBonus - a.actor.getRollData().initiativeBonus)

			// const rollResults = await Promise.all(
			// 	pcs.map(async (combatant) => {
			// 		const pcActor = combatant.actor
			// 		const rollData = combatant.actor.getRollData()
			// 		const parts = [`${rollData.initiativeFormula}+${rollData.initiativeBonus}`]
			// 		const result = (await CONFIG.DiceSD._roll(parts, pcActor)).roll.total
			// 		return {id: combatant.id, prelimInitiative: result}
			// 	})
			// )


			if (npcs.length > 0) {
				const npcRoller = npcs.reduce(function(prev, current) {
					return (prev && prev.getRollData().initiativeBonusy > current.getRollData().initiativeBonus)
					? prev : current
				})
				rollers.push(npcRoller)
				// const npcRollData = npcRoller.getRollData()
				// const npcParts = [`${npcRollData.initiativeFormula}+${npcRollData.initiativeBonus}`]
				// const npcRollResult = (await CONFIG.DiceSD._roll(npcParts, npcLeader)).roll.total
				// rollResults.push({id: npcs[0].id, prelimInitiative: npcRollResult})
			}



			rollResults.sort((a,b) => b.prelimInitiative - a.prelimInitiative)

			const firstCombatant = combatants.get(rollResults[0].id)
			const firstInitiative = rollResults[0].prelimInitiative
			const activeUsers = [game.users.activeGM, ...(game.users.players.filter((p) => p.active))]

			const firstIndex = (firstCombatant.actor.type === 'NPC') ?
				activeUsers.findIndex((p) => p === game.users.activeGM) :
				activeUsers.findIndex((p) => p?.character === firstCombatant.actor)
			for (let i = 0; i < firstIndex; i++) {
				activeUsers.push(activeUsers.shift())
			}

			const initiativeOrder = []

			for (const user of activeUsers) {
				if (user === game.users.activeGM) initiativeOrder.push(...npcs)
				else {
					const c = combatants.get(user.character?.id)
					if (c) initiativeOrder.push(c)
				}
			}

			for (let i = 0; i < initiativeOrder.length; i++) {
				super.setInitiative(initiativeOrder[i].id, initiativeOrder.size - i)
			}
		}
		else super.rollInitiative(ids, options)
	}
}
