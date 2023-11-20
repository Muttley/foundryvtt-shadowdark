export default class EncounterSD extends Combat {
	async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {
		if (game.settings.get("shadowdark", "useClockwiseInitiative")) {
			super.resetAll()
			//Structure input data
			ids = typeof  ids === 'string' ? [ids] : ids
			const currentId = this.combatant?.id;
			const chatRollMode = game.settings.get("core", "rollMode");

			const rollers = []
			const npcs = []
			for (const combatant of this.combatants) {
				if (combatant.actor.type === 'Player') rollers.push(combatant)
				else if (combatant.actor.type === 'NPC') npcs.push(combatant)
			}
			if (npcs.length > 0) {
				npcs.sort((a, b) => b.actor.getRollData().initiativeBonus - a.actor.getRollData().initiativeBonus)
				rollers.push(npcs[0])
			}

			const messages = [];
			const rollResults = await Promise.all(
				rollers.map(async (combatant, index) => {
					const isNPC = combatant.actor.type === 'NPC'
					const roll = combatant.getInitiativeRoll(formula)
					await roll.evaluate({async: true})

					// Construct chat message data
					let messageData = foundry.utils.mergeObject({
					speaker: ((isNPC) ?
					null :
					ChatMessage.getSpeaker({
						actor: combatant.actor,
						token: combatant.token,
						alias: combatant.name
					})),
					flavor: game.i18n.format("COMBAT.RollsInitiative", {name: ((isNPC) ? 'The Gamemaster' : combatant.name)}),
					flags: {"core.initiativeRoll": true}
					}, messageOptions);
					const rollChatData = await roll.toMessage(messageData, {create: false});

					// If the combatant is hidden, use a private roll unless an alternative rollMode was explicitly requested
					rollChatData.rollMode = "rollMode" in messageOptions ? messageOptions.rollMode
					: (combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode );

					// Play 1 sound for the whole rolled set
					if ( index > 0 ) rollChatData.sound = null;
					messages.push(rollChatData);

					return {combatant: combatant, prelimInitiative: roll.total}
				})
			)

			console.log(rollResults)

			const firstCombatant = rollResults.reduce(function(prev, current) {
				return (prev && prev.prelimInitiative > current.prelimInitiative)
				? prev : current
			}).combatant
////////////

/////////////
			const activeUsers = [
				game.users.activeGM,
				...(game.users.players.filter((p) => this.combatants.find((c) => c.actor === p.character)))
			]

			const firstIndex = (firstCombatant.actor.type === 'NPC') ?
				activeUsers.findIndex((p) => p === game.users.activeGM) :
				activeUsers.findIndex((p) => p?.character === firstCombatant.actor)
			for (let i = 0; i < firstIndex; i++) {
				activeUsers.push(activeUsers.shift())
			}
			console.log(firstCombatant)
			console.log(activeUsers)

			const initiativeOrder = []

			for (const user of activeUsers) {
				if (user === game.users.activeGM) initiativeOrder.push(...npcs)
				else {
					const c = this.combatants.find((c) => c.actor === user.character)
					if (c) initiativeOrder.push(c)
				}
			}
			console.log(initiativeOrder)


			for (let i = 0; i < initiativeOrder.length; i++) {
				super.setInitiative(initiativeOrder[i].id, initiativeOrder.length - i)
			}

			// Ensure the turn order remains with the same combatant
			if ( updateTurn && currentId ) {
				await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
			}

			// Create multiple chat messages
			await ChatMessage.implementation.create(messages);
						// Construct chat message data
						let messageData = foundry.utils.mergeObject({
							// speaker: (ChatMessage.getSpeaker({
							// 	actor: combatant.actor,
							// 	token: combatant.token,
							// 	alias: combatant.name
							// })),
							flavor: `Since <strong>${(firstCombatant.actor.type === 'Player' ? firstCombatant.name : 'the Gamemaster')}</strong> rolled highest, they will go first.`,
							}, messageOptions);
			await ChatMessage.implementation.create(messageData);
			return this;
		}
		else super.rollInitiative(ids, {formula, updateTurn, messageOptions})
	}
}
