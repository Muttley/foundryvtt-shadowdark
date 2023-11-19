export default class EncounterSD extends Combat {
	async rollInitiative(ids, options = {}) {
		console.log(ids)
		const combatants = ids.flatMap((id) => this.combatants.get(id) ?? []);
		console.log(combatants)
		const npcs = []
		const pcs = []
		for (const combatant of combatants) {
			console.log(combatant.actor.name)
			if (combatant.actor.type === 'Player') pcs.push(combatant)
			else if (combatant.actor.type === 'NPC') npcs.push(combatant)
		}
	console.log(npcs)
	console.log(pcs)

		npcs.sort((a, b) => b.getRollData().initiativeBonus - a.getRollData().initiativeBonus)
		console.log(npcs)

		const rollResults = await Promise.all(
			pcs.map(async (combatant) => {
				const data = combatant.actor
				const rollData = combatant.actor.getRollData()
				const parts = [`${rollData.initiativeFormula}+${rollData.initiativeBonus}`]
				const result = (await CONFIG.DiceSD._roll(parts, data)).roll.total
				return {actor: data, initiative: result, formula: parts[0]}
			})
		)
		let npcLeader

		if (npcs.length > 0) {
			npcLeader = npcs[0].actor
			console.log('npc leader')
			console.log(npcLeader)
			const npcRollData = npcLeader.getRollData()
			const npcParts = [`${npcRollData.initiativeFormula}+${npcRollData.initiativeBonus}`]
			const npcRollResult = (await CONFIG.DiceSD._roll(npcParts, npcLeader)).roll.total
			rollResults.push({actor: npcLeader, initiative: npcRollResult, formula: npcParts[0]})
		}

		rollResults.sort((a,b) => b.initiative - a.initiative)
		console.log('roll results')
		console.log(rollResults)

		const firstActor = rollResults[0].actor
		const firstInitiative = rollResults[0].initiative
		const players = [game.users.activeGM, ...game.users.players]
		console.log(players)
		const firstIndex = (firstActor.type === 'NPC') ?
			players.findIndex((p) => p === game.users.activeGM) :
			players.findIndex((p) => p?.character === firstActor)
		console.log(firstIndex)
		for (let i = 0; i < firstIndex; i++) {
			players.push(players.shift())
		}
		console.log(players)
		console.log(players[0])
		for (let i = 0; i < players.length; i++) {
			console.log(i)
			if (players[i].active){
				if (players[i] === game.users.activeGM && npcLeader) {
					console.log(npcLeader)
					super.setInitiative(combatants.find((c) => c.actor.id === npcLeader.id).id, firstInitiative - i)
				}
				else {
					if (players[i].character)
						{console.log(players[i]?.character)
						super.setInitiative(combatants.find((c) => c.actor.id === players[i]?.character?.id).id, firstInitiative - i)}
				}
			}
		}
	}
}
